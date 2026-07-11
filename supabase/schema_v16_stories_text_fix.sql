-- v16: fix stories_media_type_check to allow 'text' stories.
-- Text stories (media_type='text', text_content + bg_color, no media_url)
-- were added in a later app iteration, but the original CHECK constraint on
-- `stories.media_type` was never updated to allow that value. Every text
-- story creation attempt (FeedPage StoriesBar quick text story, CreateModal
-- text story tab) was failing at the DB layer with a constraint violation,
-- silently swallowed in some call sites.
alter table public.stories drop constraint if exists stories_media_type_check;
alter table public.stories add constraint stories_media_type_check
  check (media_type = any (array['image', 'video', 'text']));
