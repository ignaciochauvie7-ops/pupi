import * as React from 'react'

interface WelcomeEmailProps {
  userName: string
  companyName: string
}

export function WelcomeEmail({
  userName,
  companyName,
}: WelcomeEmailProps) {
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
        ¡Bienvenido, {userName}!
      </h2>

      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '15px',
        lineHeight: '1.7',
        marginBottom: '24px',
      }}>
        Tu empresa <strong style={{
          color: '#ffffff',
        }}>{companyName}</strong> ya
        está en Pupi AI. El cerebro
        inteligente de tu negocio
        está listo para trabajar.
      </p>

      <div style={{
        backgroundColor: 'rgba(37,99,235,0.1)',
        border: '1px solid rgba(37,99,235,0.3)',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '28px',
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '13px',
          margin: '0 0 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          ✦ Primeros pasos
        </p>
        <ul style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px',
          lineHeight: '1.8',
          paddingLeft: '20px',
          margin: '0',
        }}>
          <li>Completá el onboarding
            de tu empresa</li>
          <li>Cargá tu base de clientes</li>
          <li>Dejá que Pupi analice
            tu negocio</li>
          <li>Preguntale cualquier cosa
            a Pupi desde el chat</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center' }}>
        <a
          href={process.env.NEXT_PUBLIC_APP_URL
            + '/dashboard'}
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
          Ir al dashboard →
        </a>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '32px',
      }}>
        Pupi AI · Tu cerebro empresarial
      </p>
    </div>
  )
}
