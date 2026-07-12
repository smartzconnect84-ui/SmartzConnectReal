---
name: Secrets stuck empty despite showing as available
description: A secret can be listed as configured/available yet resolve to an empty string everywhere until the user re-enters it.
---

`SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `GITHUB_TOKEN`, and other secrets
were listed as available in the environment snapshot, but `${#VAR}` length checks in a fresh
ShellExec shell (and the CodeExecution sandbox) showed length 0 for several of them — i.e. they
existed as keys but held empty values.

**Why:** unclear root cause (possibly cleared/never actually saved despite appearing "set"); not
reproducible from code — don't assume a secret works just because it's listed.

**How to apply:** before relying on a secret for a real operation (DB password, deploy token,
API key), verify it resolves with a real length via `echo "${#VAR}"` in the shell. If it's 0,
use `requestSecrets({ keys: [...] })` to have the user re-enter it — that alone fixed the issue
here with no code changes needed.
