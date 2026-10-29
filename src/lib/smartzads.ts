/* SmartzAds — domain engine: types, catalogues, pricing, validation, delivery, analytics.
   Local-first: persists to localStorage per user; syncs opportunistically to the
   existing `ad_campaigns` Supabase table when it exists. No fake payments, no
   fabricated reach — estimates are labelled and derived from configured rates. */

export type CampaignStatus =
  | 'draft' | 'submitted' | 'under_review' | 'changes_requested' | 'approved'
  | 'scheduled' | 'active' | 'paused' | 'completed' | 'rejected'
  | 'cancelled' | 'payment_required' | 'payment_failed'

export type ModerationStatus =
  | 'none' | 'pending' | 'under_review' | 'changes_requested' | 'approved' | 'rejected' | 'suspended'

export type PaymentStatus = 'unpaid' | 'pending' | 'verified' | 'failed' | 'refunded' | 'partial_refund'

export type PricingModel = 'cpm' | 'cpc' | 'fixed' | 'package' | 'daily'

export interface AdCreative {
  id: string
  kind: 'image' | 'video' | 'logo'
  url: string
  name: string
  sizeBytes: number
  width?: number
  height?: number
  durationSec?: number
  createdAt: string
}

export interface CarouselCard { headline: string; destination: string; imageUrl: string }

export interface Targeting {
  country: string
  city: string
  language: string
  ageRange: string
  interests: string[]
  device: string
}

export interface Campaign {
  id: string
  ownerId: string
  name: string
  advertiserName: string
  objective: string
  headline: string
  description: string
  body: string
  cta: string
  destinationUrl: string
  leadDestination: string
  format: string
  placements: string[]
  targeting: Targeting
  creatives: AdCreative[]
  carousel: CarouselCard[]
  eventTitle: string
  eventDate: string
  eventLocation: string
  jobTitle: string
  jobOrg: string
  startDate: string
  endDate: string
  currency: string
  pricingModel: PricingModel
  budgetTotal: number
  dailyCap: number
  packageId: string
  amountSpent: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
  status: CampaignStatus
  moderationStatus: ModerationStatus
  moderationNote: string
  paymentStatus: PaymentStatus
  txRef: string
  invoiceId: string
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  history: { at: string; actor: string; action: string; note?: string }[]
}

export interface AdvertiserProfile {
  userId: string
  businessName: string
  category: string
  email: string
  phone: string
  country: string
  city: string
  website: string
  logoUrl: string
  description: string
  currency: string
  billingName: string
  billingAddress: string
  suspended: boolean
  updatedAt: string
}

export interface Invoice {
  id: string
  campaignId: string
  ownerId: string
  number: string
  amount: number
  currency: string
  model: PricingModel
  fees: number
  tax: number
  total: number
  status: PaymentStatus
  txRef: string
  createdAt: string
  refundedAt?: string
}

export interface AdsNotification { id: string; title: string; body: string; at: string; read: boolean; kind: string }

/* ── Catalogues ─────────────────────────────────────────────── */
export const OBJECTIVES = [
  { id: 'brand', label: 'Brand Awareness', desc: 'Get your name seen across SmartzConnect', formats: ['image', 'video', 'sponsored'], cta: ['Learn More', 'Visit Website'] },
  { id: 'traffic', label: 'Website Traffic', desc: 'Send visitors to your site or page', formats: ['image', 'text', 'sponsored'], cta: ['Learn More', 'Visit Website', 'Shop Now'] },
  { id: 'product', label: 'Product Promotion', desc: 'Showcase products with images and price', formats: ['image', 'carousel', 'product'], cta: ['Shop Now', 'Learn More', 'Send Message'] },
  { id: 'service', label: 'Service Promotion', desc: 'Promote services with booking contact', formats: ['image', 'business', 'text'], cta: ['Book Now', 'Contact Us', 'Get Directions'] },
  { id: 'leads', label: 'Lead Generation', desc: 'Collect enquiries and contact requests', formats: ['text', 'image', 'business'], cta: ['Contact Us', 'Send Message', 'Register Now'] },
  { id: 'app', label: 'App Downloads', desc: 'Drive installs of your mobile app', formats: ['image', 'video', 'text'], cta: ['Download', 'Learn More'] },
  { id: 'event', label: 'Event Promotion', desc: 'Fill seats for events online or in person', formats: ['event', 'image', 'sponsored'], cta: ['Register Now', 'Book Now', 'Learn More'] },
  { id: 'business', label: 'Business Promotion', desc: 'Put your business on the map', formats: ['business', 'image', 'sponsored'], cta: ['Get Directions', 'Contact Us', 'Visit Website'] },
  { id: 'social', label: 'Dating / Social Profile Promotion', desc: 'Promote a public profile or page (policy-checked)', formats: ['sponsored', 'image', 'text'], cta: ['Learn More', 'Send Message'] },
  { id: 'jobs', label: 'Job / Professional Opportunity', desc: 'Hire talent or promote opportunities', formats: ['job', 'text', 'image'], cta: ['Apply Now', 'Learn More', 'Contact Us'] },
  { id: 'sales', label: 'Sales / Customer Acquisition', desc: 'Turn views into paying customers', formats: ['carousel', 'product', 'image'], cta: ['Shop Now', 'Book Now', 'Contact Us'] },
]

export const FORMATS = [
  { id: 'image', label: 'Single Image', hint: '1200×628 landscape or 1080×1080 square · JPG/PNG/WebP ≤ 5MB', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
  { id: 'video', label: 'Video', hint: 'MP4/WebM ≤ 50MB · up to 60s · thumbnail auto-uses first frame', accept: 'video/mp4,video/webm', maxMB: 50 },
  { id: 'carousel', label: 'Carousel (2–5 cards)', hint: 'Swipeable cards, each with headline + destination', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
  { id: 'text', label: 'Text Ad', hint: 'Headline + description + button, no upload needed', accept: '', maxMB: 0 },
  { id: 'business', label: 'Business / Product', hint: 'Logo + product photo + price or offer', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
  { id: 'product', label: 'Product Promo', hint: 'Product images + price + shop destination', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
  { id: 'sponsored', label: 'Sponsored Post', hint: 'Native in-feed post, always labelled Sponsored', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
  { id: 'event', label: 'Event Ad', hint: 'Event title, date, venue + registration link', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
  { id: 'job', label: 'Job / Opportunity', hint: 'Role, organisation + application link', accept: 'image/jpeg,image/png,image/webp', maxMB: 5 },
]

export interface PlacementDef { id: string; label: string; surface: string; integrated: boolean; cpm: number; cpc: number; fixed: number; note: string }
export const PLACEMENTS: PlacementDef[] = [
  { id: 'home_feed', label: 'SmartzConnect Home Feed', surface: '/app/feed (Sponsored slot)', integrated: true, cpm: 4, cpc: 0.25, fixed: 29, note: 'Native sponsored card every ~12 posts' },
  { id: 'social_feed', label: 'SmartzSocial Feed', surface: '/app/feed (Sponsored slot)', integrated: true, cpm: 3, cpc: 0.2, fixed: 24, note: 'Shared feed inventory' },
  { id: 'blog_banner', label: 'Blog / Content Banner', surface: '/blog (banner)', integrated: true, cpm: 2, cpc: 0.15, fixed: 19, note: 'Live banner from ad_campaigns' },
  { id: 'market', label: 'SmartzMarket Discovery', surface: '/app/marketplace', integrated: false, cpm: 5, cpc: 0.3, fixed: 39, note: 'Integration required before purchase' },
  { id: 'tv', label: 'SmartzTV Promo', surface: 'SmartzTV pre-roll / rails', integrated: false, cpm: 8, cpc: 0.5, fixed: 59, note: 'Integration required before purchase' },
  { id: 'ride', label: 'SmartzRide Promo', surface: 'Ride booking screens', integrated: false, cpm: 6, cpc: 0.35, fixed: 49, note: 'Integration required before purchase' },
  { id: 'delivery', label: 'SmartzDelivery Promo', surface: 'Delivery tracking screens', integrated: false, cpm: 6, cpc: 0.35, fixed: 49, note: 'Integration required before purchase' },
  { id: 'dating', label: 'Dating Discovery (restricted)', surface: 'Discovery promos only — never in chats', integrated: false, cpm: 7, cpc: 0.4, fixed: 55, note: 'Strict policy review; never inside private messages' },
  { id: 'business', label: 'Business / Pro Directory', surface: 'Jobs + business sections', integrated: false, cpm: 4, cpc: 0.25, fixed: 29, note: 'Integration required before purchase' },
  { id: 'search', label: 'Sponsored Search', surface: 'In-app search results', integrated: false, cpm: 5, cpc: 0.35, fixed: 35, note: 'Integration required before purchase' },
]

export const PACKAGES = [
  { id: '', name: 'Custom (pay by model)', price: 0, days: 0, placements: [] as string[], formats: [] as string[], blurb: 'Set your own budget and duration' },
  { id: 'starter', name: 'Starter', price: 25, days: 7, placements: ['blog_banner'], formats: ['image', 'text'], blurb: 'Perfect first campaign · 1 placement · 7 days' },
  { id: 'business', name: 'Business', price: 79, days: 14, placements: ['home_feed', 'social_feed', 'blog_banner'], formats: ['image', 'text', 'sponsored'], blurb: 'Feed + banner reach · 14 days' },
  { id: 'pro', name: 'Professional', price: 199, days: 30, placements: ['home_feed', 'social_feed', 'blog_banner'], formats: ['image', 'carousel', 'video', 'sponsored'], blurb: 'All live inventory · video + carousel · 30 days' },
  { id: 'premium', name: 'Premium', price: 449, days: 60, placements: ['home_feed', 'social_feed', 'blog_banner'], formats: ['image', 'carousel', 'video', 'sponsored', 'product'], blurb: 'Maximum exposure · 60 days · priority rotation' },
]

export const CTAS = ['Learn More', 'Shop Now', 'Contact Us', 'Register Now', 'Book Now', 'Download', 'Apply Now', 'Visit Website', 'Get Directions', 'Send Message']
export const CURRENCIES = ['USD', 'LRD', 'NGN', 'GHS', 'KES', 'EUR', 'GBP']
export const CATEGORIES = ['Retail', 'Food & Drink', 'Fashion', 'Technology', 'Health & Beauty', 'Education', 'Real Estate', 'Transport', 'Events & Entertainment', 'Professional Services', 'Nonprofit', 'Individual / Creator', 'Other']
export const COUNTRIES = ['Liberia', 'Nigeria', 'Ghana', 'Sierra Leone', 'Guinea', 'Ivory Coast', 'Kenya', 'South Africa', 'United States', 'United Kingdom', 'Other']
export const LANGUAGES = ['English', 'French', 'Pidgin', 'Swahili', 'Other']
export const AGE_RANGES = ['18–24', '25–34', '35–44', '45+', 'All adults (18+)']
export const INTERESTS = ['Shopping', 'Food', 'Music', 'Sports', 'Technology', 'Fashion', 'Travel', 'Education', 'Business', 'Health', 'Events']

/* ── Admin-configurable rates (persisted; defaults below) ── */
export interface AdsConfig {
  minBudget: number; minDays: number; taxRate: number; feeRate: number;
  rates: Record<string, { cpm: number; cpc: number; fixed: number; enabled: boolean }>
  packages?: { id: string; name: string; price: number; days: number; placements: string[]; formats: string[]; blurb: string }[]
}
export const DEFAULT_CONFIG: AdsConfig = {
  minBudget: 5, minDays: 1, taxRate: 0, feeRate: 0.03,
  rates: Object.fromEntries(PLACEMENTS.map(p => [p.id, { cpm: p.cpm, cpc: p.cpc, fixed: p.fixed, enabled: p.integrated }])),
}
const CONFIG_KEY = 'smartzads_config_v1'
export function loadConfig(): AdsConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    const c = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    c.rates = { ...DEFAULT_CONFIG.rates, ...(JSON.parse(raw).rates || {}) }
    return c
  } catch { return DEFAULT_CONFIG }
}
export function saveConfig(c: AdsConfig) { try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)) } catch { /* noop */ } }

/* ── Pricing ──────────────────────────────────────────────── */
export function quoteFor(c: Pick<Campaign, 'placements' | 'pricingModel' | 'budgetTotal' | 'packageId' | 'startDate' | 'endDate'>, cfg: AdsConfig) {
  const pkgList = cfg.packages && cfg.packages.length > 0 ? cfg.packages : PACKAGES
  const pkg = pkgList.find(p => p.id === c.packageId && p.id)
  const days = c.startDate && c.endDate ? Math.max(1, Math.round((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1) : 1
  let base = 0
  let lines: { label: string; amount: number }[] = []
  if (pkg) {
    base = pkg.price
    lines = [{ label: `${pkg.name} package · ${pkg.days} days`, amount: pkg.price }]
  } else if (c.pricingModel === 'fixed' || c.pricingModel === 'daily') {
    for (const pid of c.placements) {
      const r = cfg.rates[pid]; const p = PLACEMENTS.find(x => x.id === pid)
      if (!r || !p) continue
      const amt = c.pricingModel === 'daily' ? r.fixed * days : r.fixed
      base += amt
      lines.push({ label: `${p.label} · ${c.pricingModel === 'daily' ? `fixed × ${days}d` : 'fixed'}`, amount: amt })
    }
  } else {
    // CPM/CPC are budget-capped: advertiser sets max budget; estimate delivery range
    base = c.budgetTotal
    const cpmAvg = avg(c.placements.map(pid => cfg.rates[pid]?.cpm || 0))
    const cpcAvg = avg(c.placements.map(pid => cfg.rates[pid]?.cpc || 0))
    const estImpr = c.pricingModel === 'cpm' && cpmAvg > 0 ? Math.floor((base / cpmAvg) * 1000) : 0
    const estClicks = c.pricingModel === 'cpc' && cpcAvg > 0 ? Math.floor(base / cpcAvg) : 0
    lines = [{ label: c.pricingModel === 'cpm' ? `CPM budget cap (≈${estImpr.toLocaleString()} max impressions)` : `CPC budget cap (≈${estClicks.toLocaleString()} max clicks)`, amount: base }]
  }
  const fees = +(base * cfg.feeRate).toFixed(2)
  const tax = +((base + fees) * cfg.taxRate).toFixed(2)
  return { lines, base: +base.toFixed(2), fees, tax, total: +(base + fees + tax).toFixed(2), days }
}
const avg = (xs: number[]) => (xs.filter(x => x > 0).reduce((a, b) => a + b, 0) / Math.max(1, xs.filter(x => x > 0).length)) || 0

/* ── Validation ───────────────────────────────────────────── */
const SAFE_URL = /^(https?:\/\/)[\w\-._~:/?#[\]@!$&'()*+,;=%]+$/i
export function validateUrl(url: string): string | null {
  if (!url) return null
  const t = url.trim()
  if (/^(javascript|data|file|ftp):/i.test(t)) return 'Unsafe link — only http(s) links are allowed.'
  if (!SAFE_URL.test(t)) return 'Enter a valid link starting with https://'
  try { const u = new URL(t); if (!['http:', 'https:'].includes(u.protocol)) return 'Only http(s) links are allowed.' } catch { return 'Enter a valid link starting with https://' }
  return null
}
export function validateFile(file: File, format: string): string | null {
  const def = FORMATS.find(f => f.id === format)
  const isVideo = file.type.startsWith('video/')
  const limitMB = isVideo ? 50 : def?.maxMB || 5
  if (format === 'text') return 'Text ads do not need uploads.'
  if (isVideo && format !== 'video') return 'Videos are only allowed for the Video format — switch format or choose an image.'
  if (!isVideo && format === 'video') return 'Video format needs a video file — switch format or choose a video.'
  if (file.size > limitMB * 1024 * 1024) return `File too large — maximum ${limitMB}MB.`
  return null
}

/* ── Analytics (zero-safe) ────────────────────────────────── */
export const ctr = (clicks: number, impr: number) => (impr > 0 ? (clicks / impr) * 100 : 0)
export const cpm = (spend: number, impr: number) => (impr > 0 ? (spend / impr) * 1000 : 0)
export const cpc = (spend: number, clicks: number) => (clicks > 0 ? spend / clicks : 0)

/* ── Delivery eligibility (single source of truth) ────────── */
export function isDeliverable(c: Campaign, cfg: AdsConfig, now = new Date()): { ok: boolean; reason: string } {
  if (!['approved', 'active', 'scheduled'].includes(c.status)) return { ok: false, reason: `status=${c.status}` }
  if (c.moderationStatus !== 'approved') return { ok: false, reason: 'moderation' }
  const needsPayment = c.pricingModel !== 'cpm' && c.pricingModel !== 'cpc' ? true : c.budgetTotal > 0
  if (needsPayment && c.paymentStatus !== 'verified') {
    // CPM/CPC with a budget still require verified payment before serving
    return { ok: false, reason: 'payment' }
  }
  if (c.startDate && new Date(c.startDate) > now) return { ok: false, reason: 'scheduled' }
  if (c.endDate && new Date(c.endDate) < now) return { ok: false, reason: 'expired' }
  if (c.amountSpent >= totalDue(c, cfg)) return { ok: false, reason: 'budget-exhausted' }
  if (!c.placements.some(pid => cfg.rates[pid]?.enabled)) return { ok: false, reason: 'placement-disabled' }
  return { ok: true, reason: 'eligible' }
}
export function totalDue(c: Pick<Campaign, 'placements' | 'pricingModel' | 'budgetTotal' | 'packageId' | 'startDate' | 'endDate'>, cfg: AdsConfig) {
  return quoteFor(c, cfg).total
}

/* Status transitions enforced both client + (documented) server-side */
const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['under_review', 'cancelled', 'draft'],
  under_review: ['approved', 'rejected', 'changes_requested'],
  changes_requested: ['submitted', 'draft', 'cancelled'],
  approved: ['scheduled', 'active', 'paused', 'cancelled'],
  scheduled: ['active', 'paused', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled', 'completed'],
  completed: [],
  rejected: ['draft', 'cancelled'],
  cancelled: [],
  payment_required: ['submitted', 'cancelled'],
  payment_failed: ['submitted', 'cancelled'],
}
export const canTransition = (from: CampaignStatus, to: CampaignStatus) => (TRANSITIONS[from] || []).includes(to)

/* ── Per-user local store ─────────────────────────────────── */
const k = (uid: string, s: string) => `smartzads_${uid}_${s}`
export function loadCampaigns(uid: string): Campaign[] {
  try { return JSON.parse(localStorage.getItem(k(uid, 'campaigns')) || '[]') } catch { return [] }
}
export function saveCampaigns(uid: string, list: Campaign[]) {
  try { localStorage.setItem(k(uid, 'campaigns'), JSON.stringify(list)) } catch { /* quota */ }
}
export function loadProfile(uid: string): AdvertiserProfile | null {
  try { const r = localStorage.getItem(k(uid, 'profile')); return r ? JSON.parse(r) : null } catch { return null }
}
export function saveProfile(uid: string, p: AdvertiserProfile) {
  try { localStorage.setItem(k(uid, 'profile'), JSON.stringify(p)) } catch { /* noop */ }
}
export function loadInvoices(uid: string): Invoice[] {
  try { return JSON.parse(localStorage.getItem(k(uid, 'invoices')) || '[]') } catch { return [] }
}
export function saveInvoices(uid: string, list: Invoice[]) {
  try { localStorage.setItem(k(uid, 'invoices'), JSON.stringify(list)) } catch { /* noop */ }
}
export function loadAdsNotifs(uid: string): AdsNotification[] {
  try { return JSON.parse(localStorage.getItem(k(uid, 'notifs')) || '[]') } catch { return [] }
}
export function saveAdsNotifs(uid: string, list: AdsNotification[]) {
  try { localStorage.setItem(k(uid, 'notifs'), JSON.stringify(list)) } catch { /* noop */ }
}
export const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`)
export const nowIso = () => new Date().toISOString()

export function blankCampaign(ownerId: string, advertiserName = ''): Campaign {
  const t = nowIso()
  return {
    id: uid(), ownerId, name: '', advertiserName, objective: 'brand', headline: '', description: '', body: '',
    cta: 'Learn More', destinationUrl: '', leadDestination: '', format: 'image', placements: ['home_feed'],
    targeting: { country: 'Liberia', city: '', language: 'English', ageRange: 'All adults (18+)', interests: [], device: 'All devices' },
    creatives: [], carousel: [], eventTitle: '', eventDate: '', eventLocation: '', jobTitle: '', jobOrg: '',
    startDate: '', endDate: '', currency: 'USD', pricingModel: 'fixed', budgetTotal: 25, dailyCap: 0, packageId: '',
    amountSpent: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0,
    status: 'draft', moderationStatus: 'none', moderationNote: '', paymentStatus: 'unpaid', txRef: '', invoiceId: '',
    idempotencyKey: uid(), createdAt: t, updatedAt: t, history: [{ at: t, actor: 'advertiser', action: 'created (draft)' }],
  }
}

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft', submitted: 'Submitted for Review', under_review: 'Under Review', changes_requested: 'Changes Requested',
  approved: 'Approved', scheduled: 'Scheduled', active: 'Active', paused: 'Paused', completed: 'Completed',
  rejected: 'Rejected', cancelled: 'Cancelled', payment_required: 'Payment Required', payment_failed: 'Payment Failed',
}
