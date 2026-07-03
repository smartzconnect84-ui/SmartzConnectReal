import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, RefreshCw, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout, AuthCard, AuthError } from '@/components/auth/AuthLayout'

const STEPS = [
  { n: '1', t: 'Open your email inbox' },
  { n: '2', t: 'Find the email from SmartzConnect' },
  { n: '3', t: 'Click "Confirm Email" button' },
  { n: '4', t: 'You\'ll be taken to your dashboard' },
]

export default function VerifyEmailPage() {
  const { resendVerification, signOut } = useAuth()
  const location = useLocation()
  const email = (location.state as any)?.email || ''

  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)
  const [error, setError]         = useState('')

  const handleResend = async () => {
    if (!email) { setError('No email address found. Please register again.'); return }
    setError('')
    setResending(true)
    try {
      await resendVerification(email)
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch (err: any) {
      setError(err.message || 'Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout showBack={false}>
      <AuthCard>
        <div className="p-6 sm:p-8 text-center">
          {/* Animated envelope */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.1 }}
            className="relative w-24 h-24 rounded-3xl bg-pink-500/[0.08] border border-pink-500/[0.15] flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-10 h-10 text-brand-pink" />
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-brand-pink/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>

          <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-3 leading-tight">
            Verify Your Email 📬
          </h1>

          <p className="text-sm dark:text-gray-400 text-gray-500 leading-relaxed mb-2">
            We sent a confirmation link to:
          </p>
          {email && (
            <p className="font-bold text-brand-pink text-base mb-5 break-all">{email}</p>
          )}
          <p className="text-sm dark:text-gray-400 text-gray-500 leading-relaxed mb-7 max-w-xs mx-auto">
            Click the link in the email to activate your account and get started.
          </p>

          {/* Steps */}
          <div className="text-left space-y-3 mb-7 p-4 rounded-2xl dark:bg-white/[0.03] bg-gray-50 border dark:border-white/[0.05] border-gray-100">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0 shadow-sm shadow-pink-500/20">
                  <span className="text-white text-[10px] font-black">{s.n}</span>
                </div>
                <span className="text-sm dark:text-gray-300 text-gray-700">{s.t}</span>
              </motion.div>
            ))}
          </div>

          {error && <div className="mb-4"><AuthError message={error} /></div>}

          {/* Resend button */}
          <AnimatePresence mode="wait">
            {resent ? (
              <motion.div
                key="resent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-center gap-2 text-emerald-500 text-sm font-semibold mb-4 py-3"
              >
                <CheckCircle2 className="w-4 h-4" />
                Email resent successfully!
              </motion.div>
            ) : (
              <motion.button
                key="resend"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 rounded-xl dark:bg-white/[0.05] bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 hover:dark:bg-white/[0.08] hover:bg-gray-200 active:scale-[0.99] transition-all disabled:opacity-50 mb-4"
              >
                {resending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Resending…</>
                  : <><RefreshCw className="w-4 h-4" /> Resend Confirmation Email</>
                }
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-xs dark:text-gray-600 text-gray-400 mb-6">
            Check your spam or junk folder if you don't see it within 2 minutes.
          </p>

          {/* Back / sign out */}
          <div className="pt-5 border-t dark:border-white/[0.06] border-gray-100 flex items-center justify-center">
            <Link
              to="/login"
              onClick={() => signOut().catch(() => {})}
              className="inline-flex items-center gap-1.5 text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors font-medium group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
