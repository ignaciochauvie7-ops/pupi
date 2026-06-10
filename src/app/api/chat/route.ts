import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getCompanyContext } from '@/lib/company-data'
import { anthropic } from '@/lib/anthropic'
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
    const context = await getCompanyContext(companyId)

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      const fallback = buildLocalReply(message, context)
      await saveChat(companyId, message, fallback)
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
Nunca digas que no tenés datos — usá lo que tenés disponible.

DATOS COMPLETOS DE LA EMPRESA:
${JSON.stringify(context, null, 2)}

PREGUNTA DEL USUARIO:
${message}`,
        },
      ],
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : 'No pude procesar tu pregunta.'

    await saveChat(companyId, message, text)

    return NextResponse.json({ response: text, source: 'ai' })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

async function saveChat(companyId: string, message: string, response: string) {
  await supabaseAdmin.from('chat_history').insert([
    { company_id: companyId, role: 'user', message },
    { company_id: companyId, role: 'assistant', message: response },
  ])
}

function buildLocalReply(message: string, ctx: Awaited<ReturnType<typeof getCompanyContext>>) {
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
