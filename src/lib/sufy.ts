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
  | 'pages'
  | 'events'
  | 'jobs'
  | 'learning'

interface UploadResponse {
  publicUrl: string
  key: string
}

/**
 * Uploads a file to SUFY object storage.
 *
 * Sends the file as multipart/form-data to the `sufy-presign` edge function,
 * which authenticates the caller and performs the PUT to SUFY server-side
 * (avoiding the CORS restriction that prevents the browser from PUT-ing
 * directly to SUFY's S3-compatible endpoint).
 *
 * Returns the public URL to store as a metadata reference in Supabase.
 */
export async function uploadToSufy(file: File, folder: SufyFolder): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const { data, error } = await supabase.functions.invoke<UploadResponse>('sufy-presign', {
    body: formData,
  })

  if (error || !data?.publicUrl) {
    throw new Error(error?.message || 'Failed to upload file to storage')
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
