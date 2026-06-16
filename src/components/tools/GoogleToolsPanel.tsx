'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  createGoogleWorkspaceFile,
  deleteGoogleWorkspaceItem,
  disconnectGoogle,
  fetchGoogleWorkspace,
  runGoogleAction,
  type GoogleBrowseTab,
  type GoogleWorkspaceItem,
} from '@/lib/dashboard-api'

const SYNC_INTERVAL_MS = 20000

function GoogleSheetsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#0F9D58" d="M11 4h18l8 8v32a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
      <path fill="#87CEAC" d="M29 4v8a4 4 0 0 0 4 4h8L29 4z" />
      <path fill="#fff" d="M14 22h20v2H14zm0 6h20v2H14zm0 6h14v2H14z" opacity=".9" />
    </svg>
  )
}

function GoogleDocsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M11 4h18l8 8v32a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
      <path fill="#A1C2FA" d="M29 4v8a4 4 0 0 0 4 4h8L29 4z" />
      <path fill="#fff" d="M14 22h20v2H14zm0 6h20v2H14zm0 6h12v2H14z" opacity=".9" />
    </svg>
  )
}

function GoogleCalendarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#fff" d="M10 8h28a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" />
      <path fill="#4285F4" d="M6 18h36v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V18z" />
      <path fill="#EA4335" d="M6 12a4 4 0 0 1 4-4h4v8H6z" />
      <path fill="#FBBC04" d="M18 8h4v8h-4z" />
      <path fill="#34A853" d="M26 8h4v8h-4z" />
      <path fill="#4285F4" d="M34 8h4a4 4 0 0 1 4 4v4h-8V8z" />
      <rect fill="#fff" x="14" y="24" width="6" height="6" rx="1" />
      <rect fill="#fff" x="22" y="24" width="6" height="6" rx="1" opacity=".85" />
      <rect fill="#fff" x="30" y="24" width="6" height="6" rx="1" opacity=".7" />
    </svg>
  )
}

function GoogleDriveIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M6 32 16 8h16l10 24z" />
      <path fill="#FBBC04" d="M6 32h32l-8 14H14z" />
      <path fill="#34A853" d="M16 8 6 32h16z" />
      <path fill="#fff" opacity=".25" d="M16 8h16l10 24H26z" />
    </svg>
  )
}

const TAB_CONFIG: Record<
  GoogleBrowseTab,
  {
    label: string
    desc: string
    Icon: typeof GoogleSheetsIcon
    createType: 'sheet' | 'doc' | 'event' | 'folder'
    createLabel: string
    emptyLabel: string
    exports: { label: string; action: string; detail: string }[]
  }
> = {
  sheets: {
    label: 'Sheets',
    desc: 'Tus hojas de cálculo de Google',
    Icon: GoogleSheetsIcon,
    createType: 'sheet',
    createLabel: 'Nueva hoja',
    emptyLabel: 'No hay hojas recientes en tu cuenta',
    exports: [
      { label: 'Exportar clientes CRM', action: 'clients', detail: 'clientes' },
      { label: 'Exportar pipeline', action: 'opportunities', detail: 'oportunidades' },
      { label: 'Exportar movimientos', action: 'movements', detail: 'registros' },
    ],
  },
  docs: {
    label: 'Docs',
    desc: 'Tus documentos de Google',
    Icon: GoogleDocsIcon,
    createType: 'doc',
    createLabel: 'Nuevo documento',
    emptyLabel: 'No hay documentos recientes en tu cuenta',
    exports: [{ label: 'Generar resumen operativo', action: 'summary-doc', detail: 'CRM, ventas y finanzas' }],
  },
  calendar: {
    label: 'Calendar',
    desc: 'Tus próximos eventos',
    Icon: GoogleCalendarIcon,
    createType: 'event',
    createLabel: 'Nuevo evento',
    emptyLabel: 'No hay eventos próximos en tu calendario',
    exports: [{ label: 'Crear revisión semanal', action: 'weekly-event', detail: 'Próximo lunes 10:00' }],
  },
  drive: {
    label: 'Drive',
    desc: 'Tus archivos y carpetas recientes',
    Icon: GoogleDriveIcon,
    createType: 'folder',
    createLabel: 'Nueva carpeta',
    emptyLabel: 'No hay archivos recientes en tu Drive',
    exports: [{ label: 'Crear carpeta Pupi', action: 'drive-folder', detail: 'Organizá exports y docs' }],
  },
}

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type GoogleToolsPanelProps = {
  googleStatus: {
    configured: boolean
    connected: boolean
    email: string | null
  } | null
  onRefreshStatus: () => Promise<void>
  showToast: (message: string) => void
  exportCounts: {
    clients: number
    opportunities: number
    movements: number
  }
}

export function GoogleToolsPanel({
  googleStatus,
  onRefreshStatus,
  showToast,
  exportCounts,
}: GoogleToolsPanelProps) {
  const [tab, setTab] = useState<GoogleBrowseTab>('sheets')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<GoogleWorkspaceItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const googleConnected = googleStatus?.connected ?? false
  const googleConfigured = googleStatus?.configured ?? false
  const active = TAB_CONFIG[tab]
  const ActiveIcon = active.Icon

  const loadItems = useCallback(async (silent = false) => {
    if (!googleConnected) {
      setItems([])
      setLoadError(null)
      setLastSyncedAt(null)
      return
    }

    if (!silent) setLoading(true)
    const result = await fetchGoogleWorkspace(tab)
    setItems(result.items)
    setLoadError(result.error)
    if (!result.error) setLastSyncedAt(new Date())
    if (!silent) setLoading(false)
  }, [googleConnected, tab])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!googleConnected) return

    const interval = window.setInterval(() => {
      loadItems(true)
    }, SYNC_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadItems(true)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [googleConnected, loadItems])

  const actionBtn = (enabled: boolean, variant: 'primary' | 'danger' = 'primary'): React.CSSProperties => ({
    background:
      variant === 'danger'
        ? enabled
          ? 'rgba(239,68,68,0.15)'
          : 'rgba(255,255,255,0.04)'
        : enabled
          ? '#2563EB'
          : 'rgba(255,255,255,0.04)',
    border: variant === 'danger' ? '1px solid rgba(239,68,68,0.25)' : 'none',
    color:
      variant === 'danger'
        ? enabled
          ? '#f87171'
          : 'rgba(255,255,255,0.3)'
        : enabled
          ? 'white'
          : 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    padding: '7px 14px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    flexShrink: 0,
  })

  const handleDelete = async (item: GoogleWorkspaceItem) => {
    const confirmed = window.confirm(`¿Eliminar "${item.name}" de Google?`)
    if (!confirmed) return

    setBusy(true)
    const result = await deleteGoogleWorkspaceItem(tab, item.id)
    setBusy(false)

    if (result && 'deleted' in result && result.deleted) {
      showToast('Eliminado de Google')
      setItems(current => current.filter(entry => entry.id !== item.id))
      await loadItems(true)
      return
    }

    showToast(('error' in result && result.error) || 'No se pudo eliminar')
  }

  const openItem = (item: GoogleWorkspaceItem) => {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  const syncLabel = lastSyncedAt
    ? `Sincronizado con Google · ${lastSyncedAt.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}`
    : 'Sincronizando con Google...'

  const handleCreate = async () => {
    setBusy(true)
    const result = await createGoogleWorkspaceFile(active.createType)
    setBusy(false)

    if (result && 'url' in result && result.url) {
      showToast(`${active.createLabel} creado`)
      window.open(result.url, '_blank', 'noopener,noreferrer')
      await loadItems(true)
      return
    }

    showToast(('error' in result && result.error) || 'No se pudo crear el archivo')
  }

  const handleExport = async (action: string, label: string) => {
    setBusy(true)
    const result = await runGoogleAction(action)
    setBusy(false)

    if (result && 'url' in result && result.url) {
      showToast(`${label} listo`)
      window.open(result.url, '_blank', 'noopener,noreferrer')
      await loadItems(true)
      return
    }

    showToast(('error' in result && result.error) || 'No se pudo exportar')
  }

  const exportDetail = (detail: string) => {
    if (detail === 'clientes') return `${exportCounts.clients} clientes`
    if (detail === 'oportunidades') return `${exportCounts.opportunities} oportunidades`
    if (detail === 'registros') return `${exportCounts.movements} registros`
    return detail
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
            {googleConnected ? googleStatus?.email || 'Google conectado' : 'Google no conectado'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
            {googleConnected
              ? 'Tus archivos se sincronizan con Google cada pocos segundos'
              : 'Conectá tu cuenta para ver tus archivos y crear nuevos'}
          </div>
        </div>
        {googleConnected ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await disconnectGoogle()
              await onRefreshStatus()
              setBusy(false)
              showToast('Google desconectado')
            }}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
              fontSize: 12,
              borderRadius: 8,
              padding: '7px 14px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Desconectar
          </button>
        ) : (
          <button
            type="button"
            disabled={!googleConfigured || busy}
            onClick={() => {
              window.location.href = '/api/google/connect'
            }}
            style={{
              background: googleConfigured ? '#2563EB' : 'rgba(255,255,255,0.06)',
              border: 'none',
              color: googleConfigured ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: 12,
              borderRadius: 8,
              padding: '7px 14px',
              cursor: googleConfigured ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            Conectar Google
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexShrink: 0 }}>
        {(Object.keys(TAB_CONFIG) as GoogleBrowseTab[]).map(tabId => {
          const config = TAB_CONFIG[tabId]
          const TabIcon = config.Icon
          const isActive = tab === tabId
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 8px',
                borderRadius: 12,
                border: isActive ? '1px solid rgba(37,99,235,0.45)' : '1px solid rgba(255,255,255,0.08)',
                background: isActive ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              <TabIcon size={32} />
              <span style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: isActive ? 600 : 500 }}>
                {config.label}
              </span>
            </button>
          )
        })}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '20px 24px',
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <ActiveIcon size={36} />
            <div>
              <div style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{active.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{active.desc}</div>
              {googleConnected && (
                <div style={{ color: 'rgba(34,197,94,0.85)', fontSize: 11, marginTop: 6 }}>{syncLabel}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              disabled={!googleConnected || busy}
              onClick={() => loadItems()}
              style={actionBtn(googleConnected && !busy)}
              title="Actualizar"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              disabled={!googleConnected || busy}
              onClick={handleCreate}
              style={actionBtn(googleConnected && !busy)}
            >
              {active.createLabel}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, marginBottom: 16 }}>
          {!googleConnected ? (
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', padding: '32px 12px' }}>
              Conectá Google para ver tus archivos acá.
            </div>
          ) : loading ? (
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', padding: '32px 12px' }}>
              Cargando tu cuenta de Google...
            </div>
          ) : loadError ? (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', padding: '24px 12px', lineHeight: 1.6 }}>
              {loadError}
              <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                Si acabás de actualizar Pupi, desconectá y volvé a conectar Google para dar permisos de lectura de Drive.
              </div>
            </div>
          ) : items.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', padding: '32px 12px' }}>
              {active.emptyLabel}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 }}>
                      {item.mimeType || 'Archivo'}
                      {item.start ? ` · ${formatDate(item.start)}` : item.modifiedAt ? ` · ${formatDate(item.modifiedAt)}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button type="button" onClick={() => openItem(item)} style={actionBtn(true)}>
                      Abrir
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(item)}
                      style={actionBtn(!busy, 'danger')}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, flexShrink: 0 }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 10 }}>
            ACCIONES PUPi
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.exports.map(item => (
              <div
                key={item.action}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                    {exportDetail(item.detail)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!googleConnected || busy}
                  onClick={() => handleExport(item.action, item.label)}
                  style={actionBtn(googleConnected && !busy)}
                >
                  Usar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
