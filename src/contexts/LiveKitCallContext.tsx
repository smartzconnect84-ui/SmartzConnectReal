import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext } from '@/contexts/AuthContext'

export type CallType = 'video' | 'audio'

export interface ActiveCall {
  roomId: string
  type: CallType
  participantName: string
  participantEmoji?: string
  participantAvatar?: string
  participantId?: string
  notificationId?: string
  isCaller?: boolean
}

export interface IncomingCallData {
  notificationId: string
  fromId: string
  fromName: string
  fromAvatar?: string
  roomId: string
  type: CallType
  expiresAt: string
}

interface LiveKitCallContextValue {
  activeCall: ActiveCall | null
  incomingCall: IncomingCallData | null
  callDeclined: boolean
  startCall: (call: ActiveCall) => void
  endCall: () => Promise<void>
  initiateCall: (opts: { contactId: string; contactName: string; contactAvatar?: string; type: CallType }) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  dismissDeclined: () => void
}

const LiveKitCallContext = createContext<LiveKitCallContextValue | null>(null)

export function LiveKitCallProvider({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext) ?? {}
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null)
  const [callDeclined, setCallDeclined] = useState(false)
  const outgoingNotifIdRef = useRef<string | null>(null)
  const missedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeCallRef = useRef<ActiveCall | null>(null)

  // Keep ref in sync so effect closures can read current value
  useEffect(() => { activeCallRef.current = activeCall }, [activeCall])

  // ── Incoming call subscription (callee side) ──────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    const ch = supabase.channel(`incoming-calls:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_notifications',
        filter: `to_id=eq.${user.id}`,
      }, async (payload) => {
        const row = payload.new as any
        if (row.status !== 'pending') return

        // Auto-decline if already in a call
        if (activeCallRef.current) {
          await supabase.from('call_notifications')
            .update({ status: 'declined' })
            .eq('id', row.id)
          return
        }

        // Fetch caller profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', row.from_id)
          .single()

        setIncomingCall({
          notificationId: row.id,
          fromId: row.from_id,
          fromName: profile?.full_name || 'Someone',
          fromAvatar: profile?.avatar_url ?? undefined,
          roomId: row.room_name,
          type: row.call_type as CallType,
          expiresAt: row.expires_at,
        })
      })
      // Watch for caller cancellation
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_notifications',
        filter: `to_id=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new as any
        if (row.status === 'cancelled' || row.status === 'missed') {
          setIncomingCall(prev => prev?.notificationId === row.id ? null : prev)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.id])

  // ── Outgoing call subscription (caller watching for accepted/declined) ─────
  useEffect(() => {
    if (!user?.id) return

    const ch = supabase.channel(`outgoing-calls:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_notifications',
        filter: `from_id=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new as any
        if (!outgoingNotifIdRef.current || row.id !== outgoingNotifIdRef.current) return

        if (row.status === 'accepted') {
          // Callee answered — cancel the missed timer so it can't close an active call
          if (missedTimerRef.current) clearTimeout(missedTimerRef.current)
          missedTimerRef.current = null
          outgoingNotifIdRef.current = null
        } else if (row.status === 'declined') {
          if (missedTimerRef.current) clearTimeout(missedTimerRef.current)
          missedTimerRef.current = null
          outgoingNotifIdRef.current = null
          setActiveCall(null)
          setCallDeclined(true)
          // Auto-dismiss after 4 s
          setTimeout(() => setCallDeclined(false), 4000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.id])

  // ── startCall — puts UI into active call ──────────────────────────────────
  const startCall = useCallback((call: ActiveCall) => {
    setActiveCall(call)
    setCallDeclined(false)
  }, [])

  // ── endCall — cleans up notification + hides UI ──────────────────────────
  const endCall = useCallback(async () => {
    if (missedTimerRef.current) clearTimeout(missedTimerRef.current)
    if (outgoingNotifIdRef.current) {
      // Cancel pending outgoing notification (if callee hasn't answered yet)
      await supabase.from('call_notifications')
        .update({ status: 'cancelled' })
        .eq('id', outgoingNotifIdRef.current)
        .eq('status', 'pending')
      outgoingNotifIdRef.current = null
    }
    setActiveCall(null)
  }, [])

  // ── initiateCall — caller side ────────────────────────────────────────────
  const initiateCall = useCallback(async (opts: {
    contactId: string; contactName: string; contactAvatar?: string; type: CallType
  }) => {
    if (!user?.id) return
    const { contactId, contactName, contactAvatar, type } = opts
    const ids = [user.id, contactId].sort()
    const roomId = `call_${ids[0].slice(0, 8)}_${ids[1].slice(0, 8)}_${Date.now()}`

    const { data: notif } = await supabase
      .from('call_notifications')
      .insert({
        from_id: user.id,
        to_id: contactId,
        room_name: roomId,
        call_type: type,
        status: 'pending',
      })
      .select('id')
      .single()

    if (!notif?.id) {
      // Insert failed (DB down, RLS rejection, network error) — do not open the
      // call UI because the callee will never receive an incoming-call alert.
      console.error('initiateCall: call_notifications insert returned no id — call aborted. Check DB/RLS.')
      return
    }

    outgoingNotifIdRef.current = notif.id
    // Auto-mark missed after 60 s if callee never responds
    missedTimerRef.current = setTimeout(async () => {
      if (outgoingNotifIdRef.current === notif.id) {
        await supabase.from('call_notifications')
          .update({ status: 'missed' })
          .eq('id', notif.id)
          .eq('status', 'pending')
        outgoingNotifIdRef.current = null
        setActiveCall(null)
      }
    }, 60000)

    startCall({
      roomId,
      type,
      participantName: contactName,
      participantAvatar: contactAvatar,
      participantId: contactId,
      notificationId: notif.id,
      isCaller: true,
    })
  }, [user?.id, startCall])

  // ── acceptCall — callee side ──────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    const { data: updated } = await supabase.from('call_notifications')
      .update({ status: 'accepted' })
      .eq('id', incomingCall.notificationId)
      .eq('status', 'pending')
      .select('id')
    // If zero rows updated, caller already cancelled — bail
    if (!updated || updated.length === 0) { setIncomingCall(null); return }

    const snap = incomingCall
    setIncomingCall(null)
    startCall({
      roomId: snap.roomId,
      type: snap.type,
      participantName: snap.fromName,
      participantAvatar: snap.fromAvatar,
      participantId: snap.fromId,
      notificationId: snap.notificationId,
      isCaller: false,
    })
  }, [incomingCall, startCall])

  // ── declineCall — callee side ─────────────────────────────────────────────
  const declineCall = useCallback(async () => {
    if (!incomingCall) return
    await supabase.from('call_notifications')
      .update({ status: 'declined' })
      .eq('id', incomingCall.notificationId)
      .eq('status', 'pending')   // guard against caller already cancelling
    setIncomingCall(null)
  }, [incomingCall])

  const dismissDeclined = useCallback(() => setCallDeclined(false), [])

  return (
    <LiveKitCallContext.Provider value={{
      activeCall, incomingCall, callDeclined,
      startCall, endCall, initiateCall, acceptCall, declineCall, dismissDeclined,
    }}>
      {children}
    </LiveKitCallContext.Provider>
  )
}

export function useLiveKitCall() {
  const ctx = useContext(LiveKitCallContext)
  if (!ctx) throw new Error('useLiveKitCall must be used inside LiveKitCallProvider')
  return ctx
}
