import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ArrowLeft, Sparkles, Users, Tv2, ShoppingBag, Car } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthInput, AuthError } from '@/components/auth/AuthLayout'

const logoImg = '/logo.png'

const FEATURES = [
  { icon: Users,       label: 'Social Network',  desc: 'Connect & date'     },
  { icon: Tv2,         label: 'SmartzTV',         desc: 'Live streaming'     },
  { icon: ShoppingBag, label: 'SmartzMarket',     desc: 'Buy & sell'         },
  { icon: Car,         label: 'SmartzRide',       desc: 'On-demand rides'    },
]

const TESTIMONIAL = {
  text: '"SmartzConnect changed how I connect with people across Africa. It\'s the super-app we\'ve always needed."',
  name: 'Amara K.',
  role: 'Lagos, Nigeria',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      {/* ── Left decorative panel (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(145deg, #12082A 0%, #1E0A3C 40%, #2D0B5A 100%)' }}>

        {/* Layered ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-brand-pink/20 blur-[100px]" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full bg-brand-purple/25 blur-[80px]" />
          <div className="absolute -bottom-20 right-1/3 w-72 h-72 rounded-full bg-brand-pink/15 blur-[90px]" />
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Floating orbs */}
        <motion.div className="absolute top-24 right-24 w-5 h-5 rounded-full bg-brand-pink/50"
          animate={{ y: [0, -18, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-1/2 right-8 w-3 h-3 rounded-full bg-brand-purple/60"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
        <motion.div className="absolute bottom-32 left-16 w-2.5 h-2.5 rounded-full bg-white/20"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />

        {/* Top logo */}
        <div className="relative flex items-center gap-3 p-10 pt-12">
          <div className="relative">
            <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-brand-pink/30 blur-md" />
          </div>
          <span className="font-display font-black text-xl text-white tracking-tight">SmartzConnect</span>
        </div>

        {/* Main copy */}
        <div className="relative px-10 flex-1 flex flex-col justify-center">
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
            <span className="text-white/70 text-xs font-semibold">Africa's #1 Super-App</span>
          </div>
          <h2 className="font-display font-black text-4xl xl:text-5xl text-white mt-4 mb-4 leading-[1.1]">
            Connect,<br />Date &<br />
            <span className="bg-love-gradient bg-clip-text text-transparent">Thrive.</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed mb-8 max-w-xs">
            Social networking, live streaming, a marketplace, and on-demand rides — all built for Africa.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] rounded-2xl p-4 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center mb-2.5 shadow-md shadow-pink-500/25">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-display font-bold text-white text-sm">{label}</p>
                <p className="text-white/40 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex gap-0.5 mb-3">
              {[0,1,2,3,4].map(i => (
                <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" viewBox="0 0 16 16"><path d="M8 1.2l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.7z"/></svg>
              ))}
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-3 italic">{TESTIMONIAL.text}</p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-black">{TESTIMONIAL.name[0]}</span>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{TESTIMONIAL.name}</p>
                <p className="text-white/40 text-[10px]">{TESTIMONIAL.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="relative px-10 pb-10">
          <p className="text-white/25 text-xs">© 2025 SmartzConnect. Empowering Africa.</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-10 relative">
        {/* Mobile ambient glow */}
        <div className="absolute inset-0 pointer-events-none lg:hidden overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-pink-500/8 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-purple-500/7 blur-[70px]" />
        </div>

        <div className="w-full max-w-[420px] relative">
          {/* Back link */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to website
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="relative">
              <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
              <div className="absolute inset-0 rounded-xl bg-brand-pink/20 blur-lg" />
            </div>
            <span className="font-display font-black text-xl tracking-tight">
              <span className="bg-love-gradient bg-clip-text text-transparent">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Heading */}
            <div className="mb-7">
              <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-1.5 leading-tight">
                Welcome back 👋
              </h1>
              <p className="dark:text-gray-400 text-gray-500 text-sm">
                Sign in to your SmartzConnect account
              </p>
            </div>

            {/* Error */}
            {error && <div className="mb-5"><AuthError message={error} /></div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5">
                  Email Address
                </label>
                <AuthInput
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-pw" className="text-xs font-semibold dark:text-gray-400 text-gray-600">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-brand-pink hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <AuthInput
                  id="login-pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  icon={<Lock className="w-4 h-4" />}
                  rightEl={
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
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
                  className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-brand-pink/30 ${
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
                <span className="text-xs dark:text-gray-400 text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
                  Remember me
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none mt-1"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px dark:bg-white/[0.06] bg-gray-100" />
              <span className="text-xs dark:text-gray-600 text-gray-400">or</span>
              <div className="flex-1 h-px dark:bg-white/[0.06] bg-gray-100" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm dark:text-gray-400 text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-pink font-bold hover:underline">
                Sign up free
              </Link>
            </p>

            <p className="text-center mt-2.5 text-xs dark:text-gray-600 text-gray-400">
              Admin?{' '}
              <Link to="/admin/login" className="text-brand-pink hover:underline font-medium">
                Admin portal →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
