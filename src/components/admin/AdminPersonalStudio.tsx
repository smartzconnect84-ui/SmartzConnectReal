import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio, Video, VideoOff, Mic, MicOff, PhoneOff, Eye,
  Users, Monitor, MonitorOff, Loader2, AlertCircle, Camera,
  Play, Square, Info, CheckCircle, X, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Room, RoomEvent, Track, type LocalParticipant, type RemoteParticipant } from 'livekit-client'
import { notifyUser } from '@/lib/notify'

// ─── helpers ──────────────────────────────────────────────────────────────────

function attachTrack(participant: LocalParticipant, el: HTMLDivElement | null) {
  if (!el) return
  el.innerHTML = ''
  participant.videoTrackPublications.forEach(pub => {
    if (pub.track && pub.kind === Track.Kind.Video) {
      const v = pub.track.attach()
      v.className = 'w-full h-full object-cover'
      el.appendChild(v)
    }
  })
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ─── types ────────────────────────────────────────────────────────────────────

type StudioStage = 'idle' | 'previewing' | 'live'

// ─── LOCAL PREVIEW (camera/mic only, NOT connected to LiveKit) ───────────────

function LocalPreview({ videoRef }: { videoRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div ref={videoRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AdminPersonalStudio() {
  const { user } = useAuth()

  const [stage, setStage] = useState<StudioStage>('idle')
  const [streamTitle, setStreamTitle] = useState('')
  const [streamCategory, setStreamCategory] = useState('General')
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [viewers, setViewers] = useState(0)
  const [duration, setDuration] = useState(0)
  const [guests, setGuests] = useState<RemoteParticipant[]>([])
  const [error, setError] = useState('')
  const [goingLive, setGoingLive] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLDivElement>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const roomRef = useRef<Room | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Preview stage: just capture local camera/mic, show to admin only ────────
  const startPreview = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      previewStreamRef.current = stream
      // Attach to the preview div
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = ''
        const videoEl = document.createElement('video')
        videoEl.srcObject = stream
        videoEl.autoplay = true
        videoEl.muted = true // muted for self-monitor (no echo)
        videoEl.playsInline = true
        videoEl.className = 'w-full h-full object-cover'
        localVideoRef.current.appendChild(videoEl)
      }
      setStage('previewing')
    } catch (e: any) {
      setError(e?.message || 'Could not access camera/mic. Please allow permissions.')
    }
  }, [])

  // ── Stop preview, tear down local tracks ────────────────────────────────────
  const stopPreview = useCallback(() => {
    previewStreamRef.current?.getTracks().forEach(t => t.stop())
    previewStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.innerHTML = ''
    setStage('idle')
    setError('')
  }, [])

  // ── Go Live: create DB row + connect to LiveKit ──────────────────────────────
  const handleGoLive = useCallback(async () => {
    if (!user?.id || !streamTitle.trim()) return
    setGoingLive(true)
    setError('')

    try {
      // Stop local preview stream (LiveKit will take over the camera/mic)
      previewStreamRef.current?.getTracks().forEach(t => t.stop())
      previewStreamRef.current = null

      // 1. Create livestreams row — is_admin_broadcast = FALSE (personal stream)
      const { data: row, error: insertErr } = await supabase
        .from('livestreams')
        .insert({
          title: streamTitle.trim(),
          category: streamCategory,
          creator_id: user.id,
          status: 'live',
          moderation_status: 'approved',
          is_admin_created: true,
          is_admin_broadcast: false, // NOT on public SmartzTV
          viewer_count: 0,
        })
        .select('id')
        .single()

      if (insertErr || !row?.id) {
        setError(insertErr?.message || 'Failed to create stream row.')
        setGoingLive(false)
        return
      }

      const newStreamId = String(row.id)
      setStreamId(newStreamId)

      // 2. Fetch LiveKit token
      const { data: tkData, error: tkErr } = await supabase.functions.invoke('livekit-token', {
        body: { room: `personal-${newStreamId}`, name: 'Admin (Personal Studio)' },
      })
      if (tkErr || !tkData?.token || !tkData?.wsUrl) {
        // Roll back: mark ended
        await supabase.from('livestreams').update({ status: 'ended' }).eq('id', newStreamId)
        setError('LiveKit token unavailable — cannot go live.')
        setGoingLive(false)
        return
      }

      // 3. Connect LiveKit room
      const room = new Room({ adaptiveStream: true, dynacast: true })
      roomRef.current = room

      await room.connect(tkData.wsUrl, tkData.token)
      await room.localParticipant.setCameraEnabled(true)
      await room.localParticipant.setMicrophoneEnabled(true)
      attachTrack(room.localParticipant, localVideoRef.current)

      // 4. Sync participant count
      const syncP = () => {
        const remotes: RemoteParticipant[] = []
        room.remoteParticipants.forEach(p => remotes.push(p))
        setGuests(remotes)
        const count = remotes.length
        setViewers(count)
        supabase.from('livestreams').update({ viewer_count: count }).eq('id', newStreamId).then(() => {})
      }
      syncP()
      room.on(RoomEvent.ParticipantConnected, syncP)
      room.on(RoomEvent.ParticipantDisconnected, syncP)
      room.on(RoomEvent.LocalTrackPublished, () => attachTrack(room.localParticipant, localVideoRef.current))

      // 5. Start timer
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

      setStage('live')
    } catch (e: any) {
      setError(e?.message || 'Failed to go live.')
    }
    setGoingLive(false)
  }, [user, streamTitle, streamCategory])

  // ── End broadcast ────────────────────────────────────────────────────────────
  const handleEndBroadcast = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    roomRef.current?.disconnect()
    roomRef.current = null
    previewStreamRef.current?.getTracks().forEach(t => t.stop())
    previewStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.innerHTML = ''
    if (streamId) {
      await supabase.from('livestreams').update({ status: 'ended', viewer_count: 0 }).eq('id', streamId)
    }
    setStage('idle')
    setStreamId(null)
    setDuration(0)
    setViewers(0)
    setGuests([])
    setMuted(false)
    setCameraOff(false)
    setScreenSharing(false)
  }, [streamId])

  const toggleMic = async () => {
    const next = !muted
    setMuted(next)
    if (stage === 'live') {
      await roomRef.current?.localParticipant.setMicrophoneEnabled(!next)
    } else if (stage === 'previewing') {
      previewStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next })
    }
  }

  const toggleCamera = async () => {
    const next = !cameraOff
    setCameraOff(next)
    if (stage === 'live') {
      await roomRef.current?.localParticipant.setCameraEnabled(!next)
      attachTrack(roomRef.current!.localParticipant, localVideoRef.current)
    } else if (stage === 'previewing') {
      previewStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !next })
    }
  }

  const toggleScreen = async () => {
    if (stage !== 'live' || !roomRef.current) return
    try {
      const next = !screenSharing
      await roomRef.current.localParticipant.setScreenShareEnabled(next)
      setScreenSharing(next)
      attachTrack(roomRef.current.localParticipant, localVideoRef.current)
    } catch { /* user cancelled screen pick */ }
  }

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      roomRef.current?.disconnect()
      previewStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const CATEGORIES = ['General', 'News', 'Music', 'Sports', 'Entertainment', 'Education', 'Comedy', 'Tech', 'Fashion', 'Food', 'Kids']

  // ─────────────────────────────── RENDER ──────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Studio header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-black text-lg dark:text-white text-gray-900">
            Studio 2 · Personal Live
          </h2>
          <p className="text-xs dark:text-gray-400 text-gray-500">
            LiveKit-powered · visible to community users · not on public SmartzTV
          </p>
        </div>
        {stage === 'live' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 dark:bg-white/10 text-white text-xs font-mono border border-white/10">
              <Clock className="w-3 h-3" /> {fmt(duration)}
            </span>
          </div>
        )}
        {stage === 'previewing' && (
          <span className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
            <Camera className="w-3 h-3" /> Preview — not live
          </span>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 text-lg leading-none">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IDLE STATE ── */}
      {stage === 'idle' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">

          {/* Info banner */}
          <div className="p-4 bg-gradient-to-r from-pink-900/20 to-rose-900/20 border-b dark:border-white/6 border-gray-100">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold dark:text-white text-gray-900">Personal Live Stream</p>
                <p className="text-xs dark:text-gray-400 text-gray-500">
                  This stream goes directly to community members (same visibility as creator streams).
                  It is <strong className="dark:text-white text-gray-900">NOT</strong> flagged as
                  <code className="mx-1 px-1 rounded bg-white/10 text-[11px]">is_admin_broadcast</code>
                  and will never appear on the public SmartzTV page.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Stream title */}
            <div>
              <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1.5">
                Stream Title *
              </label>
              <input
                value={streamTitle}
                onChange={e => setStreamTitle(e.target.value)}
                placeholder="What are you streaming today?"
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1.5">
                Category
              </label>
              <select
                value={streamCategory}
                onChange={e => setStreamCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Preview / Go Live */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={startPreview}
                disabled={!streamTitle.trim()}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold dark:text-white text-gray-800 flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                Start Preview
              </button>
              <button
                onClick={handleGoLive}
                disabled={!streamTitle.trim() || goingLive}
                className="flex-1 py-3 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all disabled:opacity-40"
              >
                {goingLive
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Going Live…</>
                  : <><Radio className="w-4 h-4" /> Go Live Now</>
                }
              </button>
            </div>

            <p className="text-center text-xs dark:text-gray-500 text-gray-400">
              Use <strong className="dark:text-gray-300 text-gray-600">Start Preview</strong> to check camera/mic before going live.
              Viewers cannot see the preview.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── PREVIEW STATE ── */}
      {stage === 'previewing' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 overflow-hidden">

          {/* Preview video */}
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            <LocalPreview videoRef={localVideoRef as React.RefObject<HTMLDivElement>} />

            {/* Overlay badge */}
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 text-white text-xs font-black backdrop-blur-sm">
                <Camera className="w-3 h-3" /> PREVIEW — Not Broadcasting
              </span>
            </div>

            {/* Camera off overlay */}
            {cameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs dark:text-gray-400 text-gray-500 flex-1">
                Camera and mic are active — <strong className="dark:text-white text-gray-900">only you</strong> can see/hear this.
              </p>
            </div>

            {/* Device controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMic}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200'}`}
              >
                {muted ? <MicOff className="w-5 h-5 dark:text-white text-white" /> : <Mic className="w-5 h-5 dark:text-white text-gray-700" />}
              </button>
              <button
                onClick={toggleCamera}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${cameraOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200'}`}
              >
                {cameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 dark:text-white text-gray-700" />}
              </button>
              <div className="flex-1" />
              <button
                onClick={stopPreview}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:bg-red-500/10 hover:text-red-500 transition-all border dark:border-white/8 border-gray-200"
              >
                <Square className="w-3.5 h-3.5" /> Stop Preview
              </button>
              <button
                onClick={handleGoLive}
                disabled={goingLive}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {goingLive
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Going Live…</>
                  : <><Play className="w-4 h-4" /> Go Live</>
                }
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── LIVE STATE ── */}
      {stage === 'live' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="dark:bg-[#0A0510] bg-gray-950 rounded-2xl border border-red-500/20 overflow-hidden shadow-2xl shadow-red-500/10">

          {/* Live video */}
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            <div ref={localVideoRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-mono backdrop-blur-sm">
                  {fmt(duration)}
                </span>
                {screenSharing && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Screen
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {viewers}
                </span>
                {guests.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                    <Users className="w-3 h-3" /> {guests.length}
                  </span>
                )}
              </div>
            </div>

            {/* Title bar */}
            <div className="absolute bottom-[72px] left-3 right-3">
              <p className="text-white font-bold text-sm truncate drop-shadow-lg">{streamTitle}</p>
              <p className="text-white/50 text-[11px]">Personal Live · Community Only</p>
            </div>

            {/* Camera off overlay */}
            {cameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-5 py-4 dark:bg-[#08050F] bg-gray-900 border-t border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {cameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={toggleScreen}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${screenSharing ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* End broadcast */}
            <button
              onClick={handleEndBroadcast}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
              title="End Broadcast"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-2 opacity-0 pointer-events-none">
              {/* spacer to balance flex layout */}
              <div className="w-12 h-12" />
              <div className="w-12 h-12" />
              <div className="w-12 h-12" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Info note when idle */}
      {stage === 'idle' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl dark:bg-white/3 bg-gray-50 border dark:border-white/6 border-gray-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold dark:text-white text-gray-900">How Studio 2 works</p>
            <ul className="text-xs dark:text-gray-400 text-gray-500 space-y-0.5 list-disc list-inside">
              <li>Click <strong className="dark:text-gray-300">Start Preview</strong> to test camera and mic — no viewers yet</li>
              <li>Click <strong className="dark:text-gray-300">Go Live</strong> to publish to the community livestream feed</li>
              <li>Stream appears in the community feed with <code className="text-[11px] px-1 rounded dark:bg-white/8 bg-gray-100">is_admin_broadcast = false</code></li>
              <li>It will <em>never</em> appear on the public /smartztv page</li>
              <li>Click the red button to end and mark stream as ended in DB</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
