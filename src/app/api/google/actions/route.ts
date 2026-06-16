import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { runGoogleAction, type GoogleAction } from '@/lib/google'
import { supabaseAdmin } from '@/lib/supabase-server'

const VALID_ACTIONS: GoogleAction[] = [
  'clients',
  'opportunities',
  'movements',
  'summary-doc',
  'weekly-event',
  'calendar-event',
  'drive-folder',
]

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const { action } = await req.json()
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  const companyId = session!.user.company_id
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  try {
    const result = await runGoogleAction(companyId, company?.name || 'Empresa', action)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de Google'
    console.error('[google] action error:', action, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
