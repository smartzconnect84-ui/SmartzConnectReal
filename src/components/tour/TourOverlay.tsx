import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { useTour } from '@/contexts/TourContext'
import { waitForTourTarget, scrollElementIntoView } from '@/lib/tourDom'

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 10 // spotlight padding around the real element

export default function TourOverlay() {
  const { isActive, currentStep, stepIndex, total, next, prev, skip, finish } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const [rect, setRect] = useState<Rect | null>(null)
  const [phase, setPhase] = useState<'navigating' | 'locating' | 'ready'>('navigating')
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // ── Navigate to the step's route, then locate + measure the target ───────
  useEffect(() => {
    if (!isActive || !currentStep) return
    let cancelled = false
    setPhase('navigating')
    setRect(null)

    const run = async () => {
      if (currentStep.route && location.pathname !== currentStep.route) {
        navigate(currentStep.route)
        // Give the route change + any lazy chunk a tick to start mounting.
        await new Promise(r => setTimeout(r, 60))
      }
      if (cancelled) return
      setPhase('locating')

      if (!currentStep.target) { if (!cancelled) setPhase('ready'); return }

      const el = await waitForTourTarget(currentStep.target)
      if (cancelled) return
      if (!el) { setPhase('ready'); return } // graceful centered fallback

      scrollElementIntoView(el)
      // Wait a beat for smooth-scroll to settle before measuring.
      await new Promise(r => setTimeout(r, 260))
      if (cancelled) return
      measure(el)
      setPhase('ready')
    }

    const measure = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
    }

    run()

    // Track scroll/resize while this step is active so the ring stays glued
    // to a moving/reflowing target.
    const onReflow = () => {
      if (!currentStep.target) return
      const el = document.querySelector<HTMLElement>(`[data-tour="${currentStep.target}"]`)
      if (el) measure(el)
    }
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)

    return () => {
      cancelled = true
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStep?.id])

  // ── Focus management ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (isActive && phase === 'ready') cardRef.current?.focus()
  }, [isActive, phase, currentStep?.id])

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); skip() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'Tab' && cardRef.current) {
        // Minimal focus trap: cycle Tab within the tour card only.
        const focusables = cardRef.current.querySelectorAll<HTMLElement>('button, a[href]')
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, next, prev, skip])

  if (!isActive || !currentStep) return null

  const isFirst = stepIndex === 0
  const isLast = stepIndex === total - 1
  const showSpotlight = phase === 'ready' && !!rect

  return (
    <div className="fixed inset-0 z-[200]" role="presentation">
      {/* ── Dim backdrop — also the click-blocker for the rest of the app ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-[#0A0710]/0"
        style={!showSpotlight ? { backgroundColor: 'rgba(10,7,16,0.72)', backdropFilter: 'blur(2px)' } : undefined}
      />

      {/* ── Spotlight ring (also swallows clicks on the highlighted area) ── */}
      <AnimatePresence>
        {showSpotlight && rect && (
          <motion.div
            key={currentStep.id + '-ring'}
            initial={false}
            animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="absolute rounded-2xl border-2 pointer-events-auto"
            style={{
              borderColor: 'var(--color-accent, #ec4899)',
              boxShadow: '0 0 0 9999px rgba(10,7,16,0.72), 0 0 24px 4px var(--color-accent, #ec4899)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Tooltip card ── */}
      <AnimatePresence mode="wait">
        <TourCard
          key={currentStep.id}
          ref={cardRef}
          rect={showSpotlight ? rect : null}
          isMobile={isMobile}
          title={currentStep.title}
          description={currentStep.description}
          placement={currentStep.placement}
          stepIndex={stepIndex}
          total={total}
          isFirst={isFirst}
          isLast={isLast}
          onPrev={prev}
          onNext={next}
          onSkip={skip}
          onFinish={finish}
          loading={phase !== 'ready'}
        />
      </AnimatePresence>
    </div>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

interface TourCardProps {
  rect: Rect | null
  isMobile: boolean
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  stepIndex: number
  total: number
  isFirst: boolean
  isLast: boolean
  loading: boolean
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
  onFinish: () => void
}

function computeCardStyle(rect: Rect | null, placement: TourCardProps['placement']): CSSProperties {
  const cardWidth = 340
  const margin = 16
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const centerX = rect.left + rect.width / 2

  let top: number
  let left = Math.min(Math.max(centerX - cardWidth / 2, margin), vw - cardWidth - margin)
  let placementUsed = placement || 'bottom'

  // Flip if there isn't room in the requested direction.
  if (placementUsed === 'bottom' && rect.top + rect.height + 220 > vh) placementUsed = 'top'
  if (placementUsed === 'top' && rect.top - 220 < 0) placementUsed = 'bottom'

  if (placementUsed === 'right' || placementUsed === 'left') {
    top = Math.min(Math.max(rect.top, margin), vh - 260)
    left = placementUsed === 'right'
      ? Math.min(rect.left + rect.width + margin, vw - cardWidth - margin)
      : Math.max(rect.left - cardWidth - margin, margin)
    return { top, left, width: cardWidth }
  }

  top = placementUsed === 'top' ? rect.top - margin : rect.top + rect.height + margin
  return placementUsed === 'top'
    ? { top, left, width: cardWidth, transform: 'translateY(-100%)' }
    : { top, left, width: cardWidth }
}

const TourCard = forwardRef<HTMLDivElement, TourCardProps>(function TourCard(props, ref) {
  const { rect, isMobile, title, description, stepIndex, total, isFirst, isLast, loading, onPrev, onNext, onSkip, onFinish, placement } = props
  const style = isMobile ? {} : computeCardStyle(rect, placement)
  const progressPct = Math.round(((stepIndex + 1) / total) * 100)

  const cardBody = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-love-gradient flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </span>
          <h3 id="tour-step-title" className="font-display font-bold text-[0.95rem] text-white truncate">{title}</h3>
        </div>
        <button
          onClick={onSkip}
          aria-label="Skip product tour"
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p id="tour-step-desc" className="text-[0.83rem] leading-relaxed text-white/85 mb-4">
        {loading ? 'Getting things ready…' : description}
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-white/60">Step {stepIndex + 1} of {total}</span>
          <span className="text-[11px] font-semibold text-white/60">{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-from, #ec4899), var(--color-brand-to, #f43f5e))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSkip}
          className="text-[12px] font-semibold text-white/60 hover:text-white transition-colors mr-auto"
        >
          Skip tour
        </button>
        {!isFirst && (
          <button
            onClick={onPrev}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 text-white text-[12px] font-bold hover:bg-white/15 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <button
          onClick={isLast ? onFinish : onNext}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-love-gradient text-white text-[12px] font-bold shadow-lg shadow-pink-500/25 hover:opacity-90 transition-opacity"
        >
          {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </>
  )

  const glass = 'backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/50 rounded-2xl p-4'

  if (isMobile) {
    return (
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        aria-describedby="tour-step-desc"
        tabIndex={-1}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className={`absolute inset-x-3 bottom-3 pointer-events-auto ${glass}`}
      >
        {cardBody}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-desc"
      tabIndex={-1}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`absolute pointer-events-auto ${glass}`}
      style={style}
    >
      {cardBody}
    </motion.div>
  )
})
