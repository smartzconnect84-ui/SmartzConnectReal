# Deploying the push-notification fixes

Code changes are complete, but three steps must run against your live Supabase
project (I don't have network/credential access to your Supabase project from
this session, so these need to be run by you — takes ~5 minutes):

## 1. Deploy the updated `send-push` edge function
```
supabase functions deploy send-push --project-ref ufmuhwepyxzaldvcbipd
```

## 2. Set the internal push secret on the edge function
Generate a random secret (e.g. `openssl rand -hex 32`) and set it — this must
be a value distinct from your service-role key:
```
supabase secrets set INTERNAL_PUSH_SECRET=<your-random-secret> --project-ref ufmuhwepyxzaldvcbipd
```

## 3. Apply the SQL changes and configure the same secret in Postgres
Run `supabase/schema.sql` and `supabase/mobile_money_payments.sql` (via the
Supabase SQL Editor or psql) to pick up:
- `notify_push_internal()` helper + `REVOKE` lockdown
- updated `check_mutual_like()` (mutual dating matches)
- updated `activate_subscription_on_payment()` (payment confirmations)

Then set the two DB settings the trigger helper reads (use the **same**
random secret from step 2):
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
ALTER DATABASE postgres SET app.supabase_url = 'https://ufmuhwepyxzaldvcbipd.supabase.co';
ALTER DATABASE postgres SET app.internal_push_secret = '<the-same-random-secret-from-step-2>';
```

After this, mutual likes and subscription activations will fire real OS push
notifications (not just in-app rows), matching every other feature.
