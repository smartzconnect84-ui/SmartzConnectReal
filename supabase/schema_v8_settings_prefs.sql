-- ─── v8: User preferences column + settings persistence ─────────────────────
-- Adds a JSONB preferences column to profiles for storing all user settings
-- client-side, without needing a separate table.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index for fast lookups when filtering by specific preference values
CREATE INDEX IF NOT EXISTS idx_profiles_preferences
  ON profiles USING gin (preferences);

-- ─── Ensure post column for media support ────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';   -- 'image' | 'video'

-- ─── Ensure stories uses consistent column naming ─────────────────────────────
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Back-fill author_id from user_id where author_id is null
UPDATE stories SET author_id = user_id WHERE author_id IS NULL AND user_id IS NOT NULL;

-- ─── Ensure documents bucket row exists in storage.buckets ───────────────────
-- (Only runs if storage schema is accessible)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('voice-messages', 'voice-messages', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('photos', 'photos', true)
  ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload to storage buckets
DO $$
BEGIN
  -- documents bucket policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'allow auth upload documents'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "allow auth upload documents" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'documents');
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'allow auth read documents'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "allow auth read documents" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'documents');
    $pol$;
  END IF;

  -- voice-messages bucket policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'allow auth upload voice'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "allow auth upload voice" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'voice-messages');
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'allow public read voice'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "allow public read voice" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'voice-messages');
    $pol$;
  END IF;
END $$;

-- ─── Verification settings request table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ,
  notes       TEXT,
  UNIQUE (user_id, status)
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own verification requests" ON verification_requests;
CREATE POLICY "users can view own verification requests"
  ON verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users can insert own verification request" ON verification_requests;
CREATE POLICY "users can insert own verification request"
  ON verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
