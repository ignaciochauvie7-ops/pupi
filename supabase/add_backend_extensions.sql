-- Backend extensions for Pupi AI settings, integrations and billing
-- Run in Supabase SQL Editor after schema.sql (needs `companies` table)

-- Required by RLS policies below (safe to re-run)
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

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_usd DECIMAL NOT NULL,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
  invoice_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_integrations_company ON company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_company ON billing_invoices(company_id);

ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_integrations_company_isolation ON company_integrations;
CREATE POLICY company_integrations_company_isolation ON company_integrations
  FOR ALL USING (company_id = current_company_id());

DROP POLICY IF EXISTS billing_invoices_company_isolation ON billing_invoices;
CREATE POLICY billing_invoices_company_isolation ON billing_invoices
  FOR ALL USING (company_id = current_company_id());

DROP TRIGGER IF EXISTS update_company_integrations_updated_at ON company_integrations;
CREATE TRIGGER update_company_integrations_updated_at
  BEFORE UPDATE ON company_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed billing invoices for test company
INSERT INTO billing_invoices (company_id, description, amount_usd, status, invoice_date)
SELECT 'a0000000-0000-0000-0000-000000000001', invoice_desc, 199, 'paid', invoice_dt::date
FROM (VALUES
  ('Plan Growth — Mayo 2026', '2026-05-01'),
  ('Plan Growth — Abril 2026', '2026-04-01'),
  ('Plan Growth — Marzo 2026', '2026-03-01')
) AS t(invoice_desc, invoice_dt)
WHERE EXISTS (SELECT 1 FROM companies WHERE id = 'a0000000-0000-0000-0000-000000000001')
AND NOT EXISTS (
  SELECT 1 FROM billing_invoices
  WHERE company_id = 'a0000000-0000-0000-0000-000000000001'
  AND description = t.invoice_desc
);

-- Default subscription for test company
INSERT INTO subscriptions (company_id, plan, status, monthly_price_usd, current_period_start, current_period_end)
SELECT 'a0000000-0000-0000-0000-000000000001', 'growth', 'active', 199,
  NOW(), '2026-07-01'::timestamptz
WHERE EXISTS (SELECT 1 FROM companies WHERE id = 'a0000000-0000-0000-0000-000000000001')
AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE company_id = 'a0000000-0000-0000-0000-000000000001');
