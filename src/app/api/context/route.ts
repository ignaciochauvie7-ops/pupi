import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { getCompanyContext } from '@/lib/company-data'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const context = await getCompanyContext(session!.user.company_id)
  return NextResponse.json(context)
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const { modules } = await req.json().catch(() => ({ modules: null }))
  const context = await getCompanyContext(session!.user.company_id)

  if (!modules || !Array.isArray(modules)) {
    return NextResponse.json(context)
  }

  const filtered: Record<string, unknown> = { company: context.company, settings: context.settings }
  for (const mod of modules) {
    if (mod === 'crm') filtered.clients = context.clients
    if (mod === 'ventas') filtered.opportunities = context.opportunities
    if (mod === 'contabilidad') filtered.movements = context.movements
    if (mod === 'rrhh') { filtered.employees = context.employees; filtered.tasks = context.tasks }
    if (mod === 'marketing') filtered.campaigns = context.campaigns
    if (mod === 'notifications') filtered.notifications = context.notifications
  }
  return NextResponse.json(filtered)
}
