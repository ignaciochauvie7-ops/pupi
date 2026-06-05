ALTER TABLE user_auth
  ADD COLUMN IF NOT EXISTS
  reset_token TEXT;

ALTER TABLE user_auth
  ADD COLUMN IF NOT EXISTS
  reset_token_expires TIMESTAMPTZ;
