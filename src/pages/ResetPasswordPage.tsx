import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
const logoImg = '/logo.png'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showCf, setShowCf]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the user back with a hash fragment containing the tokens.
  // We need to wait for the PASSWORD_RECOVERY event before allowing the form.
  useEffect(() => {
    // Check if we already have a recovery session (from the URL hash)
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
    if (password.length >= 8)  s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'][strength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      // Auto-redirect to dashboard after 2.5s
      setTimeout(() => navigate('/app/feed', { replace: true }), 2500)
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
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
          {done ? (
            /* ── Success ── */
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
                Password Updated! 🎉
              </h2>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">
                Your password has been changed successfully.
              </p>
              <p className="text-xs dark:text-gray-500 text-gray-400">
                Redirecting you to your dashboard...
              </p>
              <div className="mt-4 w-full h-1 dark:bg-white/5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5, ease: 'linear' }}
                  className="h-full bg-love-gradient rounded-full"
                />
              </div>
            </div>
          ) : !sessionReady ? (
            /* ── Waiting for recovery session ── */
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm dark:text-gray-400 text-gray-600">Verifying your reset link...</p>
              <p className="text-xs dark:text-gray-600 text-gray-400 mt-2">
                If this takes too long, your link may have expired.{' '}
                <a href="/forgot-password" className="text-brand-pink hover:underline">Request a new one</a>
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-love-soft border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-brand-pink" />
                </div>
                <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">
                  Create New Password
                </h1>
                <p className="text-sm dark:text-gray-400 text-gray-600">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:dark:text-gray-600 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'dark:bg-white/10 bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${['','text-red-500','text-amber-500','text-blue-500','text-emerald-500'][strength]}`}>
                        {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                    <input
                      type={showCf ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className={`w-full pl-10 pr-10 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all dark:text-white text-gray-900 placeholder:dark:text-gray-600 placeholder:text-gray-400 ${
                        confirm && password !== confirm
                          ? 'border-red-500/50 focus:border-red-500/50'
                          : confirm && password === confirm
                          ? 'border-emerald-500/50 focus:border-emerald-500/50'
                          : 'dark:border-white/8 border-gray-200 focus:border-pink-500/50'
                      }`}
                    />
                    <button type="button" onClick={() => setShowCf(!showCf)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
                      {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm || password !== confirm}
                  className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Save New Password</>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
