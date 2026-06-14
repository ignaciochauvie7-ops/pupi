import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getUsageStats } from '@/lib/company-data'
import { isPolarConfigured, PLAN_IDS, PLAN_NAMES, PLAN_PRICES, type PlanId } from '@/lib/polar'

function resolvePlanId(plan: string | null | undefined): PlanId {
  if (plan && PLAN_IDS.includes(plan as PlanId)) return plan as PlanId
  return 'growth'
}

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const companyId = session!.user.company_id

  const [{ data: company }, { data: subscription }, usage, invoicesRes] = await Promise.all([
    supabaseAdmin.from('companies').select('plan, name').eq('id', companyId).single(),
    supabaseAdmin.from('subscriptions').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    getUsageStats(companyId),
    supabaseAdmin.from('billing_invoices').select('*').eq('company_id', companyId).order('invoice_date', { ascending: false }).limit(12),
  ])

  const invoices = invoicesRes.error ? [] : (invoicesRes.data || [])

  const plan = resolvePlanId(subscription?.plan || company?.plan)
  const limits = usage.planLimits[plan] || usage.planLimits.growth

  return NextResponse.json({
    plan: {
      id: plan,
      name: PLAN_NAMES[plan],
      price: subscription?.monthly_price_usd || PLAN_PRICES[plan],
      status: subscription?.status || 'active',
      renewal: subscription?.current_period_end || null,
    },
    usage: {
      users: { used: usage.users_count, limit: limits.users },
      queries: { used: usage.queries_today, limit: limits.queries },
      storage: { used_gb: usage.storage_gb, limit_gb: limits.storageGb },
    },
    payment: subscription?.polar_customer_id
      ? { provider: 'polar' as const }
      : null,
    invoices: invoices.map(inv => ({
      id: inv.id,
      description: inv.description,
      amount: inv.amount_usd,
      status: inv.status,
      date: inv.invoice_date,
    })),
    polar_configured: isPolarConfigured(),
    checkout_url: '/api/checkout',
    portal_url: '/api/portal',
  })
}
