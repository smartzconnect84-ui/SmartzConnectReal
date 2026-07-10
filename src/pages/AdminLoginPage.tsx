import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2, Shield, ArrowLeft, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthInput, AuthError } from '@/components/auth/AuthLayout'
import { listSwitchableAccounts, switchToAccount, type SwitchableAccount } from '@/lib/accountSwitcher'

const logoImg = '/logo.png'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { signIn, session, isAdmin, loading: authLoading } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [switching, setSwitching] = useState<string | null>(null)
  const [savedAccounts, setSavedAccounts] = useState<SwitchableAccount[]>([])

  // Already have a valid admin session on this device (remembered sign-in) —
  // skip the form entirely and go straight to the dashboard.
  useEffect(() => {
    if (!authLoading && session && isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [authLoading, session, isAdmin, navigate])

  useEffect(() => {
    setSavedAccounts(listSwitchableAccounts())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSwitch = async (account: SwitchableAccount) => {
    setError('')
    setSwitching(account.email)
    try {
      await switchToAccount(account.email)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Could not restore that session. Please sign in with your password.')
      setSavedAccounts(listSwitchableAccounts())
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 relative flex flex-col items-center justify-center p-5 py-10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/3 w-[600px] h-[400px] rounded-full bg-amber-500/20 blur-[65px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-purple-500/22 blur-[55px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-pink-500/18 blur-[50px]" />
      </div>

      {/* Floating particles */}
      <motion.div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-amber-400/30 hidden lg:block"
        animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-28 left-24 w-1.5 h-1.5 rounded-full bg-brand-pink/30 hidden lg:block"
        animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />

      <div className="w-full max-w-[420px] relative">
        {/* Back link */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to website
          </Link>
        </div>

        {/* Logo + Admin badge */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative">
              <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
              <div className="absolute inset-0 rounded-xl bg-brand-pink/20 blur-md" />
            </div>
            <span className="font-display font-black text-xl tracking-tight">
              <span className="text-gradient-love">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-amber-500/[0.1] bg-amber-50 border dark:border-amber-500/[0.2] border-amber-100">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">Admin Portal</span>
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
          className="dark:bg-[#110D1B] bg-white rounded-3xl border dark:border-white/[0.07] border-gray-100/80 shadow-2xl dark:shadow-black/40 shadow-gray-200/60 p-6 sm:p-8"
        >
          <div className="mb-6">
            <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1.5 leading-tight">
              Admin Sign In
            </h1>
            <p className="dark:text-gray-400 text-gray-500 text-sm">Authorised personnel only</p>
          </div>

          {error && <div className="mb-5"><AuthError message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5">
                Admin Email
              </label>
              <AuthInput
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@smartzconnect.com"
                autoComplete="email"
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-pw" className="text-xs font-semibold dark:text-gray-400 text-gray-600">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-pink hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <AuthInput
                id="admin-pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
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
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-brand-pink/30 ${
                  rememberMe
                    ? 'bg-brand-pink border-brand-pink'
                    : 'dark:border-white/20 border-gray-300 group-hover:border-brand-pink/50'
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-xs dark:text-gray-400 text-gray-600 group-hover:dark:text-gray-300 transition-colors">
                Remember me on this device
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none mt-1"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                : <><Shield className="w-4 h-4" /> Access Admin Panel</>
              }
            </button>
          </form>

          <p className="text-center mt-5 text-xs dark:text-gray-600 text-gray-400">
            Not an admin?{' '}
            <Link to="/login" className="text-brand-pink hover:underline font-medium">User login →</Link>
          </p>
        </motion.div>

        <p className="text-center mt-4 text-[10px] dark:text-gray-700 text-gray-400">
          Unauthorised access is strictly prohibited and monitored.
        </p>
      </div>
    </div>
  )
}
