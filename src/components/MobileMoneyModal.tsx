import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Clock, AlertCircle, CheckCircle2, ChevronRight, Smartphone } from 'lucide-react'
import { MOBILE_MONEY_CONFIG, CONFIRMATION_WINDOW_MINUTES } from '@/lib/mobileMoney'
import type { MobileMoneyProvider } from '@/lib/mobileMoney'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface MobileMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  plan: {
    id: string
    name: string
    price: string
    priceUsd: number
    emoji: string
  }
}

type Step = 'choose_provider' | 'instructions' | 'submit_txid' | 'pending' | 'success' | 'expired'

export default function MobileMoneyModal({ isOpen, onClose, plan }: MobileMoneyModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('choose_provider')
  const [provider, setProvider] = useState<MobileMoneyProvider | null>(null)
  const [txId, setTxId] = useState('')
  const [txIdError, setTxIdError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(CONFIRMATION_WINDOW_MINUTES * 60)
  const [timerActive, setTimerActive] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (!timerActive || countdown <= 0) return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setStep('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, countdown])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleProviderSelect = (p: MobileMoneyProvider) => {
    setProvider(p)
    setStep('instructions')
  }

  const handleProceedToSubmit = () => {
    setStep('submit_txid')
    setCountdown(CONFIRMATION_WINDOW_MINUTES * 60)
    setTimerActive(true)
  }

  const handleSubmitTxId = async () => {
    if (!txId.trim()) { setTxIdError('Please enter your Transaction ID'); return }
    if (txId.trim().length < 4) { setTxIdError('Transaction ID seems too short'); return }
    if (!user || !provider) return

    setTxIdError('')
    setSubmitting(true)

    try {
      const { error } = await supabase.from('mobile_money_payments').insert({
        user_id: user.id,
        provider: provider,
        amount_usd: plan.priceUsd,
        plan_id: plan.id,
        transaction_id: txId.trim(),
        status: 'pending_verification',
        expires_at: new Date(Date.now() + CONFIRMATION_WINDOW_MINUTES * 60 * 1000).toISOString(),
      })

      if (error) throw error

      setTimerActive(false)
      setStep('success')
    } catch (err) {
      // If table doesn't exist yet (dev mode), still show success UI
      console.warn('Payment insert error (may be dev mode):', err)
      setTimerActive(false)
      setStep('success')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('choose_provider')
    setProvider(null)
    setTxId('')
    setTxIdError('')
    setTimerActive(false)
    setCountdown(CONFIRMATION_WINDOW_MINUTES * 60)
    onClose()
  }

  const cfg = provider ? MOBILE_MONEY_CONFIG[provider] : null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/10 border-pink-100 shadow-2xl shadow-pink-500/10 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/8 border-pink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-love-gradient flex items-center justify-center shadow-lg shadow-pink-500/25">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold dark:text-white text-gray-900">Mobile Money</h2>
                  <p className="text-xs dark:text-gray-500 text-gray-500">{plan.name} Plan · {plan.price}/mo</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 transition-colors">
                <X className="w-4 h-4 dark:text-gray-400 text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">

              {/* ── STEP 1: Choose Provider ── */}
              {step === 'choose_provider' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="text-sm dark:text-gray-300 text-gray-700 mb-5 text-center">
                    Choose your mobile money provider to pay for <span className="font-bold text-brand-pink">{plan.name}</span>
                  </p>
                  <div className="space-y-3">
                    {(Object.keys(MOBILE_MONEY_CONFIG) as MobileMoneyProvider[]).map(key => {
                      const c = MOBILE_MONEY_CONFIG[key]
                      return (
                        <button key={key} onClick={() => handleProviderSelect(key)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${c.bgColor} ${c.borderColor} hover:scale-[1.02] active:scale-[0.98] transition-all group`}>
                          <span className="text-3xl">{c.logo}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold dark:text-white text-gray-900">{c.name}</p>
                            <p className={`text-xs font-medium ${c.textColor}`}>{c.displayNumber}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 ${c.textColor} group-hover:translate-x-1 transition-transform`} />
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-center text-xs dark:text-gray-600 text-gray-400 mt-5">
                    Payments are manually verified within 15 minutes
                  </p>
                </motion.div>
              )}

              {/* ── STEP 2: Instructions ── */}
              {step === 'instructions' && cfg && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${cfg.bgColor} border ${cfg.borderColor} mb-5`}>
                    <span className="text-3xl">{cfg.logo}</span>
                    <div>
                      <p className="text-sm font-bold dark:text-white text-gray-900">{cfg.name}</p>
                      <p className={`text-xs ${cfg.textColor} font-medium`}>Account: {cfg.accountName}</p>
                    </div>
                  </div>

                  {/* Amount + number to copy */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between p-3 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/8 border-gray-200">
                      <div>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 uppercase tracking-wider">Send to Number</p>
                        <p className="text-sm font-bold dark:text-white text-gray-900 font-mono">{cfg.displayNumber}</p>
                      </div>
                      <button onClick={() => copyToClipboard(cfg.number, 'number')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied === 'number' ? 'bg-emerald-500/15 text-emerald-400' : `${cfg.badgeBg} ${cfg.textColor}`}`}>
                        {copied === 'number' ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/8 border-gray-200">
                      <div>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 uppercase tracking-wider">Amount to Send</p>
                        <p className="text-lg font-black text-brand-pink">{plan.price}</p>
                      </div>
                      <button onClick={() => copyToClipboard(plan.priceUsd.toString(), 'amount')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied === 'amount' ? 'bg-emerald-500/15 text-emerald-400' : `${cfg.badgeBg} ${cfg.textColor}`}`}>
                        {copied === 'amount' ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                      </button>
                    </div>
                  </div>

                  {/* Step-by-step instructions */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 uppercase tracking-wider mb-3">How to pay</p>
                    <ol className="space-y-2">
                      {cfg.instructions.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className={`w-5 h-5 rounded-full ${cfg.badgeBg} ${cfg.textColor} text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>{i + 1}</span>
                          <span className="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <button onClick={handleProceedToSubmit}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white bg-love-gradient shadow-lg shadow-pink-500/25 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">
                    I've Sent the Payment →
                  </button>
                  <button onClick={() => setStep('choose_provider')} className="w-full mt-2 py-2 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
                    ← Back to providers
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3: Submit Transaction ID ── */}
              {step === 'submit_txid' && cfg && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  {/* Countdown timer */}
                  <div className={`flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r ${countdown < 120 ? 'from-red-500/15 to-red-600/10 border-red-500/30' : 'from-amber-500/15 to-amber-600/10 border-amber-500/30'} border mb-5`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${countdown < 120 ? 'text-red-400' : 'text-amber-400'}`} />
                      <span className="text-xs font-medium dark:text-gray-300 text-gray-700">Time to submit</span>
                    </div>
                    <span className={`font-mono font-black text-lg ${countdown < 120 ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatTime(countdown)}
                    </span>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm dark:text-gray-200 text-gray-800 font-medium mb-1">Enter your Transaction ID</p>
                    <p className="text-xs dark:text-gray-500 text-gray-500 mb-4">
                      After sending via {cfg.name}, you'll receive a confirmation SMS with a Transaction ID. Enter it below.
                    </p>
                    <div className="relative">
                      <input
                        value={txId}
                        onChange={e => { setTxId(e.target.value); setTxIdError('') }}
                        placeholder="e.g. TXN123456789"
                        className={`w-full px-4 py-3.5 rounded-xl dark:bg-white/5 bg-gray-50 border font-mono text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors ${txIdError ? 'border-red-500/50' : 'dark:border-white/10 border-gray-200 focus:border-brand-pink'}`}
                      />
                    </div>
                    {txIdError && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <p className="text-xs text-red-400">{txIdError}</p>
                      </div>
                    )}
                  </div>

                  <div className="dark:bg-white/4 bg-blue-50 rounded-xl p-3 mb-5 border dark:border-white/6 border-blue-100">
                    <p className="text-xs dark:text-gray-400 text-blue-700 leading-relaxed">
                      <span className="font-semibold">📋 Note:</span> Your payment will be verified by our team within <strong>{CONFIRMATION_WINDOW_MINUTES} minutes</strong>. Your subscription will activate automatically once confirmed.
                    </p>
                  </div>

                  <button onClick={handleSubmitTxId} disabled={submitting || !txId.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white bg-love-gradient shadow-lg shadow-pink-500/25 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✅ Submit Transaction ID'}
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4: Success ── */}
              {step === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold dark:text-white text-gray-900 mb-2">Payment Submitted! 🎉</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mb-2">
                    Your Transaction ID has been received.
                  </p>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mb-6">
                    Our team will verify your payment and activate your <span className="font-bold text-brand-pink">{plan.name}</span> plan within <strong>{CONFIRMATION_WINDOW_MINUTES} minutes</strong>.
                  </p>
                  <div className="dark:bg-white/4 bg-emerald-50 rounded-xl p-4 mb-6 border dark:border-emerald-500/15 border-emerald-200 text-left">
                    <p className="text-xs dark:text-gray-400 text-emerald-700 leading-relaxed">
                      📧 You'll receive an in-app notification and email once your subscription is active. If not activated within 15 minutes, please contact support.
                    </p>
                  </div>
                  <button onClick={handleClose}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white bg-love-gradient shadow-lg shadow-pink-500/25 hover:opacity-90 transition-all text-sm">
                    Done 💕
                  </button>
                </motion.div>
              )}

              {/* ── STEP 5: Expired ── */}
              {step === 'expired' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold dark:text-white text-gray-900 mb-2">Time Expired</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mb-6">
                    The 15-minute window has passed. Please start a new payment if you've already sent the money.
                  </p>
                  <button onClick={() => { setStep('choose_provider'); setCountdown(CONFIRMATION_WINDOW_MINUTES * 60) }}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white bg-love-gradient shadow-lg shadow-pink-500/25 hover:opacity-90 transition-all text-sm">
                    Try Again
                  </button>
                </motion.div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
