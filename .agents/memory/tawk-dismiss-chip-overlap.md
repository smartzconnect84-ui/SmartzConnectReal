---
name: Tawk dismiss-chip overlap bug
description: Root cause of the custom tawk.to launcher "disappearing totally" when a visitor opened the chat window.
---

The app renders its own small "×" dismiss chip next to Tawk's floating launcher
(`src/components/TawkController.tsx`). That chip sits close enough to Tawk's own widget controls
that, once a visitor opened Tawk's chat window, an accidental click could land on the app's chip
instead of Tawk's UI — and the chip's handler called `hideWidget()`, which hides the *entire*
Tawk widget (launcher included), not just the dismiss affordance. From the user's side this
looked like live chat going "inactive" and vanishing.

**Why:** `hideWidget()`/`showWidget()` in the Tawk API operate on the whole widget, there is no
"hide just the launcher" call.

**How to apply:** the fix tracks Tawk's own chat-open/close lifecycle
(`initTawkChatOpenTracking()` / `subscribeTawkChatOpen()` in `src/lib/tawk.ts`, wired through
Tawk's `onChatMaximized`/`onChatMinimized`/`onChatHidden`/`onChatEnded` callbacks) and hides the
app's dismiss chip whenever Tawk's chat window is open, so there's nothing to mis-click. If a
user reports Tawk support being unresponsive after this, that's a staffing/dashboard-coverage
issue, not a code bug.
