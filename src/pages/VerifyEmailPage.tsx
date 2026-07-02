import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, RefreshCw, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
const logoImg = '/logo.png'
import { useAuth } from '@/hooks/useAuth'

export default function VerifyEmailPage() {
  const { resendVerification, signOut } = useAuth()
  const location = useLocation()
  // Email passed via router state from RegisterPage
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
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoImg} alt="SmartzConnect" className="w-10 h-10 object-contain" />
          <span className="font-display font-black text-xl">
            <span className="text-gradient-love">Smartz</span>
            <span className="dark:text-white text-gray-900">Connect</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="dark:bg-[#130E1E] bg-white rounded-3xl p-8 shadow-2xl shadow-black/20 border dark:border-white/6 border-gray-100 text-center"
        >
          {/* Animated envelope */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-3xl bg-love-soft border border-pink-500/20 flex items-center justify-center mx-auto mb-6 relative"
          >
            <Mail className="w-10 h-10 text-brand-pink" />
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-3xl border-2 border-pink-500/20 animate-ping" />
          </motion.div>

          <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-3">
            Verify Your Email 📬
          </h1>

          <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-2">
            We sent a confirmation link to:
          </p>
          {email && (
            <p className="font-bold text-brand-pink text-base mb-4">{email}</p>
          )}
          <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-6">
            Click the link in the email to activate your account and get started.
            After confirming, you'll be taken straight to your dashboard.
          </p>

          {/* Steps */}
          <div className="text-left space-y-3 mb-7 p-4 rounded-2xl dark:bg-white/3 bg-gray-50 border dark:border-white/5 border-gray-100">
            {[
              { n: '1', t: 'Open your email inbox' },
              { n: '2', t: 'Find the email from SmartzConnect' },
              { n: '3', t: 'Click "Confirm Email" button' },
              { n: '4', t: 'You\'ll be redirected to your dashboard' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-black">{s.n}</span>
                </div>
                <span className="text-sm dark:text-gray-300 text-gray-700">{s.t}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Resend */}
          {resent ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500 text-sm font-semibold mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Email resent successfully!
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 hover:dark:bg-white/8 hover:bg-gray-200 transition-all disabled:opacity-50 mb-4"
            >
              {resending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Resending...</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Resend Confirmation Email</>
              )}
            </button>
          )}

          <p className="text-xs dark:text-gray-600 text-gray-400 mb-5">
            Check your spam/junk folder if you don't see it within 2 minutes.
          </p>

          {/* Back / sign out */}
          <div className="pt-5 border-t dark:border-white/6 border-gray-100 flex items-center justify-center gap-4">
            <Link
              to="/login"
              onClick={() => signOut().catch(() => {})}
              className="inline-flex items-center gap-1.5 text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
