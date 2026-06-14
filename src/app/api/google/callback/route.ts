import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client, saveGoogleConnection } from '@/lib/google'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const failUrl = `${appUrl}/dashboard?tools=error`
  const successUrl = `${appUrl}/dashboard?tools=connected`

  try {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const cookieState = req.cookies.get('google_oauth_state')?.value

    if (!code || !state || state !== cookieState) {
      return NextResponse.redirect(failUrl)
    }

    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
      companyId: string
      userId: string
    }

    const client = getOAuth2Client()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    let googleEmail: string | null = null
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client })
      const profile = await oauth2.userinfo.get()
      googleEmail = profile.data.email || null
    } catch {
      googleEmail = null
    }

    await saveGoogleConnection(parsed.companyId, parsed.userId, tokens, googleEmail)

    const response = NextResponse.redirect(successUrl)
    response.cookies.delete('google_oauth_state')
    return response
  } catch (err) {
    console.error('[google] callback error:', err)
    return NextResponse.redirect(failUrl)
  }
}
