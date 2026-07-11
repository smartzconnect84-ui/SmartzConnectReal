import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ExternalLink, CheckCircle } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import IOSInstallModal from '@/components/IOSInstallModal'

interface DownloadAppButtonProps {
  /** 'primary' = brand gradient, 'secondary' = glass/outline, 'green' = emerald gradient */
  variant?: 'primary' | 'secondary' | 'green'
  className?: string
}

export default function DownloadAppButton({ variant = 'primary', className = '' }: DownloadAppButtonProps) {
  const { installState, showIOSModal, setShowIOSModal, triggerInstall } = usePWAInstall()
  const [loading, setLoading] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    const result = await triggerInstall()
    setLoading(false)
    if (result === 'accepted') {
      setJustInstalled(true)
      setTimeout(() => setJustInstalled(false), 3000)
    }
  }

  const label = justInstalled ? 'Installed!'
    : installState === 'installed' ? 'Open App'
    : installState === 'ios' ? 'Install App'
    : installState === 'ready' ? 'Download App'
    : installState === 'unsupported' ? 'Open App'
    : 'Download App'

  const Icon = justInstalled ? CheckCircle
    : (installState === 'installed' || installState === 'unsupported') ? ExternalLink
    : Download

  const styleMap = {
    primary: {
      className: 'text-white',
      style: { background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 60%, #DC2626 100%)', boxShadow: '0 6px 24px rgba(139,92,246,0.38)' },
    },
    secondary: {
      className: 'text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20',
      style: {},
    },
    green: {
      className: 'text-white',
      style: { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 6px 24px rgba(16,185,129,0.35)' },
    },
  }

  const s = styleMap[variant]

  return (
    <>
      <motion.button
        onClick={handleClick}
        disabled={loading}
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className={[
          'inline-flex items-center gap-2 font-bold text-sm sm:text-[15px] rounded-xl transition-all',
          // 10% smaller than previous px-6 sm:px-8 py-3 sm:py-3.5
          'px-5 sm:px-7 py-2.5 sm:py-3',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          s.className,
          className,
        ].join(' ')}
        style={s.style}
        aria-label={label}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : <Icon className="w-4 h-4" />}
        {label}
      </motion.button>
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  )
}
