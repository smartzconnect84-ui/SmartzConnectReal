-- ============================================================
-- Schema v28: Courses, Lessons, Quizzes, Certificates
-- ============================================================

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  cover_url     text,
  category      text DEFAULT 'General',
  level         text DEFAULT 'Beginner' CHECK (level IN ('Beginner','Intermediate','Advanced')),
  duration_mins integer DEFAULT 0,
  pass_score    integer DEFAULT 70 CHECK (pass_score BETWEEN 0 AND 100),
  quiz_timer_secs integer DEFAULT 1800,
  is_published  boolean DEFAULT false,
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

-- Lessons (ordered within a course)
CREATE TABLE IF NOT EXISTS lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title         text NOT NULL,
  content       text,
  video_url     text,
  order_index   integer DEFAULT 0,
  duration_mins integer DEFAULT 5,
  created_at    timestamptz DEFAULT now()
);

-- Quiz questions per course
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question       text NOT NULL,
  options        jsonb NOT NULL DEFAULT '[]',  -- array of option strings
  correct_index  integer NOT NULL DEFAULT 0,   -- index into options[]
  explanation    text,
  order_index    integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- User quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  course_id          uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score              integer NOT NULL DEFAULT 0,
  total_questions    integer NOT NULL DEFAULT 0,
  answers            jsonb DEFAULT '[]',     -- [{question_id, chosen_index, correct}]
  time_taken_secs    integer DEFAULT 0,
  passed             boolean DEFAULT false,
  certificate_sent   boolean DEFAULT false,
  email_sent_to      text,
  completed_at       timestamptz DEFAULT now()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id       uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  course_id        uuid REFERENCES courses(id) ON DELETE CASCADE,
  recipient_name   text NOT NULL,
  email            text NOT NULL,
  score            integer NOT NULL,
  certificate_code text UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 10)),
  issued_at        timestamptz DEFAULT now(),
  sent_at          timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS lessons_course_idx         ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS quiz_questions_course_idx  ON quiz_questions(course_id, order_index);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx     ON quiz_attempts(user_id, course_id);
CREATE INDEX IF NOT EXISTS certificates_code_idx      ON certificates(certificate_code);

-- RLS
ALTER TABLE courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates     ENABLE ROW LEVEL SECURITY;

-- Courses: published visible to all auth users; full access for admin
CREATE POLICY "courses_select" ON courses FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "courses_admin"  ON courses FOR ALL   USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Lessons: visible if course is published; admin full
CREATE POLICY "lessons_select" ON lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND is_published = true)
  OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
CREATE POLICY "lessons_admin"  ON lessons FOR ALL   USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Quiz questions: auth users can read; admin manages
CREATE POLICY "quiz_q_select"  ON quiz_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quiz_q_admin"   ON quiz_questions FOR ALL   USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Attempts: users manage their own; admin sees all
CREATE POLICY "attempts_own"   ON quiz_attempts FOR ALL   USING (user_id = auth.uid());
CREATE POLICY "attempts_admin" ON quiz_attempts FOR ALL   USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Certificates: user sees own; admin sees all
CREATE POLICY "certs_own"   ON certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "certs_admin" ON certificates FOR ALL    USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Allow authenticated users to insert their own attempts
CREATE POLICY "attempts_insert" ON quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "certs_insert"    ON certificates  FOR INSERT WITH CHECK (user_id = auth.uid());
