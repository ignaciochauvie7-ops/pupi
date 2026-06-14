import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { disconnectGoogle } from '@/lib/google'

export async function POST() {
  const { session, error } = await requireSession()
  if (error) return error

  if (!['owner', 'manager'].includes(session!.user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await disconnectGoogle(session!.user.company_id)
  return NextResponse.json({ success: true })
}
