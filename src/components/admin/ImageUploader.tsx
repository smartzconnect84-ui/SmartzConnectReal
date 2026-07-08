import { useRef, useState } from 'react'
import { Upload, Download, Trash2, Loader2, ImageOff } from 'lucide-react'
import { uploadToSufy, type SufyFolder } from '@/lib/sufy'
import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  value?: string | null
  onChange: (url: string | null) => void
  folder: SufyFolder
  label?: string
  /** Registers the upload in the site_assets media library so it shows up under Media Library and survives even if this record is deleted. */
  assetName?: string
  className?: string
}

/**
 * Reusable admin upload control: uploads a file to SUFY object storage,
 * records it in `site_assets` (so it's downloadable/reusable later), and
 * reports the resulting public URL back to the caller. Supports removing
 * the current image and downloading the original file.
 */
export default function ImageUploader({ value, onChange, folder, label, assetName, className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const url = await uploadToSufy(file, folder)
      onChange(url)
      // Best-effort media library entry — failure here shouldn't block the upload.
      await supabase.from('site_assets').insert({
        name: assetName || file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url,
        size_bytes: file.size,
        mime_type: file.type,
        is_active: true,
      }).then(() => {}, () => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = () => {
    if (!value) return
    const a = document.createElement('a')
    a.href = value
    a.download = assetName || value.split('/').pop() || 'file'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className={className}>
      {label && <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200 flex items-center justify-center flex-shrink-0">
          {value
            ? <img src={value} alt="" className="w-full h-full object-cover" />
            : <ImageOff className="w-5 h-5 dark:text-gray-600 text-gray-400" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-white/8 bg-gray-100 dark:text-white text-gray-700 hover:dark:bg-white/15 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload'}
            </button>
            {value && (
              <>
                <button type="button" onClick={handleDownload}
                  title="Download"
                  className="flex items-center justify-center w-8 h-8 rounded-lg dark:bg-white/8 bg-gray-100 dark:text-white text-gray-700 hover:dark:bg-white/15 hover:bg-gray-200 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onChange(null)}
                  title="Remove"
                  className="flex items-center justify-center w-8 h-8 rounded-lg dark:bg-red-500/10 bg-red-50 text-red-500 hover:dark:bg-red-500/20 hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>
    </div>
  )
}
