---
name: Learning courses & quiz system
description: Architecture of the course/lesson/quiz/certificate pipeline added in July 2026.
---

## Tables (schema_v28_learning_courses.sql — applied to live DB)
- courses, lessons, quiz_questions, quiz_attempts, certificates
- All have RLS; admin_users has full access; published courses visible to all auth users
- courses has pass_score (%) and quiz_timer_secs columns for per-course quiz config

## Edge functions deployed
- send-certificate: emails a styled HTML certificate; uses Resend via RESEND_API_KEY; from: academy@smartzconnect.com
- send-email: updated with 'invoice' template (full invoice HTML embedded in branded email)

## Routes
- /app/learning — LearningPage with Courses/Resources toggle tabs; courses tab shows catalog + featured banner
- /app/course/:courseId — CoursePlayerPage: overview → lessons → timed quiz → result → certificate email form
- /admin/learning — AdminLearning: 5 tabs (Courses, Lessons, Quiz Builder, Timer & Scoring, Certificates)

## Admin Learning tabs
- Courses: CRUD for courses with cover image, level, category, pass_score, quiz_timer_secs; publish toggle
- Lessons: per-course lesson CRUD (text content + optional video URL)
- Quiz Builder: per-course question CRUD with 4-option multi-choice, correct answer, explanation
- Timer & Scoring: edit quiz_timer_secs and pass_score per course in one view
- Certificates: searchable list of all issued certificates with codes + dates

## CoursePlayerPage quiz flow
1. Overview → select/start lessons → mark complete
2. "Start Quiz" launches timed countdown (course.quiz_timer_secs); auto-submits on timeout
3. Per-question answer → shows correct/wrong + explanation before next question
4. Result shows score ring + pass/fail; if passed → "Get Certificate" button
5. Certificate form: enter name + email (pre-filled from profile) → calls send-certificate edge fn → saves to certificates table

## Invoice email (InvoiceGeneratorPage)
- "Bill To" email field has Supabase auto-detect: debounced ilike query on profiles(email, full_name); dropdown picks name too
- "Send Invoice by Email" calls send-email edge fn with template:'invoice'; shows success/error toast

**Why:** Requested features — quiz timer, certificate generator in admin, full course learning flow, invoice email with Supabase user auto-detect.

**How to apply:** Admin creates courses + lessons + quiz questions at /admin/learning. Set pass_score and quiz_timer_secs per course under Timer & Scoring tab. Users take course at /app/course/:id. To issue certificates, RESEND_API_KEY must be set in Supabase edge function secrets.
