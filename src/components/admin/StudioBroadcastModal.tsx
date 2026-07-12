/**
 * StudioBroadcastModal — Full OBS/vMix-compatible broadcast management panel
 * Replaces the old inline BroadcastSetupModal with a complete control room UI.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Copy, CheckCircle, Eye, EyeOff, Radio, Wifi, WifiOff,
  RefreshCw, Trash2, Play, Power, PowerOff, Antenna, Monitor,
  ChevronDown, AlertCircle, RotateCcw, Zap, Info, BarChart3,
  Settings2, Key, Code2, Loader2, Signal, Clock, Users,
  ExternalLink, ArrowRight, Shield, Globe,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SmartzTVPlayer from '@/components/SmartzTVPlayer'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TVChannel {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  cover_url: string | null
  description: string | null
  category: string
  mux_stream_id: string | null
  mux_playback_id: string | null
  stream_key: string | null
  rtmp_url: string | null
  srt_url: string | null
  whip_url: string | null
  playback_url: string | null
  stream_status: 'idle' | 'active' | 'disconnected'
  is_active: boolean
  is_featured: boolean
  display_order: number
  current_program: string | null
  viewer_count: number
  latency_mode: string | null
  reconnect_window: number | null
  health_data: Record<string, unknown> | null
  last_broadcast_at: string | null
  created_at: string
}

type MainTab   = 'setup' | 'credentials' | 'encoders' | 'health'
type EncoderTab = 'obs' | 'vmix' | 'streamlabs' | 'ffmpeg' | 'srt'

interface StudioBroadcastModalProps {
  channel: TVChannel
  onClose: () => void
  onChannelUpdated: (ch: TVChannel) => void
}

// ── CopyField helper ───────────────────────────────────────────────────────────

function CopyField({
  label, value, secret = false, onRotate, rotating,
}: {
  label: string; value: string; secret?: boolean; onRotate?: () => void; rotating?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const display = secret && !revealed ? '•'.repeat(Math.min(value.length, 32)) : value

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 group">
        <code className="flex-1 text-[11px] font-mono text-green-400 truncate select-all leading-relaxed">
          {display}
        </code>
        {secret && (
          <button onClick={() => setRevealed(v => !v)}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            {revealed ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        )}
        <button onClick={copy}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
          {copied
            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        {onRotate && (
          <button onClick={onRotate} disabled={rotating}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            title="Rotate key — generates a new stream key (OBS will need to be updated)">
            {rotating
              ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              : <RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
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

// ── Encoder guides ─────────────────────────────────────────────────────────────

function OBSGuide({ rtmpUrl, streamKey }: { rtmpUrl: string; streamKey: string }) {
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
        { n: 2, text: 'Go to Stream tab → Service: select Custom' },
        { n: 3, text: 'Server: paste the RTMPS Server URL below' },
        { n: 4, text: 'Stream Key: paste the Stream Key below (keep this secret!)' },
        { n: 5, text: 'Click Apply → OK → Start Streaming' },
        { n: 6, text: 'Wait ~15 seconds — preview appears in the Monitor tab' },
      ].map(s => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
          <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
        </div>
      ))}
      <div className="mt-4 space-y-3">
        <CopyField label="RTMPS Server (OBS: Stream → Server)" value={rtmpUrl} />
        <CopyField label="Stream Key (OBS: Stream → Stream Key)" value={streamKey} secret />
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

function VMixGuide({ rtmpUrl, streamKey }: { rtmpUrl: string; streamKey: string }) {
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
        { n: 2, text: 'Destination: select Custom RTMP' },
        { n: 3, text: 'URL: paste the RTMPS Server URL' },
        { n: 4, text: 'Stream Key / Password: paste the Stream Key' },
        { n: 5, text: 'Quality: set to 1080p / 4000–8000 kbps → Click OK' },
        { n: 6, text: 'Click Stream button again → status turns green when connected' },
      ].map(s => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
          <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
        </div>
      ))}
      <div className="mt-4 space-y-3">
        <CopyField label="RTMPS URL (vMix: Stream → URL)" value={rtmpUrl} />
        <CopyField label="Stream Key / Password" value={streamKey} secret />
      </div>
    </div>
  )
}

function StreamlabsGuide({ rtmpUrl, streamKey }: { rtmpUrl: string; streamKey: string }) {
  return (
    <div className="space-y-4">
      {[
        { n: 1, text: 'Open Streamlabs Desktop → Settings (gear icon)' },
        { n: 2, text: 'Go to Stream tab → Stream Type: Custom Streaming Server' },
        { n: 3, text: 'URL: paste the RTMPS Server URL' },
        { n: 4, text: 'Stream Key: paste the Stream Key' },
        { n: 5, text: 'Click Done → Start Streaming' },
      ].map(s => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
          <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
        </div>
      ))}
      <div className="mt-4 space-y-3">
        <CopyField label="RTMPS Server URL" value={rtmpUrl} />
        <CopyField label="Stream Key" value={streamKey} secret />
      </div>
    </div>
  )
}

function FFmpegGuide({ rtmpUrl, streamKey }: { rtmpUrl: string; streamKey: string }) {
  const cmd = `ffmpeg -re -i input.mp4 \\
  -c:v libx264 -preset veryfast -b:v 4000k \\
  -maxrate 4000k -bufsize 8000k \\
  -g 60 -keyint_min 60 \\
  -c:a aac -b:a 160k -ar 44100 \\
  -f flv "${rtmpUrl}/${streamKey}"`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <Code2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        <p className="text-xs text-green-300">
          Replace <code className="bg-black/40 px-1 rounded">input.mp4</code> with your source. Requires FFmpeg 4.0+.
        </p>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">FFmpeg Command</span>
          <button onClick={() => navigator.clipboard.writeText(cmd)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-400 transition-colors">
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
        <pre className="p-3 text-[10px] text-green-400 font-mono leading-relaxed overflow-x-auto bg-black/40">
          {cmd}
        </pre>
      </div>
      <CopyField label="RTMPS Base URL" value={rtmpUrl} />
      <CopyField label="Stream Key (append to URL above)" value={streamKey} secret />
    </div>
  )
}

function SRTGuide({ srtUrl }: { srtUrl: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Signal className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300">
          SRT (Secure Reliable Transport) offers lower latency and better packet recovery than RTMP.
          Ideal for unstable networks.
        </p>
      </div>
      <div className="space-y-3">
        <CopyField label="SRT URL (vMix: External Output → SRT)" value={srtUrl} />
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">vMix SRT Setup</p>
        {[
          'External Output → + → SRT',
          'Paste the SRT URL into the Hostname field',
          'Mode: Caller, Port: 5001',
          'Quality: 1080p / 4000 kbps, click OK',
          'Toggle "Output" in External Output panel',
        ].map((s, i) => (
          <div key={i} className="flex gap-2.5">
            <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-xs text-gray-300 leading-relaxed">{s}</p>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OBS SRT via obs-srt-plugin</p>
        {[
          'Install obs-srt-plugin from GitHub',
          'Settings → Stream → Service: SRT',
          'Server: paste the SRT URL above',
          'Click Start Streaming',
        ].map((s, i) => (
          <div key={i} className="flex gap-2.5">
            <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-xs text-gray-300 leading-relaxed">{s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StudioBroadcastModal({
  channel, onClose, onChannelUpdated,
}: StudioBroadcastModalProps) {
  const [localChannel, setLocalChannel]   = useState<TVChannel>(channel)
  const [streamStatus, setStreamStatus]   = useState<TVChannel['stream_status']>(channel.stream_status)
  const [mainTab, setMainTab]             = useState<MainTab>('setup')
  const [encoderTab, setEncoderTab]       = useState<EncoderTab>('obs')
  const [creating, setCreating]           = useState(false)
  const [error, setError]                 = useState('')
  const [goingLive, setGoingLive]         = useState(false)
  const [endingLive, setEndingLive]       = useState(false)
  const [rotating, setRotating]           = useState(false)
  const [polling, setPolling]             = useState(false)
  const [healthData, setHealthData]       = useState<Record<string, unknown> | null>(
    channel.health_data
  )
  const [latencyMode, setLatencyMode]     = useState<string>(channel.latency_mode || 'low')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isConnected = streamStatus === 'active'
  const hasStream   = !!localChannel.mux_stream_id

  // ── Derive SRT / WHIP from stream key ────────────────────────────────────────
  const rtmpUrl  = 'rtmps://global-live.mux.com:443/app'
  const streamKey = localChannel.stream_key || ''
  const srtUrl   = localChannel.srt_url  || (streamKey ? `srt://global-live.mux.com:5001?streamid=live_${streamKey}` : '')
  const whipUrl  = localChannel.whip_url || (streamKey ? `https://global-live.mux.com:443/app/${streamKey}` : '')

  // ── Health polling ────────────────────────────────────────────────────────────
  const pollHealth = useCallback(async (silent = false) => {
    if (!localChannel.mux_stream_id) return
    if (!silent) setPolling(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('mux-stream-health', {
        body: { stream_id: localChannel.mux_stream_id, channel_id: localChannel.id },
      })
      if (!fnErr && data?.status) {
        const newStatus = data.status as TVChannel['stream_status']
        setStreamStatus(newStatus)
        setHealthData(data.health ?? null)
        setLocalChannel(prev => ({ ...prev, stream_status: newStatus }))
      }
    } catch { /* silent */ }
    if (!silent) setPolling(false)
  }, [localChannel.mux_stream_id, localChannel.id])

  useEffect(() => {
    if (!hasStream) return
    void pollHealth()
    pollRef.current = setInterval(() => pollHealth(true), 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [hasStream, pollHealth])

  // ── Create Mux stream ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true); setError('')
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('mux-create-stream', {
        body: { channel_id: localChannel.id, latency_mode: latencyMode },
      })
      if (fnErr || data?.error) {
        setError(data?.error || fnErr?.message || 'Failed to create stream')
        return
      }
      const sk = data.stream_key as string
      const updated: TVChannel = {
        ...localChannel,
        mux_stream_id:   data.stream_id,
        mux_playback_id: data.playback_id,
        stream_key:      sk,
        rtmp_url:        data.rtmp_url,
        srt_url:         `srt://global-live.mux.com:5001?streamid=live_${sk}`,
        whip_url:        `https://global-live.mux.com:443/app/${sk}`,
        playback_url:    data.playback_url,
        stream_status:   'idle',
        is_active:       false,
        latency_mode:    latencyMode,
      }
      // Persist SRT + WHIP urls to DB
      await supabase.from('tv_channels').update({
        srt_url:  updated.srt_url,
        whip_url: updated.whip_url,
        latency_mode: latencyMode,
      }).eq('id', localChannel.id)
      setLocalChannel(updated)
      onChannelUpdated(updated)
    } catch (e: unknown) {
      setError((e as Error).message || 'Unexpected error')
    }
    setCreating(false)
  }

  // ── Go Live ───────────────────────────────────────────────────────────────────
  const handleGoLive = async () => {
    if (!localChannel.mux_stream_id || !isConnected) return
    setGoingLive(true)
    const { error: dbErr } = await supabase.from('tv_channels')
      .update({ is_active: true }).eq('id', localChannel.id)
    if (dbErr) { setError(dbErr.message); setGoingLive(false); return }
    const updated = { ...localChannel, is_active: true }
    setLocalChannel(updated)
    onChannelUpdated(updated)
    setGoingLive(false)
  }

  // ── Take Offline (hide from public, keep stream alive) ────────────────────────
  const handleTakeOffline = async () => {
    setGoingLive(true)
    const { error: dbErr } = await supabase.from('tv_channels')
      .update({ is_active: false }).eq('id', localChannel.id)
    if (dbErr) { setError(dbErr.message); setGoingLive(false); return }
    const updated = { ...localChannel, is_active: false }
    setLocalChannel(updated)
    onChannelUpdated(updated)
    setGoingLive(false)
  }

  // ── End broadcast + delete Mux stream ────────────────────────────────────────
  const handleEndLive = async () => {
    if (!localChannel.mux_stream_id) return
    setEndingLive(true)
    // Hide from public first
    await supabase.from('tv_channels').update({ is_active: false }).eq('id', localChannel.id)
    // Delete from Mux
    const { error: fnErr } = await supabase.functions.invoke('mux-delete-stream', {
      body: { stream_id: localChannel.mux_stream_id, channel_id: localChannel.id },
    })
    if (fnErr) { setError(fnErr.message); setEndingLive(false); return }
    const updated: TVChannel = {
      ...localChannel,
      mux_stream_id: null, mux_playback_id: null, stream_key: null,
      rtmp_url: null, srt_url: null, whip_url: null, playback_url: null,
      stream_status: 'idle', is_active: false,
    }
    setLocalChannel(updated)
    onChannelUpdated(updated)
    setStreamStatus('idle')
    setShowDeleteConfirm(false)
    setEndingLive(false)
  }

  // ── Rotate stream key ─────────────────────────────────────────────────────────
  const handleRotateKey = async () => {
    if (!localChannel.mux_stream_id || !confirm('Rotating the stream key will disconnect any active encoder. Proceed?')) return
    setRotating(true)
    const { data, error: fnErr } = await supabase.functions.invoke('mux-rotate-key', {
      body: { stream_id: localChannel.mux_stream_id, channel_id: localChannel.id },
    })
    if (!fnErr && data?.stream_key) {
      const sk = data.stream_key as string
      const updated = {
        ...localChannel,
        stream_key: sk,
        srt_url: `srt://global-live.mux.com:5001?streamid=live_${sk}`,
        whip_url: `https://global-live.mux.com:443/app/${sk}`,
      }
      setLocalChannel(updated)
      onChannelUpdated(updated)
    } else {
      setError('Key rotation failed — try again')
    }
    setRotating(false)
  }

  // ── Tab nav config ────────────────────────────────────────────────────────────
  const tabs: { id: MainTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'setup',       label: 'Setup',       icon: Settings2 },
    { id: 'credentials', label: 'Credentials', icon: Key,    badge: hasStream ? undefined : '!' },
    { id: 'encoders',    label: 'Encoders',    icon: Monitor },
    { id: 'health',      label: 'Health',      icon: BarChart3 },
  ]

  const encoderTabs: { id: EncoderTab; label: string; color: string }[] = [
    { id: 'obs',         label: 'OBS',         color: 'text-blue-400' },
    { id: 'vmix',        label: 'vMix',        color: 'text-purple-400' },
    { id: 'streamlabs',  label: 'Streamlabs',  color: 'text-pink-400' },
    { id: 'ffmpeg',      label: 'FFmpeg',      color: 'text-green-400' },
    { id: 'srt',         label: 'SRT',         color: 'text-amber-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-stretch justify-end bg-black/75 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="w-full max-w-2xl bg-[#080510] border-l border-white/8 flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-gradient-to-r from-violet-900/30 to-purple-900/20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <Radio className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Studio 1 Control Room</p>
              <h2 className="font-display font-black text-base text-white truncate">{localChannel.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <StatusBadge status={streamStatus} />
            {polling && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
            <button onClick={() => pollHealth()}
              className="w-8 h-8 rounded-lg dark:bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Connection status bar ── */}
        <div className={`px-5 py-2 flex items-center gap-2.5 text-xs border-b border-white/5 ${
          isConnected ? 'bg-emerald-950/40' : streamStatus === 'disconnected' ? 'bg-amber-950/40' : 'bg-gray-900/40'
        }`}>
          {isConnected
            ? <><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-semibold">Encoder connected — stream is live</span></>
            : streamStatus === 'disconnected'
            ? <><WifiOff className="w-3.5 h-3.5 text-amber-400" /><span className="text-amber-400 font-semibold">Encoder disconnected — reconnecting…</span></>
            : hasStream
            ? <><Antenna className="w-3.5 h-3.5 text-gray-500" /><span className="text-gray-500">Waiting for encoder — paste the credentials into OBS or vMix then start streaming</span></>
            : <><Zap className="w-3.5 h-3.5 text-violet-400" /><span className="text-violet-400 font-semibold">Create a Mux stream to get broadcast credentials</span></>
          }
        </div>

        {/* ── Tab nav ── */}
        <div className="flex items-center gap-0.5 px-4 pt-3 flex-shrink-0">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  mainTab === t.id
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[8px] font-black flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

          {/* ── Error banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold">Error</p>
                  <p className="text-[11px] mt-0.5">{error}</p>
                </div>
                <button onClick={() => setError('')} className="flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────── SETUP TAB ──────── */}
          {mainTab === 'setup' && (
            <div className="space-y-5">

              {/* Stream creation */}
              {!hasStream ? (
                <div className="rounded-2xl border border-dashed border-violet-500/30 p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto">
                    <Antenna className="w-7 h-7 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">No Mux Stream</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Create a Mux live stream to get your RTMP and SRT credentials. 
                      You'll then connect OBS or vMix to start broadcasting.
                    </p>
                  </div>

                  {/* Latency mode selection */}
                  <div className="text-left max-w-xs mx-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Latency Mode</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'standard', label: 'Standard', desc: '~30s', icon: Globe },
                        { id: 'low',      label: 'Low',      desc: '~5s',  icon: Signal },
                        { id: 'reduced',  label: 'Ultra-Low',desc: '~2s',  icon: Zap },
                      ].map(m => {
                        const Icon = m.icon
                        return (
                          <button key={m.id} onClick={() => setLatencyMode(m.id)}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-colors text-center ${
                              latencyMode === m.id
                                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                            }`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] font-bold">{m.label}</span>
                            <span className="text-[9px] text-gray-500">{m.desc} delay</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button onClick={handleCreate} disabled={creating}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/25">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {creating ? 'Creating Mux Stream…' : 'Create Broadcast Stream'}
                  </button>
                </div>
              ) : (
                <>
                  {/* ── GO LIVE / TAKE OFFLINE control ── */}
                  <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-300">Public Broadcast Control</p>
                      <span className={`text-[10px] font-bold ${localChannel.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {localChannel.is_active ? '● Visible to Viewers' : '○ Hidden from Public'}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-gray-400">
                        {isConnected
                          ? localChannel.is_active
                            ? 'Your stream is live and visible on SmartzTV. Click "Take Offline" to hide it without ending the Mux stream.'
                            : 'Your encoder is connected! Click "Go Live" to make the stream visible on the public SmartzTV page.'
                          : 'Connect your encoder first (OBS/vMix → paste credentials → Start Streaming), then Go Live.'}
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {localChannel.is_active ? (
                          <button onClick={handleTakeOffline} disabled={goingLive}
                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-bold hover:bg-amber-500/25 disabled:opacity-60 transition-colors">
                            {goingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                            Take Offline
                          </button>
                        ) : (
                          <button onClick={handleGoLive} disabled={goingLive || !isConnected}
                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/30">
                            {goingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            {goingLive ? 'Going Live…' : isConnected ? '🔴 Go Live' : 'Connect Encoder First'}
                          </button>
                        )}
                      </div>

                      {/* Stats */}
                      {localChannel.is_active && localChannel.viewer_count > 0 && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-semibold">{localChannel.viewer_count.toLocaleString()} viewers watching now</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Admin preview monitor ── */}
                  {isConnected && localChannel.mux_playback_id && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Monitor className="w-3 h-3" /> Control Room Monitor
                      </p>
                      <SmartzTVPlayer
                        playbackId={localChannel.mux_playback_id}
                        poster={localChannel.cover_url}
                        isLive
                        title={`[ADMIN] ${localChannel.name}`}
                        viewerCount={localChannel.viewer_count}
                        accentColor="#7c3aed"
                      />
                    </div>
                  )}

                  {/* ── End broadcast (destructive) ── */}
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-red-400">End Broadcast</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Deletes the Mux stream. OBS/vMix will lose the connection and you'll need new credentials.
                        </p>
                      </div>
                      {showDeleteConfirm ? (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setShowDeleteConfirm(false)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-gray-300">Cancel</button>
                          <button onClick={handleEndLive} disabled={endingLive}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-60">
                            {endingLive ? 'Ending…' : 'Confirm'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/15 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" /> End Broadcast
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──────── CREDENTIALS TAB ──────── */}
          {mainTab === 'credentials' && (
            <div className="space-y-5">
              {!hasStream ? (
                <div className="text-center py-12 space-y-3">
                  <Key className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-500">No credentials yet — create a Mux stream in the Setup tab first.</p>
                  <button onClick={() => setMainTab('setup')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">
                    <ArrowRight className="w-3.5 h-3.5" /> Go to Setup
                  </button>
                </div>
              ) : (
                <>
                  {/* RTMPS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Radio className="w-3 h-3 text-red-400" />
                      </div>
                      <p className="text-xs font-bold text-white">RTMPS (OBS / vMix / Streamlabs)</p>
                    </div>
                    <CopyField label="RTMPS Server URL" value={rtmpUrl} />
                    <CopyField
                      label="Stream Key — keep secret!"
                      value={streamKey}
                      secret
                      onRotate={handleRotateKey}
                      rotating={rotating}
                    />
                  </div>

                  <div className="border-t border-white/8" />

                  {/* SRT */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Signal className="w-3 h-3 text-amber-400" />
                      </div>
                      <p className="text-xs font-bold text-white">SRT — Secure Reliable Transport</p>
                    </div>
                    <CopyField label="SRT URL (vMix External Output / OBS SRT Plugin)" value={srtUrl} />
                  </div>

                  <div className="border-t border-white/8" />

                  {/* WHIP */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-3 h-3 text-green-400" />
                      </div>
                      <p className="text-xs font-bold text-white">WHIP — Browser WebRTC</p>
                    </div>
                    <CopyField label="WHIP URL (browser-based streaming tools)" value={whipUrl} />
                  </div>

                  <div className="border-t border-white/8" />

                  {/* HLS playback */}
                  {localChannel.playback_url && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Play className="w-3 h-3 text-violet-400" />
                        </div>
                        <p className="text-xs font-bold text-white">HLS Playback URL (read-only)</p>
                      </div>
                      <CopyField label="HLS .m3u8 URL — for embedding in other players" value={localChannel.playback_url} />
                    </div>
                  )}

                  {/* Security notice */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      <strong>Keep your Stream Key secret.</strong> Anyone with this key can broadcast to your channel.
                      If it's compromised, use the rotate button (↺) to generate a new key immediately.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──────── ENCODERS TAB ──────── */}
          {mainTab === 'encoders' && (
            <div className="space-y-4">
              {/* Encoder sub-tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                {encoderTabs.map(t => (
                  <button key={t.id} onClick={() => setEncoderTab(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      encoderTab === t.id
                        ? `bg-white/10 border border-white/20 ${t.color}`
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {!hasStream && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Create a Mux stream first (Setup tab) to see your personalized credentials.
                </div>
              )}

              <div className="rounded-2xl bg-white/3 border border-white/8 p-4">
                {encoderTab === 'obs'        && <OBSGuide        rtmpUrl={rtmpUrl} streamKey={streamKey} />}
                {encoderTab === 'vmix'       && <VMixGuide       rtmpUrl={rtmpUrl} streamKey={streamKey} />}
                {encoderTab === 'streamlabs' && <StreamlabsGuide rtmpUrl={rtmpUrl} streamKey={streamKey} />}
                {encoderTab === 'ffmpeg'     && <FFmpegGuide     rtmpUrl={rtmpUrl} streamKey={streamKey} />}
                {encoderTab === 'srt'        && <SRTGuide        srtUrl={srtUrl} />}
              </div>

              {/* Generic tips */}
              <div className="p-3 rounded-xl bg-white/3 border border-white/8 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Universal Tips</p>
                {[
                  'Keyframe interval should be 2 seconds for smooth HLS delivery',
                  'Use CBR (Constant Bitrate) — NOT VBR — for stable live streaming',
                  '1080p @ 6000 kbps or 720p @ 3000 kbps are reliable starting points',
                  'Close other apps to free up CPU before going live',
                  'Test your stream privately before clicking "Go Live"',
                ].map((tip, i) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────── HEALTH TAB ──────── */}
          {mainTab === 'health' && (
            <div className="space-y-4">
              {!hasStream ? (
                <div className="text-center py-12 space-y-3">
                  <BarChart3 className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-500">Stream health is available once a Mux stream is created.</p>
                </div>
              ) : (
                <>
                  {/* Live status */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Connection',
                        value: streamStatus === 'active' ? 'Connected' : streamStatus === 'disconnected' ? 'Lost' : 'Waiting',
                        icon: streamStatus === 'active' ? Wifi : WifiOff,
                        color: streamStatus === 'active' ? 'text-emerald-400' : streamStatus === 'disconnected' ? 'text-amber-400' : 'text-gray-400',
                      },
                      {
                        label: 'Public Status',
                        value: localChannel.is_active ? 'Live on TV' : 'Hidden',
                        icon: localChannel.is_active ? Eye : EyeOff,
                        color: localChannel.is_active ? 'text-red-400' : 'text-gray-400',
                      },
                      {
                        label: 'Viewers',
                        value: localChannel.viewer_count.toLocaleString(),
                        icon: Users,
                        color: 'text-violet-400',
                      },
                    ].map(s => {
                      const Icon = s.icon
                      return (
                        <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                          <Icon className={`w-4 h-4 ${s.color} mb-2`} />
                          <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Stream settings */}
                  <div className="rounded-xl bg-white/5 border border-white/8 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/8">
                      <p className="text-xs font-bold text-gray-400">Mux Stream Settings</p>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {[
                        { label: 'Stream ID',        value: localChannel.mux_stream_id || '—' },
                        { label: 'Latency Mode',      value: (healthData?.latency_mode as string) || latencyMode || 'low' },
                        { label: 'Reconnect Window',  value: `${(healthData?.reconnect_window as number) || 60}s` },
                        { label: 'Max Duration',      value: `${Math.floor(((healthData?.max_continuous_duration as number) || 43200) / 3600)}h` },
                        { label: 'Last Checked',      value: (healthData?.checked_at as string) ? new Date(healthData!.checked_at as string).toLocaleTimeString() : '—' },
                        { label: 'Last Broadcast',    value: localChannel.last_broadcast_at ? new Date(localChannel.last_broadcast_at).toLocaleString() : 'Never' },
                      ].map(r => (
                        <div key={r.label} className="flex items-start justify-between gap-3">
                          <span className="text-[11px] text-gray-500">{r.label}</span>
                          <span className="text-[11px] text-gray-300 font-mono text-right break-all">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mux dashboard link */}
                  <a href="https://dashboard.mux.com/video/live-streams" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/15 transition-colors">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      <div>
                        <p className="text-xs font-bold text-violet-300">Mux Dashboard</p>
                        <p className="text-[10px] text-gray-500">View detailed analytics, assets, and logs</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>

                  <button onClick={() => pollHealth()} disabled={polling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs font-semibold text-gray-300 hover:bg-white/8 disabled:opacity-60 transition-colors">
                    {polling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Refresh Health Data
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
