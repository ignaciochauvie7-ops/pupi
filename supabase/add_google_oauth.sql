-- Google OAuth connections for Workspace integrations

CREATE TABLE IF NOT EXISTS google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  connected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  google_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_google_connections_company ON google_connections(company_id);

ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS google_connections_company_isolation ON google_connections;
CREATE POLICY google_connections_company_isolation ON google_connections
  FOR ALL USING (company_id = current_company_id());

DROP TRIGGER IF EXISTS update_google_connections_updated_at ON google_connections;
CREATE TRIGGER update_google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
