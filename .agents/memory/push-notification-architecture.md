---
name: Push notification architecture
description: Rule for adding real OS push (not just in-app badge) for new social/system events.
---

- Always use `notifyUser()` (in `src/lib/notify.ts`) for anything that should trigger a real device push. Raw inserts into the notifications table only update the in-app red-dot badge — no push/sound fires.
- **Why:** the two paths look similar in code but silently diverge in user-visible behavior; this was found via a full audit and is easy to regress by copy-pasting an old insert pattern.
- Broadcast-style notification types (site-wide announcements, admin go-live actions) must be server-side gated to admin/staff accounts, not just allowlisted by type — a type-only allowlist lets any authenticated user impersonate an admin broadcast to arbitrary recipients.
- Mass fan-out (to all followers/all users) for feed-style events is an open follow-up, not yet implemented — avoid building ad-hoc N+1 fan-out in a request handler; it needs a batched/segmented push design.
