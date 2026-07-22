/**
 * YouTube Live streaming provider implementation.
 *
 * OBS / vMix broadcast flow:
 *   1. Admin goes to YouTube Studio → Go Live → Schedule or Start
 *   2. Copies the Stream Key from YouTube Studio
 *   3. Pastes it into the SmartzTV admin channel settings
 *   4. Enters the YouTube Video/Broadcast ID (visible in the YouTube Studio URL)
 *   5. OBS/vMix connects to rtmp://a.rtmp.youtube.com/live2 with the stream key
 *   6. YouTube serves HLS; we embed it via iframe on the public & admin pages
 *
 * To swap providers: implement StreamingProvider and pass it to getProvider().
 */

import type { EmbedOptions, StreamingProvider, StreamingProviderName } from './types'

export const YOUTUBE_RTMP_URL = 'rtmp://a.rtmp.youtube.com/live2'
export const YOUTUBE_RTMPS_URL = 'rtmps://a.rtmps.youtube.com:443/live2'

export class YouTubeProvider implements StreamingProvider {
  readonly name: StreamingProviderName = 'youtube'

  /**
   * Returns the YouTube iframe embed URL for a live broadcast.
   *
   * If `broadcastId` is a YouTube video ID (e.g. "dQw4w9WgXcQ"), embeds that specific
   * video/broadcast. Supports both live and VOD playback via the same embed URL.
   */
  getEmbedUrl(broadcastId: string, options: EmbedOptions = {}): string {
    const { autoplay = true, muted = true } = options
    const params = new URLSearchParams({
      // YouTube requires autoplay=1 for live streams to play immediately
      autoplay: autoplay ? '1' : '0',
      mute:     muted    ? '1' : '0',
      // Clean player without YouTube branding
      modestbranding: '1',
      rel: '0',
      // Allow the iframe to communicate back (for future JS API use)
      enablejsapi: '1',
      // Allow fullscreen
      fs: '1',
      // For live streams, start at the live edge
      live_start: '1',
    })
    return `https://www.youtube.com/embed/${encodeURIComponent(broadcastId)}?${params.toString()}`
  }

  /**
   * For a YouTube channel's live stream (when the broadcaster hasn't set a specific video ID yet).
   * Embeds the current live stream for a channel ID.
   */
  getChannelLiveEmbedUrl(channelId: string, options: EmbedOptions = {}): string {
    const { autoplay = true, muted = true } = options
    const params = new URLSearchParams({
      channel: channelId,
      autoplay: autoplay ? '1' : '0',
      mute:     muted    ? '1' : '0',
      modestbranding: '1',
      rel: '0',
      enablejsapi: '1',
    })
    return `https://www.youtube.com/embed/live_stream?${params.toString()}`
  }

  /** Standard RTMP ingest URL — stream key is channel-specific and entered by admin */
  getRtmpIngestUrl(): string {
    return YOUTUBE_RTMP_URL
  }

  /** Encrypted RTMPS ingest URL (recommended for production) */
  getRtmpsIngestUrl(): string {
    return YOUTUBE_RTMPS_URL
  }

  /** Public share URL for the broadcast */
  getShareUrl(broadcastId: string): string {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(broadcastId)}`
  }

  /** YouTube Studio URL for the broadcaster to manage the stream */
  getStudioUrl(): string {
    return 'https://studio.youtube.com/channel/mine/livestreaming/manage'
  }

  /**
   * Validates that a string looks like a YouTube video ID (11 alphanumeric chars).
   * Accepts both bare IDs and full youtube.com/watch?v= URLs.
   */
  parseVideoId(input: string): string | null {
    if (!input) return null
    const trimmed = input.trim()

    // Try to extract from URL
    try {
      const url = new URL(trimmed)
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v')
        if (v && /^[\w-]{11}$/.test(v)) return v
        // youtu.be short links handled below
      }
      if (url.hostname === 'youtu.be') {
        const id = url.pathname.slice(1).split('?')[0]
        if (/^[\w-]{11}$/.test(id)) return id
      }
    } catch { /* not a URL, treat as raw ID */ }

    // Raw 11-char video ID
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed

    return null
  }
}

/** Singleton YouTube provider instance */
export const youtubeProvider = new YouTubeProvider()
