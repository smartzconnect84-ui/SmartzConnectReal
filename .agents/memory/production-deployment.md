---
name: Production deployment
description: How to deploy edge functions and run SQL against the live Supabase DB from Replit
---

# Production Deployment

## Edge Function Deployment
- Use `--use-api` flag: `supabase functions deploy <name> --use-api`
- Replit's shell blocks external DNS, so local Deno bundling fails (deno.land unreachable)
- `--use-api` uploads raw source to Supabase for server-side bundling — works fine
- CLI binary path: `/home/runner/.npm/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-linux-x64/bin/supabase`

**Why:** `supabase functions deploy` without `--use-api` tries to bundle locally using Deno, which needs to fetch from deno.land. Replit sandboxes block this DNS resolution.

## Database Connection
- Use **session pooler port 5432**, not transaction pooler port 6543
- Transaction pooler (6543) throws "Authentication credentials are invalid" from psql
- Connection: `postgresql://postgres.ufmuhwepyxzaldvcbipd:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require`
- Always set `PGSSLMODE=require` before psql commands

## admin_users Table
- `admin_users.id` is a FK to `profiles.id` — must use the user's profile UUID, no auto-generation
- Valid roles: `'admin'`, `'super_admin'`, `'ceo'`, `'moderator'` (not 'superadmin')
- To insert: provide `id = auth_id = profile UUID`

## SUFY Region
- SUFY_REGION set to `us-south-1` (tested: only region that returns HTTP 400 vs 000 DNS failure from Replit shell)
- Endpoint format: `https://<bucket>.mos.<region>.sufybkt.com/<key>`
- Display name "USA, dallas" → region code `us-south-1` (DNS resolves, other guesses like us-dallas-1 do not)
- Still worth confirming from SUFY dashboard if uploads fail after secrets are set

## Secrets Set on Supabase Edge Functions
All set via Management API `POST /v1/projects/{ref}/secrets`:
LIVEKIT_API_KEY, LIVEKIT_API_SECRET, STREAM_API_SECRET, ONESIGNAL_REST_API_KEY, ONESIGNAL_APP_ID, SUFY_ACCESS_KEY_ID, SUFY_SECRET_ACCESS_KEY, SUFY_BUCKET, SUFY_REGION
(RESEND_API_KEY and SERVICE_ROLE_KEY were already present)
