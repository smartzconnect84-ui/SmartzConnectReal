/**
 * Abstract streaming provider interface.
 * YouTube Live is the default implementation; swap in LiveKit, Cloudflare Stream,
 * Livepeer, or 100ms by creating a new class that satisfies this contract.
 */

export interface StreamConfig {
  /** Unique broadcast identifier on the provider (e.g. YouTube video ID) */
  broadcastId: string
  /** RTMP ingest URL for OBS/vMix */
  rtmpUrl: string
  /** Stream key (secret) */
  streamKey: string
  /** Optional HLS/DASH playback URL for fallback */
  playbackUrl?: string
  /** Human-readable provider name */
  provider: StreamingProviderName
  /** Extra provider-specific metadata */
  meta?: Record<string, unknown>
}

export interface StreamStatus {
  broadcastId: string
  status: 'idle' | 'active' | 'disconnected'
  viewerCount?: number
  startedAt?: string
  provider: StreamingProviderName
}

export interface BroadcastSchedule {
  id: string
  channelId: string
  title: string
  description?: string
  thumbnailUrl?: string
  category?: string
  startsAt: string
  endsAt?: string
  isRecurring: boolean
  recurrence?: string
  broadcastId?: string
  provider: StreamingProviderName
}

export interface EngagementAnalytics {
  broadcastId: string
  viewerCount: number
  peakViewers: number
  totalComments: number
  totalReactions: number
  watchTimeMinutes: number
  provider: StreamingProviderName
}

export type StreamingProviderName = 'youtube' | 'livekit' | 'cloudflare' | 'livepeer' | '100ms'

/**
 * Core interface every streaming provider must implement.
 * Business logic (comments, reactions, moderation) is handled in SmartzConnect
 * itself — providers only handle the media transport.
 */
export interface StreamingProvider {
  readonly name: StreamingProviderName

  /**
   * Returns the embed URL for a given broadcast ID.
   * Used to render the video player iframe.
   */
  getEmbedUrl(broadcastId: string, options?: EmbedOptions): string

  /**
   * Returns the RTMP ingest endpoint for a channel/stream key.
   * The stream key is stored in the DB and shown to admins.
   */
  getRtmpIngestUrl(): string

  /**
   * Returns a viewer-facing broadcast URL (for sharing).
   */
  getShareUrl(broadcastId: string): string
}

export interface EmbedOptions {
  autoplay?: boolean
  muted?: boolean
  startTime?: number
}

/** DB row shape for tv_channels (YouTube-era) */
export interface TVChannelRow {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  cover_url: string | null
  description: string | null
  category: string
  /** YouTube Live video/broadcast ID — used for iframe embed */
  youtube_video_id: string | null
  /** YouTube channel ID — used for /live_stream fallback embed */
  youtube_channel_id: string | null
  /** RTMP stream key (shown only to admins, kept secret) */
  stream_key: string | null
  /** Custom HLS/DASH playback URL (optional override) */
  playback_url: string | null
  stream_status: 'idle' | 'active' | 'disconnected'
  is_active: boolean
  is_featured: boolean
  is_admin_broadcast: boolean
  display_order: number
  current_program: string | null
  viewer_count: number
  last_broadcast_at: string | null
  created_at: string
}

/** DB row for tv_comments */
export interface TVCommentRow {
  id: string
  channel_id: string
  broadcast_id: string | null
  user_id: string
  parent_id: string | null
  content: string
  is_pinned: boolean
  is_deleted: boolean
  is_admin_hidden: boolean
  created_at: string
  profiles?: {
    id: string
    full_name: string
    avatar_url: string | null
    role: string | null
  }
  reactions?: TVCommentReactionRow[]
  reply_count?: number
}

export interface TVCommentReactionRow {
  id: string
  comment_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface TVStreamReactionRow {
  id: string
  channel_id: string
  broadcast_id: string | null
  user_id: string
  emoji: string
  created_at: string
}
