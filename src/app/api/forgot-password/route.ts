import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendResetPasswordEmail } from '@/lib/emails/send'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, ' +
          'recibirás instrucciones',
      })
    }

    const resetToken = crypto
      .randomBytes(32)
      .toString('hex')

    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    ).toISOString()

    await supabaseAdmin
      .from('user_auth')
      .update({
        reset_token: resetToken,
        reset_token_expires: expiresAt,
      })
      .eq('user_id', user.id)

    await sendResetPasswordEmail(
      email,
      user.name,
      resetToken
    )

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, ' +
        'recibirás instrucciones',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
