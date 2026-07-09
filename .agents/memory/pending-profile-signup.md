---
name: Pending profile data across email-verification signup
description: How avatar/DOB captured on the register form reach the profile row when signup requires email confirmation.
---

The Supabase `sufy-presign` edge function (used for all uploads, including
avatars) requires an authenticated session (`requireUser`). At signup time, if
email confirmation is required, `signUp()` does not return a usable session —
so an avatar picked on the register form can't be uploaded immediately.

**Why:** avoids either blocking registration on upload, or silently dropping
the chosen avatar/DOB when confirmation is required.

**How to apply:** `AuthContext.signUp` checks whether a session came back
immediately. If yes, it uploads/saves right away. If not, it base64-encodes
the avatar and stashes `{ dateOfBirth, avatarFile }` in
`localStorage["szc_pending_profile:<email>"]`. The `SIGNED_IN` branch of
`onAuthStateChange` calls `applyPendingProfile` to upload the avatar and write
`date_of_birth`/`avatar_url` once a real session exists, then clears the
localStorage entry. If this flow is touched again, keep both halves (stash +
apply) in sync — a change to one without the other will silently lose data.
