---
    name: Vercel token empty despite existing
    description: VERCEL_TOKEN secret shows as configured but resolves empty in shell/workflow, breaking the Deploy to Vercel workflow with "missing a value" error.
    ---

    Same class of bug as the general "secrets stuck empty" issue but specific to VERCEL_TOKEN: viewEnvVars({type:"secret"}) reports it exists, yet `echo ${#VERCEL_TOKEN}` in shell returns 0 and the Vercel CLI deploy workflow fails with "You defined --token, but it's missing a value".

    **Why:** Occasionally Replit secrets get into a stuck state where they're registered but not actually materialized into the shell/workflow environment.

    **How to apply:** Don't try to "fix" this by editing the deploy command or vercel config. Call requestSecrets({keys:["VERCEL_TOKEN"], userMessage: "..."}) to have the user re-confirm/re-enter it, then verify with a shell echo of the length before re-running the deploy workflow.
    