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

interface UploadResponse {
  publicUrl: string
  key: string
}

/**
 * Uploads a file to SUFY object storage via the `sufy-upload` edge function.
 *
 * The file is sent as multipart/form-data to the edge function, which then
 * PUTs it directly to SUFY using server-side SigV4 credentials. This avoids
 * the CORS restriction that prevents the browser from PUT-ing directly to
 * SUFY's S3-compatible endpoint (the old presigned-URL approach broke because
 * SUFY does not send the required Access-Control-Allow-Origin headers for
 * cross-origin browser PUTs).
 *
 * Returns the public URL to store as a metadata reference in Supabase.
 */
export async function uploadToSufy(file: File, folder: SufyFolder): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const { data, error } = await supabase.functions.invoke<UploadResponse>('sufy-upload', {
    body: formData,
  })

  if (error || !data?.publicUrl) {
    throw new Error(error?.message || 'Failed to upload file to SUFY')
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
