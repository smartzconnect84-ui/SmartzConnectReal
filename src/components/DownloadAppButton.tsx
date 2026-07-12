import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ExternalLink, CheckCircle } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import IOSInstallModal from '@/components/IOSInstallModal'

interface DownloadAppButtonProps {
  /** 'primary' = brand gradient, 'secondary' = glass/outline, 'green' = emerald gradient, 'yellow' = amber gradient (Download/Get Started CTA) */
  variant?: 'primary' | 'secondary' | 'green' | 'yellow'
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
    yellow: {
      className: 'text-black',
      style: { background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)', boxShadow: '0 6px 24px rgba(245,158,11,0.35)' },
    },
  }

  const s = styleMap[variant]

  return (
    <>
      <motion.div
        className="relative inline-block"
        animate={{ scale: [1, 1.025, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Ambient pulsing glow ring */}
        <motion.span
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ boxShadow: ['0 0 0 0px rgba(255,255,255,0.28)', '0 0 0 9px rgba(255,255,255,0)', '0 0 0 0px rgba(255,255,255,0)'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.5 }}
        />
        <motion.button
          onClick={handleClick}
          disabled={loading}
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.9, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 15 }}
          className={[
            'relative inline-flex items-center gap-2 font-bold text-sm sm:text-[15px] rounded-xl transition-all overflow-hidden',
            // 10% smaller than previous px-6 sm:px-8 py-3 sm:py-3.5
            'px-5 sm:px-7 py-2.5 sm:py-3',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            s.className,
            className,
          ].join(' ')}
          style={s.style}
          aria-label={label}
        >
          {/* Shine sweep on hover */}
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)' }}
            initial={{ x: '-120%' }}
            whileHover={{ x: '120%' }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
          {loading ? (
            <svg className="w-4 h-4 animate-spin relative" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <motion.span
              className="relative flex"
              whileHover={{ y: [0, -3, 0] }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Icon className="w-4 h-4" />
            </motion.span>
          )}
          <span className="relative">{label}</span>
        </motion.button>
      </motion.div>
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  )
}
