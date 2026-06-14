import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getPolarClient, getReturnUrl, isPolarConfigured } from '@/lib/polar'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  if (!isPolarConfigured()) {
    return NextResponse.json({ error: 'Polar no está configurado' }, { status: 503 })
  }

  const polar = getPolarClient()
  if (!polar) {
    return NextResponse.json({ error: 'Polar no está configurado' }, { status: 503 })
  }

  try {
    const customerSession = await polar.customerSessions.create({
      externalCustomerId: session!.user.company_id,
      returnUrl: getReturnUrl(),
    })

    return NextResponse.redirect(customerSession.customerPortalUrl)
  } catch (err) {
    console.error('[polar] portal error:', err)
    return NextResponse.json(
      { error: 'No se pudo abrir el portal de facturación. ¿Ya tenés una suscripción activa?' },
      { status: 500 }
    )
  }
}
