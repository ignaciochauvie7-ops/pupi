import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.company_id) {
    return {
      session: null,
      error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }
  return { session, error: null }
}

export function assertSameCompany(sessionCompanyId: string, requestedCompanyId?: string) {
  if (requestedCompanyId && requestedCompanyId !== sessionCompanyId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}
