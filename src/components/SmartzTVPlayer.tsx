import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2, AlertCircle, Antenna, Eye } from 'lucide-react'
import MuxPlayer from '@mux/mux-player-react'

/**
 * Modern, brand-styled watch player for SmartzTV.
 * - `playbackId` → live Mux HLS stream (click-to-play/pause, muted-autoplay by default)
 * - `videoUrl`   → recorded/VOD playback via a plain <video> element ("watch it after")
 * Exactly one of the two should be supplied.
 */
interface SmartzTVPlayerProps {
  playbackId?: string | null
  videoUrl?: string | null
  poster?: string | null
  isLive: boolean
  title?: string
  viewerCount?: number
  accentColor?: string
}

type PlayerStatus = 'loading' | 'playing' | 'paused' | 'error'

export default function SmartzTVPlayer({
  playbackId, videoUrl, poster, isLive, title, viewerCount = 0, accentColor = '#8b5cf6',
}: SmartzTVPlayerProps) {
  const muxRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus] = useState<PlayerStatus>('loading')
  const [muted, setMuted] = useState(true)
  const [showControls, setShowControls] = useState(true)

  const activeEl = (): (HTMLMediaElement & { paused: boolean }) | null =>
    playbackId ? muxRef.current : videoRef.current

  useEffect(() => { setStatus('loading') }, [playbackId, videoUrl])

  useEffect(() => {
    const el = activeEl()
    if (!el) return
    const onPlaying = () => setStatus('playing')
    const onPause = () => setStatus(s => (s === 'error' ? s : 'paused'))
    const onError = () => setStatus('error')
    const onWaiting = () => setStatus(s => (s === 'playing' ? s : 'loading'))
    el.addEventListener('playing', onPlaying)
    el.addEventListener('pause', onPause)
    el.addEventListener('error', onError)
    el.addEventListener('waiting', onWaiting)
    return () => {
      el.removeEventListener('playing', onPlaying)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('error', onError)
      el.removeEventListener('waiting', onWaiting)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackId, videoUrl])

  const wake = () => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(s => (status === 'playing' ? false : s)), 2800)
  }

  useEffect(() => {
    wake()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePlay = () => {
    const el = activeEl()
    if (!el) return
    if (el.paused) void el.play?.().catch(() => {})
    else el.pause?.()
    wake()
  }

  const toggleMute = () => {
    const el = activeEl()
    setMuted(m => {
      const next = !m
      if (el) el.muted = next
      return next
    })
    wake()
  }

  const toggleFullscreen = () => {
    const wrap = wrapRef.current
    if (!wrap) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else wrap.requestFullscreen?.()
    wake()
  }

  if (!playbackId && !videoUrl) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 bg-gradient-to-br from-[#0e0720] via-[#160830] to-[#1a0a35] flex flex-col items-center justify-center text-center px-6">
        <Antenna className="w-10 h-10 text-white/20 mb-3" />
        <p className="text-sm text-white/50 font-semibold">Nothing to play yet</p>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-black select-none"
      style={{ boxShadow: `0 20px 60px -20px ${accentColor}40` }}
      onMouseMove={wake}
      onClick={togglePlay}
    >
      {playbackId ? (
        <MuxPlayer
          ref={muxRef}
          streamType="live"
          playbackId={playbackId}
          autoPlay="muted"
          muted={muted}
          playsInline
          primaryColor="#ffffff"
          accentColor={accentColor}
          poster={poster || undefined}
          metadata={{ video_title: title || 'SmartzTV', viewer_user_id: 'anonymous' }}
          style={{ width: '100%', height: '100%', '--controls': 'none' } as any}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          poster={poster || undefined}
          autoPlay
          muted={muted}
          playsInline
          loop
          className="w-full h-full object-cover"
        />
      )}

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 pointer-events-none z-10">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center pointer-events-none z-10">
          <AlertCircle className="w-10 h-10 text-amber-400/60" />
          <p className="text-sm text-white/70 font-semibold">Playback unavailable</p>
          <p className="text-xs text-white/40">Check back in a moment.</p>
        </div>
      )}

      {/* Top badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
        {isLive ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-black shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-bold backdrop-blur-sm border border-white/10">
            REPLAY
          </span>
        )}
        {viewerCount > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] backdrop-blur-sm">
            <Eye className="w-3 h-3" /> {viewerCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Center play/pause */}
      <AnimatePresence>
        {status !== 'loading' && status !== 'error' && (showControls || status === 'paused') && (
          <motion.button
            key="center-toggle"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            aria-label={status === 'paused' ? 'Play' : 'Pause'}
            className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white z-20"
            style={{ background: `linear-gradient(135deg, ${accentColor}, rgba(0,0,0,0.55))`, backdropFilter: 'blur(6px)', boxShadow: `0 8px 30px ${accentColor}66` }}
          >
            {status === 'paused'
              ? <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" fill="white" />
              : <Pause className="w-6 h-6 sm:w-7 sm:h-7" fill="white" />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom control bar */}
      <AnimatePresence>
        {showControls && status !== 'loading' && status !== 'error' && (
          <motion.div
            key="control-bar"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-3 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-20"
          >
            <button onClick={togglePlay} aria-label={status === 'paused' ? 'Play' : 'Pause'}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
              {status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="flex-1" />
            <button onClick={toggleFullscreen} aria-label="Fullscreen"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
