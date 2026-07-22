/**
 * StudioBroadcastModal — YouTube Live broadcast management panel.
 * Guides admins through OBS/vMix setup, stream key entry, and go-live control.
 * Provider-agnostic interface: swap YouTubeProvider for any other in src/lib/streaming/.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Copy, CheckCircle, Eye, EyeOff, Radio, WifiOff,
  RefreshCw, Play, Power, PowerOff, Antenna, Monitor,
  ChevronDown, AlertCircle, Zap, Info, BarChart3,
  Settings2, Key, Code2, Loader2, Signal, Clock, Users,
  ExternalLink, ArrowRight, Shield, Globe, PlaySquare,
  Tv, CheckCircle2, RotateCcw, Save, Tag, Link,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SmartzTVPlayer from '@/components/SmartzTVPlayer'
import { youtubeProvider, YOUTUBE_RTMP_URL, YOUTUBE_RTMPS_URL } from '@/lib/streaming'
import StreamAnalytics from '@/components/smartztv/StreamAnalytics'
import ScheduleManager from '@/components/smartztv/ScheduleManager'
import CommentModerationPanel from '@/components/smartztv/CommentModerationPanel'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TVChannel {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  cover_url: string | null
  description: string | null
  category: string
  youtube_video_id: string | null
  youtube_channel_id: string | null
  stream_key: string | null
  playback_url: string | null
  stream_status: 'idle' | 'active' | 'disconnected'
  is_active: boolean
  is_featured: boolean
  display_order: number
  current_program: string | null
  viewer_count: number
  last_broadcast_at: string | null
  created_at: string
}

type MainTab    = 'setup' | 'encoders' | 'moderation' | 'schedule' | 'analytics'
type EncoderTab = 'obs' | 'vmix' | 'streamlabs' | 'ffmpeg'

interface StudioBroadcastModalProps {
  channel: TVChannel
  onClose: () => void
  onChannelUpdated: (ch: TVChannel) => void
}

// ── CopyField helper ───────────────────────────────────────────────────────────

function CopyField({
  label, value, secret = false, mono = true,
}: { label: string; value: string; secret?: boolean; mono?: boolean }) {
  const [copied, setCopied]     = useState(false)
  const [revealed, setRevealed] = useState(false)
  const display = secret && !revealed ? '•'.repeat(Math.min(value.length || 20, 32)) : value

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 group">
        <code className={`flex-1 text-[11px] truncate select-all leading-relaxed ${mono ? 'font-mono text-green-400' : 'text-white'}`}>
          {value ? display : <span className="text-gray-600 italic">Not set</span>}
        </code>
        {secret && value && (
          <button onClick={() => setRevealed(v => !v)}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            {revealed ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        )}
        {value && (
          <button onClick={copy}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TVChannel['stream_status'] }) {
  const cfg = {
    active:       { cls: 'bg-red-500/20 text-red-400 border-red-500/30',       dot: 'bg-red-500 animate-pulse', label: 'LIVE' },
    disconnected: { cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500',             label: 'DISCONNECTED' },
    idle:         { cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30',    dot: 'bg-gray-500',              label: 'IDLE' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── OBS Guide ─────────────────────────────────────────────────────────────────

function OBSGuide({ streamKey }: { streamKey: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          OBS Studio 28+ recommended. Use <strong>RTMPS</strong> for encrypted broadcast.
        </p>
      </div>
      {[
        { n: 1, text: 'Open OBS Studio → Click Settings (bottom right)' },
        { n: 2, text: 'Go to Stream tab → Service: select YouTube / YouTube - RTMPS' },
        { n: 3, text: 'Or select "Custom" and paste the RTMPS server URL manually' },
        { n: 4, text: 'Stream Key: paste the YouTube Stream Key below (keep this secret!)' },
        { n: 5, text: 'Click Apply → OK → Start Streaming' },
        { n: 6, text: 'YouTube processes the stream — paste the Video ID into the channel settings' },
      ].map(s => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
          <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
        </div>
      ))}
      <div className="mt-4 space-y-3">
        <CopyField label="RTMPS Server (OBS: Stream → Server)" value={YOUTUBE_RTMPS_URL} />
        <CopyField label="RTMP Server (fallback)" value={YOUTUBE_RTMP_URL} />
        {streamKey && <CopyField label="YouTube Stream Key" value={streamKey} secret />}
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-1.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recommended OBS Settings</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
          <span className="text-gray-500">Encoder</span><span>x264 or NVENC</span>
          <span className="text-gray-500">Rate Control</span><span>CBR</span>
          <span className="text-gray-500">Bitrate</span><span>4000–8000 kbps</span>
          <span className="text-gray-500">Keyframe Interval</span><span>2 seconds</span>
          <span className="text-gray-500">Profile</span><span>high</span>
          <span className="text-gray-500">Audio Bitrate</span><span>160 kbps</span>
        </div>
      </div>
    </div>
  )
}

// ── vMix Guide ────────────────────────────────────────────────────────────────

function VMixGuide({ streamKey }: { streamKey: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-xs text-purple-300">
          vMix 24+ supports RTMPS natively. Use External Output for best quality.
        </p>
      </div>
      {[
        { n: 1, text: 'In vMix → click the Stream button (top toolbar)' },
        { n: 2, text: 'Destination: select YouTube or Custom RTMP' },
        { n: 3, text: 'URL: paste the RTMPS Server URL (or use the YouTube preset)' },
        { n: 4, text: 'Stream Key / Password: paste the YouTube Stream Key' },
        { n: 5, text: 'Quality: set to 1080p / 4000–8000 kbps → Click OK' },
        { n: 6, text: 'Click Stream button again → status turns green when connected' },
      ].map(s => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
          <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
        </div>
      ))}
      <div className="mt-4 space-y-3">
        <CopyField label="RTMPS URL" value={YOUTUBE_RTMPS_URL} />
        {streamKey && <CopyField label="YouTube Stream Key" value={streamKey} secret />}
      </div>
    </div>
  )
}

// ── Streamlabs Guide ──────────────────────────────────────────────────────────

function StreamlabsGuide({ streamKey }: { streamKey: string }) {
  return (
    <div className="space-y-4">
      {[
        { n: 1, text: 'Open Streamlabs → Settings → Stream' },
        { n: 2, text: 'Platform: select YouTube or Custom RTMP' },
        { n: 3, text: 'Server: paste the RTMPS server URL' },
        { n: 4, text: 'Stream Key: paste the YouTube Stream Key' },
        { n: 5, text: 'Click Done → click Go Live in Streamlabs' },
      ].map(s => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
          <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
        </div>
      ))}
      <div className="mt-4 space-y-3">
        <CopyField label="Server" value={YOUTUBE_RTMPS_URL} />
        {streamKey && <CopyField label="Stream Key" value={streamKey} secret />}
      </div>
    </div>
  )
}

// ── FFmpeg Guide ──────────────────────────────────────────────────────────────

function FFmpegGuide({ streamKey }: { streamKey: string }) {
  const cmd = streamKey
    ? `ffmpeg -re -i input.mp4 -c:v libx264 -preset veryfast -b:v 4000k -maxrate 4000k -bufsize 8000k -g 60 -c:a aac -b:a 160k -f flv "${YOUTUBE_RTMP_URL}/${streamKey}"`
    : `ffmpeg -re -i input.mp4 -c:v libx264 -preset veryfast -b:v 4000k -c:a aac -b:a 160k -f flv "${YOUTUBE_RTMP_URL}/<YOUR_STREAM_KEY>"`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Code2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300">Use this to stream video files or test broadcasts from the terminal.</p>
      </div>
      <div className="space-y-3">
        <CopyField label="RTMP URL" value={YOUTUBE_RTMP_URL} />
        {streamKey && <CopyField label="Stream Key" value={streamKey} secret />}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Example FFmpeg Command</p>
        <div className="bg-black/60 border border-white/8 rounded-xl p-3">
          <code className="text-[10px] font-mono text-green-400 break-all leading-relaxed">{cmd}</code>
        </div>
      </div>
    </div>
  )
}

// ── Setup Tab — YouTube credentials + go live control ─────────────────────────

function SetupTab({
  channel, onChannelUpdated,
}: { channel: TVChannel; onChannelUpdated: (ch: TVChannel) => void }) {
  const [videoId, setVideoId]       = useState(channel.youtube_video_id || '')
  const [channelId, setChannelId]   = useState(channel.youtube_channel_id || '')
  const [streamKey, setStreamKey]   = useState(channel.stream_key || '')
  const [program, setProgram]       = useState(channel.current_program || '')
  const [saving, setSaving]         = useState(false)
  const [goingLive, setGoingLive]   = useState(false)
  const [endingLive, setEndingLive] = useState(false)
  const [toast, setToast]           = useState('')
  const [showPreview, setShowPreview] = useState(
    channel.stream_status === 'active' && !!channel.youtube_video_id
  )

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Parse & validate YouTube video ID from full URL or bare ID
  const parsedId = youtubeProvider.parseVideoId(videoId)

  const save = async () => {
    setSaving(true)
    const updates: Partial<TVChannel> = {
      youtube_video_id:  parsedId || null,
      youtube_channel_id: channelId.trim() || null,
      stream_key:         streamKey.trim() || null,
      current_program:    program.trim() || null,
    }
    const { data, error } = await supabase
      .from('tv_channels').update(updates).eq('id', channel.id).select().single()
    setSaving(false)
    if (error) { showToast('Error saving: ' + error.message); return }
    onChannelUpdated(data as TVChannel)
    showToast('Settings saved')
  }

  const goLive = async () => {
    setGoingLive(true)
    const { data, error } = await supabase.from('tv_channels')
      .update({ stream_status: 'active', is_active: true, last_broadcast_at: new Date().toISOString() })
      .eq('id', channel.id).select().single()
    setGoingLive(false)
    if (error) { showToast('Error: ' + error.message); return }
    onChannelUpdated(data as TVChannel)
    setShowPreview(true)
    showToast('🔴 Channel marked as LIVE')
  }

  const endLive = async () => {
    setEndingLive(true)
    const { data, error } = await supabase.from('tv_channels')
      .update({ stream_status: 'idle' })
      .eq('id', channel.id).select().single()
    setEndingLive(false)
    if (error) { showToast('Error: ' + error.message); return }
    onChannelUpdated(data as TVChannel)
    setShowPreview(false)
    showToast('Stream ended')
  }

  const isLive = channel.stream_status === 'active'

  return (
    <div className="space-y-5 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-xl whitespace-nowrap">
            <CheckCircle className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status + Go Live button */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/4 border border-white/8">
        <div className="flex items-center gap-3">
          <StatusBadge status={channel.stream_status} />
          {isLive && channel.youtube_video_id && (
            <a href={youtubeProvider.getShareUrl(channel.youtube_video_id)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Watch on YouTube
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <button onClick={endLive} disabled={endingLive}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-600/40 hover:bg-gray-600/60 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {endingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
              End Stream
            </button>
          ) : (
            <button onClick={goLive} disabled={goingLive || !parsedId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              title={!parsedId ? 'Enter a YouTube Video ID first' : ''}>
              {goingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              Go Live
            </button>
          )}
        </div>
      </div>

      {/* Live preview */}
      {showPreview && (channel.youtube_video_id || channel.youtube_channel_id) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" /> Live Preview
            </p>
            <button onClick={() => setShowPreview(false)} className="text-xs text-gray-600 hover:text-gray-400">Hide</button>
          </div>
          <SmartzTVPlayer
            videoId={channel.youtube_video_id}
            channelId={channel.youtube_channel_id}
            poster={channel.cover_url}
            isLive={isLive}
            title={channel.name}
            viewerCount={channel.viewer_count}
            showStudioLink
          />
        </div>
      )}
      {!showPreview && (channel.youtube_video_id || channel.youtube_channel_id) && (
        <button onClick={() => setShowPreview(true)}
          className="w-full py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/6 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
          <Play className="w-4 h-4" /> Show Preview
        </button>
      )}

      {/* YouTube credentials form */}
      <div className="space-y-4 p-4 rounded-2xl bg-white/3 border border-white/8">
        <div className="flex items-center gap-2 mb-1">
          <PlaySquare className="w-4 h-4 text-red-400" />
          <p className="text-sm font-bold text-white">YouTube Live Settings</p>
        </div>

        {/* Video ID */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
            YouTube Video / Broadcast ID *
          </label>
          <input
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
            placeholder="Paste YouTube URL or 11-char video ID"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 font-mono"
          />
          {videoId && (
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${parsedId ? 'text-emerald-400' : 'text-red-400'}`}>
              {parsedId
                ? <><CheckCircle className="w-3 h-3" /> Valid ID: {parsedId}</>
                : <><AlertCircle className="w-3 h-3" /> Invalid YouTube URL or video ID</>}
            </p>
          )}
          <p className="text-[10px] text-gray-600 mt-1">
            From YouTube Studio → Go Live → copy the video ID from the URL (e.g. youtube.com/watch?v=<strong>XXXXXXXXXXX</strong>)
          </p>
        </div>

        {/* Channel ID */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
            YouTube Channel ID <span className="text-gray-600 normal-case font-normal">(fallback embed)</span>
          </label>
          <input
            value={channelId}
            onChange={e => setChannelId(e.target.value)}
            placeholder="UC…"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 font-mono"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            Found in YouTube Studio → Settings → Channel → Advanced Settings
          </p>
        </div>

        {/* Stream key */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Key className="w-3 h-3" /> Stream Key <span className="text-gray-600 normal-case font-normal">(stored securely, for OBS/vMix)</span>
          </label>
          <CopyField label="" value={streamKey} secret={!!streamKey} />
          <input
            value={streamKey}
            onChange={e => setStreamKey(e.target.value)}
            placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 font-mono mt-2"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            From YouTube Studio → Go Live → Stream Settings → Stream key
          </p>
        </div>

        {/* Current program */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Current Program / Show Name
          </label>
          <input
            value={program}
            onChange={e => setProgram(e.target.value)}
            placeholder="e.g. Morning News with Jane"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* YouTube Studio link */}
      <a href="https://studio.youtube.com/channel/mine/livestreaming/manage"
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-colors text-sm font-semibold">
        <PlaySquare className="w-4 h-4" />
        Open YouTube Studio
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export default function StudioBroadcastModal({ channel, onClose, onChannelUpdated }: StudioBroadcastModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('setup')
  const [encoderTab, setEncoderTab] = useState<EncoderTab>('obs')
  const [localChannel, setLocalChannel] = useState(channel)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Keep localChannel in sync when parent updates channel prop
  useEffect(() => { setLocalChannel(channel) }, [channel])

  const handleChannelUpdated = (ch: TVChannel) => {
    setLocalChannel(ch)
    onChannelUpdated(ch)
  }

  const tabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'setup',       label: 'Setup',      icon: Settings2   },
    { id: 'encoders',    label: 'Encoders',   icon: Monitor     },
    { id: 'moderation',  label: 'Moderate',   icon: Shield      },
    { id: 'schedule',    label: 'Schedule',   icon: Clock       },
    { id: 'analytics',   label: 'Analytics',  icon: BarChart3   },
  ]

  const encoderTabs: { id: EncoderTab; label: string }[] = [
    { id: 'obs',        label: 'OBS' },
    { id: 'vmix',       label: 'vMix' },
    { id: 'streamlabs', label: 'Streamlabs' },
    { id: 'ffmpeg',     label: 'FFmpeg' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div ref={overlayRef} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-3xl bg-[#0c0920] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-pink-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white truncate">{localChannel.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={localChannel.stream_status} />
              {localChannel.viewer_count > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {localChannel.viewer_count.toLocaleString()} watching
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 overflow-x-auto scrollbar-none flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-violet-400 border-violet-400'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'setup' && (
            <SetupTab channel={localChannel} onChannelUpdated={handleChannelUpdated} />
          )}

          {activeTab === 'encoders' && (
            <div className="space-y-4">
              {/* Encoder sub-tabs */}
              <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
                {encoderTabs.map(t => (
                  <button key={t.id} onClick={() => setEncoderTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      encoderTab === t.id
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {encoderTab === 'obs'        && <OBSGuide        streamKey={localChannel.stream_key || ''} />}
              {encoderTab === 'vmix'       && <VMixGuide       streamKey={localChannel.stream_key || ''} />}
              {encoderTab === 'streamlabs' && <StreamlabsGuide streamKey={localChannel.stream_key || ''} />}
              {encoderTab === 'ffmpeg'     && <FFmpegGuide     streamKey={localChannel.stream_key || ''} />}
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="h-[500px]">
              <CommentModerationPanel
                channelId={localChannel.id}
                broadcastId={localChannel.youtube_video_id}
              />
            </div>
          )}

          {activeTab === 'schedule' && (
            <ScheduleManager channelId={localChannel.id} channelName={localChannel.name} />
          )}

          {activeTab === 'analytics' && (
            <StreamAnalytics
              channelId={localChannel.id}
              broadcastId={localChannel.youtube_video_id}
              viewerCount={localChannel.viewer_count}
              isLive={localChannel.stream_status === 'active'}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}
