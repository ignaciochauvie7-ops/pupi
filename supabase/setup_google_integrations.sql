-- Pupi AI — Google integrations setup (run once in Supabase SQL Editor)
-- Requires schema.sql already applied.

-- From add_backend_extensions.sql (company_integrations)
CREATE OR REPLACE FUNCTION current_company_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'company_id', '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS company_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  connected BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_company_integrations_company ON company_integrations(company_id);
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_integrations_company_isolation ON company_integrations;
CREATE POLICY company_integrations_company_isolation ON company_integrations
  FOR ALL USING (company_id = current_company_id());

DROP TRIGGER IF EXISTS update_company_integrations_updated_at ON company_integrations;
CREATE TRIGGER update_company_integrations_updated_at
  BEFORE UPDATE ON company_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- From add_google_oauth.sql
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
