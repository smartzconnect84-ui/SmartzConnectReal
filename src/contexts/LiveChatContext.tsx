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
  // Chat launcher starts tucked away in the top-bar icon; the floating bubble/teaser
  // only reappears once the user explicitly opens it (from the top-bar or shortcut).
  const [dismissed, setDismissed] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  return (
    <LiveChatContext.Provider value={{ open, dismissed, setOpen, setDismissed, unreadCount, setUnreadCount }}>
      {children}
    </LiveChatContext.Provider>
  )
}

export function useLiveChat() {
  return useContext(LiveChatContext)
}
