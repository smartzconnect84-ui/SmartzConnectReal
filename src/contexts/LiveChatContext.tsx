import { createContext, useContext, useState, type ReactNode } from 'react'

interface LiveChatContextType {
  open: boolean
  dismissed: boolean
  setOpen: (v: boolean) => void
  setDismissed: (v: boolean) => void
  unreadCount: number
  setUnreadCount: (v: number) => void
}

export const LiveChatContext = createContext<LiveChatContextType>({
  open: false,
  dismissed: false,
  setOpen: () => {},
  setDismissed: () => {},
  unreadCount: 0,
  setUnreadCount: () => {},
})

export function LiveChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(1)
  return (
    <LiveChatContext.Provider value={{ open, dismissed, setOpen, setDismissed, unreadCount, setUnreadCount }}>
      {children}
    </LiveChatContext.Provider>
  )
}

export function useLiveChat() {
  return useContext(LiveChatContext)
}
