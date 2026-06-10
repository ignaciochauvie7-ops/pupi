import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  DEFAULT_INTEGRATIONS,
  DEFAULT_NOTIFICATION_ALERTS,
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_FREQ,
  DEFAULT_VOICE_SETTINGS,
  mergeCompanySettings,
  type CompanySettings,
} from '@/lib/settings'
import { getIntegrationsAvailability, INTEGRATION_CATALOG } from '@/lib/integrations'

function buildSettingsResponse(company: { settings?: unknown }) {
  const stored = mergeCompanySettings(company.settings)
  const availability = getIntegrationsAvailability()

  return {
    notifications: {
      alerts: { ...DEFAULT_NOTIFICATION_ALERTS, ...stored.notifications?.alerts },
      channels: { ...DEFAULT_NOTIFICATION_CHANNELS, ...stored.notifications?.channels },
      freq: { ...DEFAULT_NOTIFICATION_FREQ, ...stored.notifications?.freq },
      whatsappPhone: stored.notifications?.whatsappPhone || '',
    },
    voice: {
      ...DEFAULT_VOICE_SETTINGS,
      ...stored.voice,
    },
    integrations: {
      ...DEFAULT_INTEGRATIONS,
      ...stored.integrations,
    },
    companyExtra: stored.companyExtra || {},
    integrationAvailability: availability,
    integrationCatalog: INTEGRATION_CATALOG.map(i => ({
      id: i.id,
      name: i.name,
      configured: availability[i.id],
    })),
  }
}

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const { data: company, error: dbError } = await supabaseAdmin
    .from('companies')
    .select('settings')
    .eq('id', session!.user.company_id)
    .single()

  if (dbError) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const { data: dbIntegrations } = await supabaseAdmin
    .from('company_integrations')
    .select('provider, connected')
    .eq('company_id', session!.user.company_id)

  const integrationState = { ...DEFAULT_INTEGRATIONS }
  for (const row of dbIntegrations || []) {
    integrationState[row.provider] = row.connected
  }

  const base = buildSettingsResponse(company)
  base.integrations = { ...base.integrations, ...integrationState }

  return NextResponse.json(base)
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const body = await req.json()
  const companyId = session!.user.company_id

  const { data: company, error: fetchError } = await supabaseAdmin
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const current = mergeCompanySettings(company.settings)
  const patch: CompanySettings = {}

  if (body.notifications) {
    patch.notifications = {
      alerts: { ...current.notifications?.alerts, ...body.notifications.alerts },
      channels: { ...current.notifications?.channels, ...body.notifications.channels },
      freq: { ...current.notifications?.freq, ...body.notifications.freq },
      whatsappPhone: body.notifications.whatsappPhone ?? current.notifications?.whatsappPhone,
    }
  }

  if (body.voice) {
    patch.voice = { ...current.voice, ...body.voice }
  }

  if (body.companyExtra) {
    patch.companyExtra = { ...current.companyExtra, ...body.companyExtra }
  }

  const merged: CompanySettings = {
    ...current,
    ...patch,
    notifications: patch.notifications ?? current.notifications,
    voice: patch.voice ?? current.voice,
    companyExtra: patch.companyExtra ?? current.companyExtra,
  }

  const { error: updateError } = await supabaseAdmin
    .from('companies')
    .update({ settings: merged })
    .eq('id', companyId)

  if (updateError) return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })

  if (body.integrations) {
    merged.integrations = { ...current.integrations, ...body.integrations }
    await supabaseAdmin.from('companies').update({ settings: merged }).eq('id', companyId)

    for (const [provider, connected] of Object.entries(body.integrations as Record<string, boolean>)) {
      await supabaseAdmin.from('company_integrations').upsert(
        {
          company_id: companyId,
          provider,
          connected,
          connected_at: connected ? new Date().toISOString() : null,
        },
        { onConflict: 'company_id,provider' }
      )
    }
  }

  return NextResponse.json(buildSettingsResponse({ settings: merged }))
}
