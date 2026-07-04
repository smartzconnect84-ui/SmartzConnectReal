import { supabase } from './supabase'

export type SufyFolder =
  | 'avatars'
  | 'covers'
  | 'photos'
  | 'stories'
  | 'marketplace'
  | 'posts'
  | 'voice-notes'
  | 'documents'

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
  key: string
}

/**
 * Uploads a file directly to SUFY object storage.
 *
 * Flow: ask the `sufy-presign` edge function (Session Service pattern) for a
 * short-lived presigned PUT URL scoped to the current user, then PUT the
 * file straight to SUFY from the browser. Supabase never sees the binary —
 * it only ever receives the resulting public URL to store as a reference,
 * matching the SUFY-owns-storage / Supabase-owns-metadata split.
 */
export async function uploadToSufy(file: File, folder: SufyFolder): Promise<string> {
  const { data, error } = await supabase.functions.invoke<PresignResponse>('sufy-presign', {
    body: { folder, fileName: file.name, contentType: file.type || 'application/octet-stream' },
  })

  if (error || !data?.uploadUrl) {
    throw new Error(error?.message || 'Failed to get SUFY upload URL')
  }

  const putRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })

  if (!putRes.ok) {
    throw new Error(`SUFY upload failed (${putRes.status})`)
  }

  return data.publicUrl
}

/** Deletes a previously uploaded object, identified by its SUFY object key. */
export async function deleteFromSufy(key: string): Promise<void> {
  const { error } = await supabase.functions.invoke('sufy-delete', { body: { key } })
  if (error) {
    throw new Error(error.message || 'Failed to delete SUFY object')
  }
}

/** Extracts the object key (path after the bucket host) from a SUFY public URL. */
export function sufyKeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    return u.pathname.replace(/^\//, '')
  } catch {
    return null
  }
}
