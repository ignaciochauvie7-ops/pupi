import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import {
  getPolarClient,
  getProductIdForPlan,
  getReturnUrl,
  getSuccessUrl,
  isPolarConfigured,
} from '@/lib/polar'

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  if (!isPolarConfigured()) {
    return NextResponse.json({ error: 'Polar no está configurado' }, { status: 503 })
  }

  const plan = req.nextUrl.searchParams.get('plan') || 'growth'
  const productId = getProductIdForPlan(plan)

  if (!productId) {
    return NextResponse.json({ error: 'Plan no disponible en Polar' }, { status: 400 })
  }

  const polar = getPolarClient()
  if (!polar) {
    return NextResponse.json({ error: 'Polar no está configurado' }, { status: 503 })
  }

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: session!.user.company_id,
      customerEmail: session!.user.email || undefined,
      customerName: session!.user.name || undefined,
      successUrl: getSuccessUrl(),
      returnUrl: getReturnUrl(),
      metadata: {
        company_id: session!.user.company_id,
        plan,
      },
    })

    if (!checkout.url) {
      return NextResponse.json({ error: 'No se pudo crear el checkout' }, { status: 500 })
    }

    return NextResponse.redirect(checkout.url)
  } catch (err) {
    console.error('[polar] checkout error:', err)
    return NextResponse.json({ error: 'Error al iniciar el checkout' }, { status: 500 })
  }
}
