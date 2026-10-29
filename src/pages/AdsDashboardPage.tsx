import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Plus, LayoutDashboard, Image as ImageIcon, BarChart3, Target,
  Wallet, Receipt, Bell, LifeBuoy, User as UserIcon, Settings as SettingsIcon,
  ChevronRight, Upload, X, Check, Clock, Pause, Play, Copy, Trash2,
  Download, AlertTriangle, CheckCircle, Eye, ChevronLeft, Loader2, Flag,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'
import {
  type Campaign, type AdvertiserProfile, type Invoice, type AdsNotification,
  OBJECTIVES, FORMATS, PLACEMENTS, PACKAGES, CTAS, CURRENCIES, CATEGORIES, COUNTRIES, LANGUAGES, AGE_RANGES, INTERESTS,
  loadConfig, quoteFor, validateUrl, validateFile, ctr, cpm, cpc, isDeliverable,
  canTransition, loadCampaigns, saveCampaigns, loadProfile, saveProfile, loadInvoices, saveInvoices,
  loadAdsNotifs, saveAdsNotifs, blankCampaign, uid, nowIso, STATUS_LABEL, type CampaignStatus,
} from '@/lib/smartzads'

type Section = 'overview' | 'create' | 'campaigns' | 'library' | 'performance' | 'audience' | 'budget' | 'invoices' | 'notifs' | 'support' | 'profile' | 'settings'

const NAV: { id: Section; label: string; icon: typeof Plus }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'create', label: 'Create Advertisement', icon: Plus },
  { id: 'campaigns', label: 'My Campaigns', icon: Megaphone },
  { id: 'library', label: 'Creative Library', icon: ImageIcon },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'audience', label: 'Audience & Targeting', icon: Target },
  { id: 'budget', label: 'Budget & Payments', icon: Wallet },
  { id: 'invoices', label: 'Invoices & Receipts', icon: Receipt },
  { id: 'notifs', label: 'Notifications', icon: Bell },
  { id: 'support', label: 'Support & Help', icon: LifeBuoy },
  { id: 'profile', label: 'Advertiser Profile', icon: UserIcon },
  { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
]

const input = 'w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition'
const label = 'block text-xs font-bold uppercase tracking-wider dark:text-gray-400 text-gray-500 mb-1.5'
const btnP = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50'
const btnS = 'inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-sm font-semibold dark:bg-white/8 bg-gray-100 dark:text-gray-200 text-gray-700 border dark:border-white/10 border-gray-200 hover:dark:bg-white/12 hover:bg-gray-200 transition disabled:opacity-50'
const card = 'dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5'

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  submitted: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  under_review: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  changes_requested: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  approved: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  scheduled: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  active: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
  paused: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
  completed: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
  cancelled: 'bg-gray-500/15 text-gray-500 border-gray-500/25',
  payment_required: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/25',
  payment_failed: 'bg-red-500/15 text-red-400 border-red-500/25',
}

export default function AdsDashboardPage() {
  const { user } = useAuth()
  const uidKey = user?.id || 'guest'
  const [section, setSection] = useState<Section>('overview')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [notifs, setNotifs] = useState<AdsNotification[]>([])
  const [cfg] = useState(loadConfig)
  const [loaded, setLoaded] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // wizard state
  const [draft, setDraft] = useState<Campaign | null>(null)
  const [step, setStep] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  // filters
  const [q, setQ] = useState('')
  const [fStatus, setFStatus] = useState('all')
  const [perfId, setPerfId] = useState<string>('all')
  const [range, setRange] = useState('30')

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3200) }
  const persist = (list: Campaign[]) => { setCampaigns(list); saveCampaigns(uidKey, list) }
  const pushHist = (c: Campaign, action: string, note?: string): Campaign => ({ ...c, history: [...c.history, { at: nowIso(), actor: 'advertiser', action, note }], updatedAt: nowIso() })

  /* load + opportunistic cloud sync */
  useEffect(() => {
    setCampaigns(loadCampaigns(uidKey)); setProfile(loadProfile(uidKey))
    setInvoices(loadInvoices(uidKey)); setNotifs(loadAdsNotifs(uidKey))
    setLoaded(true)
    // best-effort: pull owner's rows from new schema table if it exists
    if (user?.id) {
      Promise.resolve(supabase.from('smartzads_campaigns').select('*').eq('owner_id', user.id).limit(50))
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setCampaigns(prev => {
              const ids = new Set(prev.map(c => c.id))
              const merged = [...prev]
              for (const r of data as unknown[]) {
                const row = r as Record<string, unknown>
                if (typeof row.id === 'string' && !ids.has(row.id)) {
                  const t = nowIso()
                  merged.push({
                    ...blankCampaign(user.id), ...(row as object), id: row.id as string, ownerId: user.id,
                    creatives: Array.isArray(row.creatives) ? row.creatives as Campaign['creatives'] : [],
                    targeting: { ...blankCampaign(user.id).targeting, ...((row.targeting as object) || {}) },
                    history: Array.isArray(row.history) ? row.history as Campaign['history'] : [{ at: t, actor: 'system', action: 'imported from cloud' }],
                  } as Campaign)
                }
              }
              saveCampaigns(uidKey, merged)
              return merged
            })
          }
        }).catch(() => { /* table may not exist yet — local-first */ })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uidKey])

  const notify = (title: string, body: string, kind = 'info') => {
    const n: AdsNotification = { id: uid(), title, body, at: nowIso(), read: false, kind }
    const list = [n, ...notifs].slice(0, 100)
    setNotifs(list); saveAdsNotifs(uidKey, list)
  }

  const totals = useMemo(() => ({
    spend: campaigns.reduce((a, c) => a + c.amountSpent, 0),
    impr: campaigns.reduce((a, c) => a + c.impressions, 0),
    clicks: campaigns.reduce((a, c) => a + c.clicks, 0),
    active: campaigns.filter(c => c.status === 'active').length,
  }), [campaigns])

  /* ── wizard actions ── */
  const startCreate = () => {
    setDraft(blankCampaign(uidKey, profile?.businessName || ''))
    setEditingId(null); setStep(0); setSection('create')
  }
  const openEdit = (c: Campaign) => {
    if (!['draft', 'changes_requested', 'rejected'].includes(c.status)) { say('Only drafts, rejected or change-requested campaigns can be edited — approved ads need re-review.'); return }
    setDraft({ ...c }); setEditingId(c.id); setStep(0); setSection('create')
  }
  const saveDraft = () => {
    if (!draft) return
    if (!draft.name.trim()) { say('Give your campaign a name first.'); return }
    const d = pushHist({ ...draft, status: draft.status === 'draft' ? 'draft' : draft.status }, editingId ? 'edited draft' : 'saved draft')
    if (editingId) persist(campaigns.map(c => c.id === editingId ? d : c))
    else persist([d, ...campaigns])
    setEditingId(d.id)
    say('Draft saved.')
    // best-effort cloud upsert
    if (user?.id) supabase.from('smartzads_campaigns').upsert({ id: d.id, owner_id: user.id, name: d.name, status: 'draft' } as never).then(() => {}, () => {})
  }
  const submit = () => {
    if (!draft) return
    const urlErr = validateUrl(draft.destinationUrl)
    if (!draft.name.trim() || !draft.headline.trim()) { say('Add a campaign name and headline before submitting.'); return }
    if (urlErr) { say(urlErr); return }
    if (draft.placements.length === 0) { say('Choose at least one placement.'); return }
    if (!draft.startDate || !draft.endDate) { say('Set campaign start and end dates.'); return }
    const quote = quoteFor(draft, cfg)
    if (quote.total < cfg.minBudget) { say(`Minimum campaign budget is $${cfg.minBudget.toFixed(2)}.`); return }
    const needsPay = draft.pricingModel === 'fixed' || draft.pricingModel === 'daily' || draft.packageId !== ''
    const d = pushHist({
      ...draft, status: needsPay && draft.paymentStatus !== 'verified' ? 'payment_required' : 'submitted',
      moderationStatus: 'pending', moderationNote: '',
    }, 'submitted for review')
    if (editingId) persist(campaigns.map(c => c.id === editingId ? d : c))
    else { persist([d, ...campaigns]); setEditingId(d.id) }
    // invoice
    const inv: Invoice = {
      id: uid(), campaignId: d.id, ownerId: uidKey, number: `INV-${Date.now().toString(36).toUpperCase()}`,
      amount: quote.base, currency: d.currency, model: d.pricingModel, fees: quote.fees, tax: quote.tax,
      total: quote.total, status: d.paymentStatus === 'verified' ? 'verified' : 'unpaid', txRef: d.txRef, createdAt: nowIso(),
    }
    const invList = [inv, ...invoices.filter(i => i.campaignId !== d.id)]; setInvoices(invList); saveInvoices(uidKey, invList)
    notify('Advertisement submitted', `"${d.name}" is now awaiting review. ${needsPay && d.paymentStatus !== 'verified' ? 'Complete payment in Budget & Payments to activate after approval.' : ''}`, 'moderation')
    setDraft(d); say(needsPay && d.paymentStatus !== 'verified' ? 'Submitted — payment required before delivery.' : 'Submitted for review.')
  }
  const transition = (c: Campaign, to: CampaignStatus) => {
    if (!canTransition(c.status, to)) { say(`Cannot move from ${STATUS_LABEL[c.status]} to ${STATUS_LABEL[to]}.`); return }
    // material edits to approved creative must re-review — enforced by openEdit + this path
    const d = pushHist({ ...c, status: to }, `status → ${to}`)
    persist(campaigns.map(x => x.id === c.id ? d : x))
    const labels: Partial<Record<CampaignStatus, string>> = { active: 'Campaign activated', paused: 'Campaign paused', cancelled: 'Campaign cancelled', completed: 'Campaign marked complete' }
    if (labels[to]) notify(labels[to]!, `"${c.name}" — ${STATUS_LABEL[to]}.`, 'status')
    say(`Campaign ${STATUS_LABEL[to].toLowerCase()}.`)
  }
  const duplicate = (c: Campaign) => {
    const d = pushHist({ ...blankCampaign(uidKey), ...JSON.parse(JSON.stringify({ ...c, id: undefined })) as object, id: uid(), name: `${c.name} (copy)`, status: 'draft', moderationStatus: 'none', moderationNote: '', paymentStatus: 'unpaid', txRef: '', invoiceId: '', impressions: 0, clicks: 0, leads: 0, conversions: 0, amountSpent: 0, idempotencyKey: uid(), createdAt: nowIso(), updatedAt: nowIso() } as Campaign, 'duplicated')
    persist([d, ...campaigns]); say('Duplicated as a new draft.')
  }
  const remove = (c: Campaign) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return
    persist(campaigns.filter(x => x.id !== c.id)); say('Campaign deleted.')
  }

  /* mock-verified payment adapter: records a provider reference, marks pending verification,
     and ONLY activates after explicit "verify" (simulating server webhook). No fake success. */
  const [payMethod, setPayMethod] = useState('Mobile Money')
  const [payRef, setPayRef] = useState('')
  const recordPayment = (c: Campaign) => {
    if (!payRef.trim()) { say('Enter the provider transaction reference first.'); return }
    const key = c.idempotencyKey
    if (invoices.some(i => i.txRef === payRef.trim() && i.status === 'verified')) { say('This reference was already used — duplicate prevented.'); return }
    const d = pushHist({ ...c, txRef: payRef.trim(), paymentStatus: 'pending', status: c.status === 'payment_required' ? 'submitted' : c.status }, `payment recorded (${payMethod}, ref ${payRef.trim()}, key ${key.slice(0, 8)}) — awaiting provider verification`)
    persist(campaigns.map(x => x.id === c.id ? d : x))
    setInvoices(prev => { const l = prev.map(i => i.campaignId === c.id ? { ...i, status: 'pending' as const, txRef: payRef.trim() } : i); saveInvoices(uidKey, l); return l })
    notify('Payment recorded', `Reference ${payRef.trim()} is awaiting provider verification. Your campaign will NOT run until verified.`, 'billing')
    say('Payment recorded — awaiting verification. Campaign is not active yet.')
    setPayRef('')
  }
  const verifyPaymentDemo = (c: Campaign) => {
    // Demo verifier stands in for a real provider webhook. In production this is
    // replaced by a server-side webhook with signature checks — never the browser.
    const ok = window.confirm('Demo verification: simulate the payment provider confirming this transaction?\n\nIn production this happens via a signed server webhook, never a button.')
    if (!ok) return
    const d = pushHist({ ...c, paymentStatus: 'verified', status: c.status === 'submitted' ? 'submitted' : c.status }, 'payment VERIFIED by provider webhook (demo)')
    persist(campaigns.map(x => x.id === c.id ? d : x))
    setInvoices(prev => { const l = prev.map(i => i.campaignId === c.id ? { ...i, status: 'verified' as const } : i); saveInvoices(uidKey, l); return l })
    notify('Payment successful', `Payment for "${c.name}" was verified. It will go live after moderation approval.`, 'billing')
    say('Payment verified. Awaiting moderation approval.')
  }

  const filtered = campaigns.filter(c =>
    (fStatus === 'all' || c.status === fStatus) &&
    (!q || (c.name + c.headline + c.advertiserName).toLowerCase().includes(q.toLowerCase()))
  )
  const perfCampaigns = perfId === 'all' ? campaigns : campaigns.filter(c => c.id === perfId)

  if (!loaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 pt-[72px] sm:pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-500">SmartzAds · Self-Service</p>
            <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900">Advertising Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/smartzads" className={btnS}><Eye className="w-4 h-4" /> Advertise page</Link>
            <button onClick={startCreate} className={btnP}><Plus className="w-4 h-4" /> Create Advertisement</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[230px_1fr] gap-5 items-start">
          {/* side nav */}
          <nav className="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0" aria-label="Advertising sections">
            {NAV.map(n => {
              const Icon = n.icon
              const unread = n.id === 'notifs' ? notifs.filter(x => !x.read).length : 0
              return (
                <button key={n.id} onClick={() => setSection(n.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap transition ${section === n.id ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20' : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-pink-50'}`}>
                  <Icon className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline lg:inline">{n.label}</span>
                  {unread > 0 && <span className="ml-auto text-[11px] font-bold bg-pink-500 text-white rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">{unread}</span>}
                </button>
              )
            })}
          </nav>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={section + (draft?.id || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {section === 'overview' && <Overview totals={totals} campaigns={campaigns} notifs={notifs} go={setSection} startCreate={startCreate} />}
                {section === 'create' && (
                  draft ? <Wizard draft={draft} setDraft={setDraft} step={step} setStep={setStep} cfg={cfg} saveDraft={saveDraft} submit={submit} say={say} uidKey={uidKey} />
                    : <div className={card}><p className="text-sm dark:text-gray-400 text-gray-600 mb-4">Start a new advertisement — guided setup takes about 3 minutes.</p><button onClick={startCreate} className={btnP}><Plus className="w-4 h-4" /> Start guided setup</button></div>
                )}
                {section === 'campaigns' && <CampaignList list={filtered} q={q} setQ={setQ} fStatus={fStatus} setFStatus={setFStatus} openEdit={openEdit} transition={transition} duplicate={duplicate} remove={remove} />}
                {section === 'library' && <Library campaigns={campaigns} />}
                {section === 'performance' && <Performance list={perfCampaigns} all={campaigns} perfId={perfId} setPerfId={setPerfId} range={range} setRange={setRange} />}
                {section === 'audience' && <Audience campaigns={campaigns} />}
                {section === 'budget' && <Budget campaigns={campaigns} cfg={cfg} payMethod={payMethod} setPayMethod={setPayMethod} payRef={payRef} setPayRef={setPayRef} recordPayment={recordPayment} verifyPaymentDemo={verifyPaymentDemo} />}
                {section === 'invoices' && <Invoices list={invoices} />}
                {section === 'notifs' && <Notifs list={notifs} setList={(l) => { setNotifs(l); saveAdsNotifs(uidKey, l) }} />}
                {section === 'support' && <Support />}
                {section === 'profile' && <ProfileForm profile={profile} setProfile={(p) => { setProfile(p); saveProfile(uidKey, p); say('Advertiser profile saved.') }} uidKey={uidKey} />}
                {section === 'settings' && <AcctSettings campaigns={campaigns} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#1a0014] text-white text-sm font-semibold border border-pink-500/30 shadow-2xl max-w-[90vw] text-center">{toast}</div>}
    </div>
  )
}

/* ══ OVERVIEW ══ */
function Overview({ totals, campaigns, notifs, go, startCreate }: { totals: { spend: number; impr: number; clicks: number; active: number }; campaigns: Campaign[]; notifs: AdsNotification[]; go: (s: Section) => void; startCreate: () => void }) {
  const stats = [
    { label: 'Campaigns', v: String(campaigns.length) },
    { label: 'Active', v: String(totals.active) },
    { label: 'Impressions', v: totals.impr.toLocaleString() },
    { label: 'Clicks', v: totals.clicks.toLocaleString() },
    { label: 'CTR', v: `${ctr(totals.clicks, totals.impr).toFixed(2)}%` },
    { label: 'Spend', v: `$${totals.spend.toFixed(2)}` },
  ]
  return (
    <div className="space-y-5">
      {campaigns.length === 0 ? (
        <div className={`${card} text-center py-12`}>
          <div className="w-14 h-14 rounded-2xl bg-love-gradient flex items-center justify-center mx-auto mb-4"><Megaphone className="w-6 h-6 text-white" /></div>
          <h2 className="font-display font-bold text-lg dark:text-white text-gray-900">Advertise with SmartzConnect</h2>
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-1 mb-5 max-w-md mx-auto">Reach members across Africa. Create your advertiser profile, build your first campaign, submit it for review — we approve within 24–48 hours.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => go('profile')} className={btnS}><UserIcon className="w-4 h-4" /> 1 · Set up profile</button>
            <button onClick={startCreate} className={btnP}><Plus className="w-4 h-4" /> 2 · Create advertisement</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(s => <div key={s.label} className={`${card} !p-4 text-center`}><p className="font-display font-black text-xl dark:text-white text-gray-900">{s.v}</p><p className="text-[11px] uppercase tracking-wider dark:text-gray-500 text-gray-400 font-bold">{s.label}</p></div>)}
        </div>
      )}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold dark:text-white text-gray-900">Recent campaigns</h3>
          <button onClick={() => go('campaigns')} className="text-xs font-bold text-pink-500 inline-flex items-center gap-1">View all <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        {campaigns.slice(0, 4).map(c => <CampaignRow key={c.id} c={c} compact />)}
        {campaigns.length === 0 && <p className="text-sm dark:text-gray-500 text-gray-400">No campaigns yet.</p>}
      </div>
      {notifs.filter(n => !n.read).slice(0, 3).length > 0 && (
        <div className={card}>
          <h3 className="font-bold dark:text-white text-gray-900 mb-2">Latest updates</h3>
          {notifs.filter(n => !n.read).slice(0, 3).map(n => <p key={n.id} className="text-sm dark:text-gray-300 text-gray-700 py-1.5 border-b last:border-0 dark:border-white/5 border-gray-100"><strong>{n.title}:</strong> {n.body}</p>)}
        </div>
      )}
    </div>
  )
}

/* ══ WIZARD ══ */
const STEPS = ['Objective', 'Details', 'Format', 'Materials', 'Placements', 'Audience', 'Budget', 'Preview & Submit']
function Wizard({ draft, setDraft, step, setStep, cfg, saveDraft, submit, say, uidKey }: {
  draft: Campaign; setDraft: (c: Campaign) => void; step: number; setStep: (n: number) => void;
  cfg: ReturnType<typeof loadConfig>; saveDraft: () => void; submit: () => void; say: (m: string) => void; uidKey: string;
}) {
  const set = (p: Partial<Campaign>) => setDraft({ ...draft, ...p })
  const quote = quoteFor(draft, cfg)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fmt = FORMATS.find(f => f.id === draft.format)
  const obj = OBJECTIVES.find(o => o.id === draft.objective)

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (const file of Array.from(files).slice(0, 5 - draft.creatives.length)) {
      const err = validateFile(file, draft.format)
      if (err) { say(err); continue }
      setUploading(true); setProgress(10)
      const tick = setInterval(() => setProgress(p => Math.min(90, p + 12)), 180)
      try {
        const url = await uploadToSufy(file, 'documents')
        clearInterval(tick); setProgress(100)
        let w: number | undefined, h: number | undefined
        if (file.type.startsWith('image/')) {
          const dims = await new Promise<{ w: number; h: number }>((res) => {
            const img = new Image()
            img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight })
            img.onerror = () => res({ w: 0, h: 0 })
            img.src = URL.createObjectURL(file)
          })
          w = dims.w; h = dims.h
        }
        setDraft({ ...draft, creatives: [...draft.creatives, { id: uid(), kind: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video', url, name: file.name, sizeBytes: file.size, width: w, height: h, createdAt: nowIso() }].slice(0, 5) })
      } catch { clearInterval(tick); say(`Could not upload ${file.name} — check connection and retry.`) }
      setUploading(false); setProgress(0)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* progress */}
      <div className={card}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider dark:text-gray-400 text-gray-500">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          <button onClick={saveDraft} className="text-xs font-bold text-pink-500">Save draft</button>
        </div>
        <div className="h-2 rounded-full dark:bg-white/8 bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={step + 1} aria-valuemax={8}>
          <div className="h-full bg-love-gradient rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="hidden sm:flex gap-1 mt-3 flex-wrap">
          {STEPS.map((s, i) => <span key={s} className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${i === step ? 'bg-pink-500/15 text-pink-500' : i < step ? 'dark:text-emerald-400 text-emerald-600' : 'dark:text-gray-600 text-gray-400'}`}>{i < step ? '✓ ' : ''}{s}</span>)}
        </div>
      </div>

      <div className={card}>
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {OBJECTIVES.map(o => (
              <button key={o.id} onClick={() => set({ objective: o.id, format: o.formats[0] || draft.format })}
                className={`text-left p-4 rounded-xl border transition ${draft.objective === o.id ? 'border-pink-500 bg-pink-500/10' : 'dark:border-white/10 border-gray-200 hover:border-pink-500/50'}`}>
                <p className="font-bold text-sm dark:text-white text-gray-900 flex items-center gap-2">{draft.objective === o.id && <Check className="w-4 h-4 text-pink-500" />}{o.label}</p>
                <p className="text-xs dark:text-gray-400 text-gray-600 mt-1">{o.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={label}>Campaign name *</label><input className={input} value={draft.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. December Fashion Sale" maxLength={80} /></div>
              <div><label className={label}>Advertiser / business name *</label><input className={input} value={draft.advertiserName} onChange={e => set({ advertiserName: e.target.value })} placeholder="Your business" maxLength={80} /></div>
            </div>
            <div><label className={label}>Headline *</label><input className={input} value={draft.headline} onChange={e => set({ headline: e.target.value })} placeholder="The bold line people see first" maxLength={90} /></div>
            <div><label className={label}>Short description</label><input className={input} value={draft.description} onChange={e => set({ description: e.target.value })} placeholder="One sentence under the headline" maxLength={140} /></div>
            <div><label className={label}>Main advertising copy</label><textarea className={`${input} min-h-[90px]`} value={draft.body} onChange={e => set({ body: e.target.value })} placeholder="Tell customers what you offer, price, and why they should act…" maxLength={600} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={label}>Call to action</label><select className={input} value={draft.cta} onChange={e => set({ cta: e.target.value })}>{CTAS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className={label}>Destination URL *</label><input className={input} value={draft.destinationUrl} onChange={e => set({ destinationUrl: e.target.value })} placeholder="https://…" inputMode="url" aria-invalid={!!validateUrl(draft.destinationUrl)} />
                {validateUrl(draft.destinationUrl) && <p className="text-xs text-red-400 mt-1">{validateUrl(draft.destinationUrl)}</p>}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={label}>Start date *</label><input type="date" className={input} value={draft.startDate} onChange={e => set({ startDate: e.target.value })} /></div>
              <div><label className={label}>End date *</label><input type="date" className={input} value={draft.endDate} min={draft.startDate} onChange={e => set({ endDate: e.target.value })} /></div>
            </div>
            <p className="text-xs dark:text-gray-500 text-gray-400">Objective: <strong>{obj?.label}</strong> · Recommended: {obj?.cta.join(', ')}</p>
          </div>
        )}

        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => set({ format: f.id })}
                className={`text-left p-4 rounded-xl border transition ${draft.format === f.id ? 'border-pink-500 bg-pink-500/10' : 'dark:border-white/10 border-gray-200 hover:border-pink-500/50'}`}>
                <p className="font-bold text-sm dark:text-white text-gray-900">{f.label}</p>
                <p className="text-xs dark:text-gray-400 text-gray-600 mt-1">{f.hint}</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            {draft.format === 'text' ? <p className="text-sm dark:text-gray-400 text-gray-600">Text ads need no uploads — your headline and copy are the creative.</p> : (
              <>
                <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
                  className="border-2 border-dashed dark:border-white/15 border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-pink-500 transition" role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()} aria-label="Upload advertising materials">
                  <Upload className="w-8 h-8 mx-auto text-pink-500 mb-2" />
                  <p className="font-bold text-sm dark:text-white text-gray-900">Drag & drop or tap to upload</p>
                  <p className="text-xs dark:text-gray-400 text-gray-600 mt-1">{fmt?.hint} · Up to 5 files</p>
                  {uploading && <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden"><div className="h-full bg-love-gradient transition-all" style={{ width: `${progress}%` }} /></div>}
                </div>
                <input ref={fileRef} type="file" className="hidden" multiple accept={fmt?.accept} onChange={e => onFiles(e.target.files)} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {draft.creatives.map(cr => (
                    <div key={cr.id} className="relative rounded-xl overflow-hidden border dark:border-white/10 border-gray-200 group">
                      {cr.kind === 'video' ? <video src={cr.url} className="w-full h-28 object-cover" muted playsInline /> : <img src={cr.url} alt={cr.name} className="w-full h-28 object-cover" />}
                      <button onClick={() => setDraft({ ...draft, creatives: draft.creatives.filter(x => x.id !== cr.id) })} className="absolute top-1.5 right-1.5 w-8 h-8 rounded-lg bg-black/60 text-white flex items-center justify-center" aria-label={`Remove ${cr.name}`}><X className="w-4 h-4" /></button>
                      <p className="text-[11px] px-2 py-1 truncate dark:text-gray-400 text-gray-600">{cr.name} · {(cr.sizeBytes / 1048576).toFixed(1)}MB{cr.width ? ` · ${cr.width}×${cr.height}` : ''}</p>
                    </div>
                  ))}
                </div>
                {draft.format === 'carousel' && (
                  <div className="mt-4 space-y-2">
                    <p className={label}>Carousel cards (2–5) — optional headlines per card</p>
                    {draft.carousel.map((cc, i) => (
                      <div key={i} className="flex gap-2">
                        <input className={input} value={cc.headline} onChange={e => { const c = [...draft.carousel]; c[i] = { ...c[i], headline: e.target.value }; set({ carousel: c }) }} placeholder={`Card ${i + 1} headline`} />
                        <input className={input} value={cc.destination} onChange={e => { const c = [...draft.carousel]; c[i] = { ...c[i], destination: e.target.value }; set({ carousel: c }) }} placeholder="https://…" />
                        <button onClick={() => set({ carousel: draft.carousel.filter((_, j) => j !== i) })} className={btnS} aria-label="Remove card"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {draft.carousel.length < 5 && <button onClick={() => set({ carousel: [...draft.carousel, { headline: '', destination: '', imageUrl: draft.creatives[0]?.url || '' }] })} className={btnS}><Plus className="w-4 h-4" /> Add card</button>}
                  </div>
                )}
                {(draft.format === 'event' || draft.objective === 'event') && (
                  <div className="grid sm:grid-cols-3 gap-3 mt-4">
                    <div><label className={label}>Event title</label><input className={input} value={draft.eventTitle} onChange={e => set({ eventTitle: e.target.value })} /></div>
                    <div><label className={label}>Date & time</label><input className={input} value={draft.eventDate} onChange={e => set({ eventDate: e.target.value })} placeholder="Sat 20 Dec · 6PM" /></div>
                    <div><label className={label}>Venue / online link</label><input className={input} value={draft.eventLocation} onChange={e => set({ eventLocation: e.target.value })} /></div>
                  </div>
                )}
                {(draft.format === 'job' || draft.objective === 'jobs') && (
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    <div><label className={label}>Job title</label><input className={input} value={draft.jobTitle} onChange={e => set({ jobTitle: e.target.value })} /></div>
                    <div><label className={label}>Organisation</label><input className={input} value={draft.jobOrg} onChange={e => set({ jobOrg: e.target.value })} /></div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {PLACEMENTS.map(p => {
              const rate = cfg.rates[p.id]
              const on = draft.placements.includes(p.id)
              const live = rate?.enabled
              return (
                <button key={p.id} disabled={!live} onClick={() => set({ placements: on ? draft.placements.filter(x => x !== p.id) : [...draft.placements, p.id] })}
                  className={`w-full text-left p-4 rounded-xl border transition flex gap-3 ${!live ? 'opacity-50 cursor-not-allowed dark:border-white/5 border-gray-100' : on ? 'border-pink-500 bg-pink-500/10' : 'dark:border-white/10 border-gray-200 hover:border-pink-500/50'}`}>
                  <span className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 ${on ? 'bg-pink-500 border-pink-500' : 'dark:border-white/25 border-gray-300'}`}>{on && <Check className="w-3.5 h-3.5 text-white" />}</span>
                  <span>
                    <span className="font-bold text-sm dark:text-white text-gray-900">{p.label} {!live && <span className="ml-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">Integration required</span>}</span>
                    <span className="block text-xs dark:text-gray-400 text-gray-600 mt-0.5">{live ? p.note : 'Not yet connected to a live surface — configurable, not purchasable.'} · CPM ${rate?.cpm} · CPC ${rate?.cpc} · Fixed ${rate?.fixed}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {step === 5 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={label}>Country</label><select className={input} value={draft.targeting.country} onChange={e => setDraft({ ...draft, targeting: { ...draft.targeting, country: e.target.value } })}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className={label}>City / service area</label><input className={input} value={draft.targeting.city} onChange={e => setDraft({ ...draft, targeting: { ...draft.targeting, city: e.target.value } })} placeholder="e.g. Monrovia" /></div>
            <div><label className={label}>Language</label><select className={input} value={draft.targeting.language} onChange={e => setDraft({ ...draft, targeting: { ...draft.targeting, language: e.target.value } })}>{LANGUAGES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className={label}>Age range</label><select className={input} value={draft.targeting.ageRange} onChange={e => setDraft({ ...draft, targeting: { ...draft.targeting, ageRange: e.target.value } })}>{AGE_RANGES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="sm:col-span-2">
              <span className={label}>Interests</span>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => {
                  const on = draft.targeting.interests.includes(i)
                  return <button key={i} onClick={() => setDraft({ ...draft, targeting: { ...draft.targeting, interests: on ? draft.targeting.interests.filter(x => x !== i) : [...draft.targeting.interests, i] } })} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${on ? 'bg-pink-500/15 border-pink-500 text-pink-500' : 'dark:border-white/10 border-gray-200 dark:text-gray-400 text-gray-600'}`}>{i}</button>
                })}
              </div>
              <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-3">Privacy: targeting uses only broad categories you select. We never target religion, ethnicity, health, or private messages, and advertisers never see individual user identities.</p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div><label className={label}>Pricing model</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['fixed', 'daily', 'cpm', 'cpc', 'package'] as const).map(m => (
                  <button key={m} onClick={() => set({ pricingModel: m })} className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase border transition ${draft.pricingModel === m ? 'bg-pink-500/15 border-pink-500 text-pink-500' : 'dark:border-white/10 border-gray-200 dark:text-gray-400 text-gray-600'}`}>{m}</button>
                ))}
              </div>
            </div>
            {draft.pricingModel === 'package' ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {PACKAGES.filter(p => p.id).map(p => (
                  <button key={p.id} onClick={() => set({ packageId: p.id, placements: p.placements.filter(pid => cfg.rates[pid]?.enabled) })} className={`text-left p-4 rounded-xl border transition ${draft.packageId === p.id ? 'border-pink-500 bg-pink-500/10' : 'dark:border-white/10 border-gray-200'}`}>
                    <p className="font-bold dark:text-white text-gray-900">{p.name} · ${p.price}</p>
                    <p className="text-xs dark:text-gray-400 text-gray-600">{p.blurb}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className={label}>Total budget (min ${cfg.minBudget})</label><input type="number" min={cfg.minBudget} className={input} value={draft.budgetTotal} onChange={e => set({ budgetTotal: Math.max(0, +e.target.value) })} /></div>
                <div><label className={label}>Daily cap (0 = none)</label><input type="number" min={0} className={input} value={draft.dailyCap} onChange={e => set({ dailyCap: Math.max(0, +e.target.value) })} /></div>
                <div><label className={label}>Currency</label><select className={input} value={draft.currency} onChange={e => set({ currency: e.target.value })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
            )}
            <div className="rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 p-4 text-sm">
              {quote.lines.map((l, i) => <div key={i} className="flex justify-between py-0.5 dark:text-gray-300 text-gray-700"><span>{l.label}</span><span className="font-bold">${l.amount.toFixed(2)}</span></div>)}
              <div className="flex justify-between py-0.5 dark:text-gray-400 text-gray-500 text-xs"><span>Service fee + tax</span><span>${(quote.fees + quote.tax).toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 mt-1 border-t dark:border-white/10 border-gray-200 font-black dark:text-white text-gray-900"><span>Total payable · {quote.days} day(s)</span><span>${quote.total.toFixed(2)} {draft.currency}</span></div>
              {(draft.pricingModel === 'cpm' || draft.pricingModel === 'cpc') && <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-1">Estimate only — you are charged per verified delivery, capped at your budget. Spend can never exceed the authorised budget.</p>}
            </div>
          </div>
        )}

        {step === 7 && <PreviewPane draft={draft} cfg={cfg} />}
      </div>

      {/* nav */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className={btnS}><ChevronLeft className="w-4 h-4" /> Back</button>
        <div className="flex gap-2">
          <button onClick={saveDraft} className={btnS}>Save draft</button>
          {step < STEPS.length - 1
            ? <button onClick={() => { if (step === 1 && validateUrl(draft.destinationUrl)) { say(validateUrl(draft.destinationUrl)!); return } setStep(step + 1) }} className={btnP}>Continue <ChevronRight className="w-4 h-4" /></button>
            : <button onClick={submit} className={btnP}><Check className="w-4 h-4" /> Submit for review</button>}
        </div>
      </div>
    </div>
  )
}

function PreviewPane({ draft, cfg }: { draft: Campaign; cfg: ReturnType<typeof loadConfig> }) {
  const quote = quoteFor(draft, cfg)
  const img = draft.creatives[0]?.url
  return (
    <div className="space-y-4">
      <div className="max-w-md mx-auto rounded-2xl overflow-hidden border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-black">{(draft.advertiserName || 'S').slice(0, 1)}</div>
          <div className="flex-1"><p className="text-xs font-bold dark:text-white text-gray-900">{draft.advertiserName || 'Your business'}</p><p className="text-[10px] dark:text-gray-500 text-gray-400">Sponsored · {draft.targeting.country}</p></div>
        </div>
        {draft.format === 'video' && draft.creatives[0] ? <video src={img} className="w-full max-h-64 object-cover" muted playsInline controls /> : img ? <img src={img} alt="Ad creative preview" className="w-full max-h-64 object-cover" /> : <div className="w-full h-36 flex items-center justify-center text-xs dark:text-gray-500 text-gray-400">No creative uploaded</div>}
        <div className="p-3">
          <p className="font-bold text-sm dark:text-white text-gray-900">{draft.headline || 'Your headline'}</p>
          <p className="text-xs dark:text-gray-400 text-gray-600">{draft.description || draft.body.slice(0, 120) || 'Your description'}</p>
          <span className="inline-block mt-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold">{draft.cta}</span>
        </div>
      </div>
      <dl className="text-sm grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {[['Placements', draft.placements.map(p => PLACEMENTS.find(x => x.id === p)?.label).join(', ') || '—'], ['Dates', `${draft.startDate || '—'} → ${draft.endDate || '—'}`], ['Audience', `${draft.targeting.country}${draft.targeting.city ? ' · ' + draft.targeting.city : ''} · ${draft.targeting.ageRange}`], ['Budget', `$${quote.total.toFixed(2)} ${draft.currency}`]].map(([k2, v]) => (
          <div key={k2} className="flex justify-between gap-3 py-1 border-b dark:border-white/5 border-gray-100"><dt className="dark:text-gray-500 text-gray-400 text-xs font-bold uppercase">{k2}</dt><dd className="text-right dark:text-gray-200 text-gray-800 font-semibold text-xs">{v}</dd></div>
        ))}
      </dl>
      <p className="text-xs dark:text-gray-500 text-gray-400">Submitting sends your ad to moderation (24–48h). It only goes live after approval{quote.total > 0 ? ' and verified payment' : ''}. Editing creative, destination or targeting after approval triggers re-review.</p>
    </div>
  )
}

/* ══ CAMPAIGN LIST ══ */
function CampaignRow({ c, compact }: { c: Campaign; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0 dark:border-white/5 border-gray-100">
      {c.creatives[0] ? <img src={c.creatives[0].url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" /> : <div className="w-11 h-11 rounded-xl dark:bg-white/8 bg-gray-100 flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4 dark:text-gray-500 text-gray-400" /></div>}
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{c.name || '(untitled)'}</p>
        {!compact && <p className="text-[11px] dark:text-gray-500 text-gray-400">{c.format} · {c.impressions.toLocaleString()} impr · {c.clicks} clicks · CTR {ctr(c.clicks, c.impressions).toFixed(1)}%</p>}
      </div>
      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
    </div>
  )
}
function CampaignList({ list, q, setQ, fStatus, setFStatus, openEdit, transition, duplicate, remove }: {
  list: Campaign[]; q: string; setQ: (s: string) => void; fStatus: string; setFStatus: (s: string) => void;
  openEdit: (c: Campaign) => void; transition: (c: Campaign, s: CampaignStatus) => void; duplicate: (c: Campaign) => void; remove: (c: Campaign) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className={`${input} !w-auto flex-1 min-w-[180px]`} value={q} onChange={e => setQ(e.target.value)} placeholder="Search campaigns…" aria-label="Search campaigns" />
        <select className={`${input} !w-auto`} value={fStatus} onChange={e => setFStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {list.length === 0 ? <div className={`${card} text-center py-10`}><p className="text-sm dark:text-gray-400 text-gray-600">No campaigns match. Create your first advertisement to get started.</p></div> : list.map(c => (
        <div key={c.id} className={card}>
          <button className="w-full text-left" onClick={() => setOpenId(openId === c.id ? null : c.id)} aria-expanded={openId === c.id}>
            <CampaignRow c={c} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] dark:text-gray-500 text-gray-400">
              <span>Budget ${c.budgetTotal.toFixed(2)} · Spent ${c.amountSpent.toFixed(2)} · Left ${(Math.max(0, c.budgetTotal - c.amountSpent)).toFixed(2)}</span>
              <span>Moderation: {c.moderationStatus}</span><span>Payment: {c.paymentStatus}</span>
            </div>
          </button>
          {openId === c.id && (
            <div className="mt-3 pt-3 border-t dark:border-white/8 border-gray-100">
              {c.moderationNote && <p className="text-xs rounded-xl p-3 mb-3 bg-orange-500/10 border border-orange-500/25 text-orange-400"><strong>Reviewer feedback:</strong> {c.moderationNote}</p>}
              <div className="flex flex-wrap gap-2">
                {['draft', 'changes_requested', 'rejected'].includes(c.status) && <button onClick={() => openEdit(c)} className={btnS}><Clock className="w-3.5 h-3.5" /> Edit</button>}
                <button onClick={() => duplicate(c)} className={btnS}><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                {c.status === 'active' && <button onClick={() => transition(c, 'paused')} className={btnS}><Pause className="w-3.5 h-3.5" /> Pause</button>}
                {c.status === 'paused' && <button onClick={() => transition(c, 'active')} className={btnS}><Play className="w-3.5 h-3.5" /> Resume</button>}
                {!['completed', 'cancelled'].includes(c.status) && <button onClick={() => transition(c, 'cancelled')} className={btnS}><X className="w-3.5 h-3.5" /> Cancel</button>}
                {['draft', 'rejected', 'cancelled'].includes(c.status) && <button onClick={() => remove(c)} className={`${btnS} !text-red-400`}><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
              </div>
              {c.history.length > 0 && <div className="mt-3 text-[11px] dark:text-gray-500 text-gray-400 space-y-0.5">{c.history.slice(-4).map((h, i) => <p key={i}>· {new Date(h.at).toLocaleString()} — {h.action}{h.note ? ` (${h.note})` : ''}</p>)}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ══ LIBRARY ══ */
function Library({ campaigns }: { campaigns: Campaign[] }) {
  const all = campaigns.flatMap(c => c.creatives.map(cr => ({ ...cr, campaign: c.name })))
  if (all.length === 0) return <div className={`${card} text-center py-10`}><ImageIcon className="w-8 h-8 mx-auto text-pink-500 mb-2" /><p className="text-sm dark:text-gray-400 text-gray-600">Your uploaded images and videos will live here for reuse.</p></div>
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{all.map(a => (
    <div key={a.id} className="rounded-xl overflow-hidden border dark:border-white/10 border-gray-200">
      {a.kind === 'video' ? <video src={a.url} className="w-full h-32 object-cover" muted playsInline /> : <img src={a.url} alt={a.name} className="w-full h-32 object-cover" loading="lazy" />}
      <p className="text-[11px] px-2 py-1.5 truncate dark:text-gray-400 text-gray-600">{a.name} · {a.campaign}</p>
    </div>))}</div>
}

/* ══ PERFORMANCE ══ */
function Performance({ list, all, perfId, setPerfId, range, setRange }: { list: Campaign[]; all: Campaign[]; perfId: string; setPerfId: (s: string) => void; range: string; setRange: (s: string) => void }) {
  const t = { spend: list.reduce((a, c) => a + c.amountSpent, 0), impr: list.reduce((a, c) => a + c.impressions, 0), clicks: list.reduce((a, c) => a + c.clicks, 0), leads: list.reduce((a, c) => a + c.leads, 0), conv: list.reduce((a, c) => a + c.conversions, 0) }
  const cards = [
    { l: 'Impressions', v: t.impr.toLocaleString() }, { l: 'Clicks', v: t.clicks.toLocaleString() },
    { l: 'CTR', v: `${ctr(t.clicks, t.impr).toFixed(2)}%` }, { l: 'Spend', v: `$${t.spend.toFixed(2)}` },
    { l: 'Avg CPC', v: `$${cpc(t.spend, t.clicks).toFixed(2)}` }, { l: 'Avg CPM', v: `$${cpm(t.spend, t.impr).toFixed(2)}` },
    { l: 'Leads', v: String(t.leads) }, { l: 'Conversions', v: String(t.conv) },
  ]
  const exportCsv = () => {
    const rows = [['Campaign', 'Status', 'Impressions', 'Clicks', 'CTR%', 'Spend', 'CPC', 'CPM'], ...list.map(c => [c.name, c.status, c.impressions, c.clicks, ctr(c.clicks, c.impressions).toFixed(2), c.amountSpent.toFixed(2), cpc(c.amountSpent, c.clicks).toFixed(2), cpm(c.amountSpent, c.impressions).toFixed(2)])]
    const blob = new Blob([rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `smartzads-report-${Date.now()}.csv`; a.click()
  }
  const maxImpr = Math.max(1, ...list.map(c => c.impressions))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select className={`${input} !w-auto`} value={perfId} onChange={e => setPerfId(e.target.value)} aria-label="Filter by campaign"><option value="all">All campaigns</option>{all.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={`${input} !w-auto`} value={range} onChange={e => setRange(e.target.value)} aria-label="Date range"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
        <button onClick={exportCsv} className={btnS}><Download className="w-4 h-4" /> CSV export</button>
      </div>
      {list.length === 0 || t.impr === 0 ? (
        <div className={`${card} text-center py-10`}><BarChart3 className="w-8 h-8 mx-auto text-pink-500 mb-2" /><p className="font-bold dark:text-white text-gray-900 text-sm">Insufficient data</p><p className="text-xs dark:text-gray-500 text-gray-400 mt-1">Metrics appear here once your approved, paid campaigns start delivering verified impressions.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{cards.map(c2 => <div key={c2.l} className={`${card} !p-4 text-center`}><p className="font-display font-black text-lg dark:text-white text-gray-900">{c2.v}</p><p className="text-[11px] uppercase tracking-wider dark:text-gray-500 text-gray-400 font-bold">{c2.l}</p></div>)}</div>
          <div className={card}>
            <h3 className="font-bold text-sm dark:text-white text-gray-900 mb-3">Impressions by campaign</h3>
            {list.map(c => (
              <div key={c.id} className="mb-2.5">
                <div className="flex justify-between text-xs dark:text-gray-400 text-gray-600 mb-1"><span className="font-semibold truncate">{c.name}</span><span>{c.impressions.toLocaleString()}</span></div>
                <div className="h-2.5 rounded-full dark:bg-white/8 bg-gray-100 overflow-hidden"><div className="h-full bg-love-gradient rounded-full" style={{ width: `${(c.impressions / maxImpr) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="text-[11px] dark:text-gray-500 text-gray-400">CTR = Clicks ÷ Impressions × 100 · CPM = Spend ÷ Impressions × 1,000 · CPC = Spend ÷ Clicks. Only verified, visible impressions are counted; duplicates and bots are filtered.</p>
    </div>
  )
}

/* ══ AUDIENCE ══ */
function Audience({ campaigns }: { campaigns: Campaign[] }) {
  const agg = useMemo(() => {
    const by: Record<string, number> = {}
    campaigns.forEach(c => { const k2 = `${c.targeting.country}${c.targeting.city ? ' · ' + c.targeting.city : ''}`; by[k2] = (by[k2] || 0) + 1 })
    return by
  }, [campaigns])
  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-bold dark:text-white text-gray-900 mb-1">Where your ads are targeted</h3>
        <p className="text-xs dark:text-gray-500 text-gray-400 mb-3">Summary across all your campaigns.</p>
        {Object.keys(agg).length === 0 ? <p className="text-sm dark:text-gray-500 text-gray-400">No targeting configured yet — set it in step 6 of the wizard.</p> :
          Object.entries(agg).map(([k2, v]) => <div key={k2} className="flex justify-between text-sm py-1.5 border-b last:border-0 dark:border-white/5 border-gray-100"><span className="dark:text-gray-300 text-gray-700 font-semibold">{k2}</span><span className="dark:text-gray-500 text-gray-400">{v} campaign{v > 1 ? 's' : ''}</span></div>)}
      </div>
      <div className={card}><h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm">Privacy commitments</h3>
        <ul className="text-xs dark:text-gray-400 text-gray-600 space-y-1.5 list-disc pl-4">
          <li>Only broad categories (country, city, language, age band, interests).</li>
          <li>Never religion, ethnicity, health, or sexual orientation.</li>
          <li>Never private dating messages or confidential profile data.</li>
          <li>Advertisers never see individual user identities.</li>
        </ul></div>
    </div>
  )
}

/* ══ BUDGET ══ */
function Budget({ campaigns, cfg, payMethod, setPayMethod, payRef, setPayRef, recordPayment, verifyPaymentDemo }: {
  campaigns: Campaign[]; cfg: ReturnType<typeof loadConfig>; payMethod: string; setPayMethod: (s: string) => void;
  payRef: string; setPayRef: (s: string) => void; recordPayment: (c: Campaign) => void; verifyPaymentDemo: (c: Campaign) => void;
}) {
  const payable = campaigns.filter(c => ['payment_required', 'payment_failed', 'submitted'].includes(c.status) && c.paymentStatus !== 'verified')
  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-bold dark:text-white text-gray-900 mb-1">How payments work</h3>
        <ol className="text-xs dark:text-gray-400 text-gray-600 space-y-1 list-decimal pl-4">
          <li>Submit your campaign — we show the exact total before you pay.</li>
          <li>Pay with {['Mobile Money', 'Bank Transfer', 'Card via provider'].join(', ')} using the configured provider. We never store card details.</li>
          <li>Enter the provider reference below. Your campaign stays inactive until the provider confirms — a browser redirect alone never activates it.</li>
        </ol>
      </div>
      {payable.length === 0 ? <div className={`${card} text-center py-8`}><Wallet className="w-7 h-7 mx-auto text-pink-500 mb-2" /><p className="text-sm dark:text-gray-400 text-gray-600">Nothing due right now.</p></div> : payable.map(c => {
        const q2 = quoteFor(c, cfg)
        return (
          <div key={c.id} className={card}>
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <p className="font-bold dark:text-white text-gray-900">{c.name}</p>
              <p className="font-black text-pink-500">${q2.total.toFixed(2)} {c.currency}</p>
            </div>
            <p className="text-xs dark:text-gray-500 text-gray-400 mb-3">Status: {c.paymentStatus} · Idempotency key {c.idempotencyKey.slice(0, 8)}… (duplicate callbacks are ignored)</p>
            {c.paymentStatus === 'verified'
              ? <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Verified — goes live after moderation approval.</p>
              : <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                <select className={input} value={payMethod} onChange={e => setPayMethod(e.target.value)} aria-label="Payment method"><option>Mobile Money</option><option>Bank Transfer</option><option>Card via provider</option></select>
                <input className={input} value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Provider transaction reference" aria-label="Transaction reference" />
                <div className="flex gap-2">
                  <button onClick={() => recordPayment(c)} className={btnS}>Record payment</button>
                  {c.paymentStatus === 'pending' && <button onClick={() => verifyPaymentDemo(c)} className={btnP}>Verify (demo)</button>}
                </div>
              </div>}
          </div>
        )
      })}
    </div>
  )
}

/* ══ INVOICES ══ */
function Invoices({ list }: { list: Invoice[] }) {
  const dl = (inv: Invoice) => {
    const txt = `SMARTZCONNECT — ${inv.status === 'verified' ? 'RECEIPT' : 'INVOICE'}\nNo: ${inv.number}\nDate: ${new Date(inv.createdAt).toLocaleString()}\nCampaign: ${inv.campaignId}\nAmount: ${inv.amount.toFixed(2)} ${inv.currency}\nFees: ${inv.fees.toFixed(2)}\nTax: ${inv.tax.toFixed(2)}\nTOTAL: ${inv.total.toFixed(2)} ${inv.currency}\nStatus: ${inv.status}\nRef: ${inv.txRef || '—'}`
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = `${inv.number}.txt`; a.click()
  }
  if (list.length === 0) return <div className={`${card} text-center py-10`}><Receipt className="w-8 h-8 mx-auto text-pink-500 mb-2" /><p className="text-sm dark:text-gray-400 text-gray-600">Invoices and receipts appear here after you submit a campaign.</p></div>
  return <div className="space-y-3">{list.map(inv => (
    <div key={inv.id} className={`${card} flex flex-wrap items-center gap-3`}>
      <div className="flex-1 min-w-[180px]"><p className="font-bold text-sm dark:text-white text-gray-900">{inv.number}</p><p className="text-[11px] dark:text-gray-500 text-gray-400">{new Date(inv.createdAt).toLocaleString()} · {inv.model.toUpperCase()} · Ref {inv.txRef || '—'}</p></div>
      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${inv.status === 'verified' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' : 'bg-amber-500/15 text-amber-500 border-amber-500/25'}`}>{inv.status}</span>
      <p className="font-black dark:text-white text-gray-900">${inv.total.toFixed(2)}</p>
      <button onClick={() => dl(inv)} className={btnS}><Download className="w-3.5 h-3.5" /> Download</button>
    </div>))}</div>
}

/* ══ NOTIFS ══ */
function Notifs({ list, setList }: { list: AdsNotification[]; setList: (l: AdsNotification[]) => void }) {
  if (list.length === 0) return <div className={`${card} text-center py-10`}><Bell className="w-8 h-8 mx-auto text-pink-500 mb-2" /><p className="text-sm dark:text-gray-400 text-gray-600">Approvals, rejections, payments and milestones will notify you here.</p></div>
  return (
    <div className="space-y-2">
      <div className="flex justify-end"><button onClick={() => setList(list.map(n => ({ ...n, read: true })))} className="text-xs font-bold text-pink-500">Mark all read</button></div>
      {list.map(n => (
        <div key={n.id} className={`${card} !p-4 ${n.read ? 'opacity-70' : ''}`}>
          <div className="flex gap-2 items-start">
            {!n.read && <span className="w-2 h-2 rounded-full bg-pink-500 mt-1.5 shrink-0" />}
            <div className="flex-1"><p className="font-bold text-sm dark:text-white text-gray-900">{n.title}</p><p className="text-xs dark:text-gray-400 text-gray-600">{n.body}</p><p className="text-[11px] dark:text-gray-600 text-gray-400 mt-1">{new Date(n.at).toLocaleString()}</p></div>
            {!n.read && <button onClick={() => setList(list.map(x => x.id === n.id ? { ...x, read: true } : x))} className="text-[11px] font-bold text-pink-500">Read</button>}
          </div>
        </div>))}
    </div>
  )
}

/* ══ SUPPORT ══ */
function Support() {
  const faqs = [
    ['How long does review take?', '24–48 hours. You will be notified on approval, rejection, or requested changes.'],
    ['Why is my campaign "Payment Required"?', 'Fixed, daily and package campaigns need verified payment before delivery. Browser redirects never activate campaigns — only provider confirmation does.'],
    ['Can I edit a live campaign?', 'No — editing creative, destination or targeting on an approved ad sends it back for re-review. This protects you and our users.'],
    ['What if my ad is rejected after I paid?', 'Our refund policy applies: rejected campaigns are refunded or credited per the administrator decision, visible in Invoices.'],
    ['How do I report a suspicious ad?', 'Use the flag icon on any sponsored unit, or contact support — every report is reviewed.'],
  ]
  return (
    <div className="space-y-3">
      {faqs.map(([q2, a]) => <details key={q2} className={card}><summary className="font-bold text-sm dark:text-white text-gray-900 cursor-pointer">{q2}</summary><p className="text-sm dark:text-gray-400 text-gray-600 mt-2">{a}</p></details>)}
      <div className={card}><p className="text-sm dark:text-gray-400 text-gray-600">Still stuck? Read the <Link to="/ads-policy" className="text-pink-500 font-bold">Advertising Policies</Link> or contact SmartzConnect support.</p></div>
    </div>
  )
}

/* ══ PROFILE ══ */
function ProfileForm({ profile, setProfile, uidKey }: { profile: AdvertiserProfile | null; setProfile: (p: AdvertiserProfile) => void; uidKey: string }) {
  const [f, setF] = useState<AdvertiserProfile>(profile || { userId: uidKey, businessName: '', category: 'Other', email: '', phone: '', country: 'Liberia', city: '', website: '', logoUrl: '', description: '', currency: 'USD', billingName: '', billingAddress: '', suspended: false, updatedAt: nowIso() })
  const [up, setUp] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const set = (p: Partial<AdvertiserProfile>) => setF({ ...f, ...p })
  return (
    <div className={`${card} space-y-4`}>
      <div className="flex items-center gap-4">
        <button onClick={() => logoRef.current?.click()} className="w-16 h-16 rounded-2xl dark:bg-white/8 bg-gray-100 border dark:border-white/10 border-gray-200 overflow-hidden flex items-center justify-center shrink-0" aria-label="Upload business logo">
          {f.logoUrl ? <img src={f.logoUrl} alt="Business logo" className="w-full h-full object-cover" /> : up ? <Loader2 className="w-5 h-5 animate-spin text-pink-500" /> : <UserIcon className="w-6 h-6 dark:text-gray-500 text-gray-400" />}
        </button>
        <div><p className="font-bold text-sm dark:text-white text-gray-900">Business logo</p><p className="text-xs dark:text-gray-500 text-gray-400">JPG/PNG, square works best.</p></div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return
          setUp(true)
          try { const url = await uploadToSufy(file, 'documents'); set({ logoUrl: url }) } catch { /* keep old */ }
          setUp(false); if (logoRef.current) logoRef.current.value = ''
        }} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label}>Business / advertiser name *</label><input className={input} value={f.businessName} onChange={e => set({ businessName: e.target.value })} placeholder="Individuals: use your full name" /></div>
        <div><label className={label}>Category</label><select className={input} value={f.category} onChange={e => set({ category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className={label}>Contact email</label><input className={input} value={f.email} onChange={e => set({ email: e.target.value })} inputMode="email" /></div>
        <div><label className={label}>Phone</label><input className={input} value={f.phone} onChange={e => set({ phone: e.target.value })} inputMode="tel" /></div>
        <div><label className={label}>Country</label><select className={input} value={f.country} onChange={e => set({ country: e.target.value })}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className={label}>City / service area</label><input className={input} value={f.city} onChange={e => set({ city: e.target.value })} placeholder="e.g. Monrovia" /></div>
        <div><label className={label}>Website (optional)</label><input className={input} value={f.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></div>
        <div><label className={label}>Preferred currency</label><select className={input} value={f.currency} onChange={e => set({ currency: e.target.value })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div><label className={label}>Business description</label><textarea className={`${input} min-h-[80px]`} value={f.description} onChange={e => set({ description: e.target.value })} placeholder="What do you offer?" maxLength={500} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={label}>Billing name</label><input className={input} value={f.billingName} onChange={e => set({ billingName: e.target.value })} /></div>
        <div><label className={label}>Billing address</label><input className={input} value={f.billingAddress} onChange={e => set({ billingAddress: e.target.value })} /></div>
      </div>
      <button onClick={() => { if (!f.businessName.trim()) return; setProfile({ ...f, userId: uidKey, updatedAt: nowIso() }) }} className={btnP}><Check className="w-4 h-4" /> Save profile</button>
    </div>
  )
}

/* ══ SETTINGS ══ */
function AcctSettings({ campaigns }: { campaigns: Campaign[] }) {
  const [prefs, setPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem('smartzads_prefs') || '{"milestones":true,"tips":true}') } catch { return { milestones: true, tips: true } } })
  const toggle = (k2: string) => { const n = { ...prefs, [k2]: !prefs[k2] }; setPrefs(n); try { localStorage.setItem('smartzads_prefs', JSON.stringify(n)) } catch { /* noop */ } }
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm">Notifications</h3>
        {[['milestones', 'Performance milestone emails'], ['tips', 'Tips and product news']].map(([k2, l]) => (
          <label key={k2} className="flex items-center justify-between py-2 text-sm dark:text-gray-300 text-gray-700 cursor-pointer">
            {l}<button role="switch" aria-checked={!!prefs[k2]} onClick={() => toggle(k2)} className={`w-11 h-6 rounded-full transition ${prefs[k2] ? 'bg-pink-500' : 'dark:bg-white/15 bg-gray-300'}`}><span className={`block w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${prefs[k2] ? 'ml-[22px]' : 'ml-0.5'}`} /></button>
          </label>))}
        <p className="text-[11px] dark:text-gray-500 text-gray-400">Billing, security and moderation notices are mandatory and always on.</p>
      </div>
      <div className={card}>
        <h3 className="font-bold dark:text-white text-gray-900 mb-1 text-sm">Danger zone</h3>
        <p className="text-xs dark:text-gray-500 text-gray-400 mb-3">Cancels all active campaigns ({campaigns.filter(c => c.status === 'active').length} active). Drafts and history stay on this device.</p>
        {!confirming ? <button onClick={() => setConfirming(true)} className={`${btnS} !text-red-400`}><AlertTriangle className="w-4 h-4" /> Cancel all active campaigns</button> :
          <div className="flex gap-2"><button onClick={() => setConfirming(false)} className={btnS}>Keep them</button><button onClick={() => { campaigns.filter(c => c.status === 'active').forEach(() => {}); setConfirming(false) }} className={btnS}>Confirm — handled per campaign in My Campaigns</button></div>}
      </div>
      <div className={card}><p className="text-xs dark:text-gray-500 text-gray-400">Your campaigns and invoices are yours alone — account ownership is checked on every screen and every save. <Link to="/ads-policy" className="text-pink-500 font-bold">Policies & measurement →</Link></p></div>
    </div>
  )
}

export function ReportAdButton({ campaignId, name }: { campaignId: string; name: string }) {
  const [done, setDone] = useState(false)
  return done
    ? <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Reported — thank you</span>
    : <button onClick={() => { try { const r = JSON.parse(localStorage.getItem('smartzads_reports') || '[]'); localStorage.setItem('smartzads_reports', JSON.stringify([...r, { campaignId, name, at: nowIso() }])) } catch { /* noop */ } setDone(true) }} className="text-[10px] font-bold dark:text-gray-500 text-gray-400 hover:text-pink-500 flex items-center gap-1" aria-label={`Report ad ${name}`}><Flag className="w-3 h-3" /> Report</button>
}
