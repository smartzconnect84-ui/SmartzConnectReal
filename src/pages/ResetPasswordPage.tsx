import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { AuthLayout, AuthCard, AuthInput, AuthError, AuthLabel } from '@/components/auth/AuthLayout'

const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-400', 'bg-emerald-500']
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-amber-500', 'text-blue-400', 'text-emerald-500']
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [showCf, setShowCf]             = useState(false)
  const [loading, setLoading]           = useState(false)
  const [done, setDone]                 = useState(false)
  const [error, setError]               = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const strength = (() => {
    if (password.length === 0) return 0
    let s = 0
    if (password.length >= 8)          s++
    if (/[A-Z]/.test(password))        s++
    if (/[0-9]/.test(password))        s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/app/feed', { replace: true }), 2500)
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout showBack={false}>
      <AuthCard>
        {done ? (
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
              Password Updated! 🎉
            </h2>
            <p className="text-sm dark:text-gray-400 text-gray-500 mb-5">
              Your password has been changed successfully.
            </p>
            <p className="text-xs dark:text-gray-600 text-gray-400 mb-4">Redirecting to your dashboard…</p>
            <div className="w-full h-1 dark:bg-white/5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
                className="h-full bg-love-gradient rounded-full"
              />
            </div>
          </div>
        ) : !sessionReady ? (
          /* ── Waiting for session ── */
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-2 dark:border-white/10 border-gray-100 border-t-brand-pink rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm dark:text-gray-400 text-gray-600 mb-2">Verifying your reset link…</p>
            <p className="text-xs dark:text-gray-600 text-gray-400">
              If this takes too long, your link may have expired.{' '}
              <a href="/forgot-password" className="text-brand-pink hover:underline font-medium">Request a new one</a>
            </p>
          </div>
        ) : (
          /* ── Form ── */
          <div className="p-6 sm:p-8">
            <div className="text-center mb-7">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-pink-500/[0.08] border border-pink-500/[0.15] flex items-center justify-center mx-auto mb-4"
              >
                <ShieldCheck className="w-7 h-7 text-brand-pink" />
              </motion.div>
              <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">
                Create New Password
              </h1>
              <p className="text-sm dark:text-gray-400 text-gray-500">
                Choose a strong password for your account.
              </p>
            </div>

            {error && <div className="mb-5"><AuthError message={error} /></div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <AuthLabel htmlFor="rp-pw">New Password</AuthLabel>
                <AuthInput
                  id="rp-pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                  icon={<Lock className="w-4 h-4" />}
                  rightEl={
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors p-0.5"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_COLORS[strength] : 'dark:bg-white/8 bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-semibold ${STRENGTH_TEXT[strength]}`}>{STRENGTH_LABELS[strength]}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <AuthLabel htmlFor="rp-cf">Confirm Password</AuthLabel>
                <AuthInput
                  id="rp-cf"
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  error={!!(confirm && password !== confirm)}
                  success={!!(confirm && password === confirm)}
                  icon={<Lock className="w-4 h-4" />}
                  rightEl={
                    <button type="button" onClick={() => setShowCf(!showCf)}
                      className="dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors p-0.5"
                      aria-label={showCf ? 'Hide password' : 'Show password'}
                    >
                      {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" opacity=".2"/><path d="M6 3v3.5M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>
                    Passwords don't match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm || password !== confirm}
                className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none mt-1"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><ShieldCheck className="w-4 h-4" /> Save New Password</>
                }
              </button>
            </form>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
