import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(req: NextRequest) {
  try {
    const { path, bucket } = await req.json()

    if (!path || !bucket) {
      return NextResponse.json(
        { error: 'Faltan datos' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .storage
      .from(bucket)
      .remove([path])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar archivo' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    const bucket = searchParams.get('bucket')
      || 'company-files'

    if (!path) {
      return NextResponse.json(
        { error: 'Path requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(path, 3600)

    if (error) throw error

    return NextResponse.json({
      url: data.signedUrl,
    })
  } catch (error) {
    console.error('Get file error:', error)
    return NextResponse.json(
      { error: 'Error al obtener archivo' },
      { status: 500 }
    )
  }
}
