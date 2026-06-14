-- Pupi AI Supabase schema
-- Run this in a fresh Supabase project from SQL Editor or with the Supabase CLI.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. COMPANIES
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID GENERATED ALWAYS AS (id) STORED,
  name TEXT NOT NULL,
  industry TEXT,
  size INTEGER,
  plan TEXT DEFAULT 'starter'
    CHECK (plan IN ('starter', 'growth', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'onboarding')),
  primary_color TEXT DEFAULT '#2563EB',
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'employee'
    CHECK (role IN ('owner', 'manager', 'seller', 'employee', 'consultant')),
  avatar_url TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONSULTANTS
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  commission_rate DECIMAL DEFAULT 0.20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consultant_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES consultants(id) ON DELETE CASCADE,
  plan TEXT,
  monthly_fee_usd DECIMAL,
  commission_percent DECIMAL,
  commission_months INTEGER DEFAULT 6,
  status TEXT DEFAULT 'active',
  implementation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRM
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  city TEXT,
  country TEXT,
  temperature TEXT DEFAULT 'warm'
    CHECK (temperature IN ('hot', 'warm', 'cold')),
  assigned_seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  average_ticket DECIMAL DEFAULT 0,
  purchase_frequency_days INTEGER,
  last_contact_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  total_purchases DECIMAL DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  b2b_group TEXT,
  notes TEXT,
  source TEXT,
  status TEXT DEFAULT 'active',
  ai_score DECIMAL,
  ai_next_purchase_estimate DATE,
  ai_churn_risk TEXT,
  ai_recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('call', 'visit', 'email', 'purchase', 'note')),
  description TEXT,
  amount DECIMAL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VENTAS
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT,
  amount DECIMAL NOT NULL,
  stage TEXT DEFAULT 'prospect'
    CHECK (stage IN ('prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 25,
  estimated_close_date DATE,
  actual_close_date DATE,
  origin TEXT,
  lost_reason TEXT,
  notes TEXT,
  ai_priority_score DECIMAL,
  ai_risk_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('call', 'email', 'meeting', 'visit')),
  description TEXT,
  duration_minutes INTEGER,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  goal_type TEXT CHECK (goal_type IN ('amount', 'count')),
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  commission_type TEXT,
  rate DECIMAL,
  base_amount DECIMAL,
  commission_amount DECIMAL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MARKETING
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT CHECK (channel IN ('email', 'social', 'google', 'whatsapp', 'event', 'other')),
  objective TEXT,
  segment TEXT,
  budget DECIMAL,
  spent DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'finished', 'draft')),
  start_date DATE,
  end_date DATE,
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  ai_score DECIMAL,
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('market_analysis', 'competition', 'survey', 'focus_group', 'trends', 'other')),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'finished', 'archived')),
  summary TEXT,
  findings JSONB DEFAULT '[]'::jsonb,
  files TEXT[] DEFAULT ARRAY[]::text[],
  tags TEXT[] DEFAULT ARRAY[]::text[],
  ai_analyzed BOOLEAN DEFAULT false,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RRHH
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  area TEXT,
  hire_date DATE,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  address TEXT,
  dni TEXT,
  cbu TEXT,
  bank TEXT,
  gross_salary DECIMAL,
  contract_type TEXT DEFAULT 'dependency'
    CHECK (contract_type IN ('dependency', 'contract')),
  reports_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'leave', 'inactive')),
  performance_score DECIMAL,
  satisfaction_score DECIMAL,
  ai_churn_risk TEXT,
  ai_recommendation TEXT,
  documents TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  category TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  name TEXT NOT NULL,
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  scores JSONB DEFAULT '{}'::jsonb,
  overall_score DECIMAL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('justified', 'unjustified', 'vacation', 'medical_leave', 'maternity', 'other')),
  date DATE NOT NULL,
  duration_days DECIMAL DEFAULT 1,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pulse_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  questions JSONB DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '{}'::jsonb,
  overall_score DECIMAL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_hours DECIMAL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONTABILIDAD
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  origin TEXT DEFAULT 'manual'
    CHECK (origin IN ('automatic', 'manual')),
  reference_id UUID,
  reference_type TEXT,
  is_anomaly BOOLEAN DEFAULT false,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  description TEXT,
  amount DECIMAL NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  description TEXT,
  amount DECIMAL NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WORKSPACE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  module TEXT,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patterns JSONB DEFAULT '{}'::jsonb,
  insights JSONB DEFAULT '{}'::jsonb,
  kpis JSONB DEFAULT '{}'::jsonb,
  embeddings_updated_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ONBOARDING
CREATE TABLE onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  form_data JSONB DEFAULT '{}'::jsonb,
  files_uploaded TEXT[] DEFAULT ARRAY[]::text[],
  diagnosis_result JSONB DEFAULT '{}'::jsonb,
  current_stage INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('starter', 'growth', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  polar_subscription_id TEXT,
  polar_customer_id TEXT,
  monthly_price_usd DECIMAL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REPORTS
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  period TEXT,
  format TEXT DEFAULT 'pdf',
  file_url TEXT,
  generated_by TEXT DEFAULT 'pupi_ai',
  size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_companies_company ON companies(company_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_consultants_company ON consultants(company_id);
CREATE INDEX idx_consultant_companies_company ON consultant_companies(company_id);
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_interactions_company ON interactions(company_id);
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_sales_activities_company ON sales_activities(company_id);
CREATE INDEX idx_seller_goals_company ON seller_goals(company_id);
CREATE INDEX idx_commissions_company ON commissions(company_id);
CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_research_company ON research(company_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employee_tasks_company ON employee_tasks(company_id);
CREATE INDEX idx_employee_goals_company ON employee_goals(company_id);
CREATE INDEX idx_evaluations_company ON evaluations(company_id);
CREATE INDEX idx_absences_company ON absences(company_id);
CREATE INDEX idx_pulse_surveys_company ON pulse_surveys(company_id);
CREATE INDEX idx_feedback_company ON feedback(company_id);
CREATE INDEX idx_training_company ON training(company_id);
CREATE INDEX idx_movements_company ON movements(company_id);
CREATE INDEX idx_accounts_receivable_company ON accounts_receivable(company_id);
CREATE INDEX idx_accounts_payable_company ON accounts_payable(company_id);
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_company_memory_company ON company_memory(company_id);
CREATE INDEX idx_chat_history_company ON chat_history(company_id);
CREATE INDEX idx_onboarding_data_company ON onboarding_data(company_id);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_reports_company ON reports(company_id);

CREATE INDEX idx_interactions_client ON interactions(client_id);
CREATE INDEX idx_opportunities_seller ON opportunities(seller_id);
CREATE INDEX idx_employee_tasks_employee ON employee_tasks(employee_id);
CREATE INDEX idx_movements_date ON movements(date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_chat_history_user ON chat_history(user_id);

-- ROW LEVEL SECURITY
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE research ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE training ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS expects the authenticated JWT to include a company_id claim.
CREATE OR REPLACE FUNCTION current_company_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'company_id', '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE POLICY companies_company_isolation
  ON companies
  FOR ALL
  TO authenticated
  USING (id = current_company_id())
  WITH CHECK (id = current_company_id());

CREATE POLICY users_company_isolation
  ON users
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY consultants_company_isolation
  ON consultants
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY consultant_companies_company_isolation
  ON consultant_companies
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY clients_company_isolation
  ON clients
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY interactions_company_isolation
  ON interactions
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY opportunities_company_isolation
  ON opportunities
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY sales_activities_company_isolation
  ON sales_activities
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY seller_goals_company_isolation
  ON seller_goals
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY commissions_company_isolation
  ON commissions
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY campaigns_company_isolation
  ON campaigns
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY research_company_isolation
  ON research
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY employees_company_isolation
  ON employees
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY employee_tasks_company_isolation
  ON employee_tasks
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY employee_goals_company_isolation
  ON employee_goals
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY evaluations_company_isolation
  ON evaluations
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY absences_company_isolation
  ON absences
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY pulse_surveys_company_isolation
  ON pulse_surveys
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY feedback_company_isolation
  ON feedback
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY training_company_isolation
  ON training
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY movements_company_isolation
  ON movements
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY accounts_receivable_company_isolation
  ON accounts_receivable
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY accounts_payable_company_isolation
  ON accounts_payable
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY notifications_company_isolation
  ON notifications
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY company_memory_company_isolation
  ON company_memory
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY chat_history_company_isolation
  ON chat_history
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY onboarding_data_company_isolation
  ON onboarding_data
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY subscriptions_company_isolation
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY reports_company_isolation
  ON reports
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_consultants_updated_at
  BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_consultant_companies_updated_at
  BEFORE UPDATE ON consultant_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sales_activities_updated_at
  BEFORE UPDATE ON sales_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_seller_goals_updated_at
  BEFORE UPDATE ON seller_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_research_updated_at
  BEFORE UPDATE ON research
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_employee_tasks_updated_at
  BEFORE UPDATE ON employee_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_employee_goals_updated_at
  BEFORE UPDATE ON employee_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_absences_updated_at
  BEFORE UPDATE ON absences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pulse_surveys_updated_at
  BEFORE UPDATE ON pulse_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_training_updated_at
  BEFORE UPDATE ON training
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_movements_updated_at
  BEFORE UPDATE ON movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_accounts_receivable_updated_at
  BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON accounts_payable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_memory_updated_at
  BEFORE UPDATE ON company_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_history_updated_at
  BEFORE UPDATE ON chat_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_onboarding_data_updated_at
  BEFORE UPDATE ON onboarding_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
