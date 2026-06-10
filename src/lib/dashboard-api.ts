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
  }>('/api/billing')
}

export async function fetchInsights(module: string) {
  return apiFetch<{ insights: Array<{ title: string; description: string; priority: string; action: string }> }>('/api/insights', {
    method: 'POST',
    body: JSON.stringify({ module }),
  })
}
