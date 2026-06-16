import { supabaseAdmin } from '@/lib/supabase-server'
import { mergeCompanySettings } from '@/lib/settings'
import { getGoogleConnectionSummary } from '@/lib/google'
import { getRecentGoogleActions } from '@/lib/google-chat'

export async function getCompanyContext(companyId: string) {
  const [
    companyRes,
    usersRes,
    clientsRes,
    opportunitiesRes,
    movementsRes,
    employeesRes,
    tasksRes,
    campaignsRes,
    notificationsRes,
    subscriptionsRes,
    chatRes,
    memoryRes,
    researchRes,
  ] = await Promise.all([
    supabaseAdmin.from('companies').select('*').eq('id', companyId).single(),
    supabaseAdmin.from('users').select('id, name, email, role, last_active').eq('company_id', companyId),
    supabaseAdmin.from('clients').select('id, name, company_name, temperature, average_ticket, last_contact_at, city, country, tags').eq('company_id', companyId).limit(50),
    supabaseAdmin.from('opportunities').select('id, title, amount, stage, probability, estimated_close_date').eq('company_id', companyId).limit(30),
    supabaseAdmin.from('movements').select('type, amount, category, date, description').eq('company_id', companyId).order('date', { ascending: false }).limit(40),
    supabaseAdmin.from('employees').select('id, name, role, department, status, gross_salary, hire_date').eq('company_id', companyId).limit(50),
    supabaseAdmin.from('employee_tasks').select('id, title, status, priority, due_date, employee_id').eq('company_id', companyId).limit(30),
    supabaseAdmin.from('campaigns').select('id, name, channel, status, budget, spent, roi').eq('company_id', companyId).limit(20),
    supabaseAdmin.from('notifications').select('id, type, title, message, read, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('subscriptions').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('chat_history').select('role, message, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('company_memory').select('key, value, category').eq('company_id', companyId).limit(30),
    supabaseAdmin.from('research').select('id, title, status, created_at').eq('company_id', companyId).limit(10),
  ])

  const integrationsRes = await supabaseAdmin
    .from('company_integrations')
    .select('provider, connected, connected_at')
    .eq('company_id', companyId)

  const [google, recentGoogleActions] = await Promise.all([
    getGoogleConnectionSummary(companyId),
    getRecentGoogleActions(companyId, 5),
  ])

  const company = companyRes.data
  const clients = clientsRes.data || []
  const opportunities = opportunitiesRes.data || []
  const movements = movementsRes.data || []
  const settings = mergeCompanySettings(company?.settings)

  const income = movements.filter(m => m.type === 'income').reduce((s, m) => s + Number(m.amount || 0), 0)
  const expense = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Number(m.amount || 0), 0)

  return {
    company,
    settings,
    users: usersRes.data || [],
    clients,
    clients_summary: {
      total: clients.length,
      hot: clients.filter(c => c.temperature === 'hot').length,
      warm: clients.filter(c => c.temperature === 'warm').length,
      cold: clients.filter(c => c.temperature === 'cold').length,
    },
    opportunities,
    pipeline_value: opportunities.reduce((s, o) => s + Number(o.amount || 0), 0),
    movements,
    finance_summary: { income, expense, balance: income - expense },
    employees: employeesRes.data || [],
    tasks: tasksRes.data || [],
    campaigns: campaignsRes.data || [],
    notifications: notificationsRes.data || [],
    subscription: subscriptionsRes.data?.[0] || null,
    integrations: integrationsRes.error ? [] : (integrationsRes.data || []),
    google,
    recent_google_actions: recentGoogleActions,
    recent_chat: (chatRes.data || []).reverse(),
    memory: memoryRes.data || [],
    research: researchRes.data || [],
  }
}

export async function getUsageStats(companyId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [usersRes, chatTodayRes, clientsRes] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabaseAdmin.from('chat_history').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('role', 'user').gte('created_at', today.toISOString()),
    supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
  ])

  const planLimits: Record<string, { users: number; queries: number; storageGb: number }> = {
    starter: { users: 3, queries: 50, storageGb: 5 },
    growth: { users: 15, queries: 200, storageGb: 20 },
    pro: { users: 50, queries: 500, storageGb: 50 },
    enterprise: { users: 999, queries: 9999, storageGb: 200 },
  }

  return {
    users_count: usersRes.count || 0,
    queries_today: chatTodayRes.count || 0,
    clients_count: clientsRes.count || 0,
    storage_gb: 2.1,
    planLimits,
  }
}
