import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireUser } from '../_shared/sessionService.ts'
import { loadSufyConfig, uploadObject, sufyPublicUrl } from '../_shared/sufyStorage.ts'

const ALLOWED_FOLDERS = [
  'avatars', 'covers', 'photos', 'stories',
  'marketplace', 'posts', 'voice-notes', 'documents',
]

// Hard limit: 50 MB per upload. Prevents authenticated users from exhausting
// edge-function memory with oversized payloads.
const MAX_BYTES = 50 * 1024 * 1024

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, error } = await requireUser(req)
    if (error) return error

    const config = loadSufyConfig()
    if (!config) return jsonResponse({ error: 'SUFY storage not configured' }, 500)

    // Accept multipart/form-data: the file binary never leaves the edge function
    // runtime on its way to SUFY — no browser-to-S3 CORS PUT needed.
    const formData = await req.formData().catch(() => null)
    if (!formData) return jsonResponse({ error: 'Expected multipart/form-data' }, 400)

    const fileField   = formData.get('file')
    const folderField = formData.get('folder')

    // Strict type validation — prevent 500s from unexpected field types
    if (!(fileField instanceof File)) {
      return jsonResponse({ error: "'file' field must be a file attachment" }, 400)
    }
    if (typeof folderField !== 'string' || !folderField) {
      return jsonResponse({ error: "'folder' field is required" }, 400)
    }
    if (!ALLOWED_FOLDERS.includes(folderField)) {
      return jsonResponse({ error: `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}` }, 400)
    }

    // Enforce upload size limit before reading into memory
    if (fileField.size > MAX_BYTES) {
      return jsonResponse({ error: `File exceeds the 50 MB upload limit` }, 413)
    }

    // Namespace every object under the authenticated caller's user id so a user
    // can never overwrite another user's files.
    const safeName = fileField.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${folderField}/${user!.id}/${Date.now()}-${safeName}`
    const contentType = fileField.type || 'application/octet-stream'

    const body = await fileField.arrayBuffer()
    const res  = await uploadObject(config, key, body, contentType)

    if (!res.ok) {
      // Return status only — don't echo SUFY's raw error body to the client
      return jsonResponse({ error: `SUFY upload failed (${res.status})` }, 502)
    }

    const publicUrl = sufyPublicUrl(config, key)
    return jsonResponse({ publicUrl, key })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
