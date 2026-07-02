-- ============================================================
-- SmartzConnect — Mobile Money Payments Table
-- Add this to your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS mobile_money_payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL CHECK (provider IN ('mtn', 'orange')),
  amount_usd        DECIMAL(10,2) NOT NULL,
  plan_id           TEXT NOT NULL CHECK (plan_id IN ('premium', 'vip')),
  transaction_id    TEXT NOT NULL,
  status            TEXT DEFAULT 'pending_verification'
                    CHECK (status IN ('pending_verification', 'verified', 'rejected', 'expired')),
  verified_by       UUID REFERENCES profiles(id),
  verified_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mobile_money_user ON mobile_money_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_money_status ON mobile_money_payments(status);
CREATE INDEX IF NOT EXISTS idx_mobile_money_txid ON mobile_money_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mobile_money_expires ON mobile_money_payments(expires_at);

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

-- Auto-expire payments after 15 minutes (run as a cron job or Edge Function)
-- This is a helper function admins can call
CREATE OR REPLACE FUNCTION expire_old_mobile_payments()
RETURNS void AS $$
BEGIN
  UPDATE mobile_money_payments
  SET status = 'expired'
  WHERE status = 'pending_verification'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-activate subscription when payment is verified
CREATE OR REPLACE FUNCTION activate_subscription_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status = 'pending_verification' THEN
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

    -- Send notification
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'system',
      '🎉 Subscription Activated!',
      'Your ' || INITCAP(NEW.plan_id) || ' plan is now active. Enjoy your premium features!',
      jsonb_build_object('plan', NEW.plan_id, 'payment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_verified
  AFTER UPDATE ON mobile_money_payments
  FOR EACH ROW EXECUTE FUNCTION activate_subscription_on_payment();
