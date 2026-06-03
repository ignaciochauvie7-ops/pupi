import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { message, company_id } = await req.json()

    if (!message || !company_id) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single()

    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('name, temperature, average_ticket, last_contact_at')
      .eq('company_id', company_id)
      .limit(20)

    const { data: opportunities } = await supabaseAdmin
      .from('opportunities')
      .select('amount, stage, probability')
      .eq('company_id', company_id)
      .limit(10)

    const { data: movements } = await supabaseAdmin
      .from('movements')
      .select('type, amount, category, date')
      .eq('company_id', company_id)
      .order('date', { ascending: false })
      .limit(20)

    const companyContext = {
      company,
      clients_summary: {
        total: clients?.length || 0,
        hot: clients?.filter((client) => client.temperature === 'hot').length || 0,
        warm:
          clients?.filter((client) => client.temperature === 'warm').length || 0,
        cold:
          clients?.filter((client) => client.temperature === 'cold').length || 0,
      },
      pipeline: opportunities,
      recent_movements: movements,
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20251101',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Sos Pupi AI, el cerebro
          inteligente de esta empresa.
          Respondé siempre en español latino
          neutro. Sé claro, directo y útil.
          Usá los datos reales de la empresa
          para responder con precisión.
          Nunca digas que no tenés datos -
          usá lo que tenés disponible.

          DATOS DE LA EMPRESA:
          ${JSON.stringify(companyContext, null, 2)}

          PREGUNTA DEL USUARIO:
          ${message}`,
        },
      ],
    })

    const content = response.content[0]
    const text =
      content.type === 'text' ? content.text : 'No pude procesar tu pregunta.'

    await supabaseAdmin.from('chat_history').insert([
      {
        company_id,
        role: 'user',
        message,
      },
      {
        company_id,
        role: 'assistant',
        message: text,
      },
    ])

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
