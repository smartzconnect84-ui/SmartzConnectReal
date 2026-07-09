---
name: WorldChat channel lifecycle
description: How to correctly set up and tear down the WorldChat Stream channel to avoid duplicate event subscriptions and connection races.
---

# WorldChat Channel Lifecycle

**Rule:** Store each event handler in a local `let` variable inside the effect so `ch.off(event, handler)` can target the exact function on cleanup. Remove all handlers before calling `ch.stopWatching()`.

**Why:** The effect now depends on `[user?.id, streamConnected]`. When `streamConnected` toggles (reconnect/re-init), cleanup runs then init runs again. If handlers aren't removed precisely, the old channel instance accumulates duplicate listeners and every incoming message fires multiple times.

**How to apply:**
1. Declare `let onNew: ((e:any)=>void) | null = null` etc. at effect scope.
2. After `ch.watch()` succeeds, assign and attach: `onNew = (e) => {...}; ch.on('message.new', onNew)`.
3. In the cleanup return: `if (onNew) ch.off('message.new', onNew)` then `ch.stopWatching()`.
4. Use `user?.id` (primitive) not the full `user` object in the dep array to avoid spurious re-inits when auth context re-renders.
5. Gate the effect on `streamConnected` — `channel.watch()` throws if the Stream user is not yet authenticated.
