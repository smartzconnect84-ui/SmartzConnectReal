import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { cmsList } from '@/lib/contentSync'

interface CmsPageRow {
  id: string; slug: string; title: string; description: string | null
  body_md: string; cover_url: string | null; is_published: boolean
}

/**
 * Renders any page created in the admin "Site Content" manager at /pages/:slug.
 * Reads cache-first so the page keeps rendering its last-known content even if
 * the backend is briefly unreachable.
 */
export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<CmsPageRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    cmsList<CmsPageRow>('cms_pages').then(rows => {
      if (cancelled) return
      setPage(rows.find(r => r.slug === slug && r.is_published) ?? null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Page not found</h1>
        <p className="text-sm dark:text-gray-400 text-gray-500">This page doesn't exist or hasn't been published yet.</p>
        <Link to="/" className="text-brand-pink font-semibold text-sm">Back to home</Link>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
      {page.cover_url && (
        <img src={page.cover_url} alt={page.title} className="w-full aspect-video object-cover rounded-2xl mb-8" />
      )}
      <h1 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">{page.title}</h1>
      {page.description && <p className="text-base dark:text-gray-400 text-gray-500 mb-8">{page.description}</p>}
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap dark:text-gray-300 text-gray-700 leading-relaxed">
        {page.body_md}
      </div>
    </article>
  )
}
