import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { deleteGoogleWorkspaceItem, type GoogleBrowseTab } from '@/lib/google'

const VALID_TABS: GoogleBrowseTab[] = ['sheets', 'docs', 'calendar', 'drive']

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const itemId = req.nextUrl.searchParams.get('id')
  const tab = (req.nextUrl.searchParams.get('tab') || 'drive') as GoogleBrowseTab

  if (!itemId) {
    return NextResponse.json({ error: 'Falta el id del archivo' }, { status: 400 })
  }

  if (!VALID_TABS.includes(tab)) {
    return NextResponse.json({ error: 'Pestaña no válida' }, { status: 400 })
  }

  try {
    await deleteGoogleWorkspaceItem(session!.user.company_id, tab, itemId)
    return NextResponse.json({ deleted: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo eliminar'
    console.error('[google] delete error:', tab, itemId, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
