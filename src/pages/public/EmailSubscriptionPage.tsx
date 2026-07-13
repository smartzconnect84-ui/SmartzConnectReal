import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Check, Loader2, AlertCircle, Heart, Newspaper, Tag, Bell, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/**
 * Full public Email Subscription page — /subscribe
 * Lets anyone subscribe (or a logged-in user auto-fill their own email),
 * choose which types of email they want, and unsubscribe again later
 * (?mode=unsubscribe&email=...). Wired straight to the newsletter_subscribe /
 * newsletter_unsubscribe RPCs (see supabase/schema_v30_email_subscription_sync.sql).
 */

const CATEGORY_OPTIONS = [
  { id: 'general',          label: 'General Newsletter',   desc: 'Product news, tips and community highlights.', icon: Newspaper },
  { id: 'product-updates',  label: 'Product Updates',       desc: 'New features and platform changes.',            icon: Bell },
  { id: 'promotions',       label: 'Promotions & Deals',    desc: 'Discounts, offers and limited-time perks.',     icon: Tag },
  { id: 'events',           label: 'Events & Community',    desc: 'Live events, World Stage and meetups.',         icon: Heart },
]

export default function EmailSubscriptionPage() {
  const { user } = useAuth() as any
  const [params] = useSearchParams()
  const isUnsubscribeMode = params.get('mode') === 'unsubscribe'

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [categories, setCategories] = useState<string[]>(['general'])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [unsubDone, setUnsubDone] = useState(false)

  // Prefill from query param (email links) or the logged-in account
  useEffect(() => {
    const qEmail = params.get('email')
    if (qEmail) { setEmail(qEmail); return }
    if (user?.email) setEmail(user.email)
    const metaName = user?.user_metadata?.full_name
    if (metaName) setName(metaName)
  }, [params, user])

  const toggleCategory = (id: string) =>
    setCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    if (categories.length === 0) {
      setError('Choose at least one email type')
      return
    }
    setStatus('submitting')
    setError('')
    const { error: rpcErr } = await supabase.rpc('newsletter_subscribe', {
      p_email: trimmed,
      p_name: name.trim() || null,
      p_categories: categories,
      p_source: 'subscribe-page',
    })
    if (rpcErr) {
      setStatus('error')
      setError(rpcErr.message || 'Something went wrong. Please try again.')
      return
    }
    setStatus('done')
  }

  const handleUnsubscribe = async () => {
    const trimmed = email.trim()
    if (!trimmed) { setError('Enter the email address to unsubscribe'); return }
    setStatus('submitting')
    setError('')
    const { error: rpcErr } = await supabase.rpc('newsletter_unsubscribe', { p_email: trimmed })
    if (rpcErr) {
      setStatus('error')
      setError(rpcErr.message || 'Something went wrong. Please try again.')
      return
    }
    setUnsubDone(true)
    setStatus('done')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 dark:bg-[#0A0712] bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-200 shadow-xl p-6 sm:p-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-love-gradient flex items-center justify-center shadow-lg shadow-pink-500/20 mb-5">
          {isUnsubscribeMode ? <Bell className="w-7 h-7 text-white" /> : <Mail className="w-7 h-7 text-white" />}
        </div>

        <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1.5">
          {isUnsubscribeMode ? 'Manage Email Preferences' : 'Stay in the Loop'}
        </h1>
        <p className="text-sm dark:text-gray-400 text-gray-500 mb-6">
          {isUnsubscribeMode
            ? 'Unsubscribe at any time — you can always resubscribe later.'
            : 'Subscribe to get updates from SmartzConnect, tailored to what you care about.'}
        </p>

        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-3 py-8"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="font-bold dark:text-white text-gray-900">
                {unsubDone ? "You've been unsubscribed" : "You're subscribed!"}
              </p>
              <p className="text-sm dark:text-gray-400 text-gray-500">
                {unsubDone
                  ? "We're sorry to see you go. You can resubscribe anytime."
                  : 'Watch your inbox for updates from SmartzConnect.'}
              </p>
              <Link to="/" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-pink hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to home
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={isUnsubscribeMode ? (e => { e.preventDefault(); handleUnsubscribe() }) : handleSubscribe}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold dark:text-gray-400 text-gray-500 mb-1.5 block">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@email.com"
                  disabled={status === 'submitting'}
                  className="w-full px-3.5 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-white/25 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
                />
              </div>

              {!isUnsubscribeMode && (
                <>
                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-500 mb-1.5 block">Name (optional)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      disabled={status === 'submitting'}
                      className="w-full px-3.5 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-white/25 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold dark:text-gray-400 text-gray-500 mb-2 block">What would you like to receive?</label>
                    <div className="space-y-2">
                      {CATEGORY_OPTIONS.map(opt => {
                        const Icon = opt.icon
                        const checked = categories.includes(opt.id)
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => toggleCategory(opt.id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                              checked
                                ? 'dark:bg-brand-pink/10 bg-pink-50 border-brand-pink/40'
                                : 'dark:bg-white/5 bg-gray-50 dark:border-white/8 border-gray-200 hover:dark:bg-white/8 hover:bg-gray-100'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${checked ? 'bg-love-gradient' : 'dark:bg-white/10 bg-gray-200'}`}>
                              <Icon className={`w-4 h-4 ${checked ? 'text-white' : 'dark:text-gray-400 text-gray-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold dark:text-white text-gray-900">{opt.label}</p>
                              <p className="text-[11px] dark:text-gray-500 text-gray-400">{opt.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${checked ? 'bg-brand-pink border-brand-pink' : 'dark:border-white/20 border-gray-300'}`}>
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : (isUnsubscribeMode ? <Bell className="w-4 h-4" /> : <Mail className="w-4 h-4" />)}
                {status === 'submitting' ? 'Please wait…' : (isUnsubscribeMode ? 'Unsubscribe' : 'Subscribe')}
              </button>

              <p className="text-center text-[11px] dark:text-gray-500 text-gray-400">
                {isUnsubscribeMode ? (
                  <>Changed your mind? <Link to="/subscribe" className="text-brand-pink hover:underline">Subscribe instead</Link></>
                ) : (
                  <>Already subscribed and want to opt out? <Link to="/subscribe?mode=unsubscribe" className="text-brand-pink hover:underline">Unsubscribe here</Link></>
                )}
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
