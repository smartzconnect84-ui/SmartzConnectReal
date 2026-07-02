import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send } from 'lucide-react'
const logoImg = '/logo.png'
import { useAuth } from '@/hooks/useAuth'
import TurnstileWidget from '@/components/TurnstileWidget'

const TURNSTILE_ENABLED = !!import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [sent, setSent]                 = useState(false)
  const [error, setError]               = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Please complete the security check.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase())
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-pink-500/5 blur-3xl" />
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
          className="dark:bg-[#130E1E] bg-white rounded-3xl p-8 shadow-2xl shadow-black/20 border dark:border-white/6 border-gray-100"
        >
          {!sent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-love-soft border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-brand-pink" />
                </div>
                <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">
                  No worries! Enter your email and we'll send you a secure link to reset your password.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:dark:text-gray-600 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/50 transition-all"
                    />
                  </div>
                </div>

                {TURNSTILE_ENABLED && (
                  <TurnstileWidget
                    onSuccess={setTurnstileToken}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                  />
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || (TURNSTILE_ENABLED && !turnstileToken)}
                  className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </motion.div>
              <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-3">
                Check Your Email 📬
              </h2>
              <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-2">
                We sent a password reset link to:
              </p>
              <p className="font-bold text-brand-pink mb-5">{email}</p>
              <p className="text-xs dark:text-gray-500 text-gray-400 mb-6 leading-relaxed">
                Click the link in the email to create a new password. The link expires in 1 hour.
                Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm text-brand-pink hover:underline font-semibold"
              >
                Try a different email
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-6 pt-5 border-t dark:border-white/6 border-gray-100 text-center">
            <Link
              to="/login"
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
