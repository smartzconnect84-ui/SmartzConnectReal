-- ============================================================================
-- schema_v26b_newsletter_grants.sql
-- Table-level GRANTs for newsletter_subscribers — RLS policies alone are not
-- enough; Postgres also requires the base privilege before RLS is evaluated.
-- Never edit prior version files — see .agents/memory/schema-evolution.md.
-- ============================================================================

grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to authenticated;
grant usage on schema public to anon, authenticated;
