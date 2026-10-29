import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isDeliverable, loadConfig, type Campaign } from '@/lib/smartzads'
import { ReportAdButton } from '@/pages/AdsDashboardPage'

/* Collect owner campaigns from every local account on this device (delivery-side
   view is aggregate; advertisers still only manage their own in the dashboard). */
function collectLocal(placement: string): Campaign[] {
  const out: Campaign[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || ''
      const m = k.match(/^smartzads_(.+)_campaigns$/)
      if (!m) continue
      try {
        const cfg = loadConfig()
        const list = JSON.parse(localStorage.getItem(k) || '[]') as Campaign[]
        for (const c of list) {
          if (!c.placements || !c.placements.includes(placement)) continue
          if (isDeliverable(c, cfg).ok) out.push(c)
        }
      } catch { /* skip corrupt bucket */ }
    }
  } catch { /* storage unavailable */ }
  return out
}

function sessionShown(id: string): number {
  try { return parseInt(sessionStorage.getItem(`szads_seen_${id}`) || '0', 10) || 0 } catch { return 0 }
}
function markShown(id: string) {
  try { sessionStorage.setItem(`szads_seen_${id}`, String(sessionShown(id) + 1)) } catch { /* noop */ }
}
function alreadyCounted(id: string, kind: 'i' | 'c'): boolean {
  try { return !!sessionStorage.getItem(`szads_${kind}_${id}`) } catch { return false }
}
function markCounted(id: string, kind: 'i' | 'c') {
  try { sessionStorage.setItem(`szads_${kind}_${id}`, '1') } catch { /* noop */ }
}

/** Persist an event back to the owner's local bucket + best-effort cloud counters. */
function recordEvent(c: Campaign, kind: 'impressions' | 'clicks') {
  try {
    const key = `smartzads_campaigns_${c.ownerId}`
    const list = JSON.parse(localStorage.getItem(key) || '[]') as Campaign[]
    const next = list.map(x => x.id === c.id ? { ...x, [kind]: (x[kind] as number || 0) + 1, updatedAt: new Date().toISOString() } : x)
    localStorage.setItem(key, JSON.stringify(next))
  } catch { /* noop */ }
  // best-effort cloud counters — never blocks rendering
  try {
    const col = kind === 'impressions' ? 'impressions' : 'clicks'
    supabase.from('smartzads_campaigns').select('id').eq('id', c.id).limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          supabase.rpc('szads_increment', { campaign_id: c.id, column_name: col } as never)
            .then(() => {}, () => {})
        }
      }, () => {})
  } catch { /* offline */ }
}

/**
 * Fair-rotation sponsored unit. Renders nothing unless at least one campaign is
 * approved + paid + scheduled + budgeted for this placement. Never renders in
 * sensitive contexts — each product mounts it explicitly.
 */
export function SponsoredCard({ campaign, compact }: { campaign: Campaign; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const creative = campaign.creatives[0]
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || alreadyCounted(campaign.id, 'i')) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (timer.current) window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => {
            if (!alreadyCounted(campaign.id, 'i')) { markCounted(campaign.id, 'i'); recordEvent(campaign, 'impressions') }
          }, 1000) // 1s continuous visibility @ ≥50%
        } else if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
      }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => { io.disconnect(); if (timer.current) window.clearTimeout(timer.current) }
  }, [campaign])

  const open = () => {
    if (!alreadyCounted(campaign.id, 'c')) { markCounted(campaign.id, 'c'); recordEvent(campaign, 'clicks') }
    try { window.open(campaign.destinationUrl, '_blank', 'noopener,noreferrer') } catch { /* noop */ }
  }

  return (
    <div ref={ref} className={`dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-pink-500/20 border-pink-200 overflow-hidden ${compact ? '' : 'shadow-sm'}`} data-sponsored="true" aria-label={`Sponsored: ${campaign.headline}`}>
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center text-white text-[11px] font-black shrink-0">{(campaign.advertiserName || 'S').slice(0, 1)}</div>
        <p className="text-xs font-bold dark:text-white text-gray-900 truncate flex-1">{campaign.advertiserName}</p>
        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-500 border border-pink-500/25">Sponsored</span>
      </div>
      {creative && (creative.kind === 'video'
        ? <video src={creative.url} className="w-full max-h-72 object-cover mt-2" muted playsInline preload="metadata" />
        : <img src={creative.url} alt={campaign.headline} className="w-full max-h-72 object-cover mt-2" loading="lazy" />)}
      <div className="p-3">
        <p className="font-bold text-sm dark:text-white text-gray-900">{campaign.headline}</p>
        {(campaign.description || campaign.body) && <p className="text-xs dark:text-gray-400 text-gray-600 mt-0.5 line-clamp-2">{campaign.description || campaign.body.slice(0, 140)}</p>}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <button onClick={open} className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition">
            {campaign.cta} <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <ReportAdButton campaignId={campaign.id} name={campaign.name} />
        </div>
      </div>
    </div>
  )
}

/** Picks one eligible ad for a placement with fair rotation + frequency cap. */
export function FeedAdSlot({ placement = 'home_feed' }: { placement?: string }) {
  const [pool, setPool] = useState<Campaign[]>(() => collectLocal(placement))

  useEffect(() => {
    // merge admin-managed ad_campaigns (active + matching placement + in dates)
    supabase.from('ad_campaigns').select('*').eq('status', 'active').limit(20)
      .then(({ data, error }) => {
        if (error || !data) return
        const mapped: Campaign[] = []
        for (const r of data as unknown as Record<string, unknown>[]) {
          const plc = typeof r.placement === 'string' ? r.placement : ''
          if (plc && plc !== placement && plc !== 'feed' && placement === 'home_feed' && plc !== 'home_feed') continue
          const now = new Date()
          if (r.start_date && new Date(r.start_date as string) > now) continue
          if (r.end_date && new Date(r.end_date as string) < now) continue
          mapped.push({
            id: `admin-${r.id as string}`, ownerId: 'admin', name: (r.title as string) || 'Sponsored',
            advertiserName: (r.advertiser as string) || 'SmartzConnect Partner',
            objective: 'brand', format: r.type === 'video' ? 'video' : 'image',
            headline: (r.title as string) || '', description: '', body: '',
            cta: 'Learn More', destinationUrl: (r.target_url as string) || 'https://smartzconnect.com', leadDestination: '',
            creatives: r.image_url ? [{ id: `a-${r.id as string}`, kind: 'image', url: r.image_url as string, name: 'creative', sizeBytes: 0, createdAt: now.toISOString() }] : [],
            carousel: [], placements: [placement],
            targeting: { country: 'Liberia', city: '', language: 'English', ageRange: '18+', interests: [], device: 'all' },
            pricingModel: 'fixed', packageId: '', budgetTotal: Number(r.budget_usd) || 0, dailyCap: 0,
            currency: 'USD', startDate: (r.start_date as string) || '', endDate: (r.end_date as string) || '',
            status: 'active', moderationStatus: 'approved', moderationNote: '', paymentStatus: 'verified',
            txRef: '', invoiceId: '', idempotencyKey: `admin-${r.id as string}`,
            impressions: Number(r.impressions) || 0, clicks: Number(r.clicks) || 0, leads: 0, conversions: 0,
            amountSpent: Number(r.spent_usd) || 0, eventTitle: '', eventDate: '', eventLocation: '',
            jobTitle: '', jobOrg: '', history: [], createdAt: (r.created_at as string) || now.toISOString(),
            updatedAt: now.toISOString(),
          })
        }
        if (mapped.length > 0) setPool(prev => [...mapped, ...prev].slice(0, 20))
      }, () => {})
  }, [placement])

  const pick = useMemo(() => {
    const fresh = pool.filter(c => sessionShown(c.id) < 3)
    if (fresh.length === 0) return null
    fresh.sort((a, b) => (a.impressions - b.impressions) || (a.id < b.id ? -1 : 1))
    return fresh[0]
  }, [pool])

  useEffect(() => { if (pick) markShown(pick.id) }, [pick?.id])

  if (!pick) return null
  return <SponsoredCard campaign={pick} />
}

export default FeedAdSlot
