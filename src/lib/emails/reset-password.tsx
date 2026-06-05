import * as React from 'react'

interface ResetPasswordEmailProps {
  userName: string
  resetUrl: string
}

export function ResetPasswordEmail({
  userName,
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#0A0A0F',
      color: '#ffffff',
      padding: '40px',
      borderRadius: '12px',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <h1 style={{
          color: '#2563EB',
          fontSize: '28px',
          margin: '0',
        }}>
          Pupi <span style={{
            color: '#ffffff',
            fontWeight: '400',
          }}>AI</span>
        </h1>
      </div>

      <h2 style={{
        fontSize: '22px',
        fontWeight: '500',
        marginBottom: '16px',
      }}>
        Recuperar contraseña
      </h2>

      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '15px',
        lineHeight: '1.7',
        marginBottom: '28px',
      }}>
        Hola {userName}, recibimos
        una solicitud para restablecer
        la contraseña de tu cuenta.
        El enlace expira en 1 hora.
      </p>

      <div style={{ textAlign: 'center' }}>
        <a
          href={resetUrl}
          style={{
            backgroundColor: '#2563EB',
            color: '#ffffff',
            padding: '12px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            display: 'inline-block',
          }}
        >
          Restablecer contraseña →
        </a>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
        lineHeight: '1.6',
        marginTop: '28px',
        textAlign: 'center',
      }}>
        Si no solicitaste esto,
        ignorá este email.
        Tu contraseña no cambiará.
      </p>

      <p style={{
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '24px',
      }}>
        Pupi AI · Tu cerebro empresarial
      </p>
    </div>
  )
}
