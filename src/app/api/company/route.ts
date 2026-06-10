import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import { mergeCompanySettings } from '@/lib/settings'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const { data: company, error: dbError } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', session!.user.company_id)
    .single()

  if (dbError) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const extra = mergeCompanySettings(company.settings).companyExtra || {}

  return NextResponse.json({
    id: company.id,
    name: company.name,
    industry: company.industry,
    size: company.size,
    plan: company.plan,
    logo_url: company.logo_url,
    primary_color: company.primary_color,
    ...extra,
  })
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const body = await req.json()
  const companyId = session!.user.company_id

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single()

  const current = mergeCompanySettings(company?.settings)
  const companyExtra = {
    ...current.companyExtra,
    anios: body.anios ?? current.companyExtra?.anios,
    ciudad: body.ciudad ?? current.companyExtra?.ciudad,
    pais: body.pais ?? current.companyExtra?.pais,
    web: body.web ?? current.companyExtra?.web,
    desc: body.desc ?? current.companyExtra?.desc,
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('companies')
    .update({
      name: body.name,
      industry: body.industry,
      size: body.size ? parseInt(String(body.size), 10) : undefined,
      logo_url: body.logo_url,
      settings: { ...current, companyExtra },
    })
    .eq('id', companyId)
    .select('*')
    .single()

  if (updateError) return NextResponse.json({ error: 'Error al guardar empresa' }, { status: 500 })

  return NextResponse.json(data)
}
