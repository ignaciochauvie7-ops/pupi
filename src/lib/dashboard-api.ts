export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function sendChatMessage(message: string): Promise<string | null> {
  const data = await apiFetch<{ response: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
  return data?.response ?? null
}

export async function fetchSettings() {
  return apiFetch<{
    notifications: {
      alerts: Record<string, boolean>
      channels: Record<string, boolean>
      freq: Record<string, boolean>
      whatsappPhone: string
    }
    voice: Record<string, unknown>
    integrations: Record<string, boolean>
    companyExtra: Record<string, string>
  }>('/api/settings')
}

export async function saveSettings(patch: Record<string, unknown>) {
  return apiFetch('/api/settings', { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function fetchTeamUsers() {
  return apiFetch<{ users: Array<{
    id: string; name: string; email: string; role: string
    avatar: string; modules: string; permissions?: unknown
  }> }>('/api/users')
}

export async function fetchMe() {
  return apiFetch<{ id: string; name: string; email: string; role: string; phone?: string }>('/api/me')
}

export async function saveProfile(data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string; confirmPassword?: string }) {
  return apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify(data) })
}

export async function fetchCompany() {
  return apiFetch<{ name: string; industry: string; size: number; anios?: string; ciudad?: string; pais?: string; web?: string; desc?: string }>('/api/company')
}

export async function saveCompany(data: Record<string, unknown>) {
  return apiFetch('/api/company', { method: 'PATCH', body: JSON.stringify(data) })
}

export async function fetchBilling() {
  return apiFetch<{
    plan: { id: string; name: string; price: number; status: string; renewal: string | null }
    usage: { users: { used: number; limit: number }; queries: { used: number; limit: number }; storage: { used_gb: number; limit_gb: number } }
    invoices: Array<{ description: string; amount: number; status: string; date: string }>
    polar_configured: boolean
    checkout_url: string
    portal_url: string
    payment: { provider: 'polar' } | null
  }>('/api/billing')
}

export async function fetchGoogleStatus() {
  return apiFetch<{
    configured: boolean
    connected: boolean
    email: string | null
    connectUrl: string
  }>('/api/google/status')
}

export async function disconnectGoogle() {
  return apiFetch('/api/google/disconnect', { method: 'POST' })
}

export async function runGoogleAction(action: string): Promise<
  { url: string; rowCount?: number } | { error: string }
> {
  try {
    const res = await fetch('/api/google/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { error: data.error || 'No se pudo ejecutar la acción de Google' }
    }
    return data as { url: string; rowCount?: number }
  } catch {
    return { error: 'No se pudo conectar con Google' }
  }
}

export async function exportClientsToGoogle() {
  return runGoogleAction('clients')
}

export type GoogleBrowseTab = 'sheets' | 'docs' | 'calendar' | 'drive'

export type GoogleWorkspaceItem = {
  id: string
  name: string
  url: string
  mimeType?: string
  rawMimeType?: string
  modifiedAt?: string
  start?: string
  end?: string
  source?: 'drive' | 'calendar'
}

export async function fetchGoogleWorkspace(tab: GoogleBrowseTab) {
  try {
    const res = await fetch(`/api/google/browse?tab=${tab}&_=${Date.now()}`, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) {
      return { items: [] as GoogleWorkspaceItem[], error: data.error || 'No se pudieron cargar los archivos' }
    }
    return { items: (data.items || []) as GoogleWorkspaceItem[], error: null as string | null }
  } catch {
    return { items: [] as GoogleWorkspaceItem[], error: 'No se pudo conectar con Google' }
  }
}

export async function deleteGoogleWorkspaceItem(tab: GoogleBrowseTab, itemId: string) {
  try {
    const res = await fetch(`/api/google/delete?id=${encodeURIComponent(itemId)}&tab=${tab}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (!res.ok) {
      return { error: data.error || 'No se pudo eliminar' }
    }
    return { deleted: true as const }
  } catch {
    return { error: 'No se pudo conectar con Google' }
  }
}

export async function createGoogleWorkspaceFile(type: 'sheet' | 'doc' | 'folder' | 'event', title?: string) {
  try {
    const res = await fetch('/api/google/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { error: data.error || 'No se pudo crear el archivo' }
    }
    return data as { url: string; rowCount?: number }
  } catch {
    return { error: 'No se pudo conectar con Google' }
  }
}

export async function fetchInsights(module: string) {
  return apiFetch<{ insights: Array<{ title: string; description: string; priority: string; action: string }> }>('/api/insights', {
    method: 'POST',
    body: JSON.stringify({ module }),
  })
}
