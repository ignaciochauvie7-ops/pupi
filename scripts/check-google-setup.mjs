import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function loadEnv() {
  const env = {}
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function checkTable(name) {
  const { error } = await supabase.from(name).select('*', { head: true, count: 'exact' })
  if (error) {
    console.log(`❌ ${name}: ${error.message}`)
    return false
  }
  console.log(`✅ ${name}`)
  return true
}

async function main() {
  console.log('Verificando tablas necesarias para Google...\n')

  const required = [
    'companies',
    'users',
    'company_integrations',
    'google_connections',
    'chat_history',
  ]

  let ok = true
  for (const table of required) {
    const passed = await checkTable(table)
    if (!passed) ok = false
  }

  console.log('\nVariables de entorno Google:')
  console.log(env.GOOGLE_CLIENT_ID ? '✅ GOOGLE_CLIENT_ID' : '❌ GOOGLE_CLIENT_ID')
  console.log(env.GOOGLE_CLIENT_SECRET ? '✅ GOOGLE_CLIENT_SECRET' : '❌ GOOGLE_CLIENT_SECRET')
  console.log(
    env.GOOGLE_REDIRECT_URI || env.NEXT_PUBLIC_APP_URL
      ? `✅ Redirect: ${env.GOOGLE_REDIRECT_URI || `${env.NEXT_PUBLIC_APP_URL}/api/google/callback`}`
      : '❌ GOOGLE_REDIRECT_URI / NEXT_PUBLIC_APP_URL'
  )

  if (!ok) {
    console.log('\nFaltan tablas. En Supabase SQL Editor ejecutá:')
    console.log('1) supabase/add_backend_extensions.sql')
    console.log('2) supabase/add_google_oauth.sql')
    process.exit(1)
  }

  console.log('\nTodo listo en Supabase. Conectá Google desde Herramientas en el dashboard.')
}

main()
