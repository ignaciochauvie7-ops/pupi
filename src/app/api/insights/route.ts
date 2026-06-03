import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { module, company_id } = await req.json()

    if (!module || !company_id) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single()

    let moduleData = {}

    if (module === 'crm') {
      const { data } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('company_id', company_id)
      moduleData = { company, clients: data }
    }

    if (module === 'ventas') {
      const { data } = await supabaseAdmin
        .from('opportunities')
        .select('*')
        .eq('company_id', company_id)
      moduleData = { company, opportunities: data }
    }

    if (module === 'contabilidad') {
      const { data } = await supabaseAdmin
        .from('movements')
        .select('*')
        .eq('company_id', company_id)
        .order('date', { ascending: false })
        .limit(50)
      moduleData = { company, movements: data }
    }

    if (module === 'rrhh') {
      const { data } = await supabaseAdmin
        .from('employees')
        .select('*')
        .eq('company_id', company_id)
      moduleData = { company, employees: data }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20251101',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Sos Pupi AI. Analizá los
          datos del módulo ${module} y generá
          3-5 insights accionables en español.
          Sé específico con números reales.
          Respondé en formato JSON con esta
          estructura exacta y nada más:
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
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ insights: [] })
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
