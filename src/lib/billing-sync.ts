import type { Order } from '@polar-sh/sdk/models/components/order.js'
import type { Subscription } from '@polar-sh/sdk/models/components/subscription.js'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  getPlanForProductId,
  mapPolarStatus,
  PLAN_NAMES,
  PLAN_PRICES,
  subscriptionAmountUsd,
  type PlanId,
} from '@/lib/polar'

function resolveCompanyId(subscription: Subscription): string | null {
  return subscription.customer.externalId || subscription.metadata.company_id?.toString() || null
}

function resolveCompanyIdFromOrder(order: Order): string | null {
  return order.customer.externalId || order.metadata?.company_id?.toString() || null
}

async function findSubscriptionRow(companyId: string, polarSubscriptionId: string) {
  const { data: byPolarId } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('polar_subscription_id', polarSubscriptionId)
    .maybeSingle()

  if (byPolarId) return byPolarId

  const { data: latest } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return latest
}

export async function syncPolarSubscription(subscription: Subscription) {
  const companyId = resolveCompanyId(subscription)
  if (!companyId) {
    console.warn('[polar] subscription without company external id', subscription.id)
    return
  }

  const plan = getPlanForProductId(subscription.productId) || 'growth'
  const status = mapPolarStatus(subscription.status)
  const existing = await findSubscriptionRow(companyId, subscription.id)

  const row = {
    company_id: companyId,
    plan,
    status,
    polar_subscription_id: subscription.id,
    polar_customer_id: subscription.customerId,
    monthly_price_usd: subscriptionAmountUsd(subscription) || PLAN_PRICES[plan as PlanId],
    current_period_start: subscription.currentPeriodStart.toISOString(),
    current_period_end: subscription.currentPeriodEnd.toISOString(),
  }

  if (existing?.id) {
    await supabaseAdmin.from('subscriptions').update(row).eq('id', existing.id)
  } else {
    await supabaseAdmin.from('subscriptions').insert(row)
  }

  if (status === 'active' || status === 'trialing') {
    await supabaseAdmin.from('companies').update({ plan, status: 'active' }).eq('id', companyId)
  }
}

export async function recordPolarInvoice(order: Order) {
  const companyId = resolveCompanyIdFromOrder(order)
  if (!companyId) return

  const plan = getPlanForProductId(order.productId || '') || null
  const planLabel = plan ? PLAN_NAMES[plan] : 'Pupi AI'
  const amountUsd = Math.round(order.totalAmount) / 100
  const invoiceDate = (order.createdAt || new Date()).toISOString().slice(0, 10)

  await supabaseAdmin.from('billing_invoices').insert({
    company_id: companyId,
    description: `Plan ${planLabel}`,
    amount_usd: amountUsd,
    status: 'paid',
    invoice_date: invoiceDate,
  })
}
