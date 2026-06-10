export type NotificationAlerts = {
  ventasCerradas: boolean
  oportunidadesRiesgo: boolean
  clientesSinContacto: boolean
  anomaliasFinancieras: boolean
  alertasEquipo: boolean
  campanasBajoRoi: boolean
  metasRiesgo: boolean
  resumenSemanal: boolean
}

export type NotificationChannels = {
  pupi: boolean
  email: boolean
  whatsapp: boolean
}

export type NotificationFreq = {
  diario: boolean
  semanal: boolean
  mensual: boolean
}

export type VoiceSettings = {
  spaceEnabled: boolean
  wakeEnabled: boolean
  responseEnabled: boolean
  idioma: string
  tipo: string
}

export type CompanyExtra = {
  anios?: string
  ciudad?: string
  pais?: string
  web?: string
  desc?: string
  phone?: string
}

export type CompanySettings = {
  notifications?: {
    alerts?: Partial<NotificationAlerts>
    channels?: Partial<NotificationChannels>
    freq?: Partial<NotificationFreq>
    whatsappPhone?: string
  }
  voice?: Partial<VoiceSettings>
  integrations?: Record<string, boolean>
  companyExtra?: CompanyExtra
}

export const DEFAULT_NOTIFICATION_ALERTS: NotificationAlerts = {
  ventasCerradas: true,
  oportunidadesRiesgo: true,
  clientesSinContacto: true,
  anomaliasFinancieras: true,
  alertasEquipo: true,
  campanasBajoRoi: true,
  metasRiesgo: false,
  resumenSemanal: true,
}

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannels = {
  pupi: true,
  email: true,
  whatsapp: false,
}

export const DEFAULT_NOTIFICATION_FREQ: NotificationFreq = {
  diario: true,
  semanal: true,
  mensual: true,
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  spaceEnabled: true,
  wakeEnabled: false,
  responseEnabled: false,
  idioma: 'Español (Latino)',
  tipo: 'Natural',
}

export const DEFAULT_INTEGRATIONS: Record<string, boolean> = {
  mercadopago: false,
  fiserv: false,
  whatsapp: false,
  google: false,
  slack: false,
  zapier: false,
}

export function mergeCompanySettings(raw: unknown): CompanySettings {
  if (!raw || typeof raw !== 'object') return {}
  return raw as CompanySettings
}
