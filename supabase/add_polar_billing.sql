-- Migrate billing from DodoPayments to Polar.sh

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'dodo_subscription_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'polar_subscription_id'
  ) THEN
    ALTER TABLE subscriptions RENAME COLUMN dodo_subscription_id TO polar_subscription_id;
  END IF;
END $$;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;
