-- ============================================================
-- SmartzConnect — Automated Daily Database Backup
-- Run this once in the Supabase SQL Editor
-- ============================================================

-- 1. Enable required extensions (already done, idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the storage bucket for backups (idempotent via function)
--    The Edge Function creates it automatically on first run.
--    Alternatively, create it here:
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'db-backups',
  'db-backups',
  false,
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: only service role can access backup files
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role full access to db-backups'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role full access to db-backups"
      ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'db-backups'
        AND auth.role() = 'service_role'
      )
    $policy$;
  END IF;
END $$;

-- 3. Schedule the backup Edge Function to run every day at 02:00 UTC
--    pg_net.http_post calls the Edge Function via HTTP
--    Replace YOUR_SUPABASE_PROJECT_REF and YOUR_SERVICE_ROLE_KEY below.

SELECT cron.schedule(
  'daily-database-backup',
  '0 2 * * *',  -- every day at 02:00 UTC
  $$
  SELECT net.http_post(
    url     := 'https://ufmuhwepyxzaldvcbipd.supabase.co/functions/v1/database-backup',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- 4. (Optional) Run a manual backup right now to verify it works:
-- SELECT net.http_post(
--   url     := 'https://ufmuhwepyxzaldvcbipd.supabase.co/functions/v1/database-backup',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--   ),
--   body    := '{}'::jsonb
-- );

-- 5. View scheduled jobs
-- SELECT * FROM cron.job;

-- 6. View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- 7. To remove the schedule:
-- SELECT cron.unschedule('daily-database-backup');
