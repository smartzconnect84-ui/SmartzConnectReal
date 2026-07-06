import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout, AuthCard, AuthInput, AuthError, AuthLabel } from '@/components/auth/AuthLayout'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
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
    <AuthLayout>
      <AuthCard>
        {!sent ? (
          <div className="p-6 sm:p-8">
            {/* Icon header */}
            <div className="text-center mb-7">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-pink-500/[0.08] border border-pink-500/[0.15] flex items-center justify-center mx-auto mb-4"
              >
                <Mail className="w-7 h-7 text-brand-pink" />
              </motion.div>
              <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-sm dark:text-gray-400 text-gray-500 leading-relaxed max-w-xs mx-auto">
                No worries! Enter your email and we'll send a secure link to reset your password.
              </p>
            </div>

            {error && <div className="mb-5"><AuthError message={error} /></div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <AuthLabel htmlFor="fp-email">Email Address</AuthLabel>
                <AuthInput
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Send className="w-4 h-4" /> Send Reset Link</>
                }
              </button>
            </form>

            {/* Back */}
            <div className="mt-6 pt-5 border-t dark:border-white/[0.06] border-gray-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors font-medium group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* ── Success ── */
          <div className="p-6 sm:p-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-20 h-20 rounded-full bg-emerald-500/[0.12] border border-emerald-500/[0.25] flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </motion.div>

            <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-3">
              Check Your Email 📬
            </h2>
            <p className="text-sm dark:text-gray-400 text-gray-500 leading-relaxed mb-2">
              We sent a reset link to:
            </p>
            <p className="font-bold text-brand-pink text-base mb-5 break-all">{email}</p>
            <p className="text-xs dark:text-gray-500 text-gray-400 mb-6 leading-relaxed max-w-xs mx-auto">
              Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>

            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-sm text-brand-pink hover:underline font-semibold"
            >
              Try a different email
            </button>

            <div className="mt-6 pt-5 border-t dark:border-white/[0.06] border-gray-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors font-medium group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
