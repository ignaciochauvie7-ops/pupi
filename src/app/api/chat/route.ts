import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getCompanyContext } from '@/lib/company-data'
import { anthropic } from '@/lib/anthropic'
import { executeGoogleIntent, getRecentGoogleActions } from '@/lib/google-chat'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireSession()
    if (error) return error

    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    const companyId = session!.user.company_id
    const userId = session!.user.id
    const context = await getCompanyContext(companyId)
    const companyName = context.company?.name || 'Empresa'
    const googleExecution = await executeGoogleIntent(companyId, companyName, userId, message)

    if (googleExecution?.error && !process.env.ANTHROPIC_API_KEY?.trim()) {
      await saveChat(companyId, userId, message, googleExecution.error)
      return NextResponse.json({
        response: googleExecution.error,
        source: 'google',
        google: {
          action: googleExecution.intent.action,
          error: googleExecution.error,
          connectUrl: googleExecution.connectUrl || null,
        },
      })
    }

    if (googleExecution?.result && !process.env.ANTHROPIC_API_KEY?.trim()) {
      const text = `Hecho. ${googleExecution.intent.label}.\n\nAbrilo acá: ${googleExecution.result.url}`
      await saveChat(companyId, userId, message, text)
      return NextResponse.json({
        response: text,
        source: 'google',
        google: {
          action: googleExecution.intent.action,
          url: googleExecution.result.url,
          rowCount: googleExecution.result.rowCount ?? null,
        },
      })
    }

    const recentGoogleActions = await getRecentGoogleActions(companyId)
    const enrichedContext = {
      ...context,
      google: {
        ...context.google,
        recent_actions: recentGoogleActions,
      },
      google_execution: googleExecution
        ? {
            attempted: true,
            action: googleExecution.intent.action,
            label: googleExecution.intent.label,
            success: Boolean(googleExecution.result),
            url: googleExecution.result?.url || null,
            error: googleExecution.error || null,
          }
        : { attempted: false },
    }

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      const fallback = buildLocalReply(message, enrichedContext, googleExecution)
      await saveChat(companyId, userId, message, fallback)
      return NextResponse.json({ response: fallback, source: 'local' })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20251101',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Sos Pupi AI, el cerebro inteligente de esta empresa.
Respondé siempre en español latino neutro. Sé claro, directo y útil.
Usá los datos reales de la empresa para responder con precisión.
Podés cruzar información entre CRM, ventas, finanzas, RRHH y marketing.
Si ejecutaste una acción de Google en esta conversación, confirmala con el link exacto.
Si google_execution.success es true, incluí el link en tu respuesta.
Si google_execution.error existe, explicá cómo conectar Google desde Herramientas.
Nunca digas que no tenés datos — usá lo que tenés disponible.

DATOS COMPLETOS DE LA EMPRESA:
${JSON.stringify(enrichedContext, null, 2)}

PREGUNTA DEL USUARIO:
${message}`,
        },
      ],
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : 'No pude procesar tu pregunta.'

    await saveChat(companyId, userId, message, text)

    return NextResponse.json({
      response: text,
      source: 'ai',
      google: googleExecution?.result
        ? {
            action: googleExecution.intent.action,
            url: googleExecution.result.url,
            rowCount: googleExecution.result.rowCount ?? null,
          }
        : googleExecution?.error
          ? {
              action: googleExecution.intent.action,
              error: googleExecution.error,
              connectUrl: googleExecution.connectUrl || null,
            }
          : null,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

async function saveChat(companyId: string, userId: string, message: string, response: string) {
  await supabaseAdmin.from('chat_history').insert([
    { company_id: companyId, user_id: userId, role: 'user', message },
    { company_id: companyId, user_id: userId, role: 'assistant', message: response },
  ])
}

function buildLocalReply(
  message: string,
  ctx: Awaited<ReturnType<typeof getCompanyContext>>,
  googleExecution: Awaited<ReturnType<typeof executeGoogleIntent>>
) {
  if (googleExecution?.result) {
    return `Listo. ${googleExecution.intent.label}.\n\nAbrilo acá: ${googleExecution.result.url}`
  }

  if (googleExecution?.error) {
    return googleExecution.error
  }

  const lower = message.toLowerCase()
  if (lower.includes('cliente')) {
    return `Tenés ${ctx.clients_summary.total} clientes (${ctx.clients_summary.hot} calientes, ${ctx.clients_summary.warm} tibios, ${ctx.clients_summary.cold} fríos).`
  }
  if (lower.includes('venta') || lower.includes('pipeline')) {
    return `Tu pipeline tiene ${ctx.opportunities.length} oportunidades por un total de $${ctx.pipeline_value.toLocaleString()}.`
  }
  if (lower.includes('equipo') || lower.includes('empleado')) {
    return `Tu equipo tiene ${ctx.employees.length} empleados registrados y ${ctx.tasks.length} tareas activas.`
  }
  if (lower.includes('finanz') || lower.includes('ingreso')) {
    return `Resumen financiero: ingresos $${ctx.finance_summary.income.toLocaleString()}, gastos $${ctx.finance_summary.expense.toLocaleString()}, balance $${ctx.finance_summary.balance.toLocaleString()}.`
  }
  return `Soy Pupi. Tengo acceso a ${ctx.clients.length} clientes, ${ctx.opportunities.length} oportunidades y ${ctx.employees.length} empleados de ${ctx.company?.name || 'tu empresa'}. ¿Qué querés saber?`
}
