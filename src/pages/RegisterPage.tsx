import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const logoImg = '/logo.png'

export default function RegisterPage() {
  const { signIn } = useAuth()

  return (
    <div className="min-h-screen bg-[#080614] relative flex flex-col items-center justify-center p-4 py-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/4 w-[700px] h-[500px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-pink-600/8 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-violet-500/6 blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to website
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="relative">
            <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-lg" />
          </div>
          <span className="font-display font-black text-xl tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Smartz</span>
            <span className="text-white">Connect</span>
          </span>
        </div>

        <div className="bg-[#110D1F] rounded-3xl border border-white/8 shadow-2xl shadow-black/60 overflow-hidden p-6 sm:p-8 text-center">
          <h2 className="font-display font-black text-2xl text-white mb-2 leading-tight">
            Join SmartzConnect
          </h2>
          <p className="text-sm text-white/40 mb-7">
            Create your account in one click — no forms, no passwords to remember.
          </p>

          <button
            type="button"
            onClick={signIn}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm hover:from-purple-500 hover:to-purple-400 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-purple-600/25"
          >
            Create Account
          </button>
        </div>

        <p className="text-center mt-5 text-sm text-white/40">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
