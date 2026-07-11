import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, type PanInfo } from 'framer-motion'
import { LifeBuoy, MessageCircle, HelpCircle, X, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { openTawkChat, hideTawkWidget } from '@/lib/tawk'

const DISMISS_KEY = 'sc_support_widget_dismissed'
const POS_KEY = 'sc_support_widget_corner'

const SIZE = 56       // FAB diameter
const MARGIN = 20      // resting distance from the viewport edge

type Corner = 'br' | 'bl' | 'tr' | 'tl'

function cornerToXY(corner: Corner) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const x = corner === 'br' || corner === 'tr' ? vw - SIZE - MARGIN : MARGIN
  const y = corner === 'br' || corner === 'bl' ? vh - SIZE - MARGIN : MARGIN
  return { x, y }
}

function nearestCorner(x: number, y: number): Corner {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const isRight = x + SIZE / 2 > vw / 2
  const isBottom = y + SIZE / 2 > vh / 2
  if (isBottom && isRight) return 'br'
  if (isBottom && !isRight) return 'bl'
  if (!isBottom && isRight) return 'tr'
  return 'tl'
}

function loadCorner(): Corner {
  try {
    const v = sessionStorage.getItem(POS_KEY)
    if (v === 'br' || v === 'bl' || v === 'tr' || v === 'tl') return v
  } catch { /* ignore */ }
  return 'br'
}

/**
 * Global floating "support" launcher shown on every non-admin page.
 * Replaces Tawk.to's own launcher bubble (hidden via hideTawkWidget) with a
 * branded, draggable floating action button that can be flicked to any of
 * the four screen corners — it snaps and settles there with a spring
 * animation. Offers two options — Live Support (opens the Tawk chat window)
 * and Help & Support (the /help page) — and can be fully dismissed,
 * collapsing to a small edge tab that restores it.
 */
export default function FloatingSupportWidget() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  const [corner, setCorner] = useState<Corner>(loadCorner)
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Position the widget at its resting corner; recompute on resize so it
  // never gets stranded off-screen when the viewport changes.
  useEffect(() => {
    const apply = () => {
      const { x: nx, y: ny } = cornerToXY(corner)
      x.set(nx)
      y.set(ny)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [corner, x, y])

  useEffect(() => {
    hideTawkWidget()
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleDragStart = useCallback(() => {
    setOpen(false)
    setDragging(true)
  }, [])

  const handleDragEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragging(false)
    const finalX = x.get()
    const finalY = y.get()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const clampedX = Math.min(Math.max(finalX, MARGIN), vw - SIZE - MARGIN)
    const clampedY = Math.min(Math.max(finalY, MARGIN), vh - SIZE - MARGIN)
    const next = nearestCorner(clampedX, clampedY)
    setCorner(next)
    try { sessionStorage.setItem(POS_KEY, next) } catch { /* ignore */ }
    // Treat a near-zero drag as a tap, so the FAB still opens the menu.
    const dist = Math.hypot(info.offset.x, info.offset.y)
    if (dist < 6) setOpen(v => !v)
  }, [x, y])

  // Admin pages already have their own live-chat icon in the header — avoid a duplicate.
  if (location.pathname.startsWith('/admin')) return null

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
    setOpen(false)
  }
  const restore = () => {
    try { sessionStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
    setDismissed(false)
  }

  const isTop = corner === 'tl' || corner === 'tr'
  const isLeft = corner === 'tl' || corner === 'bl'

  // Popover always opens toward the center of the screen, away from the edge it's docked to.
  const popoverAnchor: React.CSSProperties = {
    position: 'absolute',
    [isTop ? 'top' : 'bottom']: SIZE + 12,
    [isLeft ? 'left' : 'right']: 0,
  }

  const dragConstraints = {
    top: MARGIN,
    left: MARGIN,
    right: typeof window !== 'undefined' ? window.innerWidth - SIZE - MARGIN : 0,
    bottom: typeof window !== 'undefined' ? window.innerHeight - SIZE - MARGIN : 0,
  }

  if (dismissed) {
    return (
      <motion.button
        drag={false}
        initial={{ opacity: 0, x: isLeft ? -8 : 8 }} animate={{ opacity: 1, x: 0 }}
        onClick={restore}
        title="Show support"
        style={{ position: 'fixed', [isTop ? 'top' : 'bottom']: MARGIN, [isLeft ? 'left' : 'right']: 0 } as React.CSSProperties}
        className={`z-[70] w-8 h-9 flex items-center justify-center dark:bg-[#130E1E] bg-white shadow-lg border dark:border-white/10 border-gray-100 dark:text-gray-500 text-gray-400 hover:dark:text-white hover:text-gray-700 transition-colors ${isLeft ? 'rounded-r-xl' : 'rounded-l-xl'}`}
      >
        {isLeft ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </motion.button>
    )
  }

  return (
    <motion.div
      ref={rootRef}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      dragConstraints={dragConstraints}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
      animate={dragging ? undefined : { x: x.get(), y: y.get() }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      style={{ position: 'fixed', top: 0, left: 0, x, y, touchAction: 'none' }}
      className="z-[70] select-none"
    >
      <AnimatePresence>
        {open && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: isTop ? -12 : 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isTop ? -12 : 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={popoverAnchor}
            className="w-64 rounded-2xl overflow-hidden shadow-2xl border dark:border-white/10 border-gray-100 dark:bg-[#130E1E] bg-white"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600">
              <p className="text-white text-sm font-bold flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5 text-white/50" /> Need help?
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={() => { setOpen(false); openTawkChat() }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:dark:bg-white/5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-[18px] h-[18px] text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white text-gray-900">Live Support</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-500">Chat with our team now</p>
                </div>
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/help') }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:dark:bg-white/5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-[18px] h-[18px] text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white text-gray-900">Help & Support</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-500">FAQs, guides & contact info</p>
                </div>
              </button>
            </div>
            <p className="px-3 pb-1 text-[10px] text-center dark:text-gray-600 text-gray-400">Tip: drag the button to move it</p>
            <button
              onClick={dismiss}
              className="w-full text-center text-[11px] dark:text-gray-500 text-gray-400 py-2 border-t dark:border-white/5 border-gray-100 hover:dark:text-gray-300 hover:text-gray-600 transition-colors"
            >
              Hide this widget
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.06 }}
        title="Support — drag to move, click to open"
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-purple-900/40 bg-gradient-to-br from-purple-600 to-pink-600 text-white cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <LifeBuoy className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
