import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TABLES_TO_BACKUP = [
  'profiles',
  'posts',
  'comments',
  'likes',
  'follows',
  'matches',
  'messages',
  'group_rooms',
  'group_members',
  'group_messages',
  'marketplace_items',
  'marketplace_orders',
  'ride_requests',
  'drivers',
  'streams',
  'notifications',
  'user_subscriptions',
  'payments',
  'mobile_money_payments',
  'worldstage_entries',
  'worldstage_events',
  'stories',
  'reports',
  'admin_users',
]

const BUCKET = 'db-backups'
const KEEP_DAYS = 30

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // Verify caller is authorized (cron secret or service role)
    const authHeader = req.headers.get('Authorization') ?? ''
    const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
    const isServiceRole = authHeader.includes(serviceKey)
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`
    if (!isServiceRole && !isCron) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timestamp = now.toISOString().replace(/[:.]/g, '-')
    const folder = `daily/${dateStr}`

    // Ensure bucket exists
    const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      allowedMimeTypes: ['application/json'],
    })
    if (bucketErr && !bucketErr.message.includes('already exists')) {
      throw new Error(`Bucket error: ${bucketErr.message}`)
    }

    const results: Record<string, { rows: number; error?: string }> = {}

    // Export each table to a JSON file in storage
    for (const table of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50000)

        if (error) {
          results[table] = { rows: 0, error: error.message }
          continue
        }

        const jsonContent = JSON.stringify(data, null, 0)
        const filePath = `${folder}/${table}.json`

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, jsonContent, {
            contentType: 'application/json',
            upsert: true,
          })

        if (uploadErr) {
          results[table] = { rows: data?.length ?? 0, error: uploadErr.message }
        } else {
          results[table] = { rows: data?.length ?? 0 }
        }
      } catch (err) {
        results[table] = { rows: 0, error: String(err) }
      }
    }

    // Write a manifest file for this backup run
    const manifest = {
      timestamp: now.toISOString(),
      tables: results,
      totalTables: TABLES_TO_BACKUP.length,
      successCount: Object.values(results).filter((r) => !r.error).length,
    }

    await supabase.storage
      .from(BUCKET)
      .upload(`${folder}/manifest-${timestamp}.json`, JSON.stringify(manifest, null, 2), {
        contentType: 'application/json',
        upsert: true,
      })

    // Clean up backups older than KEEP_DAYS
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS)

    const { data: oldFolders } = await supabase.storage.from(BUCKET).list('daily', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    })

    let deletedFolders = 0
    for (const folder of oldFolders ?? []) {
      const folderDate = new Date(folder.name)
      if (!isNaN(folderDate.getTime()) && folderDate < cutoff) {
        const { data: files } = await supabase.storage
          .from(BUCKET)
          .list(`daily/${folder.name}`)
        if (files?.length) {
          const paths = files.map((f) => `daily/${folder.name}/${f.name}`)
          await supabase.storage.from(BUCKET).remove(paths)
        }
        deletedFolders++
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        date: dateStr,
        ...manifest,
        cleanedFolders: deletedFolders,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
