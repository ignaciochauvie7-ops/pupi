import { NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { recordPolarInvoice, syncPolarSubscription } from '@/lib/billing-sync'

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  const body = await req.text()
  const headers = Object.fromEntries(req.headers.entries())

  try {
    const event = validateEvent(body, headers, secret)

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
      case 'subscription.canceled':
      case 'subscription.revoked':
      case 'subscription.past_due':
      case 'subscription.uncanceled':
        await syncPolarSubscription(event.data)
        break
      case 'order.paid':
        await recordPolarInvoice(event.data)
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    console.error('[polar] webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
