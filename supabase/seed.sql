-- Pupi — datos de prueba para Supabase SQL Editor
-- Requisito: schema.sql ya aplicado (tablas creadas).
-- No vuelvas a pegar schema.sql si te dice "companies already exists".
--
-- company_id para probar /api/chat y /api/insights:
--   a0000000-0000-0000-0000-000000000001

-- Limpia datos de prueba anteriores (mismo company_id) para poder re-ejecutar
DELETE FROM company_memory WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM chat_history WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM movements WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM opportunities WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM clients WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM users WHERE company_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM companies WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- TEST COMPANY
INSERT INTO companies (
  id, name, industry, size, plan,
  status, onboarding_complete
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Distribuidora Norte',
  'Distribución mayorista',
  8, 'growth', 'active', true
);

-- USERS
INSERT INTO users (
  id, company_id, email, name, role
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'nacho@test.com', 'Nacho', 'owner'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'jp@test.com', 'Juan Pérez', 'seller'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'ca@test.com', 'Carlos Acosta', 'seller'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'mr@test.com', 'María Ruiz', 'seller'
);

-- CLIENTS
INSERT INTO clients (
  id, company_id, name, company_name,
  email, temperature, assigned_seller_id,
  average_ticket, purchase_frequency_days,
  last_contact_at, last_purchase_at,
  total_purchases, purchase_count, tags
) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Cliente Test 1', 'Empresa A',
  'cliente1@test.com', 'hot',
  'b0000000-0000-0000-0000-000000000002',
  4200, 28,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  33600, 8,
  ARRAY['VIP', 'Mayorista']
),
(
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Cliente Test 2', 'Empresa B',
  'cliente2@test.com', 'warm',
  'b0000000-0000-0000-0000-000000000002',
  12800, 30,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days',
  89600, 7,
  ARRAY['Distribuidor']
),
(
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Cliente Test 3', NULL,
  'cliente3@test.com', 'cold',
  'b0000000-0000-0000-0000-000000000003',
  890, 20,
  NOW() - INTERVAL '35 days',
  NOW() - INTERVAL '35 days',
  4450, 5,
  ARRAY['Nuevo']
),
(
  'c0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Cliente Test 4', 'Empresa C',
  'cliente4@test.com', 'hot',
  'b0000000-0000-0000-0000-000000000003',
  28500, 25,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  199500, 7,
  ARRAY['VIP', 'Mayorista']
),
(
  'c0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Cliente Test 5', 'Empresa D',
  'cliente5@test.com', 'cold',
  'b0000000-0000-0000-0000-000000000004',
  560, 30,
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '45 days',
  2800, 5,
  ARRAY['Nuevo']
);

-- OPPORTUNITIES
INSERT INTO opportunities (
  id, company_id, client_id, seller_id,
  amount, stage, probability,
  estimated_close_date
) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000002',
  28500, 'negotiation', 80,
  NOW() + INTERVAL '3 days'
),
(
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000002',
  8900, 'proposal', 60,
  NOW() + INTERVAL '7 days'
),
(
  'd0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000004',
  4200, 'closed_won', 100,
  NOW() - INTERVAL '2 days'
);

-- MOVEMENTS
INSERT INTO movements (
  id, company_id, type, description,
  amount, category, date, origin
) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'income', 'Venta - Cliente Test 4',
  28500, 'Ventas',
  NOW() - INTERVAL '1 day', 'automatic'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'income', 'Venta - Cliente Test 1',
  4200, 'Ventas',
  NOW() - INTERVAL '2 days', 'automatic'
),
(
  'e0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'expense', 'Sueldos del mes',
  45000, 'Sueldos',
  NOW() - INTERVAL '3 days', 'manual'
),
(
  'e0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'expense', 'Campana Google Ads',
  3200, 'Marketing',
  NOW() - INTERVAL '4 days', 'manual'
),
(
  'e0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'income', 'Venta - Cliente Test 2',
  12800, 'Ventas',
  NOW() - INTERVAL '8 days', 'automatic'
),
(
  'e0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'expense', 'Alquiler oficina',
  15000, 'Operaciones',
  NOW() - INTERVAL '10 days', 'manual'
),
(
  'e0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001',
  'income', 'Venta - Cliente Test 2',
  12800, 'Ventas',
  NOW() - INTERVAL '15 days', 'automatic'
),
(
  'e0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000001',
  'expense', 'Servicios internet',
  1200, 'Servicios',
  NOW() - INTERVAL '20 days', 'manual'
);

-- COMPANY MEMORY baseline
INSERT INTO company_memory (
  company_id, patterns, insights, kpis
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '{
    "best_sales_day": "tuesday",
    "peak_months": ["may", "november"],
    "avg_deal_cycle_days": 18
  }'::jsonb,
  '{
    "top_clients_concentration": "2 clientes generan 70% de ingresos",
    "cold_clients_at_risk": 2,
    "monthly_growth": "28%"
  }'::jsonb,
  '{
    "monthly_revenue": 105370,
    "avg_ticket": 4200,
    "close_rate": 68,
    "active_clients": 5,
    "team_size": 4
  }'::jsonb
);
