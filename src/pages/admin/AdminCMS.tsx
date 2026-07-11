import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layout, Image as ImageIcon, FileText, Settings2, Plus, Trash2, Edit,
  Save, X, GripVertical, WifiOff, CheckCircle2, RefreshCw, Globe, EyeOff,
  BookOpen, Megaphone, Users, CreditCard, Star,
} from 'lucide-react'
import { cmsList, cmsSave, cmsDelete, pendingSyncCount, flushQueue } from '@/lib/contentSync'
import ImageUploader from '@/components/admin/ImageUploader'

type Tab = 'settings' | 'hero' | 'pages' | 'media' | 'blog' | 'announcements' | 'team' | 'plans'

interface SiteConfigRow { id: string; key: string; value: string; type: string; label: string; group: string }
interface HeroSlideRow {
  id: string; title: string; subtitle: string | null; emoji: string | null
  image_url: string | null; cta_text: string | null; cta_url: string | null
  badge_text: string | null; gradient: string | null; display_order: number; is_active: boolean
}
interface CmsPageRow {
  id: string; slug: string; title: string; description: string | null
  body_md: string; cover_url: string | null; is_published: boolean; updated_at: string
}
interface SiteAssetRow {
  id: string; name: string; type: string; url: string; size_bytes: number | null
  mime_type: string | null; created_at: string; is_active: boolean
}
interface BlogPostRow {
  id: string; title: string; slug: string; excerpt: string | null; content: string
  author_name: string; author_role: string | null; image_url: string | null
  category: string | null; status: string; featured: boolean
  read_time: string | null; created_at: string; updated_at: string
}
interface AnnouncementRow {
  id: string; title: string; message: string; type: string
  is_active: boolean; expires_at: string | null; created_at: string
}
interface TeamMemberRow {
  id: string; full_name: string; role: string; photo_url: string | null
  bio: string | null; country: string | null; linkedin_url: string | null
  twitter_url: string | null; is_active: boolean; display_order: number
  organization: string | null; is_advisor: boolean
}
interface PlanRow {
  id: string; name: string; slug: string; price_usd: number; price_lrd: number
  billing_cycle: string; features: string[] | null; is_active: boolean
  sort_order: number; badge: string | null
}

const TABS: { id: Tab; label: string; icon: typeof Layout }[] = [
  { id: 'settings', label: 'Site Settings', icon: Settings2 },
  { id: 'hero', label: 'Homepage Hero', icon: Layout },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'blog', label: 'Blog Posts', icon: BookOpen },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'plans', label: 'Plans & Pricing', icon: CreditCard },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
]

/** Small badge showing whether pending edits are safely queued for sync. */
function SyncStatus() {
  const [pending, setPending] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const tick = () => setPending(pendingSyncCount())
    tick()
    const id = setInterval(tick, 2000)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  if (pending === 0 && online) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
        <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
      </span>
    )
  }
  return (
    <button
      onClick={() => flushQueue()}
      className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 hover:text-amber-400"
      title="Changes are saved locally and will sync automatically once connected"
    >
      {online ? <RefreshCw className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      {pending} change{pending === 1 ? '' : 's'} saved locally, syncing…
    </button>
  )
}

export default function AdminCMS() {
  const [tab, setTab] = useState<Tab>('settings')

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900">Site Content</h1>
          <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">
            Manage everything that appears on the public site. Edits apply instantly and are never lost — even if you go offline mid-edit.
          </p>
        </div>
        <SyncStatus />
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-love-gradient text-white shadow-lg shadow-pink-500/20'
                  : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:dark:bg-white/10 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'settings' && <SettingsTab />}
      {tab === 'hero' && <HeroTab />}
      {tab === 'pages' && <PagesTab />}
      {tab === 'blog' && <BlogTab />}
      {tab === 'announcements' && <AnnouncementsTab />}
      {tab === 'team' && <TeamTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'media' && <MediaTab />}
    </div>
  )
}

/* ─────────────────────────── Site Settings ─────────────────────────── */
function SettingsTab() {
  const [rows, setRows] = useState<SiteConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const data = await cmsList<SiteConfigRow>('site_config', { orderBy: 'group' })
    setRows(data)
    setLoading(false)
    await seedBrandingDefaults(data)
  }, [])

  useEffect(() => { load() }, [load])

  const groups = rows.reduce<Record<string, SiteConfigRow[]>>((acc, r) => {
    (acc[r.group] ||= []).push(r)
    return acc
  }, {})

  const save = async (row: SiteConfigRow, value: string) => {
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, value } : r))
    await cmsSave('site_config', { ...row, value })
  }

  const addSetting = async () => {
    const key = prompt('Setting key (e.g. contact_email)')
    if (!key) return
    const label = prompt('Label to show in admin', key) || key
    const group = prompt('Group (e.g. General, Contact, Social)', 'General') || 'General'
    const type = confirm('Is this an image setting (a logo/background/photo)? Click OK for Image, Cancel for Text.') ? 'image' : 'text'
    const row: SiteConfigRow = { id: crypto.randomUUID(), key, value: '', type, label, group }
    setRows(prev => [...prev, row])
    await cmsSave('site_config', row)
  }

  const BRANDING_DEFAULTS: Omit<SiteConfigRow, 'id'>[] = [
    { key: 'brand_logo_url', value: '', type: 'image', label: 'Site Logo', group: 'Branding' },
    { key: 'brand_favicon_url', value: '', type: 'image', label: 'Favicon', group: 'Branding' },
    { key: 'homepage_bg_url', value: '', type: 'image', label: 'Homepage Background', group: 'Backgrounds' },
    { key: 'team_page_bg_url', value: '', type: 'image', label: 'Team Page Background', group: 'Backgrounds' },
    { key: 'social_page_bg_url', value: '', type: 'image', label: 'SmartzSocial Page Background', group: 'Backgrounds' },
    { key: 'service_dating_bg_url', value: '', type: 'image', label: 'SmartzDating Page Background', group: 'Backgrounds' },
    { key: 'service_tv_bg_url', value: '', type: 'image', label: 'SmartzTV Page Background', group: 'Backgrounds' },
    { key: 'service_market_bg_url', value: '', type: 'image', label: 'SmartzMarket Page Background', group: 'Backgrounds' },
    { key: 'service_ride_bg_url', value: '', type: 'image', label: 'SmartzRide Page Background', group: 'Backgrounds' },
    { key: 'service_delivery_bg_url', value: '', type: 'image', label: 'SmartzDelivery Page Background', group: 'Backgrounds' },
    { key: 'service_ads_bg_url', value: '', type: 'image', label: 'SmartzAds Page Background', group: 'Backgrounds' },
  ]

  /** Ensures the branding/background config keys exist so admins can control them without manual setup. */
  const seedBrandingDefaults = async (currentRows: SiteConfigRow[]) => {
    const existingKeys = new Set(currentRows.map(r => r.key))
    const toAdd = BRANDING_DEFAULTS.filter(d => !existingKeys.has(d.key))
    if (toAdd.length === 0) return
    const newRows = toAdd.map(d => ({ ...d, id: crypto.randomUUID() }))
    setRows(prev => [...prev, ...newRows])
    for (const row of newRows) await cmsSave('site_config', row)
  }

  const remove = async (row: SiteConfigRow) => {
    if (!confirm(`Delete setting "${row.label}"?`)) return
    setRows(prev => prev.filter(r => r.id !== row.id))
    await cmsDelete('site_config', row.id)
  }

  if (loading) return <SkeletonBlock />

  return (
    <div className="space-y-5">
      {Object.keys(groups).length === 0 && <EmptyState label="No site settings yet" />}
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider dark:text-gray-500 text-gray-500 mb-3">{group}</p>
          <div className="space-y-3">
            {items.map(row => (
              row.type === 'image' ? (
                <div key={row.id} className="flex items-center gap-3">
                  <ImageUploader
                    label={row.label}
                    folder="covers"
                    value={row.value || null}
                    assetName={row.key}
                    className="flex-1"
                    onChange={url => save(row, url || '')}
                  />
                  <button onClick={() => remove(row)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div key={row.id} className="flex items-center gap-3">
                  <label className="w-40 flex-shrink-0 text-xs font-semibold dark:text-gray-300 text-gray-700">{row.label}</label>
                  <input
                    value={drafts[row.id] ?? row.value}
                    onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))}
                    onBlur={e => save(row, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                  />
                  <button onClick={() => remove(row)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={addSetting} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
          <Plus className="w-4 h-4" /> Add Setting
        </button>
        <button onClick={() => seedBrandingDefaults(rows)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold dark:bg-white/8 bg-gray-100 dark:text-white text-gray-700 hover:dark:bg-white/15 hover:bg-gray-200 transition-colors">
          <ImageIcon className="w-4 h-4" /> Add Branding & Background Fields
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────── Homepage Hero ─────────────────────────── */
function HeroTab() {
  const [slides, setSlides] = useState<HeroSlideRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await cmsList<HeroSlideRow>('hero_slides', { orderBy: 'display_order' })
    setSlides(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const update = (id: string, patch: Partial<HeroSlideRow>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const persist = async (slide: HeroSlideRow) => {
    await cmsSave('hero_slides', slide)
  }

  const addSlide = async () => {
    const slide: HeroSlideRow = {
      id: crypto.randomUUID(), title: 'New headline.', subtitle: 'Describe this slide…',
      emoji: null, image_url: null, cta_text: 'Join Now!', cta_url: '/register',
      badge_text: 'NEW', gradient: null, display_order: slides.length, is_active: true,
    }
    setSlides(prev => [...prev, slide])
    await cmsSave('hero_slides', slide)
  }

  const remove = async (slide: HeroSlideRow) => {
    if (!confirm(`Delete slide "${slide.title}"?`)) return
    setSlides(prev => prev.filter(s => s.id !== slide.id))
    await cmsDelete('hero_slides', slide.id)
  }

  if (loading) return <SkeletonBlock />

  return (
    <div className="space-y-4">
      {slides.length === 0 && <EmptyState label="No custom hero slides yet — the homepage is using its built-in defaults." />}
      <AnimatePresence>
        {slides.map((slide, i) => (
          <motion.div key={slide.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold dark:text-gray-500 text-gray-500">
                <GripVertical className="w-3.5 h-3.5" /> Slide {i + 1}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold dark:text-gray-400 text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={slide.is_active}
                    onChange={e => { update(slide.id, { is_active: e.target.checked }); persist({ ...slide, is_active: e.target.checked }) }} />
                  Active
                </label>
                <button onClick={() => remove(slide)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <ImageUploader
                label="Background image" folder="covers" value={slide.image_url}
                assetName={`hero-${slide.id}`}
                onChange={url => { update(slide.id, { image_url: url }); persist({ ...slide, image_url: url }) }}
              />
              <div className="space-y-2">
                <TextField label="Badge text" value={slide.badge_text ?? ''} onSave={v => persist({ ...slide, badge_text: v })} onLocal={v => update(slide.id, { badge_text: v })} />
                <TextField label="Title" value={slide.title} onSave={v => persist({ ...slide, title: v })} onLocal={v => update(slide.id, { title: v })} />
                <TextField label="Subtitle" value={slide.subtitle ?? ''} onSave={v => persist({ ...slide, subtitle: v })} onLocal={v => update(slide.id, { subtitle: v })} />
                <div className="flex gap-2">
                  <TextField label="CTA text" value={slide.cta_text ?? ''} onSave={v => persist({ ...slide, cta_text: v })} onLocal={v => update(slide.id, { cta_text: v })} />
                  <TextField label="CTA link" value={slide.cta_url ?? ''} onSave={v => persist({ ...slide, cta_url: v })} onLocal={v => update(slide.id, { cta_url: v })} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <button onClick={addSlide} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
        <Plus className="w-4 h-4" /> Add Slide
      </button>
    </div>
  )
}

/* ─────────────────────────── Pages ─────────────────────────── */
function PagesTab() {
  const [pages, setPages] = useState<CmsPageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CmsPageRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setPages(await cmsList<CmsPageRow>('cms_pages', { orderBy: 'updated_at', ascending: false }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => setEditing({
    id: crypto.randomUUID(), slug: '', title: '', description: '', body_md: '',
    cover_url: null, is_published: false, updated_at: new Date().toISOString(),
  })

  const save = async () => {
    if (!editing || !editing.slug || !editing.title) { alert('Title and slug are required'); return }
    const saved = await cmsSave('cms_pages', editing)
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy }
      return [saved, ...prev]
    })
    setEditing(null)
  }

  const remove = async (page: CmsPageRow) => {
    if (!confirm(`Delete page "${page.title}"?`)) return
    setPages(prev => prev.filter(p => p.id !== page.id))
    await cmsDelete('cms_pages', page.id)
  }

  if (loading) return <SkeletonBlock />

  if (editing) {
    return (
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold dark:text-white text-gray-900">{editing.title ? 'Edit page' : 'New page'}</p>
          <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Title</p>
            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">URL slug (/pages/…)</p>
            <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Description (SEO summary)</p>
          <input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
        </div>
        <ImageUploader label="Cover image" folder="covers" value={editing.cover_url} assetName={`page-${editing.slug || editing.id}`}
          onChange={url => setEditing({ ...editing, cover_url: url })} />
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Content</p>
          <textarea rows={10} value={editing.body_md} onChange={e => setEditing({ ...editing, body_md: e.target.value })}
            placeholder="Write the page content. Plain text or Markdown (headings, **bold**, lists) is supported."
            className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-y" />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold dark:text-gray-300 text-gray-700 cursor-pointer">
          <input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} />
          Published (visible on the public site)
        </label>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
          <Save className="w-4 h-4" /> Save Page
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pages.length === 0 && <EmptyState label="No custom pages yet" />}
      {pages.map(page => (
        <div key={page.id} className="flex items-center gap-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden dark:bg-white/5 bg-gray-100 flex-shrink-0 flex items-center justify-center">
            {page.cover_url ? <img src={page.cover_url} className="w-full h-full object-cover" /> : <FileText className="w-4 h-4 dark:text-gray-500 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{page.title}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 truncate">/pages/{page.slug}</p>
          </div>
          {page.is_published
            ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500"><Globe className="w-3 h-3" /> Live</span>
            : <span className="flex items-center gap-1 text-[10px] font-bold dark:text-gray-500 text-gray-400"><EyeOff className="w-3 h-3" /> Draft</span>}
          <button onClick={() => setEditing(page)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => remove(page)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
        <Plus className="w-4 h-4" /> Add Page
      </button>
    </div>
  )
}

/* ─────────────────────────── Media Library ─────────────────────────── */
function MediaTab() {
  const [assets, setAssets] = useState<SiteAssetRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setAssets(await cmsList<SiteAssetRow>('site_assets', { orderBy: 'created_at', ascending: false }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const onUploaded = (url: string | null) => {
    if (!url) return
    load()
  }

  const remove = async (asset: SiteAssetRow) => {
    if (!confirm(`Remove "${asset.name}" from the media library?`)) return
    setAssets(prev => prev.filter(a => a.id !== asset.id))
    await cmsDelete('site_assets', asset.id)
  }

  const download = (asset: SiteAssetRow) => {
    const a = document.createElement('a')
    a.href = asset.url; a.download = asset.name; a.target = '_blank'; a.rel = 'noopener noreferrer'
    document.body.appendChild(a); a.click(); a.remove()
  }

  if (loading) return <SkeletonBlock />

  return (
    <div className="space-y-4">
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4">
        <ImageUploader label="Upload a new file" folder="documents" value={null} assetName={undefined} onChange={onUploaded} />
      </div>
      {assets.length === 0 && <EmptyState label="No files uploaded yet" />}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {assets.map(asset => (
          <div key={asset.id} className="rounded-xl overflow-hidden dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200">
            <div className="aspect-square dark:bg-white/5 bg-gray-100 flex items-center justify-center overflow-hidden">
              {asset.type === 'image'
                ? <img src={asset.url} className="w-full h-full object-cover" />
                : <FileText className="w-6 h-6 dark:text-gray-500 text-gray-400" />}
            </div>
            <div className="p-2">
              <p className="text-[11px] font-semibold dark:text-white text-gray-900 truncate">{asset.name}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <button onClick={() => download(asset)} className="flex-1 text-[10px] font-bold py-1 rounded-md dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-600">Download</button>
                <button onClick={() => remove(asset)} className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10 flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── Blog Posts ─────────────────────────── */
function BlogTab() {
  const [posts, setPosts] = useState<BlogPostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BlogPostRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setPosts(await cmsList<BlogPostRow>('blog_posts', { orderBy: 'created_at', ascending: false }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => setEditing({
    id: crypto.randomUUID(), title: '', slug: '', excerpt: '', content: '',
    author_name: '', author_role: null, image_url: null,
    category: 'General', status: 'draft', featured: false,
    read_time: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  })

  const save = async () => {
    if (!editing?.title || !editing.slug) { alert('Title and slug are required'); return }
    const saved = await cmsSave('blog_posts', { ...editing, updated_at: new Date().toISOString() })
    setPosts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy }
      return [saved, ...prev]
    })
    setEditing(null)
  }

  const remove = async (post: BlogPostRow) => {
    if (!confirm(`Delete post "${post.title}"?`)) return
    setPosts(prev => prev.filter(p => p.id !== post.id))
    await cmsDelete('blog_posts', post.id)
  }

  if (loading) return <SkeletonBlock />

  if (editing) {
    return (
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold dark:text-white text-gray-900">{editing.title ? 'Edit post' : 'New blog post'}</p>
          <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Title</p>
            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">URL slug (/blog/…)</p>
            <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Author name</p>
            <input value={editing.author_name} onChange={e => setEditing({ ...editing, author_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Category</p>
            <input value={editing.category ?? ''} onChange={e => setEditing({ ...editing, category: e.target.value })}
              placeholder="e.g. Updates, Stories, Tech"
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Excerpt (preview text)</p>
          <input value={editing.excerpt ?? ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
        </div>
        <ImageUploader label="Cover image" folder="covers" value={editing.image_url} assetName={`blog-${editing.slug || editing.id}`}
          onChange={url => setEditing({ ...editing, image_url: url })} />
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Content</p>
          <textarea rows={10} value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })}
            placeholder="Write your post content. Markdown is supported."
            className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-y" />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Status</p>
            <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}
              className="px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold dark:text-gray-300 text-gray-700 cursor-pointer mt-4">
            <input type="checkbox" checked={editing.featured} onChange={e => setEditing({ ...editing, featured: e.target.checked })} />
            Featured post
          </label>
        </div>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
          <Save className="w-4 h-4" /> Save Post
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.length === 0 && <EmptyState label="No blog posts yet" />}
      {posts.map(post => (
        <div key={post.id} className="flex items-center gap-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden dark:bg-white/5 bg-gray-100 flex-shrink-0 flex items-center justify-center">
            {post.image_url ? <img src={post.image_url} className="w-full h-full object-cover" /> : <BookOpen className="w-4 h-4 dark:text-gray-500 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{post.title || 'Untitled'}</p>
              {post.featured && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            </div>
            <p className="text-xs dark:text-gray-500 text-gray-500 truncate">/blog/{post.slug} · {post.category}</p>
          </div>
          {post.status === 'published'
            ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 flex-shrink-0"><Globe className="w-3 h-3" /> Live</span>
            : <span className="flex items-center gap-1 text-[10px] font-bold dark:text-gray-500 text-gray-400 flex-shrink-0"><EyeOff className="w-3 h-3" /> Draft</span>}
          <button onClick={() => setEditing(post)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => remove(post)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
        <Plus className="w-4 h-4" /> New Post
      </button>
    </div>
  )
}

/* ─────────────────────────── Announcements ─────────────────────────── */
function AnnouncementsTab() {
  const [items, setItems] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AnnouncementRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setItems(await cmsList<AnnouncementRow>('announcements', { orderBy: 'created_at', ascending: false }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => setEditing({
    id: crypto.randomUUID(), title: '', message: '', type: 'info',
    is_active: true, expires_at: null, created_at: new Date().toISOString(),
  })

  const save = async () => {
    if (!editing?.title || !editing.message) { alert('Title and message are required'); return }
    const saved = await cmsSave('announcements', editing)
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy }
      return [saved, ...prev]
    })
    setEditing(null)
  }

  const remove = async (item: AnnouncementRow) => {
    if (!confirm(`Delete announcement "${item.title}"?`)) return
    setItems(prev => prev.filter(p => p.id !== item.id))
    await cmsDelete('announcements', item.id)
  }

  const toggleActive = async (item: AnnouncementRow) => {
    const updated = { ...item, is_active: !item.is_active }
    setItems(prev => prev.map(p => p.id === item.id ? updated : p))
    await cmsSave('announcements', updated)
  }

  const typeColors: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-500',
    warning: 'bg-amber-500/10 text-amber-500',
    success: 'bg-emerald-500/10 text-emerald-500',
    error: 'bg-red-500/10 text-red-500',
    promo: 'bg-pink-500/10 text-pink-500',
  }

  if (loading) return <SkeletonBlock />

  if (editing) {
    return (
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold dark:text-white text-gray-900">{editing.title ? 'Edit announcement' : 'New announcement'}</p>
          <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Title</p>
            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Type</p>
            <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none">
              {['info', 'warning', 'success', 'error', 'promo'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Message</p>
          <textarea rows={4} value={editing.message} onChange={e => setEditing({ ...editing, message: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-y" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Expires at (optional)</p>
            <input type="datetime-local" value={editing.expires_at ? editing.expires_at.slice(0, 16) : ''}
              onChange={e => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold dark:text-gray-300 text-gray-700 cursor-pointer mt-5">
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
            Active (shown to users)
          </label>
        </div>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
          <Save className="w-4 h-4" /> Save Announcement
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && <EmptyState label="No announcements yet" />}
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-3.5">
          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 ${typeColors[item.type] || 'bg-gray-500/10 text-gray-500'}`}>{item.type}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{item.title}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 truncate">{item.message}</p>
          </div>
          <button onClick={() => toggleActive(item)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 transition-colors ${item.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-500 text-gray-400'}`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </button>
          <button onClick={() => setEditing(item)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => remove(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
        <Plus className="w-4 h-4" /> New Announcement
      </button>
    </div>
  )
}

/* ─────────────────────────── Team Members ─────────────────────────── */
function TeamTab() {
  const [members, setMembers] = useState<TeamMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TeamMemberRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMembers(await cmsList<TeamMemberRow>('team_members', { orderBy: 'display_order' }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => setEditing({
    id: crypto.randomUUID(), full_name: '', role: '', photo_url: null,
    bio: null, country: null, linkedin_url: null, twitter_url: null,
    is_active: true, display_order: members.length, organization: null, is_advisor: false,
  })

  const save = async () => {
    if (!editing?.full_name || !editing.role) { alert('Name and role are required'); return }
    const saved = await cmsSave('team_members', editing)
    setMembers(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy }
      return [...prev, saved]
    })
    setEditing(null)
  }

  const remove = async (member: TeamMemberRow) => {
    if (!confirm(`Remove ${member.full_name} from the team?`)) return
    setMembers(prev => prev.filter(m => m.id !== member.id))
    await cmsDelete('team_members', member.id)
  }

  if (loading) return <SkeletonBlock />

  if (editing) {
    return (
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold dark:text-white text-gray-900">{editing.full_name ? 'Edit member' : 'New team member'}</p>
          <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ImageUploader label="Photo" folder="avatars" value={editing.photo_url} assetName={`team-${editing.id}`}
            onChange={url => setEditing({ ...editing, photo_url: url })} />
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Full name</p>
              <input value={editing.full_name} onChange={e => setEditing({ ...editing, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
            </div>
            <div>
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Role / title</p>
              <input value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
            </div>
            <div>
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Country</p>
              <input value={editing.country ?? ''} onChange={e => setEditing({ ...editing, country: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Bio</p>
          <textarea rows={3} value={editing.bio ?? ''} onChange={e => setEditing({ ...editing, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-y" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">LinkedIn URL</p>
            <input value={editing.linkedin_url ?? ''} onChange={e => setEditing({ ...editing, linkedin_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Twitter URL</p>
            <input value={editing.twitter_url ?? ''} onChange={e => setEditing({ ...editing, twitter_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold dark:text-gray-300 text-gray-700 cursor-pointer">
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
            Visible on site
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold dark:text-gray-300 text-gray-700 cursor-pointer">
            <input type="checkbox" checked={editing.is_advisor} onChange={e => setEditing({ ...editing, is_advisor: e.target.checked })} />
            Advisor (not core team)
          </label>
        </div>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
          <Save className="w-4 h-4" /> Save Member
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {members.length === 0 && <EmptyState label="No team members yet" />}
      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden dark:bg-white/5 bg-gray-100 flex-shrink-0 flex items-center justify-center">
            {m.photo_url ? <img src={m.photo_url} className="w-full h-full object-cover" /> : <Users className="w-4 h-4 dark:text-gray-500 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{m.full_name}</p>
              {m.is_advisor && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">Advisor</span>}
            </div>
            <p className="text-xs dark:text-gray-500 text-gray-500 truncate">{m.role}{m.country ? ` · ${m.country}` : ''}</p>
          </div>
          {!m.is_active && <span className="text-[10px] font-bold dark:text-gray-500 text-gray-400 flex-shrink-0">Hidden</span>}
          <button onClick={() => setEditing(m)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => remove(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
        <Plus className="w-4 h-4" /> Add Member
      </button>
    </div>
  )
}

/* ─────────────────────────── Plans & Pricing ─────────────────────────── */
function PlansTab() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [featInput, setFeatInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setPlans(await cmsList<PlanRow>('subscription_plans', { orderBy: 'sort_order' }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => {
    setFeatInput('')
    setEditing({
      id: crypto.randomUUID(), name: '', slug: '', price_usd: 0, price_lrd: 0,
      billing_cycle: 'monthly', features: [], is_active: true,
      sort_order: plans.length, badge: null,
    })
  }

  const openEdit = (plan: PlanRow) => {
    setFeatInput('')
    setEditing(plan)
  }

  const save = async () => {
    if (!editing?.name || !editing.slug) { alert('Name and slug are required'); return }
    const saved = await cmsSave('subscription_plans', editing)
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy }
      return [...prev, saved]
    })
    setEditing(null)
  }

  const remove = async (plan: PlanRow) => {
    if (!confirm(`Delete plan "${plan.name}"?`)) return
    setPlans(prev => prev.filter(p => p.id !== plan.id))
    await cmsDelete('subscription_plans', plan.id)
  }

  const addFeature = () => {
    if (!featInput.trim() || !editing) return
    setEditing({ ...editing, features: [...(editing.features || []), featInput.trim()] })
    setFeatInput('')
  }

  const removeFeature = (idx: number) => {
    if (!editing) return
    setEditing({ ...editing, features: (editing.features || []).filter((_, i) => i !== idx) })
  }

  if (loading) return <SkeletonBlock />

  if (editing) {
    return (
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold dark:text-white text-gray-900">{editing.name ? 'Edit plan' : 'New plan'}</p>
          <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Plan name</p>
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Premium"
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Slug</p>
            <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="e.g. premium"
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Badge label</p>
            <input value={editing.badge ?? ''} onChange={e => setEditing({ ...editing, badge: e.target.value || null })}
              placeholder="e.g. Most Popular"
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Price (USD)</p>
            <input type="number" min={0} step={0.01} value={editing.price_usd}
              onChange={e => setEditing({ ...editing, price_usd: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Price (LRD)</p>
            <input type="number" min={0} value={editing.price_lrd}
              onChange={e => setEditing({ ...editing, price_lrd: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
          </div>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Billing cycle</p>
            <select value={editing.billing_cycle} onChange={e => setEditing({ ...editing, billing_cycle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none">
              {['monthly', 'yearly', 'one-time'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Features (one per line / enter)</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(editing.features || []).map((f, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold dark:bg-white/8 bg-gray-100 dark:text-gray-300 text-gray-700">
                {f}
                <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={featInput} onChange={e => setFeatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
              placeholder="Add a feature and press Enter"
              className="flex-1 px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
            <button onClick={addFeature} className="px-3 py-2 rounded-lg text-sm font-bold dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 hover:opacity-80">Add</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold dark:text-gray-300 text-gray-700 cursor-pointer">
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
            Active (shown on pricing page)
          </label>
          <div>
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1">Sort order</p>
            <input type="number" min={0} value={editing.sort_order}
              onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
              className="w-20 px-3 py-2 rounded-lg text-sm dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none" />
          </div>
        </div>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
          <Save className="w-4 h-4" /> Save Plan
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {plans.length === 0 && <EmptyState label="No plans configured yet" />}
      {plans.map(plan => (
        <div key={plan.id} className="flex items-center gap-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 p-3.5">
          <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold dark:text-white text-gray-900">{plan.name}</p>
              {plan.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500">{plan.badge}</span>}
              {!plan.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-500/10 dark:text-gray-400 text-gray-500">Inactive</span>}
            </div>
            <p className="text-xs dark:text-gray-500 text-gray-500">${plan.price_usd}/mo · {(plan.features || []).length} features</p>
          </div>
          <button onClick={() => openEdit(plan)} className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-gray-400 text-gray-500 hover:dark:bg-white/10 hover:bg-gray-100"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => remove(plan)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-love-gradient text-white shadow-lg shadow-pink-500/20">
        <Plus className="w-4 h-4" /> Add Plan
      </button>
    </div>
  )
}

/* ─────────────────────────── Shared bits ─────────────────────────── */
function TextField({ label, value, onLocal, onSave }: { label: string; value: string; onLocal: (v: string) => void; onSave: (v: string) => void }) {
  return (
    <div className="flex-1">
      <p className="text-[11px] font-semibold dark:text-gray-400 text-gray-600 mb-1">{label}</p>
      <input
        defaultValue={value}
        onChange={e => onLocal(e.target.value)}
        onBlur={e => onSave(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg text-xs dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
      />
    </div>
  )
}

function SkeletonBlock() {
  return <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-16 rounded-2xl dark:bg-white/5 bg-gray-100 animate-pulse" />)}</div>
}

function EmptyState({ label }: { label: string }) {
  return <div className="text-center py-8 text-sm dark:text-gray-500 text-gray-400">{label}</div>
}
