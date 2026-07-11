/**
 * AnimatedStat — counts up from 0 to the target value when scrolled into view.
 * Parses values like "15K+", "195+", "1K+", "3★", "10M+" automatically.
 */
import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedStatProps {
  value: string          // e.g. "15K+", "195+", "3★", "10M+"
  label: string
  className?: string
  valueClass?: string
  labelClass?: string
  duration?: number      // animation duration in ms
  delay?: number         // delay before starting in ms
}

function parseValue(raw: string): { num: number; suffix: string } {
  const m = raw.match(/^(\d+\.?\d*)(.*)$/)
  if (!m) return { num: 0, suffix: raw }
  return { num: parseFloat(m[1]), suffix: m[2] }
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export default function AnimatedStat({
  value,
  label,
  className = '',
  valueClass = '',
  labelClass = '',
  duration = 1800,
  delay = 0,
}: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })
  const [displayed, setDisplayed] = useState(() => {
    const { suffix } = parseValue(value)
    return `0${suffix}`
  })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true

    const { num, suffix } = parseValue(value)
    if (num === 0) { setDisplayed(value); return }

    let frameId: number
    const startAfterDelay = () => {
      let startTs: number | null = null
      const tick = (ts: number) => {
        if (!startTs) startTs = ts
        const progress = Math.min((ts - startTs) / duration, 1)
        const eased = easeOutExpo(progress)
        const current = Math.floor(eased * num)
        setDisplayed(`${current}${suffix}`)
        if (progress < 1) {
          frameId = requestAnimationFrame(tick)
        } else {
          setDisplayed(value) // snap to exact final value
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    const t = delay > 0 ? setTimeout(startAfterDelay, delay) : undefined
    if (delay === 0) startAfterDelay()

    return () => {
      clearTimeout(t)
      cancelAnimationFrame(frameId)
    }
  }, [inView, value, duration, delay])

  return (
    <div ref={ref} className={className}>
      <p className={valueClass}>{displayed}</p>
      <p className={labelClass}>{label}</p>
    </div>
  )
}
