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

## Learning Application System (v29)
- Table: `learning_applications` — user_id (nullable/anon), course_id, full_name, email, phone, motivation, duration_days (3/5/7), cost, currency, status (pending/admin_approved/admin_rejected), admin_notes
- Schema: schema_v29_learning_applications.sql (applied to live DB)
- Public route: `/learning/apply/:courseId` — no auth required, pre-fills from profile if logged in
- Shows: course card, duration picker (3/5/7 days), personal details form, cost summary
- Realtime: subscribes to `learning_applications` row by ID after submit — shows live approval/rejection toast
- LearningPage: `application_enabled` + `application_cost` + `currency` fields on courses; Apply button shown if enabled

## Admin Applications tab (AdminLearning)
- 6th tab in AdminLearning: "Applications"
- Realtime subscription to learning_applications while on tab
- Filter: All / Pending / Approved / Rejected
- Expand each application to see details, notes textarea, Approve/Reject buttons
- On Approve: update status + send-email (application_approved template) + notifyUser() if user_id
- On Reject: update status + send-email (application_rejected template) + notifyUser() if user_id

## CEO Certificate Approval flow
- AdminCEO now has "Staff Management" | "Learning Approvals" view toggle
- Learning Approvals: fetches certificates where ceo_approved=false with course join
- Shows grade card (score ring), recipient, course, date, CEO notes field
- Approve: update ceo_approved=true + call send-certificate edge fn + notifyUser
- Reject: delete cert + notifyUser

## CoursePlayerPage CEO-approval flow
- Stage 'pending_ceo': shown after cert form submitted — pulsing CEO crown icon
- Stage 'ceo_approved': shown when CEO approves (via realtime UPDATE on certificates)
- sendCertificate() now inserts with ceo_approved:false; does NOT call send-certificate
- Realtime: subscribes to certificates UPDATE for this user/course; shows ceo_approved stage on approval
- On page load: checks for existing cert (pending or approved) and restores correct stage
