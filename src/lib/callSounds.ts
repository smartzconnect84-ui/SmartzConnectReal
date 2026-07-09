/**
 * Call sound effects — synthesized via Web Audio API.
 * No external audio files needed.
 *
 * Ringing uses a cancel-token pattern so that any in-flight resume().then()
 * callback becomes a no-op the moment stopRinging() or a newer startRinging()
 * is called, preventing phantom ringing.
 */

let _ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return _ctx
}

function resume(): Promise<void> {
  return getCtx().resume().catch(() => {})
}

/** Play a single synthesized tone burst */
function tone(
  freq: number,
  duration: number,
  gain = 0.28,
  type: OscillatorType = 'sine',
  startOffset = 0,
) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset)
  gainNode.gain.setValueAtTime(0, ctx.currentTime + startOffset)
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startOffset + 0.015)
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startOffset + duration - 0.02)
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startOffset + duration)
  osc.start(ctx.currentTime + startOffset)
  osc.stop(ctx.currentTime + startOffset + duration + 0.01)
}

// ── Ringing — North-American dual-tone (440 Hz + 480 Hz), 2 s on / 4 s off ──

let _ringToken = 0          // monotonic counter — incremented on every stop
let _ringTimer: ReturnType<typeof setInterval> | null = null
/** Gain nodes for oscillators in the current burst — stopped immediately on cancel */
let _activeRingGains: GainNode[] = []

function _ringBurst() {
  const ctx = getCtx()
  const RING_DURATION = 1.8

  // Immediately silence any still-fading nodes from the previous burst
  for (const g of _activeRingGains) {
    try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(0, ctx.currentTime) } catch { /* ignore */ }
  }
  _activeRingGains = []

  ;[440, 480].forEach(freq => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g)
    g.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05)
    g.gain.setValueAtTime(0.18, ctx.currentTime + RING_DURATION - 0.05)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + RING_DURATION)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + RING_DURATION + 0.01)
    _activeRingGains.push(g)
  })
}

export function startRinging(): void {
  // Cancel any pending or active ringing first
  stopRinging()

  // Take a snapshot of the token; if it changes before resume resolves, abort
  const token = ++_ringToken
  resume().then(() => {
    if (_ringToken !== token) return   // stop was called while we were resuming
    _ringBurst()
    _ringTimer = setInterval(() => {
      if (_ringToken !== token) { clearInterval(_ringTimer!); _ringTimer = null; return }
      _ringBurst()
    }, 5500) // 2 s ring, 3.5 s silence
  })
}

export function stopRinging(): void {
  // Bump the token so any in-flight resume().then() callbacks become no-ops
  _ringToken++

  if (_ringTimer !== null) {
    clearInterval(_ringTimer)
    _ringTimer = null
  }

  // Immediately silence any ringing oscillator gain nodes
  if (_activeRingGains.length && _ctx) {
    const ctx = _ctx
    for (const g of _activeRingGains) {
      try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(0, ctx.currentTime) } catch { /* ignore */ }
    }
    _activeRingGains = []
  }
}

// ── Connected — ascending chime (C5 → E5 → G5) ────────────────────────────

export function playConnected(): void {
  stopRinging()
  resume().then(() => {
    tone(523.25, 0.14, 0.3, 'sine', 0)     // C5
    tone(659.25, 0.14, 0.3, 'sine', 0.14)  // E5
    tone(783.99, 0.22, 0.32, 'sine', 0.28) // G5
  })
}

// ── Call ended — descending chime (G4 → E4 → C4) ──────────────────────────

export function playCallEnded(): void {
  stopRinging()
  resume().then(() => {
    tone(392.00, 0.14, 0.28, 'sine', 0)     // G4
    tone(329.63, 0.14, 0.28, 'sine', 0.16)  // E4
    tone(261.63, 0.22, 0.28, 'sine', 0.32)  // C4
  })
}

// ── Mute toggle — short UI click ─────────────────────────────────────────

export function playMuteToggle(muting: boolean): void {
  resume().then(() => {
    tone(muting ? 600 : 900, 0.05, 0.15, 'square', 0)
  })
}
