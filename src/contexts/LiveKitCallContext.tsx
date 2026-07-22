import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext } from '@/contexts/AuthContext'
import { notifyUser } from '@/lib/notify'

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
  inviteToCall: (opts: { contactId: string; contactName: string; contactAvatar?: string }) => Promise<void>
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

  // ── Catch up on missed ring events ─────────────────────────────────────────
  // The realtime subscription above only delivers events while this client is
  // actively connected. If the device was offline, the tab was backgrounded/
  // suspended, or the app was closed when a call came in, the INSERT event is
  // never received. As soon as connectivity/visibility is restored, re-check
  // for any still-pending, unexpired incoming call so it surfaces immediately
  // instead of silently expiring into a missed call.
  useEffect(() => {
    if (!user?.id) return

    const checkForPendingCall = async (cancelledRef: { current: boolean }) => {
      if (activeCallRef.current) return
      const { data: rows } = await supabase
        .from('call_notifications')
        .select('id, from_id, room_name, call_type, expires_at, status')
        .eq('to_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
      // Re-check after the async query: the user may have entered/ended a call,
      // or unmounted, while this request was in flight.
      if (cancelledRef.current || activeCallRef.current) return
      const row = rows?.[0]
      if (!row) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', row.from_id)
        .single()

      // Re-check again after the second async hop, immediately before commit —
      // this closes the race the first re-check can't catch (e.g. the call was
      // accepted/expired/superseded by a realtime event during the profile fetch).
      if (cancelledRef.current || activeCallRef.current) return
      setIncomingCall(current => {
        // Don't clobber a call that arrived via realtime in the meantime, and
        // never resurrect an incoming call the user already dismissed/answered.
        if (current) return current
        return {
          notificationId: row.id,
          fromId: row.from_id,
          fromName: profile?.full_name || 'Someone',
          fromAvatar: profile?.avatar_url ?? undefined,
          roomId: row.room_name,
          type: row.call_type as CallType,
          expiresAt: row.expires_at,
        }
      })
    }

    const cancelledRef = { current: false }
    const handleOnline = () => { checkForPendingCall(cancelledRef) }
    const handleVisibility = () => { if (document.visibilityState === 'visible') checkForPendingCall(cancelledRef) }
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    // Also check once on mount (e.g. cold app launch from a call push tap)
    checkForPendingCall(cancelledRef)

    return () => {
      cancelledRef.current = true
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
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
          // Note: the decline push to the caller is sent once, from the callee's
          // own client in declineCall() below — do not duplicate it here.
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

    // ── Ring push — fires immediately, regardless of the callee's app state ──
    // The realtime subscription above only pops the incoming-call UI while the
    // callee's app is open and connected. To reach them while offline/backgrounded/
    // screen-off (as long as they have internet), send a high-priority OS push the
    // instant the call starts ringing — not just after the 60s missed-call timeout.
    // A short TTL matches the ring window so a stale "call" push never arrives late.
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
      .then(({ data: callerProfile }) => {
        notifyUser({
          userId: contactId,
          type: 'call',
          title: `Incoming ${type === 'video' ? 'video' : 'audio'} call 📞`,
          message: `${callerProfile?.full_name || 'Someone'} is calling you`,
          actionUrl: `/app/profile/${user.id}`,
          emoji: '📞',
        }).catch(() => {})
      })

    outgoingNotifIdRef.current = notif.id
    // Auto-mark missed after 60 s if callee never responds
    missedTimerRef.current = setTimeout(async () => {
      if (outgoingNotifIdRef.current === notif.id) {
        const { data: updated } = await supabase.from('call_notifications')
          .update({ status: 'missed' })
          .eq('id', notif.id)
          .eq('status', 'pending')
          .select('id')
        outgoingNotifIdRef.current = null
        setActiveCall(null)
        // Only push a "missed call" if this update actually flipped a still-
        // pending row. If it affected zero rows, the callee already accepted
        // or declined (their status change just hasn't reached this client's
        // realtime subscription yet) — pushing "missed" here would be a false
        // notification on top of a call that was actually answered.
        if (updated && updated.length > 0) {
          notifyUser({
            userId: contactId,
            type: 'missed_call',
            title: 'Missed Call 📞',
            message: `You missed a ${type} call. Tap to call back.`,
            actionUrl: `/app/profile/${user.id}`,
            emoji: '📞',
          }).catch(() => {})
        }
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

  // ── inviteToCall — add another participant to the CURRENT active call room ─
  const inviteToCall = useCallback(async (opts: { contactId: string; contactName: string; contactAvatar?: string }) => {
    if (!user?.id || !activeCallRef.current) return
    const { contactId } = opts
    const roomId = activeCallRef.current.roomId
    await supabase.from('call_notifications').insert({
      from_id: user.id,
      to_id: contactId,
      room_name: roomId,
      call_type: activeCallRef.current.type,
      status: 'pending',
    })
    await supabase.from('call_invites').upsert({
      room_name: roomId,
      user_id: contactId,
      invited_by: user.id,
      status: 'invited',
    }, { onConflict: 'room_name,user_id' })
  }, [user?.id])

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
    if (user?.id) {
      await supabase.from('call_invites').upsert({
        room_name: snap.roomId,
        user_id: user.id,
        status: 'joined',
        joined_at: new Date().toISOString(),
      }, { onConflict: 'room_name,user_id' })
    }
    startCall({
      roomId: snap.roomId,
      type: snap.type,
      participantName: snap.fromName,
      participantAvatar: snap.fromAvatar,
      participantId: snap.fromId,
      notificationId: snap.notificationId,
      isCaller: false,
    })
  }, [incomingCall, startCall, user?.id])

  // ── declineCall — callee side ─────────────────────────────────────────────
  const declineCall = useCallback(async () => {
    if (!incomingCall) return
    const snap = incomingCall
    await supabase.from('call_notifications')
      .update({ status: 'declined' })
      .eq('id', snap.notificationId)
      .eq('status', 'pending')   // guard against caller already cancelling
    setIncomingCall(null)
    // Notify the caller that callee actively declined (callee-side path)
    notifyUser({
      userId: snap.fromId,
      type: 'missed_call',
      title: 'Call Declined 📵',
      message: `${user?.email?.split('@')[0] || 'Someone'} declined your call.`,
      actionUrl: user?.id ? `/app/profile/${user.id}` : '/app',
      emoji: '📵',
    }).catch(() => {})
  }, [incomingCall, user?.id, user?.email])

  const dismissDeclined = useCallback(() => setCallDeclined(false), [])

  return (
    <LiveKitCallContext.Provider value={{
      activeCall, incomingCall, callDeclined,
      startCall, endCall, initiateCall, acceptCall, declineCall, dismissDeclined, inviteToCall,
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
