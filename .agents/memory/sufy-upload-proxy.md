---
name: SUFY upload proxy
description: How file uploads to SUFY work — browser can't PUT directly (CORS); must proxy through edge function.
---

# SUFY Upload Proxy Pattern

## The rule
Never issue presigned PUT URLs for the browser to use directly. SUFY's S3-compatible endpoint does not set `Access-Control-Allow-Origin` headers, so cross-origin browser PUTs fail with "Failed to fetch".

## How it works now
- `supabase/functions/sufy-upload/index.ts` — new edge function that accepts `multipart/form-data`, authenticates the caller via `requireUser()`, then PUTs the file body to SUFY server-side using `aws4fetch` SigV4 signing.
- `src/lib/sufy.ts` — `uploadToSufy()` sends `FormData` (file + folder) to `sufy-upload` and returns the `publicUrl`. The old presign→browser-PUT two-step flow is gone.
- `supabase/functions/_shared/sufyStorage.ts` — added `uploadObject(config, key, body, contentType)` helper used by the edge function.

**Why:** SUFY CORS blocks browser PUT; edge function has server-side credentials and no CORS restriction.

**How to apply:** Any new upload call site should use `uploadToSufy(file, folder)` from `src/lib/sufy.ts`. Never use the old `sufy-presign` function for uploads — keep it only if presigned URLs are needed for other S3 operations.

## Limits enforced in sufy-upload
- 50 MB max per file (returns 413 if exceeded)
- `file instanceof File` + `typeof folder === 'string'` validated before arrayBuffer read
- SUFY error body is NOT forwarded to client (only status code)

## Deployment
The live Supabase edge function (`sufy-upload`, project `ufmuhwepyxzaldvcbipd`) is self-contained JS (no imports from _shared) because it was deployed via Management API (not CLI). The TS version in the repo uses shared imports — correct for future CLI deployments.
