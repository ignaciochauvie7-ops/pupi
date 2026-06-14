import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { exportClientsToSheet } from '@/lib/google'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST() {
  const { session, error } = await requireSession()
  if (error) return error

  const companyId = session!.user.company_id

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  try {
    const result = await exportClientsToSheet(companyId, company?.name || 'Empresa')
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al exportar'
    console.error('[google] export clients:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
