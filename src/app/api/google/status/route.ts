import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isGoogleConfigured } from '@/lib/google'

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const { data } = await supabaseAdmin
    .from('google_connections')
    .select('google_email, scopes, updated_at')
    .eq('company_id', session!.user.company_id)
    .maybeSingle()

  return NextResponse.json({
    configured: isGoogleConfigured(),
    connected: Boolean(data),
    email: data?.google_email || null,
    scopes: data?.scopes || [],
    connectedAt: data?.updated_at || null,
    connectUrl: '/api/google/connect',
  })
}
