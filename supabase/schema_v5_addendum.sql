-- ═══════════════════════════════════════════════════════════════════════════
-- Schema v5 addendum — moderation status columns for admin backend modules
-- Run this in Supabase SQL Editor after schema_complete.sql + v4 addendum.
-- Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.marketplace_items
  add column if not exists moderation_status text default 'approved'
    check (moderation_status in ('pending','approved','rejected'));

alter table public.streams
  add column if not exists moderation_status text default 'approved'
    check (moderation_status in ('pending','approved','rejected'));

create index if not exists marketplace_moderation_idx on public.marketplace_items(moderation_status);
create index if not exists streams_moderation_idx on public.streams(moderation_status);
