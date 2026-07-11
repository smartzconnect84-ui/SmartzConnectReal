---
name: Tawk.to live chat widget fix
description: openTawkChat() was calling maximize() on a fully-hidden widget — chat was unreachable from any entry point.
---

Root cause: `Tawk_API.hideWidget()`/`showWidget()` control visibility of the **entire** widget (launcher bubble AND chat window), not just the launcher — confirmed via tawk's own JS API docs. `index.html` calls `hideWidget()` on load (intentional, to replace tawk's launcher with the app's own `FloatingSupportWidget`), but `src/lib/tawk.ts`'s `openTawkChat()` only called `maximize()`, never `showWidget()` first. Every "Live Support" entry point (FloatingSupportWidget, Footer, Navbar) was silently a no-op.

**Fix:** `openTawkChat()` now calls `showWidget()` immediately before `maximize()` (both in the instant path and the async-retry path for slow script loads). Also pinned `Tawk_API.customStyle` (bottom-right, high z-index) before the embed script loads so any pre-hide flash doesn't jump around.

**Why noted:** the "hideWidget = launcher-only" assumption is an easy trap — it silently breaks the entire chat feature with no console error, since `maximize()` on a hidden widget just does nothing.
