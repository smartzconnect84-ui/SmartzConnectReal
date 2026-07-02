import { StreamChat } from 'stream-chat'

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string

if (!apiKey) {
  console.warn(
    '⚠️  GetStream API key not set.\n' +
    'Add VITE_STREAM_API_KEY to your environment.\n' +
    'Get your key from: getstream.io/dashboard'
  )
}

export const streamClient = StreamChat.getInstance(apiKey || 'placeholder-key')

export async function connectStreamUser(
  userId: string,
  userName: string,
  avatarUrl?: string,
  token?: string
) {
  if (!apiKey || !token) return null

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

    await streamClient.connectUser(user, token)
    return streamClient
  } catch (err) {
    console.error('Stream connection error:', err)
    return null
  }
}

export async function disconnectStreamUser() {
  if (streamClient.userID) {
    await streamClient.disconnectUser()
  }
}

export function getOrCreateDirectChannel(userId1: string, userId2: string) {
  const channelId = [userId1, userId2].sort().join('-')
  return streamClient.channel('messaging', channelId, {
    members: [userId1, userId2],
  })
}

export function getOrCreateGroupChannel(roomId: string, members: string[], name: string) {
  const channelData = { name, members } as Record<string, unknown>
  return streamClient.channel('team', roomId, channelData as any)
}

export default streamClient
