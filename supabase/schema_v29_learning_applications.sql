-- ============================================================
-- Schema v29: Learning Applications + CEO Certificate Approval
-- ============================================================

-- 1. Add application fields to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS application_cost    numeric DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency            text    DEFAULT 'USD';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS application_enabled boolean DEFAULT false;

-- 2. Learning Applications table
CREATE TABLE IF NOT EXISTS learning_applications (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        REFERENCES profiles(id) ON DELETE SET NULL, -- nullable: public/anonymous applicants
  course_id          uuid        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  full_name          text        NOT NULL,
  email              text        NOT NULL,
  phone              text,
  motivation         text,
  duration_days      integer     NOT NULL DEFAULT 3 CHECK (duration_days IN (3, 5, 7)),
  cost               numeric     DEFAULT 0,
  currency           text        DEFAULT 'USD',
  status             text        NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','admin_approved','admin_rejected')),
  admin_notes        text,
  admin_reviewed_at  timestamptz,
  admin_reviewed_by  uuid,       -- admin_users.id FK omitted to avoid circular policy issues
  created_at         timestamptz DEFAULT now()
);

-- 3. Add CEO approval columns to certificates
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS ceo_approved    boolean     DEFAULT false;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS ceo_approved_at timestamptz;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS ceo_notes       text;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS la_status_idx    ON learning_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS la_user_idx      ON learning_applications(user_id);
CREATE INDEX IF NOT EXISTS la_course_idx    ON learning_applications(course_id);
CREATE INDEX IF NOT EXISTS la_email_idx     ON learning_applications(email);
CREATE INDEX IF NOT EXISTS certs_ceo_idx    ON certificates(ceo_approved, issued_at DESC);

-- 5. RLS for learning_applications
ALTER TABLE learning_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit an application
CREATE POLICY "la_public_insert"  ON learning_applications FOR INSERT WITH CHECK (true);

-- Authenticated users see their own applications
CREATE POLICY "la_user_select"    ON learning_applications FOR SELECT
  USING (user_id = auth.uid());

-- Admin has full access
CREATE POLICY "la_admin_all"      ON learning_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- 6. Allow admin to update certificates (for CEO approval)
CREATE POLICY IF NOT EXISTS "certs_admin_update" ON certificates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- 7. Allow CEO to delete (reject) certificates
CREATE POLICY IF NOT EXISTS "certs_admin_delete" ON certificates FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
