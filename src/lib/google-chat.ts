import {
  getGoogleConnectionSummary,
  runGoogleAction,
  type GoogleAction,
  type GoogleActionParams,
} from '@/lib/google'
import { supabaseAdmin } from '@/lib/supabase-server'

export type GoogleIntent = {
  action: GoogleAction
  label: string
  params?: GoogleActionParams
}

const ACTION_LABELS: Record<GoogleAction, string> = {
  clients: 'Hoja de clientes CRM',
  opportunities: 'Hoja de pipeline de ventas',
  movements: 'Hoja de movimientos contables',
  'summary-doc': 'Documento resumen operativo',
  'weekly-event': 'Evento de revisión semanal',
  'calendar-event': 'Evento en Google Calendar',
  'drive-folder': 'Carpeta en Google Drive',
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function extractTitle(message: string): string | null {
  const quoted = message.match(/["“](.+?)["”]/)
  if (quoted?.[1]) return quoted[1].trim()

  const titled = message.match(/(?:titulo|título|llamado|que diga)\s+(.+?)(?:\.|$)/i)
  if (titled?.[1]) return titled[1].trim()

  return null
}

export function detectGoogleIntent(message: string): GoogleIntent | null {
  const text = normalize(message)
  const wantsAction =
    /(crea|genera|exporta|agrega|agreg|subi|sube|manda|pon|abri|hace|haceme|quiero|necesito|podes|podrias)/.test(
      text
    ) ||
    /(google|sheet|hoja|docs?|documento|calendario|calendar|drive|workspace)/.test(text)

  if (!wantsAction) return null

  if (/calendario|calendar|evento|reunion|agenda|cita/.test(text)) {
    if (/semanal|revision semanal|lunes/.test(text)) {
      return { action: 'weekly-event', label: ACTION_LABELS['weekly-event'] }
    }

    const title = extractTitle(message) || 'Tarea desde Pupi AI'
    return {
      action: 'calendar-event',
      label: ACTION_LABELS['calendar-event'],
      params: {
        title,
        description: message.trim().slice(0, 240),
      },
    }
  }

  if (/drive|carpeta|folder|subi|sube/.test(text)) {
    return { action: 'drive-folder', label: ACTION_LABELS['drive-folder'] }
  }

  if (/doc|documento|informe|resumen/.test(text) && !/sheet|hoja/.test(text)) {
    return { action: 'summary-doc', label: ACTION_LABELS['summary-doc'] }
  }

  if (/oportunidad|pipeline|venta/.test(text)) {
    return { action: 'opportunities', label: ACTION_LABELS.opportunities }
  }

  if (/movimiento|contabil|finanz|gasto|ingreso/.test(text)) {
    return { action: 'movements', label: ACTION_LABELS.movements }
  }

  if (/cliente|crm/.test(text) || (/sheet|hoja/.test(text) && !/oportunidad|movimiento/.test(text))) {
    return { action: 'clients', label: ACTION_LABELS.clients }
  }

  return null
}

export async function getRecentGoogleActions(companyId: string, limit = 8) {
  const { data } = await supabaseAdmin
    .from('chat_history')
    .select('message, context, created_at')
    .eq('company_id', companyId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(40)

  return (data || [])
    .filter(row => {
      const ctx = row.context as { type?: string } | null
      return ctx?.type === 'google_action'
    })
    .slice(0, limit)
    .map(row => {
      const ctx = row.context as {
        action?: string
        label?: string
        url?: string
        rowCount?: number | null
        created_at?: string
      }

      return {
        action: ctx.action || 'unknown',
        label: ctx.label || 'Acción de Google',
        url: ctx.url || '',
        rowCount: ctx.rowCount ?? null,
        created_at: ctx.created_at || row.created_at,
        message: row.message,
      }
    })
}

export async function saveGoogleActionLog(
  companyId: string,
  userId: string | undefined,
  intent: GoogleIntent,
  result: { url: string; rowCount?: number }
) {
  const detail =
    typeof result.rowCount === 'number'
      ? `${intent.label} (${result.rowCount} filas)`
      : intent.label

  const message = `Listo: ${detail}. Abrilo acá: ${result.url}`

  await supabaseAdmin.from('chat_history').insert({
    company_id: companyId,
    user_id: userId,
    role: 'assistant',
    message,
    context: {
      type: 'google_action',
      action: intent.action,
      label: intent.label,
      url: result.url,
      rowCount: result.rowCount ?? null,
      created_at: new Date().toISOString(),
    },
  })
}

export async function executeGoogleIntent(
  companyId: string,
  companyName: string,
  userId: string | undefined,
  message: string
) {
  const intent = detectGoogleIntent(message)
  if (!intent) return null

  const status = await getGoogleConnectionSummary(companyId)
  if (!status.configured) {
    return {
      intent,
      error:
        'Google OAuth no está configurado en el servidor. Agregá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local.',
    }
  }

  if (!status.connected) {
    return {
      intent,
      error:
        'Google no está conectado. Andá a Herramientas → Conectar Google y autorizá Sheets, Docs, Calendar y Drive.',
      connectUrl: '/api/google/connect',
    }
  }

  try {
    const result = await runGoogleAction(companyId, companyName, intent.action, intent.params)
    await saveGoogleActionLog(companyId, userId, intent, result)

    return {
      intent,
      result,
      status,
    }
  } catch (err) {
    return {
      intent,
      error: err instanceof Error ? err.message : 'No se pudo ejecutar la acción de Google',
      status,
    }
  }
}
