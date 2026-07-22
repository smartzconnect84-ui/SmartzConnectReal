/**
 * StreamAnalytics — Live engagement analytics panel for SmartzTV admin dashboard.
 * Shows real-time viewer count, comment velocity, reaction totals, and peak metrics.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, MessageSquare, Heart, TrendingUp, Eye,
  RefreshCw, Clock, Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface StreamAnalyticsProps {
  channelId: string
  broadcastId?: string | null
  viewerCount?: number
  isLive?: boolean
}

interface AnalyticsSnapshot {
  totalComments: number
  totalReactions: number
  uniqueCommenters: number
  recentComments: number   // last 5 min
  topEmojis: { emoji: string; count: number }[]
  commentVelocity: number  // comments per minute (last 5 min)
  peakViewers: number
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sublabel?: string
  accent?: string
  pulse?: boolean
}

function StatCard({ icon: Icon, label, value, sublabel, accent = 'text-violet-400', pulse }: StatCardProps) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        accent.includes('violet') ? 'bg-violet-500/15' :
        accent.includes('emerald') ? 'bg-emerald-500/15' :
        accent.includes('pink') ? 'bg-pink-500/15' :
        accent.includes('amber') ? 'bg-amber-500/15' :
        'bg-blue-500/15'
      }`}>
        <Icon className={`w-4.5 h-4.5 ${accent}`} style={{ width: 18, height: 18 }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className={`text-2xl font-black text-white ${pulse ? 'animate-pulse' : ''}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
        {sublabel && <p className="text-[11px] text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

export default function StreamAnalytics({
  channelId, broadcastId, viewerCount = 0, isLive = false,
}: StreamAnalyticsProps) {
  const [stats, setStats]         = useState<AnalyticsSnapshot | null>(null)
  const [loading, setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const queries = await Promise.all([
      // Total comments
      supabase.from('tv_comments').select('id', { count: 'exact', head: true })
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .then(r => broadcastId
          ? supabase.from('tv_comments').select('id', { count: 'exact', head: true })
              .eq('channel_id', channelId).eq('broadcast_id', broadcastId).eq('is_deleted', false)
          : Promise.resolve(r)
        ),
      // Total reactions (comment reactions)
      supabase.from('tv_comment_reactions')
        .select('comment_id', { count: 'exact', head: true })
        .in('comment_id',
          supabase.from('tv_comments').select('id').eq('channel_id', channelId) as any
        ),
      // Unique commenters
      supabase.from('tv_comments').select('user_id')
        .eq('channel_id', channelId).eq('is_deleted', false),
      // Recent comments (last 5 min)
      supabase.from('tv_comments').select('id', { count: 'exact', head: true })
        .eq('channel_id', channelId).eq('is_deleted', false)
        .gte('created_at', fiveMinAgo),
      // Stream reactions for emoji breakdown
      supabase.from('tv_stream_reactions').select('emoji')
        .eq('channel_id', channelId),
    ])

    const [totalCommentsRes, totalRxRes, commentersRes, recentRes, emojiRes] = queries as any

    const totalComments  = totalCommentsRes?.count   || 0
    const totalReactions = totalRxRes?.count          || 0
    const uniqueIds      = new Set((commentersRes.data || []).map((r: any) => r.user_id))
    const recentComments = recentRes?.count            || 0
    const commentVelocity = recentComments > 0 ? +(recentComments / 5).toFixed(1) : 0

    // Emoji count breakdown
    const emojiCounts: Record<string, number> = {}
    for (const r of (emojiRes.data || []) as { emoji: string }[]) {
      emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1
    }
    const topEmojis = Object.entries(emojiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }))

    setStats({
      totalComments,
      totalReactions,
      uniqueCommenters: uniqueIds.size,
      recentComments,
      commentVelocity,
      topEmojis,
      peakViewers: Math.max(viewerCount, stats?.peakViewers || 0),
    })
    setLoading(false)
    setLastRefresh(new Date())
  }, [channelId, broadcastId, viewerCount, stats?.peakViewers])

  useEffect(() => {
    void load()
    // Auto-refresh every 30s when live
    if (isLive) {
      intervalRef.current = setInterval(() => void load(), 30000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load, isLive])

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Live Analytics</span>
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-black border border-red-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {fmtTime(lastRefresh)}
          </span>
          <button onClick={() => void load()}
            className="p-1.5 rounded-lg bg-white/6 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Eye}
          label="Viewers Now"
          value={viewerCount}
          accent="text-violet-400"
          pulse={isLive}
        />
        <StatCard
          icon={TrendingUp}
          label="Peak Viewers"
          value={stats?.peakViewers || viewerCount}
          accent="text-blue-400"
          sublabel="this session"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Comments"
          value={loading ? '…' : stats?.totalComments || 0}
          accent="text-emerald-400"
        />
        <StatCard
          icon={Heart}
          label="Total Reactions"
          value={loading ? '…' : stats?.totalReactions || 0}
          accent="text-pink-400"
        />
        <StatCard
          icon={Users}
          label="Commenters"
          value={loading ? '…' : stats?.uniqueCommenters || 0}
          sublabel="unique users"
          accent="text-amber-400"
        />
        <StatCard
          icon={Zap}
          label="Chat Velocity"
          value={loading ? '…' : `${stats?.commentVelocity || 0}/min`}
          sublabel="last 5 minutes"
          accent="text-violet-400"
          pulse={isLive && (stats?.commentVelocity || 0) > 5}
        />
      </div>

      {/* Top emoji reactions */}
      {stats && stats.topEmojis.length > 0 && (
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-3">Top Reactions</p>
          <div className="flex flex-wrap gap-2">
            {stats.topEmojis.map(({ emoji, count }) => (
              <motion.div key={emoji}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                <span className="text-lg">{emoji}</span>
                <span className="text-xs font-bold text-violet-300">{count.toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement rate */}
      {stats && viewerCount > 0 && (
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Engagement Rate</p>
          <div className="space-y-2">
            {[
              { label: 'Comment rate', value: viewerCount > 0 ? ((stats.uniqueCommenters / viewerCount) * 100).toFixed(1) : '0', suffix: '% of viewers commented' },
            ].map(({ label, value, suffix }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-bold text-white">{value}%</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(parseFloat(value), 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">{suffix}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
