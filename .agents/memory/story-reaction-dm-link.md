---
name: Story reaction/comment DM linking
description: How story reactions and comments were wired to also deliver as a real chat DM to the author.
---

Story emoji reactions and comments now trigger `sendStoryEventToChat()` (in `src/lib/stream.ts`)
in addition to the in-app notification. It's a fire-and-forget helper that reuses
`getOrCreateDirectChannel` to open/reuse the 1:1 Stream Chat channel between the viewer and the
story author, then sends a message summarizing the reaction/comment.

**Why:** the user wanted story engagement to feel like a real conversation starter, not just a
silent notification badge — and the notification's `actionUrl` was pointed at the generic feed,
so tapping it never actually opened the conversation.

**How to apply:** `notifyUser()` calls for story events now set `actionUrl` to
`/app/chat/:viewerId` (the DM route takes the *other user's* profile UUID, not a channel id — see
the existing Stream Chat routing contract memory) so tapping the notification lands directly in
the new DM thread.
