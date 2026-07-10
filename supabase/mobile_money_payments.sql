-- ============================================================
-- SmartzConnect — Mobile Money Payments Table
-- Add this to your Supabase SQL Editor
-- NOTE: This file reflects the LIVE schema (status enum updated
--       from legacy pending_verification/verified/expired to
--       pending/confirmed/rejected/refunded in schema_v7_production.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS mobile_money_payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL CHECK (provider IN ('mtn', 'orange', 'other')),
  phone_number      TEXT,
  amount_usd        DECIMAL(10,2) NOT NULL,
  amount_local      DECIMAL(10,2),
  currency_local    TEXT DEFAULT 'LRD',
  transaction_id    TEXT UNIQUE,
  plan_id           TEXT,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'rejected', 'refunded')),
  notes             TEXT,
  verified_by       UUID REFERENCES auth.users(id),
  verified_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mobile_money_user    ON mobile_money_payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_money_status  ON mobile_money_payments(status);
CREATE INDEX IF NOT EXISTS idx_mobile_money_txid    ON mobile_money_payments(transaction_id);
CREATE INDEX IF NOT EXISTS payments_status_idx      ON mobile_money_payments(status);
CREATE INDEX IF NOT EXISTS payments_user_idx        ON mobile_money_payments(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE mobile_money_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see own mobile money payments"
  ON mobile_money_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit mobile money payments"
  ON mobile_money_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all mobile money payments"
  ON mobile_money_payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update payment status"
  ON mobile_money_payments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Enable Realtime for payment status updates
ALTER PUBLICATION supabase_realtime ADD TABLE mobile_money_payments;

-- Auto-activate subscription when payment is confirmed
CREATE OR REPLACE FUNCTION activate_subscription_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Upsert subscription
    INSERT INTO subscriptions (user_id, tier, status, price_usd, started_at, expires_at, auto_renew)
    VALUES (
      NEW.user_id,
      NEW.plan_id,
      'active',
      NEW.amount_usd,
      NOW(),
      NOW() + INTERVAL '30 days',
      FALSE
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      tier = EXCLUDED.tier,
      status = 'active',
      price_usd = EXCLUDED.price_usd,
      started_at = NOW(),
      expires_at = NOW() + INTERVAL '30 days';

    -- Update profile subscription tier
    UPDATE profiles SET subscription_tier = NEW.plan_id WHERE id = NEW.user_id;

    -- Send notification (in-app row)
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'system',
      '🎉 Subscription Activated!',
      'Your ' || INITCAP(NEW.plan_id) || ' plan is now active. Enjoy your premium features!',
      jsonb_build_object('plan', NEW.plan_id, 'payment_id', NEW.id)
    );

    -- Fire real OS push (see notify_push_internal in schema.sql)
    PERFORM notify_push_internal(
      NEW.user_id,
      'premium',
      '🎉 Subscription Activated!',
      'Your ' || INITCAP(NEW.plan_id) || ' plan is now active. Enjoy your premium features!',
      '/app/settings/subscription'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_verified
  AFTER UPDATE ON mobile_money_payments
  FOR EACH ROW EXECUTE FUNCTION activate_subscription_on_payment();
