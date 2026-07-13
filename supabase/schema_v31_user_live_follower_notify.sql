-- ── schema_v31_user_live_follower_notify.sql ──────────────────────────────────
-- When a regular (non-admin-broadcast) livestream transitions to status='live',
-- notify all followers of the creator via notify_push_internal() (pg_net →
-- send-push edge function). Fires on both INSERT and UPDATE so it covers:
--   • SmartzTVPage.tsx   handleGoLive()          — inserts with status='live'
--   • AdminPersonalStudio.tsx handleGoLive()      — inserts with status='live'
--   • AdminSmartzTV.tsx  handleGoLive()           — updates to status='live'
-- is_admin_broadcast rows are intentionally excluded — they already use the
-- admin-manual broadcast path with a separate notify_push_internal call.

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_followers_on_user_live()
RETURNS TRIGGER AS $$
DECLARE
  v_follower RECORD;
  v_creator_name TEXT;
  v_action_url   TEXT;
BEGIN
  -- Only fire when the row just became 'live' and is NOT an admin broadcast
  IF NEW.status <> 'live' THEN
    RETURN NEW;
  END IF;
  -- On UPDATE: skip if status hasn't changed
  IF TG_OP = 'UPDATE' AND OLD.status = 'live' THEN
    RETURN NEW;
  END IF;
  -- Skip admin-broadcast streams (they're managed separately)
  IF NEW.is_admin_broadcast IS TRUE THEN
    RETURN NEW;
  END IF;
  -- creator_id must be set
  IF NEW.creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve creator display name (best-effort; empty string if not found)
  SELECT COALESCE(full_name, username, 'Someone')
    INTO v_creator_name
    FROM profiles
   WHERE id = NEW.creator_id
   LIMIT 1;

  v_action_url := '/app/smartztv';

  -- Fan-out: notify each follower of this creator
  FOR v_follower IN
    SELECT follower_id
      FROM follows
     WHERE following_id = NEW.creator_id
  LOOP
    PERFORM notify_push_internal(
      v_follower.follower_id,
      'user_live',
      '🔴 ' || v_creator_name || ' is Live!',
      v_creator_name || ' just started streaming — tap to watch',
      v_action_url
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let notification fan-out break the caller's transaction
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Attach trigger (INSERT + UPDATE) ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_notify_followers_on_user_live ON livestreams;
CREATE TRIGGER trg_notify_followers_on_user_live
  AFTER INSERT OR UPDATE OF status ON livestreams
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_user_live();
