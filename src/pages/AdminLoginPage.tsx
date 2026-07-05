import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const logoImg = '/logo.png'

export default function AdminLoginPage() {
  const { signIn } = useAuth()

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 relative flex flex-col items-center justify-center p-5 py-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/3 w-[600px] h-[400px] rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-purple-500/6 blur-[80px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-pink-500/5 blur-[70px]" />
      </div>

      <div className="w-full max-w-[420px] relative">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to website
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative">
              <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
              <div className="absolute inset-0 rounded-xl bg-brand-pink/20 blur-md" />
            </div>
            <span className="font-display font-black text-xl tracking-tight">
              <span className="bg-love-gradient bg-clip-text text-transparent">Smartz</span>
              <span className="dark:text-white text-gray-900">Connect</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-amber-500/[0.1] bg-amber-50 border dark:border-amber-500/[0.2] border-amber-100">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">Admin Portal</span>
          </div>
        </div>

        <div className="dark:bg-[#110D1B] bg-white rounded-3xl border dark:border-white/[0.07] border-gray-100/80 shadow-2xl dark:shadow-black/40 shadow-gray-200/60 p-6 sm:p-8 text-center">
          <h1 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1.5 leading-tight">
            Admin Sign In
          </h1>
          <p className="dark:text-gray-400 text-gray-500 text-sm mb-6">Authorised personnel only</p>

          <button
            type="button"
            onClick={signIn}
            className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            <Shield className="w-4 h-4" /> Sign in with Replit
          </button>

          <p className="text-center mt-5 text-xs dark:text-gray-600 text-gray-400">
            You'll only see admin tools if your account has admin permissions.
          </p>

          <p className="text-center mt-3 text-xs dark:text-gray-600 text-gray-400">
            Not an admin?{' '}
            <Link to="/login" className="text-brand-pink hover:underline font-medium">User login →</Link>
          </p>
        </div>

        <p className="text-center mt-4 text-[10px] dark:text-gray-700 text-gray-400">
          Unauthorised access is strictly prohibited and monitored.
        </p>
      </div>
    </div>
  )
}
