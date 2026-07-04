import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireUser } from '../_shared/sessionService.ts'
import { loadSufyConfig, deleteObject } from '../_shared/sufyStorage.ts'

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

    const { key } = await req.json().catch(() => ({}))
    if (!key || typeof key !== 'string') {
      return jsonResponse({ error: 'key is required' }, 400)
    }

    // A user may only delete objects inside their own namespace
    // (<folder>/<their-user-id>/...), enforced server-side.
    const ownPrefix = `/${user!.id}/`
    if (!key.includes(ownPrefix)) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const res = await deleteObject(config, key)
    if (!res.ok && res.status !== 404) {
      return jsonResponse({ error: `SUFY delete failed (${res.status})` }, 502)
    }

    return jsonResponse({ success: true })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
