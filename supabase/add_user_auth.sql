CREATE TABLE IF NOT EXISTS user_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id)
    ON DELETE CASCADE UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_auth_user_id
  ON user_auth(user_id);
