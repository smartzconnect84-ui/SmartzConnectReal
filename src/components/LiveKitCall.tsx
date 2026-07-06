import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2,
  Wifi, WifiOff, MonitorUp, PhoneIncoming,
} from 'lucide-react'
import {
  Room, RoomEvent, Track, ConnectionQuality,
  type RemoteParticipant, type LocalParticipant,
} from 'livekit-client'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { supabase } from '@/lib/supabase'

function attachTrack(participant: LocalParticipant | RemoteParticipant, el: HTMLDivElement | null) {
  if (!el) return
  el.innerHTML = ''
  participant.videoTrackPublications.forEach(pub => {
    if (pub.track && pub.kind === Track.Kind.Video) {
      const track = pub.track.attach()
      track.className = 'w-full h-full object-cover'
      el.appendChild(track)
    }
  })
}

export default function LiveKitCall() {
  const { activeCall, endCall, callDeclined, dismissDeclined } = useLiveKitCall()
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<Room | null>(null)
  const videoCallRowRef = useRef<string | null>(null)  // video_calls.id
  const callStartRef = useRef<number>(0)

  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [duration, setDuration] = useState(0)
  const [connected, setConnected] = useState(false)
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown)
  const [remoteJoined, setRemoteJoined] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset UI state whenever a new call starts
  useEffect(() => {
    if (activeCall) {
      setDuration(0)
      setMuted(false)
      setCameraOff(activeCall.type === 'audio')
      setScreenSharing(false)
      setMinimized(false)
      setConnected(false)
      setRemoteJoined(false)
      callStartRef.current = Date.now()
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [activeCall?.roomId])

  // Connect to LiveKit room
  useEffect(() => {
    if (!activeCall) return
    let disposed = false
    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    const connectRoom = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) throw new Error('Not authenticated')

        const { data, error } = await supabase.functions.invoke('livekit-token', {
          body: { room: activeCall.roomId, name: activeCall.participantName },
        })
        if (error || !data?.token || !data?.wsUrl) throw new Error('LiveKit token unavailable')
        if (disposed) return

        await room.connect(data.wsUrl, data.token)
        await room.localParticipant.setMicrophoneEnabled(true)
        if (activeCall.type === 'video') await room.localParticipant.setCameraEnabled(true)

        attachTrack(room.localParticipant, localVideoRef.current)
        setConnected(true)

        // Record call in video_calls table (only caller inserts, to avoid duplicate)
        if (activeCall.isCaller && activeCall.participantId) {
          const { data: sessionData } = await supabase.auth.getSession()
          const userId = sessionData.session?.user?.id
          if (userId) {
            const { data: vc } = await supabase.from('video_calls').insert({
              caller_id: userId,
              callee_id: activeCall.participantId,
              livekit_room: activeCall.roomId,
              call_type: activeCall.type,
              status: 'active',
              started_at: new Date().toISOString(),
            }).select('id').single()
            if (vc?.id) videoCallRowRef.current = vc.id
          }
        }

        room.remoteParticipants.forEach(p => attachTrack(p, remoteVideoRef.current))
        setRemoteJoined(room.remoteParticipants.size > 0)

        room.on(RoomEvent.TrackSubscribed, () => {
          room.remoteParticipants.forEach(p => attachTrack(p, remoteVideoRef.current))
          setRemoteJoined(true)
        })
        room.on(RoomEvent.TrackUnsubscribed, () => {
          room.remoteParticipants.forEach(p => attachTrack(p, remoteVideoRef.current))
        })
        room.on(RoomEvent.LocalTrackPublished, () => attachTrack(room.localParticipant, localVideoRef.current))
        room.on(RoomEvent.ParticipantDisconnected, () => {
          setRemoteJoined(room.remoteParticipants.size > 0)
        })
        room.on(RoomEvent.ConnectionQualityChanged, (q, participant) => {
          if (participant.isLocal) setQuality(q)
        })
        room.on(RoomEvent.Disconnected, () => {
          if (!disposed) void endCall().catch(console.error)
        })
      } catch (err) {
        console.error('LiveKit connection error:', err)
        if (!disposed) void endCall().catch(console.error)
      }
    }

    connectRoom()

    return () => {
      disposed = true
      // Update video_calls row with ended status + duration
      if (videoCallRowRef.current) {
        const durationSecs = Math.floor((Date.now() - callStartRef.current) / 1000)
        supabase.from('video_calls').update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration_s: durationSecs,
        }).eq('id', videoCallRowRef.current).then(() => {})
        videoCallRowRef.current = null
      }
      room.disconnect()
      roomRef.current = null
    }
  }, [activeCall?.roomId])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleToggleMute = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    const next = !muted
    await room.localParticipant.setMicrophoneEnabled(!next)
    setMuted(next)
  }, [muted])

  const handleToggleCamera = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    const next = !cameraOff
    await room.localParticipant.setCameraEnabled(!next)
    setCameraOff(next)
    attachTrack(room.localParticipant, localVideoRef.current)
  }, [cameraOff])

  const handleToggleScreenShare = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    try {
      const next = !screenSharing
      await room.localParticipant.setScreenShareEnabled(next)
      setScreenSharing(next)
    } catch { /* user cancelled */ }
  }, [screenSharing])

  const handleEndCall = () => {
    roomRef.current?.disconnect()
    void endCall().catch(console.error)
  }

  const qualityLabel =
    quality === ConnectionQuality.Excellent ? 'Excellent' :
    quality === ConnectionQuality.Good ? 'Good' :
    quality === ConnectionQuality.Poor ? 'Poor' : '—'

  return (
    <>
      {/* ── Active call window ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activeCall && (
          <>
            {!minimized && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              />
            )}

            <motion.div
              key="call-window"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={minimized
                ? { opacity: 1, scale: 1, width: 240, height: 160, bottom: 20, right: 20, top: 'auto', left: 'auto', x: 0, y: 0 }
                : { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed z-50 dark:bg-[#0D0A14] bg-gray-900 flex flex-col shadow-2xl overflow-hidden
                ${minimized
                  ? 'bottom-5 right-5 w-60 h-40 rounded-2xl border dark:border-pink-500/20 border-gray-700'
                  : 'inset-2 sm:inset-6 lg:inset-12 rounded-3xl border dark:border-pink-500/20 border-gray-700'
                }`}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-love-gradient flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                    {activeCall.participantAvatar
                      ? <img src={activeCall.participantAvatar} alt="" className="w-full h-full object-cover" />
                      : (activeCall.participantEmoji || '👤')}
                  </div>
                  {!minimized && (
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{activeCall.participantName}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs text-emerald-400 font-semibold">{formatDuration(duration)}</p>
                        <span className="text-xs text-white/40">·</span>
                        <p className="text-xs text-white/60">
                          {activeCall.type === 'video' ? '📹 Video' : '📞 Audio'} Call
                        </p>
                        {connected && (
                          <>
                            <span className="text-xs text-white/40">·</span>
                            <span className="flex items-center gap-1 text-[10px] text-white/50">
                              {quality === ConnectionQuality.Poor ? <WifiOff className="w-2.5 h-2.5" /> : <Wifi className="w-2.5 h-2.5" />}
                              {qualityLabel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setMinimized(m => !m)}
                    className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    {minimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  {!minimized && (
                    <button
                      onClick={handleEndCall}
                      className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors"
                    >
                      <PhoneOff className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Video area */}
              <div className={`flex-1 relative bg-black overflow-hidden ${minimized ? 'rounded-b-2xl' : ''}`}>
                <div ref={remoteVideoRef} className="absolute inset-0 w-full h-full flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                {!remoteJoined && connected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-love-gradient flex items-center justify-center text-2xl mx-auto mb-3 overflow-hidden">
                        {activeCall.participantAvatar
                          ? <img src={activeCall.participantAvatar} alt="" className="w-full h-full object-cover" />
                          : (activeCall.participantEmoji || '👤')}
                      </div>
                      <p className="text-sm text-white/80 font-semibold">
                        {activeCall.isCaller ? `Ringing ${activeCall.participantName}…` : `Joining…`}
                      </p>
                    </div>
                  </div>
                )}

                {!connected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-white/60">Connecting…</p>
                    </div>
                  </div>
                )}

                {/* Local self-view PiP */}
                {!minimized && activeCall.type === 'video' && (
                  <div
                    ref={localVideoRef}
                    className="absolute bottom-4 right-4 w-24 h-32 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-brand-pink/60 shadow-xl bg-black/70 [&>video]:w-full [&>video]:h-full [&>video]:object-cover z-10"
                  />
                )}

                {minimized && (
                  <div
                    onClick={() => setMinimized(false)}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group z-10"
                  >
                    <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-xl p-2">
                      <Maximize2 className="w-5 h-5 text-white mx-auto mb-1" />
                      <p className="text-[10px] text-white">Tap to expand</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom controls */}
              {!minimized && (
                <div className="flex items-center justify-center gap-3 px-4 py-4 bg-black/40 backdrop-blur-sm flex-shrink-0">
                  <button
                    onClick={handleToggleMute}
                    disabled={!connected}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${muted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/15 hover:bg-white/25'}`}
                  >
                    {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50 hover:bg-red-600 transition-colors hover:scale-105 active:scale-95"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>

                  {activeCall.type === 'video' && (
                    <button
                      onClick={handleToggleCamera}
                      disabled={!connected}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${cameraOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/15 hover:bg-white/25'}`}
                    >
                      {cameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                    </button>
                  )}

                  <button
                    onClick={handleToggleScreenShare}
                    disabled={!connected}
                    className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all disabled:opacity-40 ${screenSharing ? 'bg-brand-pink shadow-lg shadow-pink-500/30' : 'bg-white/15 hover:bg-white/25'}`}
                  >
                    <MonitorUp className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Minimized end button */}
              {minimized && (
                <button
                  onClick={handleEndCall}
                  className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
                >
                  <PhoneOff className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── "Call Declined" toast ──────────────────────────────────────── */}
      <AnimatePresence>
        {callDeclined && (
          <motion.div
            key="declined"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                       px-5 py-3.5 rounded-2xl bg-gray-900 border border-red-500/30 shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <PhoneIncoming className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Call declined</p>
              <p className="text-xs text-white/50">The other person is unavailable</p>
            </div>
            <button onClick={dismissDeclined} className="ml-2 text-white/30 hover:text-white/70 transition-colors text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
