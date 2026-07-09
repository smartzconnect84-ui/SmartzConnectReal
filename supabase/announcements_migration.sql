-- ============================================================
-- SmartzConnect — System Announcements Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message      text        NOT NULL,
  type         text        NOT NULL DEFAULT 'info'
                           CHECK (type IN ('info', 'warning', 'success', 'error', 'promo')),
  is_active    boolean     NOT NULL DEFAULT true,
  link_text    text,
  link_url     text,
  created_by   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- 3. All authenticated users can READ active announcements
CREATE POLICY "Anyone can read active announcements"
  ON public.system_announcements FOR SELECT
  USING (true);

-- 4. Only service role / admins can INSERT/UPDATE/DELETE
-- (Admins access via Supabase service role key in edge functions,
--  or use the admin-only policies below based on your auth setup)

CREATE POLICY "Admins can manage announcements"
  ON public.system_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 5. Optional: extend admin_users with extra staff columns (run if needed)
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS department       text,
  ADD COLUMN IF NOT EXISTS responsibilities text,
  ADD COLUMN IF NOT EXISTS avatar_url       text;

-- 6. Seed with a welcome announcement (optional)
-- INSERT INTO public.system_announcements (message, type, is_active)
-- VALUES ('🎉 Welcome to SmartzConnect — Africa''s #1 social platform!', 'promo', true);
