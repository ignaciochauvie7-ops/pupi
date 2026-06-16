import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createGoogleWorkspaceFile, type GoogleCreateType } from '@/lib/google'

const VALID_TYPES: GoogleCreateType[] = ['sheet', 'doc', 'folder', 'event']

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const { type, title } = await req.json()
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
  }

  const companyId = session!.user.company_id
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  try {
    const result = await createGoogleWorkspaceFile(
      companyId,
      company?.name || 'Empresa',
      type,
      title?.trim() || undefined
    )

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo crear el archivo'
    console.error('[google] create error:', type, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
