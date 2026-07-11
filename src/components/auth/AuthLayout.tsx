import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const logoImg = '/logo.png'

interface AuthLayoutProps {
  children: ReactNode
  showBack?: boolean
  backTo?: string
  backLabel?: string
  maxWidth?: string
}

export function AuthLayout({
  children,
  showBack = true,
  backTo = '/',
  backLabel = 'Back to website',
  maxWidth = 'max-w-md',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 py-10 overflow-hidden">
      {/* Full-bleed background photo */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/hero-networking.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Stronger dark overlay for admin — keeps it professional */}
      <div className="absolute inset-0 z-[1] bg-black/75" />

      {/* Ambient background layers */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/4 w-[700px] h-[500px] rounded-full bg-pink-500/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-purple-500/8 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-pink-500/4 blur-[80px]" />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute top-16 right-16 w-3 h-3 rounded-full bg-brand-pink/30 hidden lg:block z-[3]"
        animate={{ y: [0, -16, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-24 left-20 w-2 h-2 rounded-full bg-brand-purple/40 hidden lg:block z-[3]"
        animate={{ y: [0, 12, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-1/3 right-8 w-1.5 h-1.5 rounded-full bg-brand-blush/40 hidden lg:block z-[3]"
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <div className={`w-full ${maxWidth} relative z-[3]`}>
        {showBack && (
          <div className="mb-5">
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              {backLabel}
            </Link>
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="relative">
            <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-brand-pink/20 blur-lg" />
          </div>
          <span className="font-display font-black text-xl tracking-tight">
            <span className="text-gradient-love">Smartz</span>
            <span className="dark:text-white text-gray-900">Connect</span>
          </span>
        </div>

        {children}
      </div>
    </div>
  )
}

interface AuthCardProps {
  children: ReactNode
  className?: string
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
      className={`dark:bg-[#110D1B] bg-white rounded-3xl border dark:border-white/[0.07] border-gray-100/80 shadow-2xl dark:shadow-black/40 shadow-gray-200/60 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  rightEl?: ReactNode
  error?: boolean
  success?: boolean
}

export function AuthInput({ icon, rightEl, error, success, className = '', ...props }: AuthInputProps) {
  const borderClass = error
    ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
    : success
    ? 'border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20'
    : 'dark:border-white/[0.08] border-gray-200 focus:border-brand-pink focus:ring-brand-pink/20'

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${rightEl ? 'pr-10' : 'pr-4'} py-3 rounded-xl dark:bg-white/[0.04] bg-gray-50/80 border dark:text-white text-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${borderClass} ${className}`}
        {...props}
      />
      {rightEl && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightEl}
        </div>
      )}
    </div>
  )
}

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export function AuthButton({ loading, variant = 'primary', children, className = '', disabled, ...props }: AuthButtonProps) {
  if (variant === 'secondary') {
    return (
      <button
        disabled={disabled || loading}
        className={`w-full py-3 rounded-xl dark:bg-white/[0.05] bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 hover:dark:bg-white/[0.08] hover:bg-gray-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      disabled={disabled || loading}
      className={`w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface AuthErrorProps {
  message: string
}

export function AuthError({ message }: AuthErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
    >
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 3.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5zm-.75 6.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" />
      </svg>
      <span>{message}</span>
    </motion.div>
  )
}

interface AuthLabelProps {
  htmlFor?: string
  children: ReactNode
}

export function AuthLabel({ htmlFor, children }: AuthLabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 tracking-wide">
      {children}
    </label>
  )
}
