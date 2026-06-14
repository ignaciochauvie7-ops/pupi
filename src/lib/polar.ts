import { Polar } from '@polar-sh/sdk'
import type { Subscription } from '@polar-sh/sdk/models/components/subscription.js'

export const PLAN_IDS = ['starter', 'growth', 'pro', 'enterprise'] as const
export type PlanId = (typeof PLAN_IDS)[number]

export const PLAN_PRICES: Record<PlanId, number> = {
  starter: 79,
  growth: 199,
  pro: 449,
  enterprise: 999,
}

export const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

function polarServer(): 'sandbox' | 'production' {
  return process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production'
}

export function isPolarConfigured(): boolean {
  return Boolean(process.env.POLAR_ACCESS_TOKEN?.trim())
}

export function getPolarClient(): Polar | null {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim()
  if (!accessToken) return null

  return new Polar({
    accessToken,
    server: polarServer(),
  })
}

function productEnvKey(plan: PlanId): string {
  return `POLAR_PRODUCT_${plan.toUpperCase()}`
}

export function getProductIdForPlan(plan: string): string | null {
  if (!PLAN_IDS.includes(plan as PlanId)) return null
  const productId = process.env[productEnvKey(plan as PlanId)]?.trim()
  return productId || null
}

export function getPlanForProductId(productId: string): PlanId | null {
  for (const plan of PLAN_IDS) {
    if (process.env[productEnvKey(plan)]?.trim() === productId) {
      return plan
    }
  }
  return null
}

export function getSuccessUrl(): string {
  return (
    process.env.POLAR_SUCCESS_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?settings=billing&checkout=success`
  )
}

export function getReturnUrl(): string {
  return (
    process.env.POLAR_RETURN_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?settings=billing`
  )
}

export function mapPolarStatus(status: Subscription['status']): 'active' | 'cancelled' | 'past_due' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    default:
      return 'cancelled'
  }
}

export function subscriptionAmountUsd(subscription: Subscription): number {
  return Math.round(subscription.amount) / 100
}
