import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase-server'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar',
]

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  )
}

export function getGoogleRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/callback`
  )
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri()
  )
}

export function getGoogleAuthUrl(state: string): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  })
}

type GoogleConnectionRow = {
  company_id: string
  google_email: string | null
  access_token: string
  refresh_token: string | null
  token_expiry: string | null
  scopes: string[] | null
}

export async function saveGoogleConnection(
  companyId: string,
  userId: string,
  tokens: {
    access_token?: string | null
    refresh_token?: string | null
    expiry_date?: number | null
    scope?: string | null
  },
  googleEmail?: string | null
) {
  const existing = await supabaseAdmin
    .from('google_connections')
    .select('refresh_token')
    .eq('company_id', companyId)
    .maybeSingle()

  const refreshToken =
    tokens.refresh_token || existing.data?.refresh_token || null

  await supabaseAdmin.from('google_connections').upsert(
    {
      company_id: companyId,
      connected_by: userId,
      google_email: googleEmail || null,
      access_token: tokens.access_token,
      refresh_token: refreshToken,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      scopes: tokens.scope ? tokens.scope.split(' ') : GOOGLE_SCOPES,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'company_id' }
  )

  await supabaseAdmin.from('company_integrations').upsert(
    {
      company_id: companyId,
      provider: 'google',
      connected: true,
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'company_id,provider' }
  )
}

export async function getGoogleAuthForCompany(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from('google_connections')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as GoogleConnectionRow
  const client = getOAuth2Client()
  client.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token || undefined,
    expiry_date: row.token_expiry
      ? new Date(row.token_expiry).getTime()
      : undefined,
  })

  const expiry = client.credentials.expiry_date
  if (expiry && expiry <= Date.now() + 60_000) {
    if (!row.refresh_token) return null
    try {
      const { credentials } = await client.refreshAccessToken()
      client.setCredentials(credentials)
      await supabaseAdmin
        .from('google_connections')
        .update({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || row.refresh_token,
          token_expiry: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : row.token_expiry,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
    } catch (err) {
      console.error('[google] token refresh failed:', err)
      return null
    }
  }

  return client
}

export async function disconnectGoogle(companyId: string) {
  await supabaseAdmin
    .from('google_connections')
    .delete()
    .eq('company_id', companyId)

  await supabaseAdmin.from('company_integrations').upsert(
    {
      company_id: companyId,
      provider: 'google',
      connected: false,
      connected_at: null,
    },
    { onConflict: 'company_id,provider' }
  )
}

export async function exportClientsToSheet(companyId: string, companyName: string) {
  const auth = await getGoogleAuthForCompany(companyId)
  if (!auth) throw new Error('Google no conectado')

  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('name, company_name, email, phone, temperature, average_ticket, city, country, last_contact_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const sheets = google.sheets({ version: 'v4', auth })
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `Pupi CRM — ${companyName} — ${new Date().toLocaleDateString('es-UY')}`,
      },
    },
  })

  const spreadsheetId = created.data.spreadsheetId
  if (!spreadsheetId) throw new Error('No se pudo crear la hoja')

  const rows = [
    ['Nombre', 'Empresa', 'Email', 'Teléfono', 'Temperatura', 'Ticket', 'Ciudad', 'País', 'Último contacto'],
    ...(clients || []).map(c => [
      c.name,
      c.company_name || '',
      c.email || '',
      c.phone || '',
      c.temperature || '',
      String(c.average_ticket ?? ''),
      c.city || '',
      c.country || '',
      c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString('es-UY') : '',
    ]),
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })

  return {
    spreadsheetId,
    url: created.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    rowCount: (clients || []).length,
  }
}

async function createSpreadsheet(auth: Awaited<ReturnType<typeof getGoogleAuthForCompany>>, title: string, headers: string[], dataRows: string[][]) {
  if (!auth) throw new Error('Google no conectado')
  const sheets = google.sheets({ version: 'v4', auth })
  const created = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  })
  const spreadsheetId = created.data.spreadsheetId
  if (!spreadsheetId) throw new Error('No se pudo crear la hoja')
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: { values: [headers, ...dataRows] },
  })
  return {
    url: created.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    rowCount: dataRows.length,
  }
}

export async function exportOpportunitiesToSheet(companyId: string, companyName: string) {
  const auth = await getGoogleAuthForCompany(companyId)
  const { data: opportunities } = await supabaseAdmin
    .from('opportunities')
    .select('title, amount, stage, probability, estimated_close_date, notes')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return createSpreadsheet(
    auth,
    `Pupi Pipeline — ${companyName} — ${new Date().toLocaleDateString('es-UY')}`,
    ['Oportunidad', 'Monto', 'Etapa', 'Probabilidad', 'Cierre estimado', 'Notas'],
    (opportunities || []).map(o => [
      o.title,
      String(o.amount ?? ''),
      o.stage || '',
      String(o.probability ?? ''),
      o.estimated_close_date || '',
      o.notes || '',
    ])
  )
}

export async function exportMovementsToSheet(companyId: string, companyName: string) {
  const auth = await getGoogleAuthForCompany(companyId)
  const { data: movements } = await supabaseAdmin
    .from('movements')
    .select('type, description, amount, category, date')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(200)

  return createSpreadsheet(
    auth,
    `Pupi Contabilidad — ${companyName} — ${new Date().toLocaleDateString('es-UY')}`,
    ['Tipo', 'Descripción', 'Monto', 'Categoría', 'Fecha'],
    (movements || []).map(m => [
      m.type,
      m.description || '',
      String(m.amount ?? ''),
      m.category || '',
      m.date || '',
    ])
  )
}

export async function createCompanySummaryDoc(companyId: string, companyName: string) {
  const auth = await getGoogleAuthForCompany(companyId)
  if (!auth) throw new Error('Google no conectado')

  const [{ data: clients }, { data: opportunities }, { data: movements }] = await Promise.all([
    supabaseAdmin.from('clients').select('id').eq('company_id', companyId),
    supabaseAdmin.from('opportunities').select('amount, stage').eq('company_id', companyId),
    supabaseAdmin.from('movements').select('type, amount').eq('company_id', companyId),
  ])

  const pipeline = (opportunities || [])
    .filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
    .reduce((s, o) => s + Number(o.amount || 0), 0)
  const income = (movements || []).filter(m => m.type === 'income').reduce((s, m) => s + Number(m.amount || 0), 0)
  const expense = (movements || []).filter(m => m.type === 'expense').reduce((s, m) => s + Number(m.amount || 0), 0)

  const text = [
    `Resumen operativo — ${companyName}`,
    `Generado por Pupi AI — ${new Date().toLocaleDateString('es-UY')}`,
    '',
    `Clientes: ${clients?.length ?? 0}`,
    `Oportunidades activas: ${(opportunities || []).length}`,
    `Pipeline: $${pipeline.toLocaleString()}`,
    `Ingresos registrados: $${income.toLocaleString()}`,
    `Gastos registrados: $${expense.toLocaleString()}`,
    `Balance: $${(income - expense).toLocaleString()}`,
    '',
    'Este documento se puede ampliar desde el chat de Pupi.',
  ].join('\n')

  const docs = google.docs({ version: 'v1', auth })
  const doc = await docs.documents.create({
    requestBody: { title: `Pupi — Resumen ${companyName} — ${new Date().toLocaleDateString('es-UY')}` },
  })
  const documentId = doc.data.documentId
  if (!documentId) throw new Error('No se pudo crear el documento')

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [{ insertText: { location: { index: 1 }, text } }],
    },
  })

  return {
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  }
}

export async function createWeeklyReviewEvent(companyId: string, companyName: string) {
  const auth = await getGoogleAuthForCompany(companyId)
  if (!auth) throw new Error('Google no conectado')

  const start = new Date()
  start.setDate(start.getDate() + ((8 - start.getDay()) % 7 || 7))
  start.setHours(10, 0, 0, 0)
  const end = new Date(start)
  end.setHours(11, 0, 0, 0)

  const calendar = google.calendar({ version: 'v3', auth })
  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Revisión semanal — ${companyName}`,
      description: 'Evento creado desde Pupi AI. Revisá CRM, ventas y finanzas de la semana.',
      start: { dateTime: start.toISOString(), timeZone: 'America/Montevideo' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Montevideo' },
    },
  })

  return { url: event.data.htmlLink || 'https://calendar.google.com' }
}

export async function createPupiDriveFolder(companyId: string, companyName: string) {
  const auth = await getGoogleAuthForCompany(companyId)
  if (!auth) throw new Error('Google no conectado')

  const drive = google.drive({ version: 'v3', auth })
  const folder = await drive.files.create({
    requestBody: {
      name: `Pupi AI — ${companyName}`,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, webViewLink',
  })

  return {
    url: folder.data.webViewLink || `https://drive.google.com/drive/folders/${folder.data.id}`,
  }
}

export type GoogleAction =
  | 'clients'
  | 'opportunities'
  | 'movements'
  | 'summary-doc'
  | 'weekly-event'
  | 'drive-folder'

export async function runGoogleAction(companyId: string, companyName: string, action: GoogleAction) {
  switch (action) {
    case 'clients':
      return exportClientsToSheet(companyId, companyName)
    case 'opportunities':
      return exportOpportunitiesToSheet(companyId, companyName)
    case 'movements':
      return exportMovementsToSheet(companyId, companyName)
    case 'summary-doc':
      return createCompanySummaryDoc(companyId, companyName)
    case 'weekly-event':
      return createWeeklyReviewEvent(companyId, companyName)
    case 'drive-folder':
      return createPupiDriveFolder(companyId, companyName)
    default:
      throw new Error('Acción no válida')
  }
}
