export type Plan = 'starter' | 'growth' | 'pro' | 'enterprise'

export type Role =
  | 'owner'
  | 'manager'
  | 'seller'
  | 'employee'
  | 'consultant'

export type Temperature = 'hot' | 'warm' | 'cold'

export type Stage =
  | 'prospect'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Company {
  id: string
  name: string
  industry?: string
  plan: Plan
  status: string
  onboarding_complete: boolean
  created_at: string
}

export interface User {
  id: string
  company_id: string
  email: string
  name: string
  role: Role
  avatar_url?: string
}

export interface Client {
  id: string
  company_id: string
  name: string
  company_name?: string
  email?: string
  phone?: string
  temperature: Temperature
  assigned_seller_id?: string
  average_ticket: number
  last_contact_at?: string
  tags: string[]
  ai_score?: number
  ai_churn_risk?: string
  ai_recommended_action?: string
}

export interface Opportunity {
  id: string
  company_id: string
  client_id: string
  seller_id: string
  amount: number
  stage: Stage
  probability: number
  estimated_close_date?: string
  ai_priority_score?: number
}

export interface Employee {
  id: string
  company_id: string
  name: string
  role: string
  area?: string
  gross_salary?: number
  status: string
  performance_score?: number
  satisfaction_score?: number
  ai_churn_risk?: string
}

export interface Movement {
  id: string
  company_id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category?: string
  date: string
  origin: 'automatic' | 'manual'
  is_anomaly: boolean
}
