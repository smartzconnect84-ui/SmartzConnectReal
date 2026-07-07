import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireUser } from '../_shared/sessionService.ts'
import { loadSufyConfig, sufyPublicUrl } from '../_shared/sufyStorage.ts'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'

const ALLOWED_FOLDERS = [
  'avatars', 'covers', 'photos', 'stories',
  'marketplace', 'posts', 'voice-notes', 'documents',
]

// Hard limit: 50 MB per upload.
const MAX_BYTES = 50 * 1024 * 1024

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, error } = await requireUser(req)
    if (error) return error

    const config = loadSufyConfig()
    if (!config) {
      return jsonResponse({ error: 'SUFY storage not configured' }, 500)
    }

    // ── Parse multipart/form-data ─────────────────────────────────────────────
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse({ error: 'Request must be multipart/form-data' }, 400)
    }

    const formData = await req.formData()
    const folder    = formData.get('folder') as string | null
    const fileEntry = formData.get('file')   as File | null

    if (!folder || !fileEntry) {
      return jsonResponse({ error: 'folder and file fields are required' }, 400)
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return jsonResponse({ error: `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}` }, 400)
    }
    if ((fileEntry.size ?? 0) > MAX_BYTES) {
      return jsonResponse({ error: 'File exceeds the 50 MB upload limit' }, 413)
    }

    // ── Build the object key (namespaced under caller's user id) ─────────────
    const safeName = fileEntry.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key      = `${folder}/${user!.id}/${Date.now()}-${safeName}`
    const mime     = fileEntry.type || 'application/octet-stream'

    // ── Upload directly to SUFY from the edge function (no browser CORS) ─────
    const objectUrl = `https://${config.bucket}.mos.${config.region}.sufybkt.com/${key}`
    const client = new AwsClient({
      accessKeyId:     config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region:          config.region,
      service:         's3',
    })

    const fileBytes = await fileEntry.arrayBuffer()
    const putRes = await client.fetch(objectUrl, {
      method:  'PUT',
      headers: { 'Content-Type': mime },
      body:    fileBytes,
    })

    if (!putRes.ok) {
      const body = await putRes.text().catch(() => '')
      return jsonResponse({ error: `SUFY upload failed (${putRes.status}): ${body}` }, 502)
    }

    const publicUrl = sufyPublicUrl(config, key)
    return jsonResponse({ publicUrl, key })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
