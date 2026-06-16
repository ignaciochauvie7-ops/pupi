import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { browseGoogleWorkspace, type GoogleBrowseTab } from '@/lib/google'

const VALID_TABS: GoogleBrowseTab[] = ['sheets', 'docs', 'calendar', 'drive']

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const tab = (req.nextUrl.searchParams.get('tab') || 'sheets') as GoogleBrowseTab
  if (!VALID_TABS.includes(tab)) {
    return NextResponse.json({ error: 'Pestaña no válida' }, { status: 400 })
  }

  try {
    const items = await browseGoogleWorkspace(session!.user.company_id, tab)
    return NextResponse.json({ items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudieron cargar los archivos'
    console.error('[google] browse error:', tab, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
