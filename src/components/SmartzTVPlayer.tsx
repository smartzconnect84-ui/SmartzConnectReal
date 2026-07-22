/**
 * SmartzTVPlayer — YouTube-backed video player for SmartzTV.
 *
 * Accepts either:
 *   - `videoId`  — YouTube video/broadcast ID → embedded via iframe
 *   - `videoUrl` — Raw MP4/HLS URL           → native <video> element (VOD replays)
 *
 * Architecture note: the player is provider-agnostic at the interface level.
 * YouTubeProvider.getEmbedUrl() converts the videoId to the final iframe URL.
 * Swap providers in src/lib/streaming/index.ts without touching this component.
 */
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Loader2,
  AlertCircle, Antenna, Eye, ExternalLink,
} from 'lucide-react'
import { youtubeProvider } from '@/lib/streaming'

interface SmartzTVPlayerProps {
  /** YouTube video/broadcast ID (preferred for live streams) */
  videoId?: string | null
  /** YouTube channel ID — used as fallback when videoId is unknown (embeds /live_stream) */
  channelId?: string | null
  /** Raw video URL for VOD/replay playback via native <video> */
  videoUrl?: string | null
  /** Poster / thumbnail image */
  poster?: string | null
  isLive: boolean
  title?: string
  viewerCount?: number
  accentColor?: string
  /** Allow admins to open stream in YouTube Studio */
  showStudioLink?: boolean
}

type PlayerStatus = 'loading' | 'playing' | 'paused' | 'error'

export default function SmartzTVPlayer({
  videoId,
  channelId,
  videoUrl,
  poster,
  isLive,
  title,
  viewerCount = 0,
  accentColor = '#8b5cf6',
  showStudioLink = false,
}: SmartzTVPlayerProps) {
  const iframeRef   = useRef<HTMLIFrameElement>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus]           = useState<PlayerStatus>('loading')
  const [muted, setMuted]             = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [iframeReady, setIframeReady]  = useState(false)

  // Determine which embed to use
  const embedUrl = (() => {
    if (videoId) return youtubeProvider.getEmbedUrl(videoId, { autoplay: true, muted })
    if (channelId) return youtubeProvider.getChannelLiveEmbedUrl(channelId, { autoplay: true, muted })
    return null
  })()

  const isYouTube = !!(videoId || channelId)

  // Reset on source change
  useEffect(() => {
    setStatus('loading')
    setIframeReady(false)
  }, [videoId, channelId, videoUrl])

  // Native video element events (VOD replays)
  useEffect(() => {
    const el = videoRef.current
    if (!el || isYouTube) return
    const onPlaying = () => setStatus('playing')
    const onPause   = () => setStatus(s => s === 'error' ? s : 'paused')
    const onError   = () => setStatus('error')
    const onWaiting = () => setStatus(s => s === 'playing' ? s : 'loading')
    el.addEventListener('playing', onPlaying)
    el.addEventListener('pause',   onPause)
    el.addEventListener('error',   onError)
    el.addEventListener('waiting', onWaiting)
    return () => {
      el.removeEventListener('playing', onPlaying)
      el.removeEventListener('pause',   onPause)
      el.removeEventListener('error',   onError)
      el.removeEventListener('waiting', onWaiting)
    }
  }, [videoUrl, isYouTube])

  // Auto-hide controls
  const wake = () => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(
      () => setShowControls(s => status === 'playing' ? false : s),
      2800,
    )
  }

  useEffect(() => {
    wake()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePlay = () => {
    if (isYouTube) return  // YouTube player has its own controls
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play?.().catch(() => {})
    else el.pause?.()
    wake()
  }

  const toggleMute = () => {
    if (isYouTube) {
      // YouTube iframes: toggle by reloading with new muted param
      setMuted(m => !m)
      setIframeReady(false)
      setStatus('loading')
      return
    }
    const el = videoRef.current
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

  // Nothing to play
  if (!embedUrl && !videoUrl) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 bg-gradient-to-br from-[#0e0720] via-[#160830] to-[#1a0a35] flex flex-col items-center justify-center text-center px-6 gap-3">
        <Antenna className="w-10 h-10 text-white/20" />
        <p className="text-sm text-white/50 font-semibold">No broadcast configured</p>
        <p className="text-xs text-white/30">Set a YouTube Video ID in the channel settings to go live.</p>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-black select-none"
      style={{ boxShadow: `0 20px 60px -20px ${accentColor}40` }}
      onMouseMove={wake}
      onClick={isYouTube ? undefined : togglePlay}
    >
      {/* ── YouTube iframe embed ── */}
      {isYouTube && embedUrl && (
        <iframe
          ref={iframeRef}
          key={embedUrl}  // remount on URL change (e.g. mute toggle)
          src={embedUrl}
          title={title || 'SmartzTV Live'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          onLoad={() => {
            setIframeReady(true)
            setStatus('playing')
          }}
          onError={() => setStatus('error')}
        />
      )}

      {/* ── Native video for VOD / replay ── */}
      {!isYouTube && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster || undefined}
          autoPlay
          muted={muted}
          playsInline
          loop
          className="w-full h-full object-cover"
        />
      )}

      {/* ── Loading overlay (shown until iframe fires onLoad) ── */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 pointer-events-none z-10">
          {poster && (
            <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <Loader2 className="w-8 h-8 animate-spin relative z-10" style={{ color: accentColor }} />
          <p className="text-xs text-white/50 relative z-10">
            {isYouTube ? 'Loading YouTube stream…' : 'Buffering…'}
          </p>
        </div>
      )}

      {/* ── Error overlay ── */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 px-6 text-center pointer-events-none z-10">
          <AlertCircle className="w-10 h-10 text-amber-400/60" />
          <p className="text-sm text-white/70 font-semibold">Playback unavailable</p>
          <p className="text-xs text-white/40">Check back in a moment.</p>
        </div>
      )}

      {/* ── Top badges ── */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-20">
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

      {/* ── Studio link (admins only) ── */}
      {showStudioLink && videoId && (
        <div className="absolute top-3 right-3 z-20">
          <a
            href={`https://studio.youtube.com/video/${videoId}/livestreaming`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white/70 text-[11px] font-semibold backdrop-blur-sm border border-white/10 hover:bg-red-600/80 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Studio
          </a>
        </div>
      )}

      {/* ── VOD controls (non-YouTube only) ── */}
      {!isYouTube && (
        <>
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

          <AnimatePresence>
            {showControls && status !== 'loading' && status !== 'error' && (
              <motion.div
                key="control-bar"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                onClick={e => e.stopPropagation()}
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
        </>
      )}

      {/* ── YouTube mute/fullscreen overlay controls ── */}
      {isYouTube && iframeReady && (
        <AnimatePresence>
          {showControls && (
            <motion.div
              key="yt-bar"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-3 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-20 pointer-events-none"
            >
              <button
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-colors border border-white/10"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="flex-1" />
              <button
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
                className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-colors border border-white/10"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
