import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Sparkles, Volume2 } from 'lucide-react'
import { useTour } from '@/contexts/TourContext'
import { waitForTourTarget, scrollElementIntoView } from '@/lib/tourDom'

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 10

// Speech-bubble tail direction based on placement
type Tail = 'top' | 'bottom' | 'left' | 'right' | 'none'

export default function TourOverlay() {
  const { isActive, currentStep, stepIndex, total, next, prev, skip, finish } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const [rect, setRect] = useState<Rect | null>(null)
  const [phase, setPhase] = useState<'navigating' | 'locating' | 'ready'>('navigating')
  const [tailDir, setTailDir] = useState<Tail>('none')
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!isActive || !currentStep) return
    let cancelled = false
    setPhase('navigating')
    setRect(null)
    setTailDir('none')

    const run = async () => {
      if (currentStep.route && location.pathname !== currentStep.route) {
        navigate(currentStep.route)
        await new Promise(r => setTimeout(r, 60))
      }
      if (cancelled) return
      setPhase('locating')

      if (!currentStep.target) { if (!cancelled) setPhase('ready'); return }

      const el = await waitForTourTarget(currentStep.target)
      if (cancelled) return
      if (!el) { setPhase('ready'); return }

      scrollElementIntoView(el)
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

  // Compute tail direction after rect is known
  useEffect(() => {
    if (!rect || !cardRef.current) { setTailDir('none'); return }
    const placement = currentStep?.placement
    const vw = window.innerWidth
    const vh = window.innerHeight
    let dir: Tail = 'none'

    if (placement === 'bottom' || (!placement && rect.top + rect.height + 220 <= vh)) {
      dir = 'top' // tail points up toward the element (card is below)
    } else if (placement === 'top') {
      dir = 'bottom'
    } else if (placement === 'right') {
      dir = 'left'
    } else if (placement === 'left') {
      dir = 'right'
    }
    setTailDir(dir)
  }, [rect, currentStep?.placement])

  useLayoutEffect(() => {
    if (isActive && phase === 'ready') cardRef.current?.focus()
  }, [isActive, phase, currentStep?.id])

  useEffect(() => {
    if (!isActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); skip() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'Tab' && cardRef.current) {
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
      {/* Dim backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-[#0A0710]/0"
        style={!showSpotlight ? { backgroundColor: 'rgba(10,7,16,0.72)', backdropFilter: 'blur(2px)' } : undefined}
      />

      {/* Spotlight ring */}
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

      {/* Speech bubble tooltip */}
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
          tailDir={tailDir}
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

// Typewriter effect hook
function useTypewriter(text: string, speed = 18, active = true) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) { setDisplayed(text); setDone(true); return }
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, active]) // eslint-disable-line react-hooks/exhaustive-deps

  return { displayed, done }
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
  tailDir: Tail
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
  onFinish: () => void
}

const CARD_WIDTH = 320
const MARGIN = 14

function computeCardStyle(rect: Rect | null, placement: TourCardProps['placement']): { style: CSSProperties; tailDir: Tail } {
  if (!rect) return { style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, tailDir: 'none' }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const centerX = rect.left + rect.width / 2

  let top: number
  let left = Math.min(Math.max(centerX - CARD_WIDTH / 2, MARGIN), vw - CARD_WIDTH - MARGIN)
  let placementUsed = placement || 'bottom'
  let tailDir: Tail = 'none'

  if (placementUsed === 'bottom' && rect.top + rect.height + 240 > vh) placementUsed = 'top'
  if (placementUsed === 'top' && rect.top - 240 < 0) placementUsed = 'bottom'

  if (placementUsed === 'right' || placementUsed === 'left') {
    top = Math.min(Math.max(rect.top, MARGIN), vh - 280)
    left = placementUsed === 'right'
      ? Math.min(rect.left + rect.width + MARGIN, vw - CARD_WIDTH - MARGIN)
      : Math.max(rect.left - CARD_WIDTH - MARGIN, MARGIN)
    tailDir = placementUsed === 'right' ? 'left' : 'right'
    return { style: { top, left, width: CARD_WIDTH }, tailDir }
  }

  if (placementUsed === 'top') {
    top = rect.top - MARGIN
    tailDir = 'bottom'
    return { style: { top, left, width: CARD_WIDTH, transform: 'translateY(-100%)' }, tailDir }
  }

  // bottom
  top = rect.top + rect.height + MARGIN
  tailDir = 'top'
  return { style: { top, left, width: CARD_WIDTH }, tailDir }
}

const TourCard = forwardRef<HTMLDivElement, TourCardProps>(function TourCard(props, ref) {
  const { rect, isMobile, title, description, stepIndex, total, isFirst, isLast, loading, onPrev, onNext, onSkip, onFinish, placement } = props
  const { style, tailDir: computedTail } = isMobile ? { style: {}, tailDir: 'none' as Tail } : computeCardStyle(rect, placement)
  const progressPct = Math.round(((stepIndex + 1) / total) * 100)

  const { displayed, done } = useTypewriter(loading ? 'Getting things ready…' : description, 16, !loading)

  // Tail CSS — a small triangle pointing from the bubble toward the element
  const tailStyle = (dir: Tail): CSSProperties => {
    const accent = 'var(--color-accent, #ec4899)'
    const base: CSSProperties = {
      content: "''",
      position: 'absolute',
      width: 0,
      height: 0,
    }
    if (dir === 'top') return { ...base, top: -10, left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: `10px solid ${accent}` }
    if (dir === 'bottom') return { ...base, bottom: -10, left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `10px solid ${accent}` }
    if (dir === 'left') return { ...base, left: -10, top: '30%', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: `10px solid ${accent}` }
    if (dir === 'right') return { ...base, right: -10, top: '30%', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: `10px solid ${accent}` }
    return {}
  }

  const activeTail = isMobile ? 'none' : (props.tailDir !== 'none' ? props.tailDir : computedTail)

  const cardBody = (
    <>
      {/* Speech-bubble tail */}
      {activeTail !== 'none' && !isMobile && (
        <div style={{ ...tailStyle(activeTail), position: 'absolute', zIndex: 1 }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <motion.span
            className="w-8 h-8 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            <Volume2 className="w-4 h-4 text-white" />
          </motion.span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">SmartzConnect</p>
            <h3 id="tour-step-title" className="font-display font-black text-[0.92rem] text-white leading-tight">{title}</h3>
          </div>
        </div>
        <button
          onClick={onSkip}
          aria-label="Skip product tour"
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Typewriter description */}
      <div className="min-h-[56px] mb-4">
        <p id="tour-step-desc" className="text-[0.82rem] leading-relaxed text-white/85">
          {displayed}
          {!done && <span className="inline-block w-0.5 h-3.5 bg-pink-400 ml-0.5 animate-pulse align-middle" />}
        </p>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === stepIndex ? 20 : 6, opacity: i === stepIndex ? 1 : 0.3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="h-1.5 rounded-full"
            style={{ background: i === stepIndex ? 'var(--color-accent, #ec4899)' : 'rgba(255,255,255,0.3)' }}
          />
        ))}
        <span className="ml-auto text-[10px] font-semibold text-white/40">{stepIndex + 1}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-from, #ec4899), var(--color-brand-to, #f43f5e))' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSkip}
          className="text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors mr-auto"
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
        <motion.button
          onClick={isLast ? onFinish : onNext}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-love-gradient text-white text-[12px] font-bold shadow-lg shadow-pink-500/30 hover:opacity-90 transition-opacity"
        >
          {isLast ? (
            <><Sparkles className="w-3.5 h-3.5" /> Done!</>
          ) : (
            <>Next <ChevronRight className="w-3.5 h-3.5" /></>
          )}
        </motion.button>
      </div>
    </>
  )

  const glass = 'backdrop-blur-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/20 shadow-2xl shadow-black/60 rounded-2xl p-4 relative overflow-visible'

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
      initial={{ opacity: 0, scale: 0.88, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: -8 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={`absolute pointer-events-auto ${glass}`}
      style={style}
    >
      {cardBody}
    </motion.div>
  )
})
