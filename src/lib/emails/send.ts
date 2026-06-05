import { resend } from '@/lib/resend'
import { WelcomeEmail } from './welcome'
import { ResetPasswordEmail } from './reset-password'

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  companyName: string
) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: `Bienvenido a Pupi AI, ${userName}`,
      react: WelcomeEmail({ userName, companyName }),
    })
    return { success: true }
  } catch (error) {
    console.error('Welcome email error:', error)
    return { success: false, error }
  }
}

export async function sendResetPasswordEmail(
  to: string,
  userName: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: 'Restablecer contraseña — Pupi AI',
      react: ResetPasswordEmail({
        userName,
        resetUrl,
      }),
    })
    return { success: true }
  } catch (error) {
    console.error('Reset email error:', error)
    return { success: false, error }
  }
}
