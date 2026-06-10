import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getCompanyContext } from '@/lib/company-data'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireSession()
    if (error) return error

    const { module } = await req.json()
    if (!module) {
      return NextResponse.json({ error: 'Módulo requerido' }, { status: 400 })
    }

    const companyId = session!.user.company_id
    const context = await getCompanyContext(companyId)

    let moduleData: Record<string, unknown> = { company: context.company }

    if (module === 'crm') moduleData = { company: context.company, clients: context.clients, clients_summary: context.clients_summary }
    if (module === 'ventas') moduleData = { company: context.company, opportunities: context.opportunities, pipeline_value: context.pipeline_value }
    if (module === 'contabilidad') moduleData = { company: context.company, movements: context.movements, finance_summary: context.finance_summary }
    if (module === 'rrhh') moduleData = { company: context.company, employees: context.employees, tasks: context.tasks }
    if (module === 'marketing') moduleData = { company: context.company, campaigns: context.campaigns, research: context.research }
    if (module === 'all') moduleData = context as unknown as Record<string, unknown>

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json({
        insights: buildLocalInsights(module, context),
        source: 'local',
      })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20251101',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Sos Pupi AI. Analizá los datos del módulo ${module} y generá 3-5 insights accionables en español.
Sé específico con números reales. Cruzá datos con otros módulos si es relevante.
Respondé en formato JSON con esta estructura exacta y nada más:
{
  "insights": [
    {
      "title": "título corto",
      "description": "descripción",
      "priority": "high|medium|low",
      "action": "acción sugerida"
    }
  ]
}

DATOS: ${JSON.stringify(moduleData)}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const clean = content.text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return NextResponse.json({ ...parsed, source: 'ai' })
    }

    return NextResponse.json({ insights: [] })
  } catch (err) {
    console.error('Insights error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

function buildLocalInsights(module: string, ctx: Awaited<ReturnType<typeof getCompanyContext>>) {
  const insights = []
  if (module === 'crm' || module === 'all') {
    insights.push({
      title: `${ctx.clients_summary.hot} clientes calientes`,
      description: `De ${ctx.clients_summary.total} clientes totales, ${ctx.clients_summary.cold} están fríos.`,
      priority: 'high',
      action: 'Contactá los clientes fríos esta semana',
    })
  }
  if (module === 'ventas' || module === 'all') {
    insights.push({
      title: `Pipeline de $${ctx.pipeline_value.toLocaleString()}`,
      description: `${ctx.opportunities.length} oportunidades activas en el pipeline.`,
      priority: 'medium',
      action: 'Revisá las oportunidades con mayor probabilidad de cierre',
    })
  }
  if (module === 'contabilidad' || module === 'all') {
    insights.push({
      title: `Balance $${ctx.finance_summary.balance.toLocaleString()}`,
      description: `Ingresos $${ctx.finance_summary.income.toLocaleString()} vs gastos $${ctx.finance_summary.expense.toLocaleString()}.`,
      priority: ctx.finance_summary.balance < 0 ? 'high' : 'medium',
      action: 'Analizá los gastos del mes',
    })
  }
  return insights
}
