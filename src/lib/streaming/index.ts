/**
 * Streaming provider factory.
 * Import from here — never import directly from provider files in UI code.
 */

export * from './types'
export { youtubeProvider, YouTubeProvider, YOUTUBE_RTMP_URL, YOUTUBE_RTMPS_URL } from './youtube'

import { youtubeProvider } from './youtube'
import type { StreamingProvider, StreamingProviderName } from './types'

const providers: Record<StreamingProviderName, StreamingProvider> = {
  youtube:    youtubeProvider,
  // Future providers — add class instances here:
  livekit:    youtubeProvider,  // placeholder until LiveKit provider is added
  cloudflare: youtubeProvider,  // placeholder
  livepeer:   youtubeProvider,  // placeholder
  '100ms':    youtubeProvider,  // placeholder
}

/**
 * Returns the active streaming provider.
 * Defaults to YouTube. Override by passing a different provider name.
 */
export function getProvider(name: StreamingProviderName = 'youtube'): StreamingProvider {
  return providers[name] ?? youtubeProvider
}

/** Convenience: active default provider */
export const streamingProvider = youtubeProvider
