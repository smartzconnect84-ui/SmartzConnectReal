import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireUser } from '../_shared/sessionService.ts'
import { loadSufyConfig, presignPutUrl, sufyPublicUrl } from '../_shared/sufyStorage.ts'

const ALLOWED_FOLDERS = ['avatars', 'covers', 'photos', 'stories', 'marketplace', 'posts', 'voice-notes', 'documents']

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

    const { folder, fileName, contentType } = await req.json().catch(() => ({}))
    if (!folder || !fileName || !contentType) {
      return jsonResponse({ error: 'folder, fileName and contentType are required' }, 400)
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return jsonResponse({ error: `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}` }, 400)
    }

    // Every object is namespaced under the caller's own user id — a user can
    // only ever be issued a presigned URL for their own path, so ownership
    // of the resulting key never needs to be trusted from client input.
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${folder}/${user!.id}/${Date.now()}-${safeName}`

    const uploadUrl = await presignPutUrl(config, key, contentType)
    const publicUrl = sufyPublicUrl(config, key)

    return jsonResponse({ uploadUrl, publicUrl, key })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
