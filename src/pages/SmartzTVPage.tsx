import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Heart, Eye, Search, Flame, TrendingUp, Radio, Gift, X, Tv, Crown, Zap, Shield, RefreshCw, Plus, Mic, MicOff, Video, VideoOff, PhoneOff, Users, Loader2, Link2, Edit2, Trash2, Share2, MessageSquare, Clapperboard, Save, CheckCircle, Monitor, MonitorOff, UserPlus2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { uploadToSufy } from '@/lib/sufy'
import { notifyUser } from '@/lib/notify'
import { Room, RoomEvent, Track, type LocalParticipant, type RemoteParticipant } from 'livekit-client'

/** Render all video tracks from a participant into a div */
function attachTrack(participant: LocalParticipant | RemoteParticipant, el: HTMLDivElement | null) {
  if (!el) return
  el.innerHTML = ''
  participant.videoTrackPublications.forEach(pub => {
    if (pub.track && pub.kind === Track.Kind.Video) {
      const v = pub.track.attach()
      v.className = 'w-full h-full object-cover'
      el.appendChild(v)
    }
  })
  if (!participant.isLocal) {
    participant.audioTrackPublications.forEach(pub => {
      if (pub.track && pub.kind === Track.Kind.Audio) {
        const a = pub.track.attach() as HTMLAudioElement
        a.autoplay = true
        a.style.display = 'none'
        el.appendChild(a)
      }
    })
  }
}

const categories = ['All', 'Live', 'Music', 'Comedy', 'Tech', 'Fashion', 'Sports', 'Food', 'Education']

const giftItems = [
  { emoji: '🌹', name: 'Rose',    price: 1,   color: 'text-red-400' },
  { emoji: '💎', name: 'Diamond', price: 50,  color: 'text-blue-400' },
  { emoji: '🚀', name: 'Rocket',  price: 100, color: 'text-purple-400' },
  { emoji: '👑', name: 'Crown',   price: 500, color: 'text-amber-400' },
  { emoji: '🎁', name: 'Gift',    price: 10,  color: 'text-pink-400' },
  { emoji: '⭐', name: 'Star',    price: 25,  color: 'text-yellow-400' },
]

interface Stream {
  id: string; title: string; creator: string; creatorId: string; creatorEmoji: string; avatar_url?: string
  views: string; likes: number; duration: string; category: string; emoji: string
  live: boolean; trending: boolean; gifts: number; verified: boolean; vip: boolean
  thumbnail_url?: string; isAdminBroadcast?: boolean; invitedCreatorId?: string
}

// ── Broadcaster component ─────────────────────────────────────────────────
interface BroadcastData { streamId: string; title: string; guestName?: string }

function SmartzTVBroadcaster({ data, onEnd }: { data: BroadcastData; onEnd: () => void }) {
  const localVideoRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<Room | null>(null)
  const [connected, setConnected] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [viewers, setViewers] = useState(0)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [lkError, setLkError] = useState('')
  // Kick signal listener (for guest mode)
  const ctrlChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const ch = supabase.channel(`stream-ctrl-${data.streamId}`)
      .on('broadcast', { event: 'kick' }, (msg: any) => {
        // If this broadcaster's identity matches the kicked one, disconnect
        if (msg.payload?.identity && roomRef.current?.localParticipant.identity === msg.payload.identity) {
          handleEnd()
        }
      })
      .subscribe()
    ctrlChannelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [data.streamId])

  useEffect(() => {
    let disposed = false
    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    let timedOut = false
    const timeoutId = setTimeout(() => {
      if (!disposed) {
        timedOut = true
        room.disconnect()
        setLkError('Connection timed out. Check your camera/mic permissions and try again.')
      }
    }, 20000)

    const connect = async () => {
      try {
        const { data: tkData, error } = await supabase.functions.invoke('livekit-token', {
          body: { room: `smartz-tv-${data.streamId}`, name: data.guestName || 'Broadcaster' },
        })
        if (error || !tkData?.token || !tkData?.wsUrl) throw new Error('LiveKit token unavailable — check server config')
        if (disposed || timedOut) return
        await room.connect(tkData.wsUrl, tkData.token)
        if (disposed || timedOut) { room.disconnect(); return }
        clearTimeout(timeoutId)
        setLkError('')
        await room.localParticipant.setCameraEnabled(true)
        await room.localParticipant.setMicrophoneEnabled(true)
        attachTrack(room.localParticipant, localVideoRef.current)
        setConnected(true)
        setViewers(room.remoteParticipants.size)
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        room.on(RoomEvent.LocalTrackPublished, () => attachTrack(room.localParticipant, localVideoRef.current))
        const syncViewerCount = () => {
          const count = room.remoteParticipants.size
          setViewers(count)
          // Only the primary broadcaster authorises DB writes; guests must not clobber counts
          if (!data.guestName) {
            supabase.from('livestreams').update({ viewer_count: count }).eq('id', data.streamId).then(() => {})
          }
        }
        room.on(RoomEvent.ParticipantConnected, syncViewerCount)
        room.on(RoomEvent.ParticipantDisconnected, syncViewerCount)
        // Only primary broadcaster reacts to unexpected disconnects by marking the stream ended
        if (!data.guestName) {
          room.on(RoomEvent.Disconnected, () => {
            if (disposed) return
            supabase.from('livestreams').update({ status: 'ended', viewer_count: 0 }).eq('id', data.streamId).then(() => {})
          })
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (!disposed && !timedOut) setLkError(err?.message || 'Could not start broadcast')
      }
    }
    connect()
    return () => {
      disposed = true
      clearTimeout(timeoutId)
      if (timerRef.current) clearInterval(timerRef.current)
      room.disconnect()
      roomRef.current = null
    }
  }, [data.streamId])

  const handleEnd = useCallback(async () => {
    roomRef.current?.disconnect()
    if (!data.guestName) {
      // Only end the stream DB record if this is the main broadcaster, not a guest
      await supabase.from('livestreams').update({ status: 'ended', viewer_count: 0 }).eq('id', data.streamId)
    }
    onEnd()
  }, [data.streamId, data.guestName, onEnd])

  const toggleMute = useCallback(async () => {
    const r = roomRef.current; if (!r) return
    const next = !muted
    await r.localParticipant.setMicrophoneEnabled(!next)
    setMuted(next)
  }, [muted])

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current; if (!r) return
    const next = !cameraOff
    await r.localParticipant.setCameraEnabled(!next)
    setCameraOff(next)
    attachTrack(r.localParticipant, localVideoRef.current)
  }, [cameraOff])

  const toggleScreen = useCallback(async () => {
    const r = roomRef.current; if (!r) return
    try {
      const next = !screenSharing
      await r.localParticipant.setScreenShareEnabled(next)
      setScreenSharing(next)
      attachTrack(r.localParticipant, localVideoRef.current)
    } catch { /* user cancelled */ }
  }, [screenSharing])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Live camera */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <div ref={localVideoRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

        {!connected && !lkError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <div className="w-10 h-10 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
            <p className="text-sm text-white/60">{data.guestName ? 'Joining as guest…' : 'Starting your broadcast…'}</p>
          </div>
        )}
        {lkError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
            <p className="text-red-400 font-semibold">⚠️ Broadcast error</p>
            <p className="text-sm text-white/50">{lkError}</p>
            <button onClick={handleEnd} className="mt-2 px-6 py-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold">Leave Stream</button>
          </div>
        )}

        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {data.guestName ? 'GUEST' : 'LIVE'}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs font-semibold backdrop-blur-sm">{fmt(duration)}</span>
            {screenSharing && (
              <span className="px-2.5 py-1 rounded-full bg-blue-500/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Screen
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
            <Users className="w-3.5 h-3.5" /> {viewers}
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-20 left-4 right-4">
          <p className="text-white font-bold text-sm drop-shadow-lg truncate">{data.title}</p>
          {data.guestName && <p className="text-white/50 text-xs">Joined as guest</p>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-6 py-5 bg-[#0A0710] flex-shrink-0">
        <button onClick={toggleMute} disabled={!connected}
          className={`w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${muted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
          {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </button>
        <button onClick={toggleCamera} disabled={!connected}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${cameraOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
          {cameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
        </button>
        <button onClick={handleEnd}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-colors hover:scale-105 active:scale-95">
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
        <button onClick={toggleScreen} disabled={!connected}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${screenSharing ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
          {screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
        </button>
        {!data.guestName && (
          <button
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            onClick={() => {
              const url = `${window.location.origin}/app/smartztv`
              if (navigator.share) { navigator.share({ title: data.title, url }).catch(() => {}) }
              else { navigator.clipboard.writeText(url).catch(() => {}) }
            }}>
            <Share2 className="w-4.5 h-4.5 text-white w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Stream viewer modal ───────────────────────────────────────────────────
function StreamModal({ stream, onClose, onJoinAsGuest }: {
  stream: Stream; onClose: () => void
  onJoinAsGuest?: (streamId: string, title: string) => void
}) {
  const { user } = useAuth()
  const [gifted, setGifted] = useState<string | null>(null)
  const [giftSending, setGiftSending] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<{ id?: number; user: string; avatar?: string; text: string; time: string }[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(stream.likes || 0)
  const [shareToast, setShareToast] = useState(false)
  // LiveKit viewer
  const liveVideoRef = useRef<HTMLDivElement>(null)
  const viewerRoomRef = useRef<Room | null>(null)
  const [liveVideoReady, setLiveVideoReady] = useState(false)

  // Check follow + like status on open
  useEffect(() => {
    if (!user) return
    if (stream.creatorId && stream.creatorId !== user.id) {
      supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', stream.creatorId)
        .maybeSingle().then(({ data }) => { if (data) setFollowing(true) })
    }
    supabase.from('post_reactions').select('id').eq('post_id', stream.id).eq('user_id', user.id).eq('emoji', '❤️')
      .maybeSingle().then(({ data }) => { if (data) setLiked(true) })
  }, [user?.id, stream.id, stream.creatorId])

  const toggleFollow = async () => {
    if (!user || !stream.creatorId || stream.creatorId === user.id || followLoading) return
    setFollowLoading(true)
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', stream.creatorId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: stream.creatorId })
      notifyUser({
        userId: stream.creatorId,
        type: 'follow',
        title: 'New Follower on SmartzTV',
        message: 'Someone started following you from SmartzTV!',
        actionUrl: `/app/user/${user.id}`,
        emoji: '📺',
      }).catch(() => {})
      setFollowing(true)
    }
    setFollowLoading(false)
  }

  const toggleLike = async () => {
    if (!user) return
    const next = !liked
    setLiked(next)
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1))
    if (next) {
      void supabase.from('post_reactions').insert({ post_id: stream.id, user_id: user.id, emoji: '❤️' })
    } else {
      void supabase.from('post_reactions').delete().eq('post_id', stream.id).eq('user_id', user.id).eq('emoji', '❤️')
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/app/smartztv`
    if (navigator.share) {
      navigator.share({ title: stream.title, text: `Watch "${stream.title}" on SmartzTV!`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2500)
      }).catch(() => {})
    }
  }

  // LiveKit viewer connection
  useEffect(() => {
    if (!stream.live) return
    let disposed = false
    const room = new Room({ adaptiveStream: true })
    viewerRoomRef.current = room

    const connect = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('livekit-token', {
          body: { room: `smartz-tv-${stream.id}`, publish: false },
        })
        if (error || !data?.token || !data?.wsUrl) return
        if (disposed) return
        await room.connect(data.wsUrl, data.token)
        if (disposed) { room.disconnect(); return }

        const renderRemote = () => {
          if (liveVideoRef.current) {
            liveVideoRef.current.innerHTML = ''
            let rendered = 0
            room.remoteParticipants.forEach(p => {
              p.videoTrackPublications.forEach(pub => {
                if (pub.track && pub.kind === Track.Kind.Video) {
                  const v = pub.track.attach()
                  v.className = 'w-full h-full object-cover'
                  liveVideoRef.current!.appendChild(v)
                  rendered++
                }
              })
              p.audioTrackPublications.forEach(pub => {
                if (pub.track && pub.kind === Track.Kind.Audio) {
                  const a = pub.track.attach() as HTMLAudioElement
                  a.autoplay = true; a.style.display = 'none'
                  liveVideoRef.current!.appendChild(a)
                }
              })
            })
            setLiveVideoReady(rendered > 0)
          }
        }
        renderRemote()
        room.on(RoomEvent.TrackSubscribed, renderRemote)
        room.on(RoomEvent.TrackUnsubscribed, renderRemote)
      } catch { /* LiveKit not configured — fall back to static thumbnail */ }
    }
    connect()
    return () => {
      disposed = true
      room.disconnect()
      viewerRoomRef.current = null
    }
  }, [stream.id, stream.live])

  // Load & subscribe to real-time comments
  useEffect(() => {
    let isMounted = true
    const formatComment = (c: any) => ({
      id: c.id,
      user: (c.profiles as any)?.full_name?.split(' ')[0] || '🧑🏾',
      avatar: (c.profiles as any)?.avatar_url || undefined,
      text: c.content,
      time: new Date(c.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    })

    const load = async () => {
      setCommentsLoading(true)
      const { data } = await supabase
        .from('stream_comments')
        .select('id, content, created_at, profiles:user_id(full_name, avatar_url)')
        .eq('stream_id', stream.id).eq('is_deleted', false)
        .order('created_at', { ascending: true }).limit(80)
      if (isMounted && data) setComments(data.map(formatComment))
      if (isMounted) setCommentsLoading(false)
    }
    load()

    // Real-time subscription for new comments
    const sub = supabase.channel(`modal-comments-${stream.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'stream_comments',
        filter: `stream_id=eq.${stream.id}`,
      }, async (payload: any) => {
        const { data: c } = await supabase
          .from('stream_comments')
          .select('id, content, created_at, profiles:user_id(full_name, avatar_url)')
          .eq('id', payload.new.id).single()
        if (isMounted && c) setComments(prev => [...prev, formatComment(c)])
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(sub)
    }
  }, [stream.id])

  // Auto-scroll to newest comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const sendComment = async () => {
    if (!comment.trim() || !user) return
    const text = comment.trim()
    setComment('')
    await supabase.from('stream_comments').insert({
      stream_id: stream.id, user_id: user.id, content: text,
    })
  }

  const sendGift = async (gift: typeof giftItems[0]) => {
    if (!user || giftSending) return
    setGifted(gift.name)
    setGiftSending(true)
    try {
      await supabase.from('stream_gifts').insert({
        stream_id: stream.id, sender_id: user.id,
        gift_type: gift.name, gift_emoji: gift.emoji, coins_cost: gift.price,
      })
      await supabase.rpc('increment_gifts_earned', { stream_row_id: stream.id, amount: gift.price })
    } catch { /* silently continue */ }
    setGiftSending(false)
  }

  const isInvitedGuest = user && stream.invitedCreatorId && stream.invitedCreatorId === user.id

  return (
    <>
      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Link copied!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="dark:bg-[#0D0A14] bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border dark:border-purple-900/20">

          {/* Stream view */}
          <div className="relative h-56 sm:h-64 bg-gradient-to-br from-pink-900/50 to-purple-900/50 flex items-center justify-center flex-shrink-0">
            {stream.thumbnail_url
              ? <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover absolute inset-0" />
              : <div className="text-8xl">{stream.emoji}</div>}

            {stream.live && (
              <div ref={liveVideoRef}
                className={`absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover transition-opacity ${liveVideoReady ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
            {stream.live && !liveVideoReady && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                <span className="text-[10px] text-white/70">Connecting to stream…</span>
              </div>
            )}

            {/* Top row */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {stream.live && <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">● LIVE</span>}
                {stream.trending && <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black">🔥 Trending</span>}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Bottom row */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full dark:bg-purple-900/40 bg-black/40 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                  {stream.avatar_url ? <img src={stream.avatar_url} alt={stream.creator} className="w-full h-full object-cover" /> : stream.creatorEmoji}
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{stream.creator}</p>
                  <p className="text-white/70 text-[10px] flex items-center gap-1"><Eye className="w-3 h-3" /> {stream.views}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Like */}
                <button onClick={toggleLike}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all backdrop-blur-sm ${liked ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}>
                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-white' : ''}`} /> {likeCount}
                </button>
                {/* Share */}
                <button onClick={handleShare}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                {/* Follow */}
                {user && stream.creatorId && stream.creatorId !== user.id && (
                  <button onClick={toggleFollow} disabled={followLoading}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg transition-all disabled:opacity-60 ${following ? 'bg-white/20 text-white border border-white/30' : 'bg-love-gradient text-white'}`}>
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold dark:text-white text-gray-100 text-sm leading-snug flex-1 mr-2 truncate">{stream.title}</h3>
              {/* Join as Guest button */}
              {isInvitedGuest && onJoinAsGuest && stream.live && (
                <button
                  onClick={() => { onClose(); onJoinAsGuest(stream.id, stream.title) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold flex-shrink-0 shadow-lg hover:opacity-90 transition-opacity">
                  <UserPlus2 className="w-3.5 h-3.5" /> Go Live as Guest
                </button>
              )}
            </div>

            {/* Gifts */}
            <div>
              <p className="text-[11px] dark:text-pink-300/60 text-gray-400 font-semibold mb-2">Send a gift</p>
              <div className="grid grid-cols-6 gap-2">
                {giftItems.map(g => (
                  <button key={g.name} onClick={() => sendGift(g)} disabled={!user || giftSending}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all disabled:opacity-50 ${gifted === g.name ? 'dark:bg-purple-800/30 bg-purple-100 ring-1 ring-brand-pink' : 'dark:bg-white/5 bg-gray-100 hover:dark:bg-white/8'}`}>
                    <span className="text-xl">{g.emoji}</span>
                    <span className={`text-[9px] font-bold ${g.color}`}>{g.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Comments */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-pink" />
                <p className="text-[11px] dark:text-pink-300/60 text-gray-400 font-semibold">
                  Live chat {stream.live && <span className="text-red-400 ml-1">● live</span>}
                </p>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {commentsLoading ? (
                  <p className="text-xs dark:text-purple-400/50 text-gray-400 italic">Loading…</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs dark:text-purple-400/50 text-gray-400 italic">Be the first to comment!</p>
                ) : (
                  comments.map((c, i) => (
                    <div key={c.id ?? i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-love-gradient flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 overflow-hidden mt-0.5">
                        {c.avatar ? <img src={c.avatar} alt={c.user} className="w-full h-full object-cover" /> : c.user[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold dark:text-purple-300 text-gray-700 mr-1">{c.user}</span>
                        <span className="text-xs dark:text-pink-50 text-gray-900 break-words">{c.text}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            <div className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()}
                placeholder={user ? 'Say something…' : 'Log in to comment'}
                disabled={!user}
                className="flex-1 px-3 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-100 text-sm dark:text-pink-50 text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none border dark:border-purple-500/15 border-transparent focus:dark:border-pink-500/30 disabled:opacity-50" />
              <button onClick={sendComment} disabled={!comment.trim() || !user}
                className="px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">Send</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

/* ── Creator Studio: Edit Modal ──────────────────────────────────────── */
interface MyStream {
  id: string; title: string; category: string; status: string
  thumbnail_url?: string; viewer_count: number; created_at: string
  comment_count?: number
}

function UserEditStreamModal({ stream, onClose, onSaved }: {
  stream: MyStream; onClose: () => void; onSaved: () => void
}) {
  const [title, setTitle] = useState(stream.title)
  const [category, setCategory] = useState(stream.category)
  const [thumbnail, setThumbnail] = useState(stream.thumbnail_url || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('livestreams').update({ title: title.trim(), category, thumbnail_url: thumbnail || null }).eq('id', stream.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100">
          <h2 className="font-bold text-sm dark:text-white text-gray-900 flex items-center gap-2"><Edit2 className="w-4 h-4 text-brand-pink" /> Edit Stream</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-50 border dark:border-purple-500/15 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:dark:border-pink-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-50 border dark:border-purple-500/15 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none">
              {['Music','Comedy','Tech','Fashion','Sports','Food','Education','Live'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 block mb-1">Thumbnail URL</label>
            <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://…"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-50 border dark:border-purple-500/15 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:dark:border-pink-500/30" />
          </div>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="w-full py-2.5 rounded-2xl bg-love-gradient text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Creator Studio: Stream Comments Modal ────────────────────────────── */
function StreamCommentsModal({ stream, userId, onClose }: {
  stream: MyStream; userId: string; onClose: () => void
}) {
  const [comments, setComments] = useState<{ id: number; user: string; text: string; time: string; userId?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('stream_comments')
        .select('id, content, created_at, user_id, profiles:user_id(full_name, avatar_url)')
        .eq('stream_id', stream.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        setComments(data.map((c: any) => ({
          id: c.id,
          user: (c.profiles as any)?.full_name || 'User',
          text: c.content,
          time: new Date(c.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
          userId: c.user_id,
        })))
      }
      setLoading(false)
    }
    load()
    // Realtime subscription
    const sub = supabase.channel(`stream-comments-${stream.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stream_comments', filter: `stream_id=eq.${stream.id}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [stream.id])

  const handleDelete = async (id: number) => {
    await supabase.from('stream_comments').update({ is_deleted: true }).eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md dark:bg-[#0D0A14] bg-white rounded-t-3xl sm:rounded-3xl border dark:border-white/8 border-gray-200 overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-sm dark:text-white text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-pink" /> Comments — {stream.title}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-brand-pink" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 dark:text-gray-500 text-gray-400 text-sm">No comments yet.</div>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl dark:bg-white/5 bg-gray-50 group">
                  <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.user[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold dark:text-white text-gray-900">{c.user}</p>
                    <p className="text-sm dark:text-gray-300 text-gray-700 mt-0.5">{c.text}</p>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-1">{c.time}</p>
                  </div>
                  <button onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg dark:bg-red-500/10 bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"
                    title="Delete comment">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SmartzTVPage() {
  const { user } = useAuth()
  const [streams, setStreams] = useState<Stream[]>([])
  const [adminLiveBanner, setAdminLiveBanner] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [showGoLiveModal, setShowGoLiveModal] = useState(false)
  const [liveTitle, setLiveTitle] = useState('')
  const [liveCategory, setLiveCategory] = useState('Music')
  const [liveThumbnailUrl, setLiveThumbnailUrl] = useState('')
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [goingLive, setGoingLive] = useState(false)
  const [broadcastData, setBroadcastData] = useState<BroadcastData | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  // Creator Studio state
  const [activeTab, setActiveTab] = useState<'watch' | 'studio'>('watch')
  const [myStreams, setMyStreams] = useState<MyStream[]>([])
  const [myStreamsLoading, setMyStreamsLoading] = useState(false)
  const [editingStream, setEditingStream] = useState<MyStream | null>(null)
  const [commentsStream, setCommentsStream] = useState<MyStream | null>(null)
  const [deleteStreamId, setDeleteStreamId] = useState<string | null>(null)
  const [deletingStream, setDeletingStream] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)

  // Dedicated query for admin broadcast — not subject to top-20 limit so the
  // banner always appears even if the admin stream has 0 viewers yet.
  const fetchAdminBanner = async () => {
    const { data } = await supabase
      .from('livestreams')
      .select('id, title, category, status, viewer_count, gifts_earned, thumbnail_url, creator_id, is_admin_broadcast')
      .eq('is_admin_broadcast', true)
      .eq('status', 'live')
      .limit(1)
      .maybeSingle()
    if (!data) { setAdminLiveBanner(null); return }
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', data.creator_id)
      .maybeSingle()
    const vc = data.viewer_count || 0
    setAdminLiveBanner({
      id: String(data.id), title: data.title || 'SmartzTV Live', creator: prof?.full_name || 'SmartzTV',
      creatorId: String(data.creator_id || ''), creatorEmoji: '📺', avatar_url: prof?.avatar_url,
      views: vc > 1000 ? `${(vc / 1000).toFixed(1)}K` : String(vc), likes: 0, duration: 'LIVE',
      category: data.category || 'Live', emoji: '📺', live: true, trending: false,
      gifts: data.gifts_earned || 0, verified: false, vip: false,
      thumbnail_url: data.thumbnail_url, isAdminBroadcast: true,
    })
  }

  const fetchStreams = async () => {
    setLoading(true)
    fetchAdminBanner()   // independent — runs in parallel with the main list
    try {
      // Fetch streams — no FK on creator_id so profiles join is done separately
      const { data: rows, error } = await supabase
        .from('livestreams')
        .select('id, title, category, status, viewer_count, gifts_earned, thumbnail_url, created_at, creator_id, is_admin_broadcast, invited_creator_id')
        .order('viewer_count', { ascending: false })
        .limit(20)

      if (error) throw error

      const creatorIds = [...new Set((rows || []).map((r: any) => r.creator_id).filter(Boolean))]
      let profileMap: Record<string, any> = {}
      if (creatorIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, is_verified, subscription_tier')
          .in('id', creatorIds)
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
        }
      }

      setStreams((rows || []).map((s: any) => {
        const cat = s.category || 'Music'
        const emojiMap: Record<string, string> = { Music: '🎵', Comedy: '😂', Tech: '💻', Fashion: '👗', Sports: '⚽', Food: '🍛', Education: '📚', Live: '📺' }
        const profile = profileMap[s.creator_id] || null
        const isLive = s.status === 'live'
        // Only show viewer count for live streams; ended/offline streams always show 0
        const vc = isLive ? (s.viewer_count || 0) : 0
        return {
          id: String(s.id),
          title: s.title || 'Untitled Stream',
          creator: profile?.full_name || 'Creator',
          creatorId: String(s.creator_id || ''),
          creatorEmoji: '🎬',
          avatar_url: profile?.avatar_url,
          views: vc > 1000 ? `${(vc / 1000).toFixed(1)}K` : String(vc),
          likes: 0,
          duration: s.status === 'live' ? 'LIVE' : '—',
          category: cat,
          emoji: emojiMap[cat] || '📺',
          live: isLive,
          trending: vc > 5000,
          gifts: s.gifts_earned || 0,
          verified: profile?.is_verified || false,
          vip: profile?.subscription_tier === 'vip',
          thumbnail_url: s.thumbnail_url,
          isAdminBroadcast: s.is_admin_broadcast ?? false,
          invitedCreatorId: s.invited_creator_id || undefined,
        }
      }))
    } catch {
      // Leave previous streams intact on error
    }
    setLoading(false)
  }

  useEffect(() => { fetchStreams() }, [])

  // Realtime: update viewer counts + detect admin going live + new streams
  useEffect(() => {
    const sub = supabase
      .channel('livestreams-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'livestreams' },
        (payload: any) => {
          const updated = payload.new
          if (!updated?.id) return
          const isLive = updated.status === 'live'
          const vc = isLive ? (updated.viewer_count ?? 0) : 0
          const viewStr = vc > 1000 ? `${(vc / 1000).toFixed(1)}K` : String(vc)

          // If this touches an admin broadcast, refresh the dedicated banner query
          if (updated.is_admin_broadcast) fetchAdminBanner()

          setStreams(prev => {
            const exists = prev.some(s => s.id === String(updated.id))
            if (!exists) { fetchStreams(); return prev }
            return prev.map(s => {
              if (s.id !== String(updated.id)) return s
              return { ...s, views: viewStr, live: isLive, isAdminBroadcast: updated.is_admin_broadcast ?? s.isAdminBroadcast }
            })
          })
          setSelectedStream(prev => {
            if (!prev || prev.id !== String(updated.id)) return prev
            return { ...prev, views: String(vc), live: isLive }
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'livestreams' },
        (payload: any) => {
          fetchStreams()
          // If the new stream is an admin broadcast, refresh banner immediately
          if (payload.new?.is_admin_broadcast) fetchAdminBanner()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  // Creator Studio: fetch user's own streams
  const fetchMyStreams = useCallback(async () => {
    if (!user?.id) return
    setMyStreamsLoading(true)
    const { data } = await supabase
      .from('livestreams')
      .select('id, title, category, status, thumbnail_url, viewer_count, created_at')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setMyStreams((data || []).map((s: any) => ({
      id: String(s.id),
      title: s.title || 'Untitled',
      category: s.category || 'General',
      status: s.status || 'ended',
      thumbnail_url: s.thumbnail_url,
      viewer_count: s.viewer_count || 0,
      created_at: s.created_at,
    })))
    setMyStreamsLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (activeTab === 'studio') fetchMyStreams()
  }, [activeTab, fetchMyStreams])

  const handleDeleteStream = async () => {
    if (!deleteStreamId) return
    setDeletingStream(true)
    await supabase.from('livestreams').delete().eq('id', deleteStreamId).eq('creator_id', user?.id || '')
    setMyStreams(prev => prev.filter(s => s.id !== deleteStreamId))
    setDeleteStreamId(null)
    setDeletingStream(false)
  }

  const handleShareStream = (stream: MyStream) => {
    const url = `${window.location.origin}/app/smartztv`
    if (navigator.share) {
      navigator.share({ title: stream.title, text: `Watch "${stream.title}" on SmartzTV!`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareToast(stream.title)
        setTimeout(() => setShareToast(null), 3000)
      }).catch(() => {})
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumbnail(true)
    try {
      const url = await uploadToSufy(file, 'covers')
      setLiveThumbnailUrl(url)
    } catch { /* ignore */ }
    setUploadingThumbnail(false)
  }

  const handleGoLive = async () => {
    if (!liveTitle.trim() || !user?.id) return
    setGoingLive(true)
    const title = liveTitle.trim()
    const { data: row, error } = await supabase.from('livestreams').insert({
      title,
      category: liveCategory,
      creator_id: user.id,
      status: 'live',
      thumbnail_url: liveThumbnailUrl.trim() || null,
    }).select('id').single()
    if (error) console.error('[Go Live] insert error:', error.message)

    if (!error && row?.id) {
      setShowGoLiveModal(false)
      setLiveTitle('')
      setLiveThumbnailUrl('')
      fetchStreams()
      setBroadcastData({ streamId: String(row.id), title })
      // Self-confirmation push (system type bypasses self-push guard)
      notifyUser({
        userId: user.id,
        type: 'system',
        title: '📺 You\'re Live!',
        message: `"${title}" is now streaming on SmartzTV!`,
        actionUrl: '/app/smartztv',
        emoji: '📺',
      }).catch(() => {})

      // Fan-out: notify all followers that this user just went live
      ;(async () => {
        try {
          const { data: followers } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id)
            .limit(200)
          if (!followers?.length) return
          const myProfile = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
          const creatorName = myProfile.data?.full_name || 'Someone'
          // Fire in parallel batches to avoid Promise.all hanging on errors
          const notifyAll = followers.map(f =>
            notifyUser({
              userId: f.follower_id,
              type: 'live_stream',
              title: `📺 ${creatorName} is LIVE!`,
              message: `${creatorName} just started streaming "${title}". Watch now!`,
              actionUrl: '/app/smartztv',
              emoji: '🔴',
            }).catch(() => {})
          )
          await Promise.allSettled(notifyAll)
        } catch {
          // Silently swallow — follower fan-out must never block go-live
        }
      })().catch(() => {})
    }
    setGoingLive(false)
  }

  const filtered = streams.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.creator.toLowerCase().includes(search.toLowerCase())
    if (activeCategory === 'Live') return matchSearch && s.live
    return matchSearch && (activeCategory === 'All' || s.category === activeCategory)
  })

  const liveCount = streams.filter(s => s.live).length

  return (
    <div className="h-full overflow-y-auto dark:bg-[#0A0710] bg-gray-50 pb-4 relative">
      {/* Live broadcaster overlay */}
      <AnimatePresence>
        {broadcastData && (
          <SmartzTVBroadcaster
            data={broadcastData}
            onEnd={() => { setBroadcastData(null); fetchStreams() }}
          />
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Link copied for "{shareToast}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#0D0A14] bg-white border-b dark:border-purple-900/20 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-black dark:text-white text-gray-900 flex items-center gap-2">
              <Tv className="w-5 h-5 text-brand-pink" /> SmartzTV
            </h1>
            <p className="text-xs dark:text-pink-300/60 text-gray-500">Live & on-demand streaming</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={activeTab === 'watch' ? fetchStreams : fetchMyStreams}
              className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
            </button>
            {liveCount > 0 && activeTab === 'watch' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500">{liveCount} live</span>
              </div>
            )}
            <button onClick={() => setShowGoLiveModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold hover:opacity-90 transition-opacity">
              <Radio className="w-3.5 h-3.5" /> Go Live
            </button>
          </div>
        </div>

        {/* Watch / Creator Studio tab switcher */}
        <div className="flex gap-1 p-1 dark:bg-white/5 bg-gray-100 rounded-xl mb-3">
          <button onClick={() => setActiveTab('watch')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'watch' ? 'bg-love-gradient text-white shadow' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            <Play className="w-3.5 h-3.5" /> Watch
          </button>
          <button onClick={() => setActiveTab('studio')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'studio' ? 'bg-love-gradient text-white shadow' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            <Clapperboard className="w-3.5 h-3.5" /> Creator Studio
          </button>
        </div>

        {/* Search + categories only in Watch tab */}
        {activeTab === 'watch' && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search streams, creators…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:border dark:border-purple-500/15 border border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 focus:outline-none focus:dark:border-pink-500/30 transition-colors" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-purple-300/70 text-gray-600 hover:text-brand-pink'}`}>
                  {cat === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-1 animate-pulse" />}
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Watch Tab */}
      {activeTab === 'watch' && (
        <div className="px-4 py-4">
          {/* ── Admin Broadcast Banner ─────────────────────────────────── */}
          {adminLiveBanner && (() => {
            const adminLive = adminLiveBanner
            return (
              <motion.button
                key={adminLive.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedStream(adminLive)}
                className="w-full mb-5 rounded-2xl overflow-hidden border-2 border-red-500/60 shadow-xl shadow-red-500/20 relative cursor-pointer group"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 via-pink-900/80 to-purple-900/90" />
                {adminLive.thumbnail_url && (
                  <img src={adminLive.thumbnail_url} alt={adminLive.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                )}

                {/* Content */}
                <div className="relative p-4 flex items-center gap-4">
                  {/* Pulsing live dot */}
                  <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/40">
                    <Tv className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
                      </span>
                      <span className="text-[10px] text-white/60 font-semibold">📺 Official Broadcast</span>
                    </div>
                    <p className="font-black text-white text-sm leading-tight truncate">{adminLive.title}</p>
                    <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {adminLive.views} watching — tap to watch live
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })()}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
              <p className="text-sm dark:text-pink-300/60 text-gray-500">Loading streams…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="text-5xl">📺</div>
              <p className="font-bold dark:text-white text-gray-900">No streams yet</p>
              <p className="text-sm dark:text-pink-300/60 text-gray-500">Be the first to go live on SmartzTV!</p>
              <button onClick={() => { setActiveTab('studio'); setShowGoLiveModal(true) }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/20">
                <Radio className="w-4 h-4" /> Go Live Now
              </button>
            </div>
          ) : (
            <>
              {filtered.some(s => s.live) && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="font-bold text-sm dark:text-white text-gray-900">Live Now</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.filter(s => s.live).map((stream, i) => (
                      <StreamCard key={stream.id} stream={stream} i={i} onClick={() => setSelectedStream(stream)} />
                    ))}
                  </div>
                </div>
              )}
              {filtered.some(s => !s.live) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-brand-pink" />
                    <h2 className="font-bold text-sm dark:text-white text-gray-900">Trending Videos</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.filter(s => !s.live).map((stream, i) => (
                      <StreamCard key={stream.id} stream={stream} i={i} onClick={() => setSelectedStream(stream)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Creator Studio Tab */}
      {activeTab === 'studio' && (
        <div className="px-4 py-4 space-y-4">
          {/* Studio header */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-purple-900/15 border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold dark:text-white text-gray-900">Creator Studio</h2>
                <p className="text-xs dark:text-pink-300/60 text-gray-500">Manage your streams, view analytics & comments</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'My Streams', value: myStreams.length.toString() },
                { label: 'Live Now',   value: myStreams.filter(s => s.status === 'live').length.toString() },
                { label: 'Total Views', value: myStreams.reduce((a, s) => a + s.viewer_count, 0).toLocaleString() },
              ].map(stat => (
                <div key={stat.label} className="dark:bg-white/5 bg-gray-50 rounded-xl p-2.5">
                  <p className="font-black text-lg dark:text-white text-gray-900">{stat.value}</p>
                  <p className="text-[10px] dark:text-gray-400 text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* My Streams list */}
          {myStreamsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-pink" /></div>
          ) : myStreams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🎬</div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">No streams yet</p>
              <p className="text-sm dark:text-pink-300/60 text-gray-500 mb-4">Go live to start building your audience!</p>
              <button onClick={() => setShowGoLiveModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-love-gradient text-white font-bold text-sm mx-auto">
                <Radio className="w-4 h-4" /> Start Your First Stream
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-bold text-sm dark:text-white text-gray-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-brand-pink" /> My Streams
              </h3>
              {myStreams.map((stream, i) => (
                <motion.div key={stream.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-purple-900/15 border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl dark:bg-white/5 bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
                      {stream.thumbnail_url
                        ? <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
                        : '📺'}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{stream.title}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black flex-shrink-0 ${stream.status === 'live' ? 'bg-red-500 text-white' : 'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-600'}`}>
                          {stream.status === 'live' ? '● LIVE' : stream.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">{stream.category} · <Eye className="w-3 h-3 inline" /> {stream.viewer_count} views</p>
                      <p className="text-[10px] dark:text-gray-500 text-gray-400">{new Date(stream.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-0 border-t dark:border-white/5 border-gray-100 divide-x dark:divide-white/5 divide-gray-100">
                    <button onClick={() => handleShareStream(stream)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold dark:text-gray-400 text-gray-600 hover:text-emerald-500 transition-colors">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button onClick={() => setEditingStream(stream)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold dark:text-gray-400 text-gray-600 hover:text-blue-500 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setCommentsStream(stream)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold dark:text-gray-400 text-gray-600 hover:text-purple-500 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Comments
                    </button>
                    <button onClick={() => setDeleteStreamId(stream.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold dark:text-gray-400 text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stream modal (Watch tab) */}
      <AnimatePresence>
        {selectedStream && (
          <StreamModal
            stream={selectedStream}
            onClose={() => setSelectedStream(null)}
            onJoinAsGuest={(streamId, title) => {
              setSelectedStream(null)
              setBroadcastData({ streamId, title, guestName: user?.email?.split('@')[0] || 'Guest' })
            }}
          />
        )}
      </AnimatePresence>

      {/* Creator Studio: Edit modal */}
      <AnimatePresence>
        {editingStream && (
          <UserEditStreamModal
            stream={editingStream}
            onClose={() => setEditingStream(null)}
            onSaved={fetchMyStreams}
          />
        )}
      </AnimatePresence>

      {/* Creator Studio: Comments modal */}
      <AnimatePresence>
        {commentsStream && user && (
          <StreamCommentsModal
            stream={commentsStream}
            userId={user.id}
            onClose={() => setCommentsStream(null)}
          />
        )}
      </AnimatePresence>

      {/* Creator Studio: Delete confirmation */}
      <AnimatePresence>
        {deleteStreamId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-xs dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-6 text-center shadow-2xl">
              <div className="text-4xl mb-3">🗑️</div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">Delete stream?</p>
              <p className="text-sm dark:text-gray-400 text-gray-500 mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteStreamId(null)} className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700">Cancel</button>
                <button onClick={handleDeleteStream} disabled={deletingStream} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-60">
                  {deletingStream ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Go Live modal */}
      <AnimatePresence>
        {showGoLiveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowGoLiveModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="dark:bg-[#0D0A14] bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden border dark:border-purple-900/20">
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-purple-900/20 border-gray-100">
                <h2 className="font-display font-black text-lg dark:text-white text-gray-900 flex items-center gap-2"><Radio className="w-5 h-5 text-red-500" /> Go Live</h2>
                <button onClick={() => setShowGoLiveModal(false)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center"><X className="w-4 h-4 dark:text-gray-400 text-gray-600" /></button>
              </div>
              <div className="p-5 space-y-4">
                <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder="Stream title*"
                  className="w-full px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-500/30" />
                <select value={liveCategory} onChange={e => setLiveCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none">
                  {categories.filter(c => c !== 'All' && c !== 'Live').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* Thumbnail upload */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold dark:text-purple-300/70 text-gray-600">Thumbnail (optional)</p>
                  <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                  <div className="flex items-center gap-2">
                    {liveThumbnailUrl && (
                      <img src={liveThumbnailUrl} alt="thumbnail preview" className="w-10 h-10 rounded-xl object-cover border dark:border-purple-500/20 border-gray-200 flex-shrink-0" />
                    )}
                    <button type="button" onClick={() => thumbnailInputRef.current?.click()} disabled={uploadingThumbnail}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-purple-900/10 bg-gray-50 border dark:border-purple-500/15 border-gray-200 text-xs font-semibold dark:text-gray-300 text-gray-700 hover:dark:border-pink-500/30 transition-colors disabled:opacity-50 whitespace-nowrap">
                      {uploadingThumbnail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      {uploadingThumbnail ? 'Uploading…' : 'Upload Thumbnail'}
                    </button>
                  </div>
                  <input value={liveThumbnailUrl} onChange={e => setLiveThumbnailUrl(e.target.value)}
                    placeholder="https://… or upload above"
                    className="w-full px-4 py-2.5 rounded-xl dark:bg-purple-900/10 bg-gray-50 dark:text-white text-gray-900 placeholder:dark:text-purple-400/50 placeholder:text-gray-400 border dark:border-purple-500/15 border-gray-200 text-sm focus:outline-none focus:dark:border-pink-500/30" />
                </div>
                <button onClick={handleGoLive} disabled={!liveTitle.trim() || goingLive}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {goingLive ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Radio className="w-4 h-4" /> Start Streaming</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StreamCard({ stream, i, onClick }: { stream: Stream; i: number; onClick: () => void }) {
  return (
    <motion.div key={stream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      onClick={onClick} className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-purple-900/15 border-gray-200 overflow-hidden cursor-pointer hover:dark:border-pink-500/20 hover:border-brand-pink/30 transition-all shadow-sm group">
      <div className="relative h-36 bg-gradient-to-br from-pink-900/40 to-purple-900/40 flex items-center justify-center overflow-hidden">
        {stream.thumbnail_url
          ? <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
          : <span className="text-5xl group-hover:scale-110 transition-transform">{stream.emoji}</span>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {stream.live && <span className="px-2 py-1 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">● LIVE</span>}
          {stream.trending && <span className="px-2 py-1 rounded-full bg-amber-500 text-white text-[9px] font-black">🔥</span>}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 dark:bg-black/60 bg-black/60 rounded-full px-2 py-0.5">
          <Eye className="w-3 h-3 text-white/80" />
          <span className="text-[10px] text-white/80 font-semibold">{stream.views}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-sm dark:text-white text-gray-900 truncate mb-1">{stream.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full dark:bg-purple-900/20 bg-gray-100 flex items-center justify-center text-xs overflow-hidden">
              {stream.avatar_url ? <img src={stream.avatar_url} alt={stream.creator} className="w-full h-full object-cover" /> : stream.creatorEmoji}
            </div>
            <span className="text-xs dark:text-pink-300/70 text-gray-500 truncate max-w-[90px]">{stream.creator}</span>
            {stream.verified && <span className="text-blue-400 text-[10px]">✓</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] dark:text-purple-400/60 text-gray-400">
            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{stream.likes}</span>
            {stream.gifts > 0 && <span className="flex items-center gap-0.5"><Gift className="w-3 h-3 text-amber-400" />{stream.gifts}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
