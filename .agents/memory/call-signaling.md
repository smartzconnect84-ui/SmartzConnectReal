---
name: Call signaling state machine
description: Full video/audio call system — how signaling flows, critical bugs fixed, and key decisions.
---

## Signal flow
1. Caller: `initiateCall()` → inserts `call_notifications` row (status=pending) → joins LiveKit room → 60s missed timer starts
2. Callee: realtime INSERT fires → `IncomingCall` overlay shows
3. Callee accepts: `acceptCall()` updates status=accepted (guarded with `.eq('status','pending')`) → joins same LiveKit room
4. Callee declines: `declineCall()` updates status=declined → caller gets realtime UPDATE → "Call declined" toast
5. Caller cancels: `endCall()` updates status=cancelled (guarded by pending) → callee overlay dismisses

## Critical: clear outgoingNotifIdRef on accepted
When callee accepts, the outgoing subscription fires with status='accepted'. You MUST:
- `clearTimeout(missedTimerRef.current)`
- Set both `missedTimerRef.current = null` and `outgoingNotifIdRef.current = null`

**Why:** The 60s missed timer checks `outgoingNotifIdRef.current === notif.id` but does NOT check if the call is active. Without clearing the ref on accepted, the timer fires at 60s, calls `setActiveCall(null)`, and terminates the call silently.

## State transition guards
- `acceptCall()` and `declineCall()` both use `.eq('status', 'pending')` on the update.
- If zero rows updated → caller already cancelled → bail silently.

## endCall() is async
All call sites must use `void endCall().catch(console.error)` — never fire-and-forget without error handling, and never block the UI thread with `await` in event handlers.

## Provider ordering
`AuthProvider` wraps `LiveKitCallProvider` in App.tsx — safe to call `useAuth()` inside the provider.

## Tables used
- `call_notifications`: realtime enabled, RLS allows both from_id and to_id to SELECT/UPDATE
- `video_calls`: caller inserts on connect (status=active), updates on disconnect (status=ended, duration_s)
