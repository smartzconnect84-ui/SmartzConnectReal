---
name: Spin & Chat dating eligibility categories
description: How relationship_goal filters the Spin & Chat matching pool, and legacy value handling.
---

Spin & Chat only matches profiles whose `relationship_goal` is one of the three
current categories: `friendship`, `social`, `dating`. This keeps the wheel from
surfacing people who never opted into being matched.

**Why:** some rows still carry older `relationship_goal` values from earlier
schema revisions (`casual`, `long_term`, `marriage`, `networking`) written
before the category was narrowed to three options.

**How to apply:** the eligibility set in `SpinChatPage.tsx` maps legacy values
into the closest current bucket (`casual`→social, `long_term`/`marriage`→dating)
so existing users aren't silently dropped from the pool. `networking` has no
clear mapping and stays excluded on purpose. If the three-category taxonomy
changes again, update both `SpinChatPage.tsx`'s eligibility set and
`ProfilePage.tsx`'s "Looking for" dropdown together — they must stay in sync.
