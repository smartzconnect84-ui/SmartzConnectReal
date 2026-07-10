import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2,
  Wifi, WifiOff, MonitorUp, PhoneIncoming, Pause, Play, Sparkles, UserPlus, X,
  Volume2, VolumeX,
} from 'lucide-react'
import {
  Room, RoomEvent, Track, ConnectionQuality,
  type RemoteParticipant, type LocalParticipant,
} from 'livekit-client'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { useStream } from '@/contexts/StreamContext'
import { supabase } from '@/lib/supabase'
import { startRinging, stopRinging, playConnected, playCallEnded, playMuteToggle } from '@/lib/callSounds'
import { getDominantColor } from '@/lib/dominantColor'

// Keeps a live set of all remote <audio> elements so we can route them to
// the chosen audio output device when the speaker toggle changes.
const remoteAudioEls = new Set<HTMLAudioElement>()

function attachTrack(participant: LocalParticipant | RemoteParticipant, el: HTMLDivElement | null) {
  if (!el) return
  // Prune any audio elements this tile previously held before wiping the DOM,
  // so remoteAudioEls never accumulates stale/detached refs across re-attaches.
  el.querySelectorAll('audio').forEach(a => remoteAudioEls.delete(a as HTMLAudioElement))
  el.innerHTML = ''
  participant.videoTrackPublications.forEach(pub => {
    if (pub.track && pub.kind === Track.Kind.Video) {
      const track = pub.track.attach()
      track.className = 'w-full h-full object-cover'
      el.appendChild(track)
    }
  })
  // Audio tracks must also be attached to an element, or the browser never
  // plays the remote party's voice even though the track is subscribed.
  // Never attach the LOCAL participant's own audio — that would echo the
  // user's own mic back to them.
  if (!participant.isLocal) {
    participant.audioTrackPublications.forEach(pub => {
      if (pub.track && pub.kind === Track.Kind.Audio) {
        const audioEl = pub.track.attach() as HTMLAudioElement
        audioEl.autoplay = true
        audioEl.style.display = 'none'
        el.appendChild(audioEl)
        remoteAudioEls.add(audioEl)
      }
    })
  }
}

const VIDEO_FILTERS = [
  { id: 'none',      label: 'None',      css: 'none' },
  { id: 'warm',      label: 'Warm',      css: 'saturate(1.25) sepia(0.12) brightness(1.05)' },
  { id: 'cool',      label: 'Cool',      css: 'saturate(1.1) hue-rotate(-8deg) brightness(1.02)' },
  { id: 'bw',        label: 'B&W',       css: 'grayscale(1) contrast(1.1)' },
  { id: 'soft',      label: 'Soft Glow', css: 'brightness(1.08) contrast(0.95) blur(0.3px)' },
  { id: 'vivid',     label: 'Vivid',     css: 'saturate(1.5) contrast(1.1)' },
]

interface ConferenceMember {
  userId: string
  name: string
  avatar?: string
  status: string
}

export default function LiveKitCall() {
  const { activeCall, endCall, callDeclined, dismissDeclined, inviteToCall } = useLiveKitCall()
  // userName is the current user's own display name (fetched from their profile by StreamContext).
  // It is used as the LiveKit participant identity/name — NOT the other person's name.
  const { userName: myDisplayName } = useStream()
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteTileRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const roomRef = useRef<Room | null>(null)
  const videoCallRowRef = useRef<string | null>(null)  // video_calls.id
  const callStartRef = useRef<number>(0)
  // Cache dominant colors per avatar URL to avoid re-computing every render
  const colorCacheRef = useRef<Map<string, string>>(new Map())

  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [duration, setDuration] = useState(0)
  const [connected, setConnected] = useState(false)
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown)
  const [remoteJoined, setRemoteJoined] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const [filter, setFilter] = useState(VIDEO_FILTERS[0])
  const [showFilters, setShowFilters] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [contacts, setContacts] = useState<{ id: string; name: string; avatar?: string }[]>([])
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([])
  const [speakerOn, setSpeakerOn] = useState(true)
  const [speakerNote, setSpeakerNote] = useState<string | null>(null)
  const [themeColor, setThemeColor] = useState('#EC4899')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const preHoldMicRef = useRef(false)
  const preHoldCamRef = useRef(false)

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
      setOnHold(false)
      setFilter(VIDEO_FILTERS[0])
      setSpeakerOn(true)
      setSpeakerNote(null)
      callStartRef.current = Date.now()
    } else {
      stopRinging()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      stopRinging()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeCall?.roomId])

  // Extract dominant color from participant avatar for the call theme
  useEffect(() => {
    if (!activeCall?.participantAvatar) {
      setThemeColor('#EC4899')
      return
    }
    const url = activeCall.participantAvatar
    if (colorCacheRef.current.has(url)) {
      setThemeColor(colorCacheRef.current.get(url)!)
      return
    }
    let cancelled = false
    getDominantColor(url).then(color => {
      if (!cancelled) {
        colorCacheRef.current.set(url, color)
        setThemeColor(color)
      }
    })
    return () => { cancelled = true }
  }, [activeCall?.participantAvatar])

  // Caller-side ringing: play while connected to room but remote hasn't joined yet
  useEffect(() => {
    if (connected && !remoteJoined && activeCall?.isCaller) {
      startRinging()
    } else {
      stopRinging()
    }
    return () => stopRinging()
  }, [connected, remoteJoined, activeCall?.isCaller])

  // Play "connected" chime when the other party joins
  const prevRemoteJoinedRef = useRef(false)
  useEffect(() => {
    if (remoteJoined && !prevRemoteJoinedRef.current) {
      playConnected()
    }
    prevRemoteJoinedRef.current = remoteJoined
  }, [remoteJoined])

  // Duration timer only runs once the call is actually connected to the other
  // party (not while ringing) and pauses while on hold.
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (connected && remoteJoined && !onHold) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [connected, remoteJoined, onHold])

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

        // Pre-flight: request mic permission before connecting so the browser
        // permission dialog shows before LiveKit tries to publish tracks.
        // This ensures the user has a chance to grant access; without this
        // some browsers block `setMicrophoneEnabled` silently mid-call.
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            stream.getTracks().forEach(t => t.stop()) // Release immediately — LiveKit re-acquires
          } catch {
            // Permission denied or device unavailable — LiveKit will surface the error gracefully
          }
        }
        if (disposed) return

        const { data, error } = await supabase.functions.invoke('livekit-token', {
          // Pass the current user's own display name as the LiveKit participant name,
          // not the other participant's name. myDisplayName comes from the user's own profile.
          body: { room: activeCall.roomId, name: myDisplayName || undefined },
        })
        if (error || !data?.token || !data?.wsUrl) throw new Error('LiveKit token unavailable')
        if (disposed) return

        await room.connect(data.wsUrl, data.token)

        // startAudio() unblocks audio playback on browsers/iOS that apply autoplay
        // restrictions. Must be called after connect and preferably within the call
        // answer user-gesture chain so the browser allows it.
        try { await room.startAudio() } catch { /* best-effort — non-critical */ }

        await room.localParticipant.setMicrophoneEnabled(true)
        if (activeCall.type === 'video') await room.localParticipant.setCameraEnabled(true)

        attachTrack(room.localParticipant, localVideoRef.current)
        if (localVideoRef.current) localVideoRef.current.style.filter = filter.css
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

        const syncRemoteTiles = () => {
          const list = Array.from(room.remoteParticipants.values())
          setRemoteParticipants(list)
          list.forEach(p => attachTrack(p, remoteTileRefs.current.get(p.identity) ?? null))
          setRemoteJoined(list.length > 0)
        }

        syncRemoteTiles()

        room.on(RoomEvent.TrackSubscribed, syncRemoteTiles)
        room.on(RoomEvent.TrackUnsubscribed, syncRemoteTiles)
        room.on(RoomEvent.ParticipantConnected, syncRemoteTiles)
        room.on(RoomEvent.LocalTrackPublished, () => {
          attachTrack(room.localParticipant, localVideoRef.current)
          if (localVideoRef.current) localVideoRef.current.style.filter = filter.css
        })
        room.on(RoomEvent.ParticipantDisconnected, syncRemoteTiles)
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
      // Clean up remote audio element tracking on room disconnect
      remoteAudioEls.clear()
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

  // Re-apply the chosen visual filter whenever it changes (local preview only —
  // a true server-side/outgoing filter would require a canvas track processor;
  // this is a lightweight local styling pass).
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.style.filter = filter.css
  }, [filter])

  const handleToggleHold = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    const next = !onHold
    if (next) {
      preHoldMicRef.current = muted
      preHoldCamRef.current = cameraOff
      await room.localParticipant.setMicrophoneEnabled(false)
      if (activeCall?.type === 'video') await room.localParticipant.setCameraEnabled(false)
    } else {
      await room.localParticipant.setMicrophoneEnabled(!preHoldMicRef.current)
      if (activeCall?.type === 'video') await room.localParticipant.setCameraEnabled(!preHoldCamRef.current)
    }
    setOnHold(next)
  }, [onHold, muted, cameraOff, activeCall?.type])

  const openInvite = useCallback(async () => {
    setShowInvite(true)
    if (contacts.length > 0) return
    const { data } = await supabase.auth.getSession()
    const myId = data.session?.user?.id
    if (!myId) return
    const { data: friends } = await supabase
      .from('follows')
      .select('following_id, profiles:following_id(id, full_name, avatar_url)')
      .eq('follower_id', myId)
      .limit(20)
    const list = (friends ?? [])
      .map((f: any) => f.profiles)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id, name: p.full_name || 'Member', avatar: p.avatar_url }))
    setContacts(list)
  }, [contacts.length])

  const handleInvite = useCallback(async (contact: { id: string; name: string; avatar?: string }) => {
    await inviteToCall({ contactId: contact.id, contactName: contact.name, contactAvatar: contact.avatar })
    setShowInvite(false)
  }, [inviteToCall])

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
    playMuteToggle(next)
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
    } catch (err) {
      // Ignore the browser's own "Share cancelled" rejection, but surface real failures.
      const message = err instanceof Error ? err.message : String(err)
      if (!/permission denied|cancel/i.test(message)) {
        console.error('Screen share failed:', err)
      }
    }
  }, [screenSharing])

  const handleToggleSpeaker = useCallback(async () => {
    const next = !speakerOn
    setSpeakerOn(next)
    setSpeakerNote(null)

    // Feature-detect setSinkId support
    const testEl = document.createElement('audio')
    const supportsSinkId = typeof (testEl as any).setSinkId === 'function'

    if (!supportsSinkId || !navigator.mediaDevices?.enumerateDevices) {
      setSpeakerNote('Speaker routing isn\'t supported in this browser.')
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput')

      if (audioOutputs.length === 0) {
        setSpeakerNote('No audio output devices found.')
        return
      }

      // When switching to "speaker on": prefer a device labelled "speaker"
      // (common on mobile browsers). Otherwise fall back to the default device.
      // When switching to "earpiece/off": prefer a device labelled "earpiece".
      let targetDevice: MediaDeviceInfo | undefined

      if (next) {
        // speakerOn = true — route to loudspeaker
        targetDevice =
          audioOutputs.find(d => /speaker/i.test(d.label)) ??
          audioOutputs.find(d => d.deviceId === 'default') ??
          audioOutputs[0]
      } else {
        // speakerOn = false — route to earpiece/headset
        targetDevice =
          audioOutputs.find(d => /earpiece|receiver/i.test(d.label)) ??
          audioOutputs.find(d => d.deviceId === 'default') ??
          audioOutputs[0]
      }

      if (!targetDevice) return

      const sinkId = targetDevice.deviceId
      const promises: Promise<void>[] = []
      remoteAudioEls.forEach(el => {
        if ((el as any).setSinkId) {
          promises.push((el as any).setSinkId(sinkId).catch(() => {}))
        }
      })
      await Promise.all(promises)
    } catch {
      setSpeakerNote('Could not change audio output device.')
    }
  }, [speakerOn])

  const handleEndCall = () => {
    playCallEnded()
    roomRef.current?.disconnect()
    void endCall().catch(console.error)
  }

  const qualityLabel =
    quality === ConnectionQuality.Excellent ? 'Excellent' :
    quality === ConnectionQuality.Good ? 'Good' :
    quality === ConnectionQuality.Poor ? 'Poor' : '—'

  // Build theme CSS variables for ambient call styling
  const themeStyle: React.CSSProperties = {
    ['--call-theme-color' as string]: themeColor,
  }

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
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${themeColor}22 0%, transparent 60%), rgba(0,0,0,0.70)` }}
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
              style={themeStyle}
              className={`fixed z-50 dark:bg-[#0D0A14] bg-gray-900 flex flex-col shadow-2xl overflow-hidden
                ${minimized
                  ? 'bottom-5 right-5 w-60 h-40 rounded-2xl border border-[color:var(--call-theme-color)]/30'
                  : 'inset-2 sm:inset-6 lg:inset-12 rounded-3xl border border-[color:var(--call-theme-color)]/30'
                }`}
            >
              {/* Ambient top glow accent */}
              {!minimized && (
                <div
                  className="absolute inset-x-0 top-0 h-32 pointer-events-none z-0"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${themeColor}20 0%, transparent 70%)` }}
                />
              )}

              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm flex-shrink-0 relative z-10"
                style={{ borderBottom: `1px solid ${themeColor}22` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${themeColor}99, ${themeColor}44)`, boxShadow: `0 0 0 2px ${themeColor}55` }}
                  >
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
                        {onHold && (
                          <>
                            <span className="text-xs text-white/40">·</span>
                            <span className="text-[10px] font-bold text-amber-400">ON HOLD</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!minimized && (
                    <button
                      onClick={openInvite}
                      title="Add to call"
                      className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
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

              {/* Video area — grid supports unlimited conference participants */}
              <div className={`flex-1 relative bg-black overflow-hidden ${minimized ? 'rounded-b-2xl' : ''}`}>
                <div className={`absolute inset-0 grid gap-0.5 ${
                  remoteParticipants.length <= 1 ? 'grid-cols-1' :
                  remoteParticipants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                  {remoteParticipants.map(p => (
                    <div key={p.identity} className="relative w-full h-full bg-black/50 flex items-center justify-center overflow-hidden">
                      <div
                        ref={el => { if (el) remoteTileRefs.current.set(p.identity, el); else remoteTileRefs.current.delete(p.identity) }}
                        className="w-full h-full flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded-md">{p.name || p.identity}</span>
                    </div>
                  ))}
                </div>

                {!remoteJoined && connected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${themeColor}99, ${themeColor}44)`, boxShadow: `0 0 20px ${themeColor}40` }}
                      >
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
                    className="absolute bottom-4 right-4 w-24 h-32 sm:w-32 sm:h-44 rounded-2xl overflow-hidden shadow-xl bg-black/70 [&>video]:w-full [&>video]:h-full [&>video]:object-cover z-10"
                    style={{ border: `2px solid ${themeColor}99` }}
                  />
                )}

                {onHold && !minimized && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                    <div className="text-center">
                      <Pause className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-white">Call on hold</p>
                      <p className="text-xs text-white/50">Your mic &amp; camera are paused</p>
                    </div>
                  </div>
                )}

                {/* Filter picker */}
                {showFilters && !minimized && (
                  <div className="absolute top-3 right-3 z-20 dark:bg-[#130E1E]/95 bg-gray-900/95 rounded-2xl border border-white/10 p-3 flex gap-2 shadow-2xl">
                    {VIDEO_FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setFilter(f); }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${filter.id === f.id ? 'bg-love-gradient text-white' : 'bg-white/10 text-white/70'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Invite to call modal */}
                {showInvite && !minimized && (
                  <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-6">
                    <div className="w-full max-w-sm dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/10 border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold dark:text-white text-gray-900">Add to this call</p>
                        <button onClick={() => setShowInvite(false)}><X className="w-4 h-4 dark:text-gray-400 text-gray-500" /></button>
                      </div>
                      {contacts.length === 0 ? (
                        <p className="text-xs dark:text-gray-500 text-gray-400 py-4 text-center">No contacts to invite yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {contacts.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleInvite(c)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                                {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : '👤'}
                              </div>
                              <span className="text-sm font-semibold dark:text-white text-gray-900 truncate">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                <div className="flex flex-col items-center gap-1 px-4 pt-3 pb-4 bg-black/40 backdrop-blur-sm flex-shrink-0 relative z-10"
                  style={{ borderTop: `1px solid ${themeColor}22` }}
                >
                  <div className="flex items-center justify-center gap-3">

                    {/* Mute — only appears once the other party has joined */}
                    {remoteJoined && (
                      <button
                        onClick={handleToggleMute}
                        title={muted ? 'Unmute' : 'Mute'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/15 hover:bg-white/25'}`}
                      >
                        {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                      </button>
                    )}

                    <button
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50 hover:bg-red-600 transition-colors hover:scale-105 active:scale-95"
                    >
                      <PhoneOff className="w-6 h-6 text-white" />
                    </button>

                    {activeCall.type === 'video' && connected && (
                      <button
                        onClick={handleToggleCamera}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/15 hover:bg-white/25'}`}
                      >
                        {cameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                      </button>
                    )}

                    {connected && (
                      <button
                        onClick={handleToggleScreenShare}
                        className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all ${screenSharing ? 'shadow-lg' : 'bg-white/15 hover:bg-white/25'}`}
                        style={screenSharing ? { background: themeColor, boxShadow: `0 4px 15px ${themeColor}50` } : undefined}
                      >
                        <MonitorUp className="w-5 h-5 text-white" />
                      </button>
                    )}

                    {/* Hold — only appears once the other party has joined */}
                    {remoteJoined && (
                      <button
                        onClick={handleToggleHold}
                        title={onHold ? 'Resume call' : 'Hold call'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${onHold ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-white/15 hover:bg-white/25'}`}
                      >
                        {onHold ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
                      </button>
                    )}

                    {activeCall.type === 'video' && connected && (
                      <button
                        onClick={() => setShowFilters(v => !v)}
                        title="Video filters"
                        className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all ${showFilters ? 'shadow-lg' : 'bg-white/15 hover:bg-white/25'}`}
                        style={showFilters ? { background: themeColor, boxShadow: `0 4px 15px ${themeColor}50` } : undefined}
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </button>
                    )}

                    {/* Speaker / Handsfree toggle */}
                    <button
                      onClick={handleToggleSpeaker}
                      title={speakerOn ? 'Switch to earpiece' : 'Switch to speaker'}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${speakerOn ? 'bg-white/15 hover:bg-white/25' : 'bg-white/5 hover:bg-white/15'}`}
                    >
                      {speakerOn
                        ? <Volume2 className="w-5 h-5 text-white" />
                        : <VolumeX className="w-5 h-5 text-white/50" />}
                    </button>
                  </div>

                  {/* Speaker unsupported note */}
                  {speakerNote && (
                    <p className="text-[10px] text-white/40 mt-0.5 text-center">{speakerNote}</p>
                  )}
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
