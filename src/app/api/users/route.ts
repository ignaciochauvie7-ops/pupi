import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-api'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const MODULE_LABELS: Record<string, string> = {
  crm: 'CRM',
  ventas: 'Ventas',
  marketing: 'Marketing',
  rrhh: 'RRHH',
  contabilidad: 'Contabilidad',
  workspace: 'Workspace',
}

function formatModules(permissions: Record<string, { enabled?: boolean }> | null) {
  if (!permissions) return 'Workspace'
  const enabled = Object.entries(permissions)
    .filter(([, v]) => v?.enabled)
    .map(([k]) => MODULE_LABELS[k] || k)
  return enabled.length ? enabled.join(', ') : 'Workspace'
}

export async function GET() {
  const { session, error } = await requireSession()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, permissions, avatar_url, last_active, created_at')
    .eq('company_id', session!.user.company_id)
    .order('created_at', { ascending: true })

  if (dbError) return NextResponse.json({ error: 'Error al cargar usuarios' }, { status: 500 })

  const users = (data || []).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
    modules: formatModules(u.permissions as Record<string, { enabled?: boolean }>),
    permissions: u.permissions,
    last_active: u.last_active,
  }))

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  if (!['owner', 'manager'].includes(session!.user.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { name, email, role, permissions } = await req.json()
  if (!email || !name) {
    return NextResponse.json({ error: 'Nombre y email requeridos' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).single()
  if (existing) return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })

  const tempPassword = crypto.randomBytes(12).toString('base64url')
  const password_hash = await bcrypt.hash(tempPassword, 12)

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      company_id: session!.user.company_id,
      name,
      email,
      role: role || 'employee',
      permissions: permissions || {},
    })
    .select('id, name, email, role, permissions')
    .single()

  if (userError) return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })

  await supabaseAdmin.from('user_auth').insert({ user_id: user.id, password_hash })

  return NextResponse.json({
    user: {
      ...user,
      avatar: name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
      modules: formatModules(user.permissions as Record<string, { enabled?: boolean }>),
    },
    invite_sent: true,
  })
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const { id, name, email, role, permissions } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data: target } = await supabaseAdmin
    .from('users')
    .select('company_id, role')
    .eq('id', id)
    .single()

  if (!target || target.company_id !== session!.user.company_id) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (target.role === 'owner' && session!.user.role !== 'owner') {
    return NextResponse.json({ error: 'No podés editar al dueño' }, { status: 403 })
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('users')
    .update({ name, email, role, permissions })
    .eq('id', id)
    .select('id, name, email, role, permissions')
    .single()

  if (updateError) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  return NextResponse.json({
    user: {
      ...data,
      avatar: data.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
      modules: formatModules(data.permissions as Record<string, { enabled?: boolean }>),
    },
  })
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  if (id === session!.user.id) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
  }

  const { data: target } = await supabaseAdmin
    .from('users')
    .select('company_id, role')
    .eq('id', id)
    .single()

  if (!target || target.company_id !== session!.user.company_id) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: 'No podés eliminar al dueño' }, { status: 403 })
  }

  await supabaseAdmin.from('user_auth').delete().eq('user_id', id)
  await supabaseAdmin.from('users').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
