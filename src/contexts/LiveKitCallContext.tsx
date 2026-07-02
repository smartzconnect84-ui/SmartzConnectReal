import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type CallType = 'video' | 'audio'

export interface ActiveCall {
  roomId: string
  type: CallType
  participantName: string
  participantEmoji?: string
  participantAvatar?: string
}

interface LiveKitCallContextValue {
  activeCall: ActiveCall | null
  startCall: (call: ActiveCall) => void
  endCall: () => void
}

const LiveKitCallContext = createContext<LiveKitCallContextValue | null>(null)

export function LiveKitCallProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)

  const startCall = useCallback((call: ActiveCall) => {
    setActiveCall(call)
  }, [])

  const endCall = useCallback(() => {
    setActiveCall(null)
  }, [])

  return (
    <LiveKitCallContext.Provider value={{ activeCall, startCall, endCall }}>
      {children}
    </LiveKitCallContext.Provider>
  )
}

export function useLiveKitCall() {
  const ctx = useContext(LiveKitCallContext)
  if (!ctx) throw new Error('useLiveKitCall must be used inside LiveKitCallProvider')
  return ctx
}
