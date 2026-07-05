import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const logoImg = '/logo.png'

export default function LoginPage() {
  const { signIn } = useAuth()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden text-[#f2f0f5] bg-[Black]"
      style={{
        background: 'radial-gradient(ellipse 120% 100% at 75% 60%, #4a1a6b 0%, #2d1155 25%, #1a0a35 50%, #0d0520 75%, #080414 100%)',
      }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-900/30 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-pink-800/15 blur-[90px]" />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-2.5 mb-8">
        <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain" />
        <span className="font-display font-black text-xl tracking-tight text-white">
          Smartz<span className="text-purple-400">Connect</span>
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

        {/* Sign in button */}
        <button
          type="button"
          onClick={signIn}
          className="w-full py-3 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #9333ea 0%, #c026d3 50%, #e11d48 100%)',
            boxShadow: '0 4px 24px rgba(147,51,234,0.35)',
          }}
        >
          Sign in
        </button>

        <p className="text-center text-sm text-white/50 mt-5">
          New here? Signing in will create your account automatically.
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

      {/* Back to home */}
      <Link
        to="/"
        className="mt-5 text-xs text-white/35 hover:text-white/60 transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  )
}
