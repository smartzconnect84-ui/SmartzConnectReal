import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TOUR_STEPS, type TourStep } from '@/lib/tourSteps'

interface TourContextType {
  isActive: boolean
  steps: TourStep[]
  stepIndex: number
  currentStep: TourStep | null
  total: number
  loadingCompletionStatus: boolean
  /** Start the tour. `restart` clears the previous completion flag first. */
  startTour: (opts?: { restart?: boolean }) => void
  next: () => void
  prev: () => void
  skip: () => void
  finish: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

const LOCAL_KEY_PREFIX = 'szc_tour_completed:'

export function TourProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [completed, setCompleted] = useState<boolean | null>(null) // null = unknown yet
  const autoStartedRef = useRef(false)

  const steps = useMemo(
    () => TOUR_STEPS.filter(s => !s.roles || s.roles.includes(role)),
    [role],
  )

  // ── Resolve completion status: fast localStorage read first, then confirm
  // against the DB (source of truth across devices). ──────────────────────
  useEffect(() => {
    if (!user?.id) { setCompleted(null); return }
    const localVal = localStorage.getItem(LOCAL_KEY_PREFIX + user.id)
    if (localVal === '1') setCompleted(true)

    let mounted = true
    supabase
      .from('profiles')
      .select('tour_completed')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          // Transient failure — fall back to whatever localStorage said (or
          // false, so the tour can still run offline-first).
          setCompleted(prev => prev ?? (localVal === '1'))
          return
        }
        const done = !!data?.tour_completed
        setCompleted(done)
        localStorage.setItem(LOCAL_KEY_PREFIX + user.id, done ? '1' : '0')
      })

    return () => { mounted = false }
  }, [user?.id])

  const persistCompletion = useCallback(async (done: boolean) => {
    if (!user?.id) return
    localStorage.setItem(LOCAL_KEY_PREFIX + user.id, done ? '1' : '0')
    setCompleted(done)
    try {
      await supabase.from('profiles').update({ tour_completed: done }).eq('id', user.id)
    } catch {
      // Non-fatal — localStorage already reflects the intent; DB will
      // reconcile next time the profile is fetched successfully.
    }
  }, [user?.id])

  const startTour = useCallback((opts?: { restart?: boolean }) => {
    setStepIndex(0)
    setIsActive(true)
    if (opts?.restart) persistCompletion(false)
  }, [persistCompletion])

  // Auto-launch once per session for first-time users, after their
  // completion status is known and it's confirmed `false`.
  useEffect(() => {
    if (autoStartedRef.current) return
    if (!user?.id) return
    if (completed !== false) return
    autoStartedRef.current = true
    const t = setTimeout(() => startTour(), 900)
    return () => clearTimeout(t)
  }, [user?.id, completed, startTour])

  const stop = useCallback(() => {
    setIsActive(false)
    setStepIndex(0)
  }, [])

  const finish = useCallback(() => {
    stop()
    persistCompletion(true)
  }, [stop, persistCompletion])

  const skip = useCallback(() => {
    stop()
    persistCompletion(true)
  }, [stop, persistCompletion])

  const next = useCallback(() => {
    setStepIndex(i => {
      if (i + 1 >= steps.length) {
        finish()
        return i
      }
      return i + 1
    })
  }, [steps.length, finish])

  const prev = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  const currentStep = isActive ? (steps[stepIndex] ?? null) : null

  return (
    <TourContext.Provider value={{
      isActive, steps, stepIndex, currentStep, total: steps.length,
      loadingCompletionStatus: completed === null,
      startTour, next, prev, skip, finish,
    }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within a TourProvider')
  return ctx
}
