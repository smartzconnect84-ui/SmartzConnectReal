import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import TurnstileWidget from '@/components/TurnstileWidget'
const logoImg = '/logo.png'

const TURNSTILE_ENABLED = !!import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Please complete the security check.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/app/feed', { replace: true })
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email }, replace: true })
      } else {
        setError(err.message || 'Invalid email or password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/3 blur-3xl" />

        <div className="relative flex items-center gap-3 p-12">
          <img src={logoImg} alt="SmartzConnect" className="w-10 h-10 object-contain" />
          <span className="font-display font-black text-xl text-white">SmartzConnect</span>
        </div>

        <div className="relative p-12">
          <h2 className="font-display font-black text-4xl text-white mb-4 leading-tight">
            Africa's #1<br />Social Platform
          </h2>
          <p className="text-white/60 text-base mb-8 leading-relaxed">
            Connect, date, stream, shop, and ride — all in one app built for Africa.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'Social', l: 'Connections' },
              { v: 'Streaming', l: 'SmartzTV' },
              { v: 'Shopping', l: 'SmartzMarket' },
              { v: 'Rides', l: 'SmartzRide' },
            ].map(s => (
              <div key={s.l} className="bg-white/8 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="font-display font-black text-xl text-white">{s.v}</p>
                <p className="text-white/50 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-12">
          <p className="text-white/50 text-sm">Connecting Africa, one community at a time.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Back to website */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to website
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <img src={logoImg} alt="SmartzConnect" className="w-10 h-10 object-contain" />
            <span className="font-display font-black text-xl">
              <span className="text-gradient-love">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-1">Welcome back 👋</h1>
            <p className="dark:text-gray-400 text-gray-600 text-sm mb-8">Sign in to your SmartzConnect account</p>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand-pink hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {showPw ? <EyeOff className="w-4 h-4 dark:text-gray-500 text-gray-400" /> : <Eye className="w-4 h-4 dark:text-gray-500 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Turnstile */}
              {TURNSTILE_ENABLED && (
                <TurnstileWidget
                  onSuccess={setTurnstileToken}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                />
              )}

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${rememberMe ? 'bg-brand-pink border-brand-pink' : 'dark:border-white/20 border-gray-300'}`}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs dark:text-gray-400 text-gray-600">Remember me</span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
              </button>
            </form>

            <p className="text-center mt-6 text-sm dark:text-gray-400 text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-pink font-bold hover:underline">Sign up free</Link>
            </p>

            <p className="text-center mt-3 text-xs dark:text-gray-500 text-gray-400">
              Admin?{' '}
              <Link to="/admin/login" className="text-brand-pink hover:underline">Admin login →</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
