import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getRecentGoogleActions } from '@/lib/google-chat'
import { getGoogleConnectionSummary } from '@/lib/google'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const companyId = session!.user.company_id
  const [status, actions] = await Promise.all([
    getGoogleConnectionSummary(companyId),
    getRecentGoogleActions(companyId, 12),
  ])

  return NextResponse.json({
    ...status,
    actions,
    connectUrl: '/api/google/connect',
  })
}
