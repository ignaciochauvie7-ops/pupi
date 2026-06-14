import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getGoogleAuthUrl, isGoogleConfigured } from '@/lib/google'
import crypto from 'crypto'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: 'Google OAuth no configurado' }, { status: 503 })
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = Buffer.from(
    JSON.stringify({
      companyId: session!.user.company_id,
      userId: session!.user.id,
      nonce,
    })
  ).toString('base64url')

  const response = NextResponse.redirect(getGoogleAuthUrl(state))
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
