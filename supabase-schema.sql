-- ═══════════════════════════════════════════════════════════════════════════
-- SmartzConnect — SAFE IDEMPOTENT Schema
-- ✅ Run this even if you already ran a previous version — it will NOT error.
-- All statements use IF NOT EXISTS / DO $$ blocks to skip existing objects.
-- ═══════════════════════════════════════════════════════════════════════════
-- Run in: supabase.com/dashboard → Your Project → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Extend the existing `users` table with any missing columns ───────
-- Your DB already has a `users` table. We ADD columns only if they don't exist.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
    ALTER TABLE public.users ADD COLUMN username text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan') THEN
    ALTER TABLE public.users ADD COLUMN plan text DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='goal') THEN
    ALTER TABLE public.users ADD COLUMN goal text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='online') THEN
    ALTER TABLE public.users ADD COLUMN online boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
    ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ── STEP 2: Auto-sync auth.users → public.users on signup ───────────────────
-- Creates/replaces the trigger function that fires when a new user signs up.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (
    auth_id,
    email,
    name,
    email_verified,
    created_at,
    last_seen
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'email_confirmed')::boolean, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    name  = COALESCE(EXCLUDED.name, public.users.name);
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger (safe — CREATE OR REPLACE not available for triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── STEP 3: Sync email_verified when user confirms email ────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.users
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL),
      updated_at     = NOW()
  WHERE auth_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_updated();

-- ── STEP 4: matches table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a     int  REFERENCES public.users(id) ON DELETE CASCADE,
  user_b     int  REFERENCES public.users(id) ON DELETE CASCADE,
  matched_at timestamptz DEFAULT now(),
  UNIQUE(user_a, user_b)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='matches' AND policyname='Users can see their own matches') THEN
    CREATE POLICY "Users can see their own matches"
      ON public.matches FOR SELECT
      USING (
        auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_a) OR
        auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_b)
      );
  END IF;
END $$;

-- ── STEP 5: swipes table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.swipes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper     int  REFERENCES public.users(id) ON DELETE CASCADE,
  swiped     int  REFERENCES public.users(id) ON DELETE CASCADE,
  action     text NOT NULL CHECK (action IN ('like','pass','superlike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(swiper, swiped)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='swipes' AND policyname='Users can insert own swipes') THEN
    CREATE POLICY "Users can insert own swipes"
      ON public.swipes FOR INSERT
      WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = swiper));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='swipes' AND policyname='Users can see own swipes') THEN
    CREATE POLICY "Users can see own swipes"
      ON public.swipes FOR SELECT
      USING (
        auth.uid() = (SELECT auth_id FROM public.users WHERE id = swiper) OR
        auth.uid() = (SELECT auth_id FROM public.users WHERE id = swiped)
      );
  END IF;
END $$;

-- ── STEP 6: messages — add missing columns if needed ────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='match_id') THEN
    ALTER TABLE public.messages ADD COLUMN match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='read') THEN
    ALTER TABLE public.messages ADD COLUMN read boolean DEFAULT false;
  END IF;
END $$;

-- ── STEP 7: posts — add missing columns if needed ───────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='media_type') THEN
    ALTER TABLE public.posts ADD COLUMN media_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='shares_count') THEN
    ALTER TABLE public.posts ADD COLUMN shares_count int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='comments_count') THEN
    ALTER TABLE public.posts ADD COLUMN comments_count int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes_count') THEN
    ALTER TABLE public.posts ADD COLUMN likes_count int DEFAULT 0;
  END IF;
END $$;

-- ── STEP 8: subscriptions table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        int  REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  plan           text NOT NULL DEFAULT 'free',
  billing_cycle  text DEFAULT 'monthly',
  status         text DEFAULT 'active',
  payment_method text,
  tx_id          text,
  started_at     timestamptz DEFAULT now(),
  expires_at     timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Users can manage own subscription') THEN
    CREATE POLICY "Users can manage own subscription"
      ON public.subscriptions FOR ALL
      USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
  END IF;
END $$;

-- ── STEP 9: story_views table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id   uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  int  REFERENCES public.users(id)   ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='story_views' AND policyname='Story views readable') THEN
    CREATE POLICY "Story views readable" ON public.story_views FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='story_views' AND policyname='Users can insert story views') THEN
    CREATE POLICY "Users can insert story views"
      ON public.story_views FOR INSERT
      WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = viewer_id));
  END IF;
END $$;

-- ── STEP 10: comments table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid REFERENCES public.posts(id)  ON DELETE CASCADE,
  author_id  int  REFERENCES public.users(id)  ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Comments are publicly readable') THEN
    CREATE POLICY "Comments are publicly readable" ON public.comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Users can create comments') THEN
    CREATE POLICY "Users can create comments"
      ON public.comments FOR INSERT
      WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = author_id));
  END IF;
END $$;

-- ── STEP 11: groups table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groups (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  description text,
  avatar_url  text,
  is_private  boolean DEFAULT false,
  owner_id    int  REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Groups are publicly readable') THEN
    CREATE POLICY "Groups are publicly readable" ON public.groups FOR SELECT USING (true);
  END IF;
END $$;

-- ── STEP 12: group_members table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id   uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    int  REFERENCES public.users(id)  ON DELETE CASCADE,
  role       text DEFAULT 'member',
  joined_at  timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Group members readable') THEN
    CREATE POLICY "Group members readable" ON public.group_members FOR SELECT USING (true);
  END IF;
END $$;

-- ── STEP 13: rides table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rides (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id      int  REFERENCES public.users(id)    ON DELETE CASCADE,
  driver_id     int  REFERENCES public.drivers(id)  ON DELETE SET NULL,
  pickup        text NOT NULL,
  destination   text NOT NULL,
  status        text DEFAULT 'pending',
  fare          numeric(10,2),
  ride_type     text DEFAULT 'standard',
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rides' AND policyname='Users can see own rides') THEN
    CREATE POLICY "Users can see own rides"
      ON public.rides FOR SELECT
      USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = rider_id));
  END IF;
END $$;

-- ── STEP 14: marketplace_items table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id    int  REFERENCES public.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  price        numeric(10,2) NOT NULL,
  category     text,
  images       text[],
  condition    text DEFAULT 'new',
  status       text DEFAULT 'active',
  location     text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_items' AND policyname='Items are publicly readable') THEN
    CREATE POLICY "Items are publicly readable" ON public.marketplace_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_items' AND policyname='Sellers can manage own items') THEN
    CREATE POLICY "Sellers can manage own items"
      ON public.marketplace_items FOR ALL
      USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = seller_id));
  END IF;
END $$;

-- ── STEP 15: mobile_money_payments table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mobile_money_payments (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        int  REFERENCES public.users(id) ON DELETE CASCADE,
  plan           text NOT NULL,
  amount         numeric(10,2) NOT NULL,
  currency       text DEFAULT 'USD',
  provider       text NOT NULL,
  phone_number   text,
  tx_id          text,
  status         text DEFAULT 'pending',
  billing_cycle  text DEFAULT 'monthly',
  created_at     timestamptz DEFAULT now(),
  confirmed_at   timestamptz
);

ALTER TABLE public.mobile_money_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mobile_money_payments' AND policyname='Users can manage own payments') THEN
    CREATE POLICY "Users can manage own payments"
      ON public.mobile_money_payments FOR ALL
      USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
  END IF;
END $$;

-- ── STEP 16: Enable Realtime on key tables ───────────────────────────────────
-- Run these separately in SQL Editor after tables are created:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Done! Safe to re-run at any time — no duplicate errors.
-- ═══════════════════════════════════════════════════════════════════════════
