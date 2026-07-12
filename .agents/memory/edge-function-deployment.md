---
name: Edge function deployment
description: How to deploy all Supabase edge functions from Replit; which CLI version and flags work.
---

Use the **globally installed** `supabase` CLI (v2.109.1+, at `/home/runner/workspace/.config/npm/node_global/bin/supabase`), NOT `npx supabase@1.x.x` — older pinned versions don't support `--use-api`.

Deploy all functions in one command with parallel jobs:

```bash
export SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"
supabase functions deploy \
  database-backup livekit-public-token livekit-token \
  mux-create-stream mux-delete-stream mux-rotate-key \
  mux-stream-health mux-stream-status notify send-email \
  send-push stream-token stream-webhook sufy-delete \
  sufy-presign sufy-upload \
  --project-ref ufmuhwepyxzaldvcbipd --use-api -j 4
```

Project ref: `ufmuhwepyxzaldvcbipd` | Region: `eu-west-1`

**Why:** `npx supabase@1.207.9 functions deploy --use-api` throws "unknown flag: --use-api". Always use the globally installed binary.

**How to apply:** Any time edge functions need to be redeployed (new secrets, code changes, or routine sync). SUPABASE_ACCESS_TOKEN must be valid (length ~44 chars).
