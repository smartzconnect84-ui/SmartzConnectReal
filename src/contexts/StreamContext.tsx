import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { connectStreamUser, disconnectStreamUser } from '@/lib/stream'

interface StreamContextType {
  connected: boolean
  unreadCount: number
  apiKey: string
  userId: string | null
  userName: string | null
  userToken: string | null
}

export const StreamContext = createContext<StreamContextType>({
  connected: false,
  unreadCount: 0,
  apiKey: '',
  userId: null,
  userName: null,
  userToken: null,
})

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY as string

async function fetchStreamToken(userId: string, accessToken: string): Promise<string | undefined> {
  if (!import.meta.env.VITE_SUPABASE_URL) return undefined

  // ── Primary: DB RPC (generate_getstream_token reads secret from admin_config).
  // This avoids needing STREAM_API_SECRET set as a Supabase edge-function secret.
  try {
    const { data: rpcToken, error: rpcError } = await supabase.rpc('generate_getstream_token')
    if (!rpcError && rpcToken) {
      return rpcToken as string
    }
    if (rpcError) {
      console.warn('Stream token RPC fallback to edge function:', rpcError.message)
    }
  } catch (rpcErr) {
    console.warn('Stream token RPC failed, falling back to edge function:', rpcErr)
  }

  // ── Fallback: edge function (requires STREAM_API_SECRET in Supabase secrets).
  try {
    const { data, error } = await supabase.functions.invoke('stream-token', {
      body: { userId },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (error) {
      console.error('Stream token edge function error:', error.message)
      return undefined
    }
    return data?.token
  } catch (err) {
    console.error('Stream token fetch failed (network or cold-start):', err)
    return undefined
  }
}

export function StreamProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user || !session || !STREAM_API_KEY) {
      setConnected(false)
      setUserToken(null)
      setUnreadCount(0)
      return
    }

    let cancelled = false
    const setup = async () => {
      try {
        const profile = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (cancelled) return

        const name = profile.data?.full_name || user.email || 'User'
        const avatar = profile.data?.avatar_url || undefined
        setUserName(name)

        // Fetch once to confirm the edge function is reachable and to display
        // in context (e.g. for channel creation). Stream itself will use the
        // tokenProvider below so it can silently refresh on expiry (code 16).
        // Retry up to 3 times with exponential backoff — edge functions can be
        // cold-starting on first request after inactivity.
        let token: string | undefined
        for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
          token = await fetchStreamToken(user.id, session.access_token)
          if (token) break
          if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)))
        }
        if (cancelled) return

        if (!token) {
          console.error('Stream token unavailable after retries — chat features disabled. Ensure STREAM_API_SECRET is set as a Supabase edge function secret.')
          setConnected(false)
          return
        }

        setUserToken(token)

        // tokenProvider: called by Stream whenever the current JWT is about to
        // expire. Always fetches a fresh Supabase session first so the edge
        // function receives a valid access_token even after an hourly rotation.
        // Throws on failure so Stream knows to retry rather than using a blank token.
        const tokenProvider = async (): Promise<string> => {
          const { data: { session: fresh } } = await supabase.auth.getSession()
          if (!fresh?.access_token) throw new Error('No active Supabase session for Stream token refresh')
          const t = await fetchStreamToken(user.id, fresh.access_token)
          if (!t) throw new Error('Stream token endpoint returned empty — will retry')
          return t
        }

        const client = await connectStreamUser(user.id, name, avatar, tokenProvider)
        if (cancelled) {
          await disconnectStreamUser()
          return
        }

        if (client) {
          setConnected(true)

          // Update presence immediately on connect
          supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then(() => {})

          // Heartbeat: keep last_seen fresh every 30 s while tab is open
          const heartbeatId = setInterval(() => {
            if (!cancelled) {
              supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then(() => {})
            }
          }, 30000)

          // Sync initial unread count
          const countResp = await client.getUnreadCount()
          if (!cancelled) setUnreadCount(countResp.total_unread_count ?? 0)

          // Subscribe to real-time unread count changes
          const handleEvent = (event: any) => {
            if (
              event.type === 'notification.message_new' ||
              event.type === 'notification.mark_read' ||
              event.type === 'message.new'
            ) {
              client.getUnreadCount().then((resp) => {
                if (!cancelled) setUnreadCount(resp.total_unread_count ?? 0)
              })
            }
          }
          client.on(handleEvent)
          unsubRef.current = () => {
            client.off(handleEvent)
            clearInterval(heartbeatId)
          }
        }
      } catch (err) {
        // Log the real error so configuration problems surface in devtools.
        // Stream is not required for other app features, but silence here makes
        // mis-configuration impossible to diagnose.
        console.error('Stream initialization failed:', err)
      }
    }

    setup()
    return () => {
      cancelled = true
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
      disconnectStreamUser()
      setConnected(false)
      setUserToken(null)
      setUnreadCount(0)
    }
  }, [user?.id, session?.access_token])

  return (
    <StreamContext.Provider value={{
      connected,
      unreadCount,
      apiKey: STREAM_API_KEY || '',
      userId: user?.id ?? null,
      userName,
      userToken,
    }}>
      {children}
    </StreamContext.Provider>
  )
}

export function useStream() {
  return useContext(StreamContext)
}
