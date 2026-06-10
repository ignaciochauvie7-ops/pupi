import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import { mergeCompanySettings } from '@/lib/settings'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const { data: user, error: dbError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, company_id, permissions, avatar_url')
    .eq('id', session!.user.id)
    .single()

  if (dbError) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name, settings')
    .eq('id', user.company_id)
    .single()

  const extra = mergeCompanySettings(company?.settings)

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    company_name: company?.name,
    phone: extra.companyExtra?.phone || '',
    avatar_url: user.avatar_url,
  })
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const body = await req.json()
  const userId = session!.user.id
  const companyId = session!.user.company_id

  if (body.name) {
    await supabaseAdmin.from('users').update({ name: body.name }).eq('id', userId)
  }

  if (body.phone !== undefined) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('settings')
      .eq('id', companyId)
      .single()

    const current = mergeCompanySettings(company?.settings)
    await supabaseAdmin
      .from('companies')
      .update({
        settings: {
          ...current,
          companyExtra: { ...current.companyExtra, phone: body.phone },
        },
      })
      .eq('id', companyId)
  }

  if (body.currentPassword && body.newPassword) {
    const { data: authData } = await supabaseAdmin
      .from('user_auth')
      .select('password_hash')
      .eq('user_id', userId)
      .single()

    if (!authData) return NextResponse.json({ error: 'Auth no encontrado' }, { status: 404 })

    const valid = await bcrypt.compare(body.currentPassword, authData.password_hash)
    if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })

    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(body.newPassword, 12)
    await supabaseAdmin.from('user_auth').update({ password_hash }).eq('user_id', userId)
  }

  return NextResponse.json({ success: true })
}
