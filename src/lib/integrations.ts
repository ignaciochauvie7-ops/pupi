export type IntegrationProvider =
  | 'mercadopago'
  | 'fiserv'
  | 'whatsapp'
  | 'google'
  | 'slack'
  | 'zapier'

export type IntegrationMeta = {
  id: IntegrationProvider
  letter: string
  name: string
  desc: string
  color: string
  bg: string
  envKeys: string[]
}

export const INTEGRATION_CATALOG: IntegrationMeta[] = [
  {
    id: 'mercadopago',
    letter: 'MP',
    name: 'Mercado Pago',
    desc: 'Registrá pagos automáticamente',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
    envKeys: ['MP_ACCESS_TOKEN', 'MP_WEBHOOK_SECRET'],
  },
  {
    id: 'fiserv',
    letter: 'F',
    name: 'Fiserv',
    desc: 'Integrá tu POS Fiserv',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.15)',
    envKeys: ['FISERV_API_KEY', 'FISERV_SECRET', 'FISERV_MERCHANT_ID'],
  },
  {
    id: 'whatsapp',
    letter: 'WA',
    name: 'WhatsApp Business',
    desc: 'Recibí y enviá mensajes desde Pupi',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'],
  },
  {
    id: 'google',
    letter: 'G',
    name: 'Google Workspace',
    desc: 'Sheets, Docs, Calendar y Drive',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.15)',
    envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    id: 'slack',
    letter: 'S',
    name: 'Slack',
    desc: 'Recibí alertas en tu workspace',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.15)',
    envKeys: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'],
  },
  {
    id: 'zapier',
    letter: 'Z',
    name: 'Zapier',
    desc: 'Conectá Pupi con miles de apps',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
    envKeys: ['ZAPIER_WEBHOOK_URL'],
  },
]

export function integrationEnvReady(provider: IntegrationProvider): boolean {
  const meta = INTEGRATION_CATALOG.find(i => i.id === provider)
  if (!meta) return false
  return meta.envKeys.every(key => Boolean(process.env[key]?.trim()))
}

export function getIntegrationsAvailability() {
  return Object.fromEntries(
    INTEGRATION_CATALOG.map(i => [i.id, integrationEnvReady(i.id)])
  ) as Record<IntegrationProvider, boolean>
}
