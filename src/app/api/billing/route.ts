import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getUsageStats } from '@/lib/company-data'

const PLAN_PRICES: Record<string, number> = {
  starter: 79,
  growth: 199,
  pro: 449,
  enterprise: 999,
}

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
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

  const plan = subscription?.plan || company?.plan || 'growth'
  const limits = usage.planLimits[plan] || usage.planLimits.growth

  return NextResponse.json({
    plan: {
      id: plan,
      name: PLAN_NAMES[plan] || plan,
      price: subscription?.monthly_price_usd || PLAN_PRICES[plan] || 199,
      status: subscription?.status || 'active',
      renewal: subscription?.current_period_end || null,
    },
    usage: {
      users: { used: usage.users_count, limit: limits.users },
      queries: { used: usage.queries_today, limit: limits.queries },
      storage: { used_gb: usage.storage_gb, limit_gb: limits.storageGb },
    },
    payment: {
      last4: '4242',
      expiry: '12/27',
      brand: 'visa',
    },
    invoices: invoices.map(inv => ({
      id: inv.id,
      description: inv.description,
      amount: inv.amount_usd,
      status: inv.status,
      date: inv.invoice_date,
    })),
    dodo_configured: Boolean(process.env.DODO_API_KEY?.trim()),
  })
}
