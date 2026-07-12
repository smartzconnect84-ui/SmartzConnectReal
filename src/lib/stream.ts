import { StreamChat } from 'stream-chat'

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string

if (!apiKey) {
  console.error(
    '⚠️  GetStream API key not set.\n' +
    'Add VITE_STREAM_API_KEY to your environment.\n' +
    'Get your key from: getstream.io/dashboard\n' +
    'Chat features are disabled until this is configured.'
  )
}

// A 'placeholder-key' fallback used to mask missing configuration by letting the
// client "connect" and fail later with confusing errors deep in chat components.
// Fail fast instead: only construct the real client when a key is present; every
// caller below already guards on `connected`/truthiness before touching this.
export const streamClient: StreamChat | null = apiKey ? StreamChat.getInstance(apiKey) : null

export async function connectStreamUser(
  userId: string,
  userName: string,
  avatarUrl?: string,
  /** Pass a function so Stream can auto-refresh on token expiry (code 16). */
  tokenOrProvider?: string | (() => Promise<string>)
) {
  if (!streamClient || !tokenOrProvider) return null

  try {
    if (streamClient.userID === userId) {
      return streamClient
    }

    if (streamClient.userID) {
      await streamClient.disconnectUser()
    }

    const user = {
      id: userId,
      name: userName,
      ...(avatarUrl ? { image: avatarUrl } : {}),
    }

    await streamClient.connectUser(user, tokenOrProvider)
    return streamClient
  } catch (err) {
    console.error('Stream connection error:', err)
    return null
  }
}

export async function disconnectStreamUser() {
  if (streamClient?.userID) {
    await streamClient.disconnectUser()
  }
}

export function getOrCreateDirectChannel(userId1: string, userId2: string) {
  if (!streamClient) throw new Error('Stream chat is not configured (missing VITE_STREAM_API_KEY)')
  // Stream channel IDs are capped at 64 chars.
  // Strip dashes from both UUIDs (32 chars each), sort for determinism, take 60 chars total.
  const [a, b] = [userId1, userId2].sort()
  const channelId = (a.replace(/-/g, '') + b.replace(/-/g, '')).slice(0, 60)
  return streamClient.channel('messaging', channelId, {
    members: [userId1, userId2],
  })
}

/**
 * Auto-forwards a story reaction/reply into a real Direct Message thread with
 * the story author — mirrors Instagram/Snapchat behavior where reacting to or
 * replying to someone's story lands in their chat inbox, not just a feed
 * notification. Fire-and-forget: never throws, never blocks the caller's UI.
 */
export async function sendStoryEventToChat(opts: {
  currentUserId: string
  authorId?: string
  viewerName: string
  text: string
  storyMediaUrl?: string | null
}) {
  const { currentUserId, authorId, text, storyMediaUrl } = opts
  if (!streamClient || !authorId || authorId === currentUserId) return
  try {
    const channel = getOrCreateDirectChannel(currentUserId, authorId)
    await channel.watch()
    await channel.sendMessage({
      text,
      attachments: storyMediaUrl
        ? [{ type: 'image', image_url: storyMediaUrl, title: 'Story' }]
        : undefined,
    } as any)
  } catch (err) {
    console.warn('[sendStoryEventToChat] failed to deliver story DM:', err)
  }
}

// Note: GroupChatPage creates group channels directly via streamClient.channel('messaging', ...)
// using the room's stream_channel_id or a derived `group-<id>` key. This helper aligns with
// that pattern so any future callers use the same channel type (Stream 'team' channels are a
// paid Enterprise feature; 'messaging' works for group rooms on all plans).
export function getOrCreateGroupChannel(roomId: string, members: string[], name: string) {
  if (!streamClient) throw new Error('Stream chat is not configured (missing VITE_STREAM_API_KEY)')
  const chanId = `group-${roomId}`.slice(0, 60)
  return streamClient.channel('messaging', chanId, { name, members } as any)
}

export default streamClient
