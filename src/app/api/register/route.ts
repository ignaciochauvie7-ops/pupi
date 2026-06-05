import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/emails/send'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, company_name, industry } = await req.json()

    if (!name || !email || !password || !company_name) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: company_name,
        industry: industry || null,
        plan: 'starter',
        status: 'onboarding',
        onboarding_complete: false,
      })
      .select()
      .single()

    if (companyError) throw companyError

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: company.id,
        email,
        name,
        role: 'owner',
      })
      .select()
      .single()

    if (userError) throw userError

    const password_hash = await bcrypt.hash(password, 12)

    const { error: authError } = await supabaseAdmin
      .from('user_auth')
      .insert({
        user_id: user.id,
        password_hash,
      })

    if (authError) throw authError

    await sendWelcomeEmail(
      email,
      name,
      company_name
    )

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      company_id: company.id,
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}
