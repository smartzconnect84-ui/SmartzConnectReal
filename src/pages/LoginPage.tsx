import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import TurnstileWidget from '@/components/TurnstileWidget'
import BrandName from '@/components/BrandName'

const TURNSTILE_ENABLED = !!import.meta.env.VITE_TURNSTILE_SITE_KEY

const logoImg = '/logo.png'

/* Google "G" coloured SVG icon */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, session, loading: authLoading } = useAuth()

  // If already authenticated, skip the login screen entirely
  useEffect(() => {
    if (!authLoading && session) {
      navigate('/app/feed', { replace: true })
    }
  }, [session, authLoading, navigate])

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]         = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Verify Turnstile token server-side before signing in (only when enabled)
      if (TURNSTILE_ENABLED && turnstileToken) {
        const { data, error: tvErr } = await supabase.functions.invoke('verify-turnstile', {
          body: { token: turnstileToken },
        })
        if (tvErr || !data?.success) {
          setError('CAPTCHA verification failed. Please refresh and try again.')
          setTurnstileToken('')
          return
        }
      }
      await signIn(email, password)
      navigate('/app/feed', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // OAuth redirects away; no navigation needed here
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden text-[#f2f0f5]"
      style={{
        background: 'radial-gradient(ellipse 120% 100% at 75% 60%, #4a1a6b 0%, #2d1155 25%, #1a0a35 50%, #0d0520 75%, #080414 100%)',
      }}
    >
      {/* Full-bleed background photo */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/hero-couple.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay so text stays legible */}
      <div className="absolute inset-0 z-[1] bg-black/60" />

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-700/45 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-900/55 blur-[70px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-pink-800/35 blur-[60px]" />
      </div>

      {/* Content (above background layers) */}
      <div className="relative z-[3] flex flex-col items-center w-full px-4">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <img src={logoImg} alt="SmartzConnect" className="w-[43px] h-[43px] object-contain" />
        <span className="font-display font-black text-2xl tracking-tight">
          <BrandName />
        </span>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-[420px] rounded-2xl p-7 sm:p-8"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Heading */}
        <h1 className="font-display font-black text-2xl text-white mb-1">Welcome back</h1>
        <p className="text-sm text-white/50 mb-6">Sign in to access your dashboard.</p>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 active:scale-[0.99] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        >
          {googleLoading
            ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            : <GoogleIcon />
          }
          Continue with Google
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/35 font-medium">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                  rememberMe
                    ? 'bg-blue-500 border-blue-500'
                    : 'border border-white/25 bg-transparent'
                }`}
                style={rememberMe ? { border: '1.5px solid #3b82f6' } : { border: '1.5px solid rgba(255,255,255,0.25)' }}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className="text-xs text-white/60">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Turnstile CAPTCHA (only shown when site key is configured) */}
          {TURNSTILE_ENABLED && (
            <div className="flex justify-center pt-1">
              <TurnstileWidget
                onToken={setTurnstileToken}
                onError={() => setTurnstileToken('')}
              />
            </div>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading || googleLoading || (TURNSTILE_ENABLED && !turnstileToken)}
            className="w-full py-3 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            style={{
              background: 'linear-gradient(135deg, #9333ea 0%, #c026d3 50%, #e11d48 100%)',
              boxShadow: '0 4px 24px rgba(147,51,234,0.35)',
            }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              : 'Sign in'
            }
          </button>
        </form>

        {/* Create account */}
        <p className="text-center text-sm text-white/50 mt-5">
          New here?{' '}
          <Link to="/register" className="text-white font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      {/* Staff member card */}
      <div
        className="relative w-full max-w-[420px] mt-3 rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        <div>
          <p className="text-xs font-bold text-amber-400">Staff member?</p>
          <p className="text-xs text-white/45 mt-0.5">Use the Control Center</p>
        </div>
        <Link
          to="/admin/login"
          className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold text-white whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
          }}
        >
          Admin Login →
        </Link>
      </div>

      {/* Back to website */}
      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to website
      </Link>

      </div>{/* end content z-[3] wrapper */}
    </div>
  )
}
