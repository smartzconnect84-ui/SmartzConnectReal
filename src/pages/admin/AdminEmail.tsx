import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Send, Users, Crown, Zap, Heart, Eye, ChevronDown,
  CheckCircle, AlertCircle, Loader2, Plus, Trash2, X,
  RefreshCw, Download, BarChart2, Clock, Globe, Paperclip, FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EmailCampaign {
  id: string
  subject: string
  body: string
  audience: string
  status: 'draft' | 'sent' | 'scheduled'
  sent_count: number
  opened_count: number
  created_at: string
  sent_at: string | null
}

const AUDIENCES = [
  { id: 'all',      label: 'All Users',       icon: Globe,  color: 'text-blue-400',   desc: 'Every registered user' },
  { id: 'free',     label: 'Free Users',       icon: Heart,  color: 'text-gray-400',   desc: 'Users on the free plan' },
  { id: 'premium',  label: 'Premium Members',  icon: Zap,    color: 'text-pink-400',   desc: 'Premium subscribers only' },
  { id: 'vip',      label: 'VIP Members',      icon: Crown,  color: 'text-amber-400',  desc: 'VIP tier subscribers' },
  { id: 'inactive', label: 'Inactive Users',   icon: Clock,  color: 'text-orange-400', desc: 'Haven\'t logged in 30+ days' },
  { id: 'newsletter', label: 'Newsletter Subscribers', icon: Mail, color: 'text-emerald-400', desc: 'Public signup list — not necessarily members' },
]

const TEMPLATES = [
  {
    id: 'welcome',
    label: 'Welcome Back',
    subject: 'We missed you on SmartzConnect 💕',
    body: `Hi {{name}},

We noticed you haven't visited SmartzConnect recently and we wanted to reach out.

There are new people waiting to connect with you, new conversations happening, and exciting features you haven't tried yet.

Come back and see what's new — your profile is waiting!

❤️ The SmartzConnect Team`,
  },
  {
    id: 'promo',
    label: 'Premium Promo',
    subject: 'Upgrade to Premium — Special Offer Inside 🌟',
    body: `Hi {{name}},

For a limited time, get SmartzConnect Premium at a special rate.

With Premium you get:
✨ Unlimited swipes & matches
💬 Priority message delivery
🚀 Profile boost — be seen 3x more
📍 See who liked you
🎯 Advanced filters

Upgrade today and start connecting like never before.

With love,
The SmartzConnect Team`,
  },
  {
    id: 'feature',
    label: 'New Feature',
    subject: 'Something new just launched on SmartzConnect 🎉',
    body: `Hi {{name}},

We've been working hard behind the scenes and we're excited to share something new with you.

Head into the app and explore the latest update — we think you'll love it.

See you there!

The SmartzConnect Team`,
  },
]

const inp = 'w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors'

function formatRelative(date: string) {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString()
}

export default function AdminEmail() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [activeTab, setActiveTab] = useState<'compose' | 'sent'>('compose')

  const [userCount, setUserCount] = useState<Record<string, number>>({})
  const [fromEmail, setFromEmail] = useState('support@smartzconnect.com')
  const [fromName, setFromName] = useState('SmartzConnect Team')

  interface Subscriber { id: string; email: string; name: string | null; source: string | null; created_at: string }
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [showSubscribers, setShowSubscribers] = useState(false)
  const [removingSub, setRemovingSub] = useState<string | null>(null)

  const fetchSubscribers = async () => {
    const { data } = await supabase.from('newsletter_subscribers')
      .select('id, email, name, source, created_at').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(500)
    setSubscribers(data || [])
  }

  const removeSubscriber = async (id: string) => {
    setRemovingSub(id)
    await supabase.from('newsletter_subscribers').delete().eq('id', id)
    setSubscribers(prev => prev.filter(s => s.id !== id))
    setUserCount(p => ({ ...p, newsletter: Math.max((p.newsletter || 1) - 1, 0) }))
    setRemovingSub(null)
  }

  const exportSubscribers = () => {
    if (!subscribers.length) return
    const rows = subscribers.map(s => [s.email, s.name || '', s.source || '', s.created_at].join(','))
    const csv = ['Email,Name,Source,Subscribed At', ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  interface EmailAttachment {
    filename: string
    content: string   // base64
    contentType: string
    sizeKb: number
  }

  const [attachments, setAttachments] = useState<EmailAttachment[]>([])
  const attachInputRef = useRef<HTMLInputElement>(null)

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`"${file.name}" exceeds the 5 MB limit`, false)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setAttachments(prev => {
          if (prev.length >= 5) { showToast('Maximum 5 attachments per email', false); return prev }
          if (prev.some(a => a.filename === file.name)) return prev
          return [...prev, { filename: file.name, content: base64, contentType: file.type || 'application/octet-stream', sizeKb: Math.round(file.size / 1024) }]
        })
      }
      reader.readAsDataURL(file)
    })
    // Reset so the same file can be re-added if removed
    e.target.value = ''
  }

  const removeAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(a => a.filename !== filename))
  }

  const [form, setForm] = useState({
    subject: '',
    body: '',
    audience: 'all',
    footer: 'You are receiving this email because you have an account on SmartzConnect. To unsubscribe, visit your account settings.',
  })

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    setLoading(true)
    const [campaignsRes, allRes, premRes, vipRes, newsletterRes] = await Promise.all([
      supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('plan_id', 'premium').eq('status', 'active'),
      supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('plan_id', 'vip').eq('status', 'active'),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])
    setCampaigns(campaignsRes.data || [])
    setUserCount({
      all: allRes.count || 0,
      premium: premRes.count || 0,
      vip: vipRes.count || 0,
      newsletter: newsletterRes.count || 0,
    })
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setForm(p => ({ ...p, subject: t.subject, body: t.body }))
  }

  const audienceCount = (id: string) => {
    if (id === 'all') return userCount.all || 0
    if (id === 'premium') return userCount.premium || 0
    if (id === 'vip') return userCount.vip || 0
    if (id === 'newsletter') return userCount.newsletter || 0
    return 0
  }

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      showToast('Subject and body are required', false)
      return
    }
    setSending(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          subject: form.subject.trim(),
          body: form.body.trim(),
          audience: form.audience,
          footer: form.footer,
          from_email: fromEmail,
          from_name: fromName,
          attachments: attachments.map(a => ({
            filename: a.filename,
            content: a.content,
            content_type: a.contentType,
          })),
        },
        headers: { Authorization: `Bearer ${token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      try {
        await supabase.from('system_notifications').insert({
          type: 'email_campaign',
          title: `Email Sent: ${form.subject}`,
          body: `Campaign sent to "${form.audience}" audience (${data?.sent_count ?? 0} recipients)`,
          is_read: false,
        })
      } catch { /* notification logging is best-effort */ }

      showToast(`Email campaign sent to ${(data?.sent_count ?? 0).toLocaleString()} of ${(data?.total ?? 0).toLocaleString()} users!`)
      setShowCompose(false)
      setForm({ subject: '', body: '', audience: 'all', footer: form.footer })
      setAttachments([])
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Failed to send campaign', false)
    }
    setSending(false)
  }

  const handleSaveDraft = async () => {
    if (!form.subject.trim()) {
      showToast('Add a subject before saving draft', false)
      return
    }
    const key = `email_draft_${Date.now()}`
    localStorage.setItem(key, JSON.stringify({ ...form, savedAt: new Date().toISOString() }))
    showToast('Draft saved locally')
  }

  const exportCampaigns = () => {
    if (!campaigns.length) return
    const rows = campaigns.map(c =>
      [c.subject, c.audience, c.status, c.sent_count, c.opened_count, c.created_at].join(',')
    )
    const csv = ['Subject,Audience,Status,Sent,Opened,Date', ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `email-campaigns-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900">Email Campaigns</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5">Compose and send bulk promotional emails to your users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCampaigns}
            className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={fetchData}
            className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
            <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
          </button>
          <button onClick={() => { setShowSubscribers(true); fetchSubscribers() }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-xs font-semibold transition-colors">
            <Users className="w-3.5 h-3.5" /> Subscribers ({(userCount.newsletter || 0).toLocaleString()})
          </button>
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Compose
          </button>
        </div>
      </div>

      {/* Sender Config */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-brand-pink" />
          <h3 className="font-bold text-sm dark:text-white text-gray-900">Sender Configuration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">From Name</label>
            <input value={fromName} onChange={e => setFromName(e.target.value)} className={inp} placeholder="SmartzConnect Team" />
          </div>
          <div>
            <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">From Email</label>
            <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} className={inp} placeholder="support@smartzconnect.com" />
          </div>
        </div>
        <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-3">
          Emails are sent via the <code className="font-mono">send-bulk-email</code> Supabase Edge Function using Resend. Set <code className="font-mono">RESEND_API_KEY</code> in your Supabase project secrets to activate real delivery.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: campaigns.length, color: 'from-pink-500 to-rose-600', icon: Mail },
          { label: 'Emails Sent', value: campaigns.reduce((a, c) => a + (c.sent_count || 0), 0).toLocaleString(), color: 'from-blue-500 to-indigo-600', icon: Send },
          { label: 'Total Users', value: (userCount.all || 0).toLocaleString(), color: 'from-purple-500 to-violet-600', icon: Users },
          { label: 'Open Rate', value: campaigns.length ? `${Math.round((campaigns.reduce((a, c) => a + (c.opened_count || 0), 0) / Math.max(campaigns.reduce((a, c) => a + (c.sent_count || 0), 0), 1)) * 100)}%` : '—', color: 'from-emerald-500 to-teal-600', icon: BarChart2 },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-black dark:text-white text-gray-900">{s.value}</p>
              <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Campaign history */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/5 border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-pink" />
            <h3 className="font-bold text-sm dark:text-white text-gray-900">Campaign History</h3>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center">
            <Mail className="w-10 h-10 dark:text-gray-600 text-gray-300 mx-auto mb-3" />
            <p className="font-bold dark:text-white text-gray-900 mb-1">No campaigns yet</p>
            <p className="text-sm dark:text-gray-400 text-gray-500 mb-4">Compose your first email campaign above</p>
            <button onClick={() => setShowCompose(true)} className="text-xs text-brand-pink font-semibold hover:underline">
              + Compose Email
            </button>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/4 divide-gray-50">
            {campaigns.map((c, i) => {
              const aud = AUDIENCES.find(a => a.id === c.audience)
              const AudIcon = aud?.icon || Globe
              return (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-4 hover:dark:bg-white/2 hover:bg-pink-50/30 transition-colors gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold dark:text-white text-gray-900 truncate">{c.subject}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${aud?.color || 'text-gray-400'}`}>
                          <AudIcon className="w-3 h-3" /> {aud?.label || c.audience}
                        </span>
                        <span className="text-[10px] dark:text-gray-500 text-gray-400">{formatRelative(c.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold dark:text-white text-gray-900">{(c.sent_count || 0).toLocaleString()}</p>
                      <p className="text-[10px] dark:text-gray-500 text-gray-400">sent</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                      c.status === 'sent' ? 'bg-emerald-500/15 text-emerald-500' :
                      c.status === 'scheduled' ? 'bg-blue-500/15 text-blue-400' :
                      'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-500'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Newsletter Subscribers Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSubscribers && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowSubscribers(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-lg dark:bg-[#1A1228] bg-white sm:rounded-3xl rounded-t-3xl border dark:border-white/8 border-gray-200 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100 sticky top-0 dark:bg-[#1A1228] bg-white z-10">
                <div>
                  <h3 className="font-bold text-sm dark:text-white text-gray-900">Newsletter Subscribers</h3>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400 mt-0.5">Public signup list from the site footer</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportSubscribers}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-[11px] font-semibold transition-colors">
                    <Download className="w-3 h-3" /> Export
                  </button>
                  <button onClick={() => setShowSubscribers(false)} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                  </button>
                </div>
              </div>
              {subscribers.length === 0 ? (
                <div className="py-12 text-center px-5">
                  <Mail className="w-10 h-10 dark:text-gray-600 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold dark:text-white text-gray-900 mb-1">No subscribers yet</p>
                  <p className="text-sm dark:text-gray-400 text-gray-500">Signups from the footer form will appear here</p>
                </div>
              ) : (
                <div className="divide-y dark:divide-white/4 divide-gray-50">
                  {subscribers.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold dark:text-white text-gray-900 truncate">{s.name || s.email}</p>
                        <p className="text-[11px] dark:text-gray-500 text-gray-400 truncate">{s.email} · {s.source || 'website'}</p>
                      </div>
                      <button onClick={() => removeSubscriber(s.id)} disabled={removingSub === s.id}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                        {removingSub === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Compose Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowCompose(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-3xl dark:bg-[#1A1228] bg-white sm:rounded-3xl rounded-t-3xl border dark:border-white/8 border-gray-200 shadow-2xl max-h-[92vh] overflow-y-auto">

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/8 border-gray-100 sticky top-0 dark:bg-[#1A1228] bg-white z-10 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center">
                    <Mail className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg dark:text-white text-gray-900">Compose Email</h3>
                    <p className="text-xs dark:text-gray-500 text-gray-400">Bulk promotional email campaign</p>
                  </div>
                </div>
                <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">

                {/* Tabs */}
                <div className="flex gap-1.5 p-1 dark:bg-black/20 bg-gray-100 rounded-xl w-fit">
                  {(['compose', 'sent'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                      {tab === 'compose' ? 'New Message' : 'Templates'}
                    </button>
                  ))}
                </div>

                {activeTab === 'sent' ? (
                  <div className="space-y-2">
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => { applyTemplate(t); setActiveTab('compose') }}
                        className="w-full text-left p-4 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 hover:border-brand-pink transition-colors">
                        <p className="text-sm font-bold dark:text-white text-gray-900 mb-0.5">{t.label}</p>
                        <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{t.subject}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Audience */}
                    <div>
                      <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-2 block">Send To</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AUDIENCES.map(a => {
                          const Icon = a.icon
                          const count = audienceCount(a.id)
                          return (
                            <button key={a.id} onClick={() => setForm(p => ({ ...p, audience: a.id }))}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                form.audience === a.id
                                  ? 'border-brand-pink bg-pink-500/10'
                                  : 'dark:border-white/8 border-gray-200 dark:bg-white/3 bg-white hover:border-pink-300'
                              }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-3.5 h-3.5 ${a.color}`} />
                                <span className="text-xs font-bold dark:text-white text-gray-900">{a.label}</span>
                              </div>
                              <p className="text-[10px] dark:text-gray-400 text-gray-500">{a.desc}</p>
                              {count > 0 && <p className={`text-[10px] font-bold mt-1 ${a.color}`}>{count.toLocaleString()} users</p>}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Subject Line *</label>
                      <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                        placeholder="Your email subject…" className={inp} />
                    </div>

                    {/* Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold dark:text-gray-400 text-gray-600">Email Body *</label>
                        <span className="text-[10px] dark:text-gray-500 text-gray-400">Use {'{{name}}'} for personalization</span>
                      </div>
                      <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                        rows={10} placeholder="Write your email message here…" className={inp + ' resize-none font-mono text-xs'} />
                    </div>

                    {/* Footer */}
                    <div>
                      <label className="text-xs font-bold dark:text-gray-400 text-gray-600 mb-1.5 block">Footer / Unsubscribe Text</label>
                      <textarea value={form.footer} onChange={e => setForm(p => ({ ...p, footer: e.target.value }))}
                        rows={2} className={inp + ' resize-none'} />
                    </div>

                    {/* Attachments */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold dark:text-gray-400 text-gray-600">Attachments</label>
                        <span className="text-[10px] dark:text-gray-500 text-gray-400">Max 5 files · 5 MB each</span>
                      </div>
                      <input
                        ref={attachInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.zip"
                        className="hidden"
                        onChange={handleAttachFiles}
                      />
                      {attachments.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {attachments.map(a => (
                            <div key={a.filename} className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200">
                              <FileText className="w-3.5 h-3.5 text-brand-pink flex-shrink-0" />
                              <span className="text-xs dark:text-gray-300 text-gray-700 truncate flex-1">{a.filename}</span>
                              <span className="text-[10px] dark:text-gray-500 text-gray-400 flex-shrink-0">{a.sizeKb} KB</span>
                              <button onClick={() => removeAttachment(a.filename)} className="flex-shrink-0 w-5 h-5 rounded-full dark:bg-white/10 bg-gray-200 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                                <X className="w-3 h-3 dark:text-gray-400 text-gray-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => attachInputRef.current?.click()}
                        disabled={attachments.length >= 5}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-dashed border-gray-300 dark:text-gray-400 text-gray-500 text-xs font-semibold hover:border-brand-pink hover:text-brand-pink transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {attachments.length === 0 ? 'Add Attachment' : `Add Another (${attachments.length}/5)`}
                      </button>
                    </div>

                    {/* Preview */}
                    {showPreview && form.body && (
                      <div className="p-4 rounded-xl dark:bg-black/30 bg-gray-50 border dark:border-white/8 border-gray-200">
                        <p className="text-xs font-bold dark:text-gray-400 text-gray-500 mb-3 uppercase tracking-widest">Preview</p>
                        <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">{form.subject || '(no subject)'}</p>
                        <div className="text-sm dark:text-gray-300 text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {form.body.replace(/{{name}}/g, 'Alex')}
                        </div>
                        {form.footer && (
                          <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-4 pt-3 border-t dark:border-white/5 border-gray-200">
                            {form.footer}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 px-6 pb-6 flex-wrap">
                <button onClick={() => setShowPreview(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-sm font-semibold transition-colors">
                  <Eye className="w-4 h-4" /> {showPreview ? 'Hide' : 'Preview'}
                </button>
                <button onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink text-sm font-semibold transition-colors">
                  <ChevronDown className="w-4 h-4" /> Save Draft
                </button>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setShowCompose(false)}
                    className="px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm font-semibold hover:opacity-80 transition-opacity">
                    Cancel
                  </button>
                  <button onClick={handleSend} disabled={sending || !form.subject.trim() || !form.body.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending…' : `Send to ${audienceCount(form.audience).toLocaleString()} Users`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
