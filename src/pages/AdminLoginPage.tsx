import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
const logoImg = '/logo.png'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before accessing the admin panel.')
      } else {
        setError(err.message || 'Invalid credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-pink-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to website */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to website
          </Link>
        </div>

        {/* Logo + badge */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <img src={logoImg} alt="SmartzConnect" className="w-10 h-10 object-contain" />
            <span className="font-display font-black text-xl">
              <span className="text-gradient-love">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-amber-500/10 bg-amber-50 border dark:border-amber-500/20 border-amber-200">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Admin Portal</span>
          </div>
        </div>

        <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-2xl shadow-pink-500/5 p-6 sm:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1">Admin Sign In</h1>
            <p className="dark:text-gray-400 text-gray-600 text-sm mb-6">Authorised personnel only</p>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="admin@smartzconnect.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand-pink hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {showPw
                      ? <EyeOff className="w-4 h-4 dark:text-gray-500 text-gray-400" />
                      : <Eye className="w-4 h-4 dark:text-gray-500 text-gray-400" />
                    }
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${rememberMe ? 'bg-brand-pink border-brand-pink' : 'dark:border-white/20 border-gray-300'}`}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs dark:text-gray-400 text-gray-600">Remember me on this device</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Shield className="w-4 h-4" /> <ArrowRight className="w-4 h-4" /> Access Admin Panel</>
                }
              </button>
            </form>

            <p className="text-center mt-5 text-xs dark:text-gray-500 text-gray-400">
              Not an admin?{' '}
              <Link to="/login" className="text-brand-pink hover:underline">User login</Link>
            </p>
          </motion.div>
        </div>

        <p className="text-center mt-4 text-[10px] dark:text-gray-600 text-gray-400">
          Unauthorised access is strictly prohibited and monitored.
        </p>
      </div>
    </div>
  )
}
