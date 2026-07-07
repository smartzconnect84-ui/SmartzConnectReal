import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_FOLDERS = [
  'avatars', 'covers', 'photos', 'stories',
  'marketplace', 'posts', 'voice-notes', 'documents',
]

// Hard limit: 50 MB per upload.
const MAX_BYTES = 50 * 1024 * 1024

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { user: null, error: jsonResponse({ error: 'Unauthorized' }, 401) }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, error: jsonResponse({ error: 'Unauthorized' }, 401) }
  return { user, error: null }
}

function objectUrl(bucket: string, region: string, key: string): string {
  return `https://${bucket}.mos.${region}.sufybkt.com/${key}`
}

async function uploadToSufy(
  accessKeyId: string, secretAccessKey: string,
  bucket: string, region: string,
  key: string, body: ArrayBuffer, contentType: string
): Promise<Response> {
  const client = new AwsClient({ accessKeyId, secretAccessKey, region, service: 's3' })
  return client.fetch(objectUrl(bucket, region, key), {
    method: 'PUT',
    headers: { 'content-type': contentType },
    body,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user, error: authError } = await requireUser(req)
    if (authError) return authError

    const accessKeyId     = Deno.env.get('SUFY_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('SUFY_SECRET_ACCESS_KEY')
    const bucket          = Deno.env.get('SUFY_BUCKET')
    const region          = Deno.env.get('SUFY_REGION')

    if (!accessKeyId || !secretAccessKey || !bucket || !region) {
      return jsonResponse({ error: 'SUFY storage not configured' }, 500)
    }

    let formData: FormData
    try { formData = await req.formData() } catch {
      return jsonResponse({ error: 'Expected multipart/form-data' }, 400)
    }

    const fileField   = formData.get('file')
    const folderField = formData.get('folder')

    // Deno's FormData returns Blob/File for file parts
    if (!fileField || typeof (fileField as Blob).arrayBuffer !== 'function') {
      return jsonResponse({ error: "'file' field must be a file attachment" }, 400)
    }
    if (typeof folderField !== 'string' || !folderField) {
      return jsonResponse({ error: "'folder' field is required" }, 400)
    }
    if (!ALLOWED_FOLDERS.includes(folderField)) {
      return jsonResponse({ error: `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}` }, 400)
    }

    const fileBlob = fileField as File
    if ((fileBlob.size ?? 0) > MAX_BYTES) {
      return jsonResponse({ error: 'File exceeds the 50 MB upload limit' }, 413)
    }

    const safeName    = (fileBlob.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
    const key         = `${folderField}/${user!.id}/${Date.now()}-${safeName}`
    const contentType = fileBlob.type || 'application/octet-stream'
    const body        = await fileBlob.arrayBuffer()

    const res = await uploadToSufy(accessKeyId, secretAccessKey, bucket, region, key, body, contentType)

    if (!res.ok) {
      return jsonResponse({ error: `SUFY upload failed (${res.status})` }, 502)
    }

    return jsonResponse({ publicUrl: objectUrl(bucket, region, key), key })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
