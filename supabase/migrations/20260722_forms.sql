-- ================================================================
-- Forms system: site_forms + form_submissions
-- ================================================================

-- site_forms: stores form definitions (fields as JSONB)
CREATE TABLE IF NOT EXISTS public.site_forms (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  category             TEXT NOT NULL DEFAULT 'contact',
  description          TEXT,
  fields               JSONB NOT NULL DEFAULT '[]',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  submit_label         TEXT NOT NULL DEFAULT 'Submit',
  success_message      TEXT NOT NULL DEFAULT 'Thank you! Your submission has been received.',
  redirect_url         TEXT,
  email_notifications  BOOLEAN NOT NULL DEFAULT false,
  notification_email   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- form_submissions: stores each user submission as JSONB
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     UUID NOT NULL REFERENCES public.site_forms(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_forms_slug       ON public.site_forms(slug);
CREATE INDEX IF NOT EXISTS idx_site_forms_is_active  ON public.site_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_ts   ON public.form_submissions(created_at DESC);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_site_forms_updated_at ON public.site_forms;
CREATE TRIGGER trg_site_forms_updated_at
  BEFORE UPDATE ON public.site_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.site_forms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active forms (public form rendering)
DROP POLICY IF EXISTS "Public read active forms" ON public.site_forms;
CREATE POLICY "Public read active forms"
  ON public.site_forms FOR SELECT
  USING (is_active = true);

-- Admins can do everything on forms
DROP POLICY IF EXISTS "Admin full access forms" ON public.site_forms;
CREATE POLICY "Admin full access forms"
  ON public.site_forms FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- Anyone (including anon) can insert a submission
DROP POLICY IF EXISTS "Anyone can submit a form" ON public.form_submissions;
CREATE POLICY "Anyone can submit a form"
  ON public.form_submissions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.site_forms WHERE id = form_id AND is_active = true)
  );

-- Admins can read / delete submissions
DROP POLICY IF EXISTS "Admin read submissions" ON public.form_submissions;
CREATE POLICY "Admin read submissions"
  ON public.form_submissions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin delete submissions" ON public.form_submissions;
CREATE POLICY "Admin delete submissions"
  ON public.form_submissions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- Seed a default Contact Us form so the page is non-empty on first load
INSERT INTO public.site_forms (title, slug, category, description, fields, submit_label, success_message)
VALUES (
  'Contact Us',
  'contact',
  'contact',
  'Have a question or want to work together? We''d love to hear from you.',
  '[
    {"id":"f1","type":"text","label":"Full Name","placeholder":"Your full name","required":true,"order":0},
    {"id":"f2","type":"email","label":"Email Address","placeholder":"you@example.com","required":true,"order":1},
    {"id":"f3","type":"text","label":"Subject","placeholder":"What is this about?","required":true,"order":2},
    {"id":"f4","type":"textarea","label":"Message","placeholder":"Tell us more...","required":true,"order":3}
  ]'::jsonb,
  'Send Message',
  'Thanks for reaching out! We''ll get back to you within 24 hours.'
)
ON CONFLICT (slug) DO NOTHING;

-- Seed a Feedback form
INSERT INTO public.site_forms (title, slug, category, description, fields, submit_label, success_message)
VALUES (
  'Share Feedback',
  'feedback',
  'feedback',
  'We''re always looking to improve. Tell us what you think.',
  '[
    {"id":"f1","type":"text","label":"Name","placeholder":"Your name (optional)","required":false,"order":0},
    {"id":"f2","type":"email","label":"Email","placeholder":"your@email.com","required":false,"order":1},
    {"id":"f3","type":"rating","label":"Overall Rating","required":true,"order":2},
    {"id":"f4","type":"select","label":"Category","required":true,"options":["App Design","Performance","Features","Support","Other"],"order":3},
    {"id":"f5","type":"textarea","label":"Your Feedback","placeholder":"Tell us what you liked or what could be better...","required":true,"order":4}
  ]'::jsonb,
  'Submit Feedback',
  'Thank you for your feedback! It helps us improve every day.'
)
ON CONFLICT (slug) DO NOTHING;
