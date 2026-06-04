import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
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

const EMAIL = 'ignaciochauvie7@gmail.com'
const NAME = 'Ignacio'
const PASSWORD = process.argv[2] || 'Pupi2026!Ignacio'
const COMPANY_NAME = 'Distribuidora Ignacio'

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('id, email, name, company_id')
    .eq('email', EMAIL)
    .maybeSingle()

  if (findError) {
    console.error('Error buscando usuario:', findError.message)
    process.exit(1)
  }

  let userId = existing?.id

  if (!existing) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: COMPANY_NAME,
        industry: null,
        plan: 'starter',
        status: 'active',
        onboarding_complete: true,
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creando company:', companyError.message)
      process.exit(1)
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        company_id: company.id,
        email: EMAIL,
        name: NAME,
        role: 'owner',
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creando user:', userError.message)
      process.exit(1)
    }

    userId = user.id
    console.log('Usuario y empresa creados.')
  } else {
    console.log('Usuario ya existía en users.')
  }

  const password_hash = await bcrypt.hash(PASSWORD, 12)

  const { data: authRow } = await supabase
    .from('user_auth')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (authRow) {
    const { error: updateError } = await supabase
      .from('user_auth')
      .update({ password_hash })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error actualizando password:', updateError.message)
      process.exit(1)
    }
    console.log('Contraseña actualizada en user_auth.')
  } else {
    const { error: authError } = await supabase.from('user_auth').insert({
      user_id: userId,
      password_hash,
    })

    if (authError) {
      console.error('Error creando user_auth:', authError.message)
      process.exit(1)
    }
    console.log('user_auth creado.')
  }

  console.log('\n--- Listo para login ---')
  console.log('Email:', EMAIL)
  console.log('Password:', PASSWORD)
  console.log('http://localhost:3000/login')
}

main()
