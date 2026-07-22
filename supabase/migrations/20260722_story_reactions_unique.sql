-- Add unique constraint on story_reactions(story_id, viewer_id)
-- so that upsert with onConflict:'story_id,viewer_id' works correctly.
-- This prevents duplicate reactions from the same user on the same story.
ALTER TABLE public.story_reactions
  DROP CONSTRAINT IF EXISTS story_reactions_story_id_viewer_id_key;

ALTER TABLE public.story_reactions
  ADD CONSTRAINT story_reactions_story_id_viewer_id_key
  UNIQUE (story_id, viewer_id);
