import { useState, type ElementType } from 'react'
import { X, AlertTriangle, Info, CheckCircle, Gift } from 'lucide-react'
import { useAnnouncement } from '@/contexts/AnnouncementContext'
import type { AnnouncementType } from '@/contexts/AnnouncementContext'

const TYPE_CONFIG: Record<AnnouncementType, {
  bg: string
  border: string
  icon: ElementType
}> = {
  info:    { bg: 'bg-blue-600',    border: 'border-blue-500',    icon: Info },
  warning: { bg: 'bg-amber-500',   border: 'border-amber-400',   icon: AlertTriangle },
  success: { bg: 'bg-emerald-600', border: 'border-emerald-500', icon: CheckCircle },
  error:   { bg: 'bg-red-600',     border: 'border-red-500',     icon: AlertTriangle },
  promo:   { bg: 'bg-love-gradient', border: 'border-pink-400',  icon: Gift },
}

export default function AnnouncementBanner() {
  const { activeAnnouncement, bannerEnabled } = useAnnouncement()
  // Per-announcement dismiss: tracking by ID so new announcements auto-surface
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  if (!bannerEnabled || !activeAnnouncement || dismissedId === activeAnnouncement.id) return null

  const cfg = TYPE_CONFIG[activeAnnouncement.type] ?? TYPE_CONFIG.info
  const Icon = cfg.icon
  const msg = activeAnnouncement.message
  const isPromo = activeAnnouncement.type === 'promo'

  return (
    <div
      className={`relative flex items-center overflow-hidden ${isPromo ? 'bg-love-gradient' : cfg.bg} border-b ${cfg.border} border-opacity-30 text-white flex-shrink-0`}
      style={{ minHeight: '36px' }}
    >
      {/* Type icon */}
      <div className="flex-shrink-0 px-3 flex items-center">
        <Icon className="w-3.5 h-3.5 opacity-90" />
      </div>

      {/* Scrolling message — duplicate content for seamless loop */}
      <div className="flex-1 overflow-hidden" style={{ height: 36 }}>
        <div
          className="flex items-center h-full"
          style={{ animation: 'marquee 26.6s linear infinite', whiteSpace: 'nowrap', willChange: 'transform' }}
        >
          <span className="text-[13px] font-semibold opacity-95 pr-20">{msg}</span>
          {activeAnnouncement.link_text && activeAnnouncement.link_url && (
            <a
              href={activeAnnouncement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 font-bold text-[13px] hover:opacity-80 transition-opacity pr-20"
            >
              {activeAnnouncement.link_text} →
            </a>
          )}
          {/* Second copy for seamless loop */}
          <span className="text-[13px] font-semibold opacity-95 pr-20">{msg}</span>
          {activeAnnouncement.link_text && activeAnnouncement.link_url && (
            <a
              href={activeAnnouncement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 font-bold text-[13px] hover:opacity-80 transition-opacity pr-20"
            >
              {activeAnnouncement.link_text} →
            </a>
          )}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissedId(activeAnnouncement.id)}
        className="flex-shrink-0 px-3 flex items-center opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
