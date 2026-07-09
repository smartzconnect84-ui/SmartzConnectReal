---
name: SpinChat smart matching
description: How the interest/country scoring algorithm works in SpinChatPage and the design decisions behind it.
---

# SpinChat Smart Matching

## The rule
`scoreMatch(candidate, myInterests, myCountry)` returns a numeric score:
- +10 pts per shared interest (case-insensitive string comparison)
- +5 pts for same country

In `spin()`, the active pool (presence > online > anyone) is sorted by score descending (ties broken randomly), then the top-3 candidates are selected randomly. This preserves the fun "spin" feel while biasing toward compatible people.

**Why top-3 and not top-1:** Picking only the best match would feel deterministic and boring — the spin wheel would always land on the same person. Top-3 keeps variety while still preferring good matches.

## Current user data
`myInterests` and `myCountry` are fetched in a `useEffect` on `user.id` with a `cancelled` flag guard so stale responses don't update state after unmount or user change. Stored in component state, not a ref, so re-renders after fetch automatically improve future spins.

## How to apply
- If adding new match signals (e.g. age range, preferred gender), add them to `scoreMatch()` with appropriate point weights.
- The `myInterests`/`myCountry` fetch is in `SpinChatPage.tsx` — extend the `select()` query if more fields are needed.
- The top-N slice (`Math.min(3, scored.length)`) can be tuned if matching feels too predictable or too random.
