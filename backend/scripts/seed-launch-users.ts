import { randomBytes } from 'crypto'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'

type LaunchUserSpec = {
  email: string
  appRole: 'user' | 'admin' | 'super_admin'
  planCode: 'free' | 'plus' | 'enterprise'
  passwordEnvKey: string
}

type ScriptArgs = {
  force: boolean
  supabaseOnly: boolean
  printPasswords: boolean
}

type SupabaseUser = {
  id: string
  email: string | null
}

const logger = createLogger('script.seed-launch-users')

const launchUsers: LaunchUserSpec[] = [
  {
    email: 'omar@remit-scout.com',
    appRole: 'super_admin',
    planCode: 'enterprise',
    passwordEnvKey: 'LAUNCH_PASSWORD_OMAR',
  },
  {
    email: 'developer@remit-scout.com',
    appRole: 'admin',
    // Give developers enterprise access for testing without relying on Stripe wiring.
    planCode: 'enterprise',
    passwordEnvKey: 'LAUNCH_PASSWORD_DEVELOPER',
  },
  {
    email: 'austrilic@gmail.com',
    appRole: 'user',
    planCode: 'enterprise',
    passwordEnvKey: 'LAUNCH_PASSWORD_AUSTRILIC',
  },
  {
    email: 'ghabayenedu@gmail.com',
    appRole: 'user',
    planCode: 'plus',
    passwordEnvKey: 'LAUNCH_PASSWORD_GHABAYENEDU',
  },
  {
    email: 'support@remit-scout.com',
    appRole: 'user',
    planCode: 'free',
    passwordEnvKey: 'LAUNCH_PASSWORD_SUPPORT',
  },
]

const usage = () => {
  console.log(`
Usage:
  tsx backend/scripts/seed-launch-users.ts [--supabase-only] [--force] [--print-passwords]

Password env vars (optional):
  LAUNCH_PASSWORD_OMAR
  LAUNCH_PASSWORD_DEVELOPER
  LAUNCH_PASSWORD_AUSTRILIC
  LAUNCH_PASSWORD_GHABAYENEDU
  LAUNCH_PASSWORD_SUPPORT
  DEFAULT_LAUNCH_PASSWORD

SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.

Notes:
  - By default, this script does NOT print plaintext passwords.
  - Use --print-passwords only for controlled, temporary credentials (dev/staging).
`)
}

const parseArgs = (): ScriptArgs => {
  const args: ScriptArgs = { force: false, supabaseOnly: false, printPasswords: false }
  for (const arg of process.argv.slice(2)) {
    if (arg === '--help') {
      usage()
      process.exit(0)
    }
    if (arg === '--supabase-only') {
      args.supabaseOnly = true
      continue
    }
    if (arg === '--force') {
      args.force = true
      continue
    }
    if (arg === '--print-passwords') {
      args.printPasswords = true
      continue
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }
  return args
}

const requireSupabaseConfig = () => {
  if (!config.auth.supabase.url) {
    throw new Error('SUPABASE_URL is missing')
  }
  if (!config.auth.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  }
}

const supabaseBaseUrl = () => config.auth.supabase.url.replace(/\/$/, '')

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch (error) {
    console.warn('[seed-launch-users] response json parse failed', {
      status: response.status,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

const extractMessage = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return ''
  const asRecord = payload as Record<string, unknown>
  const message = asRecord.message ?? asRecord.error ?? asRecord.msg
  if (typeof message === 'string') return message
  if (message === null || message === undefined) return ''
  return JSON.stringify(message)
}

const extractUsers = (payload: unknown): SupabaseUser[] => {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const id = typeof row.id === 'string' ? row.id : null
        const email = typeof row.email === 'string' ? row.email : null
        if (!id) return null
        return { id, email }
      })
      .filter((row): row is SupabaseUser => row !== null)
  }
  if (typeof payload === 'object' && payload !== null) {
    const users = (payload as Record<string, unknown>).users
    if (Array.isArray(users)) {
      return extractUsers(users)
    }
  }
  return []
}

const supabaseAdminRequest = async (
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; payload: unknown }> => {
  const response = await fetch(`${supabaseBaseUrl()}${path}`, {
    ...init,
    headers: {
      apikey: config.auth.supabase.serviceRoleKey,
      Authorization: `Bearer ${config.auth.supabase.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const payload = await parseJson(response)
  return { response, payload }
}

const findSupabaseUserByEmail = async (email: string): Promise<SupabaseUser | null> => {
  const normalizedEmail = email.trim().toLowerCase()
  const direct = await supabaseAdminRequest(
    `/auth/v1/admin/users?email=${encodeURIComponent(normalizedEmail)}`,
    { method: 'GET' },
  )

  if (direct.response.ok) {
    const users = extractUsers(direct.payload)
    const matched = users.find((row) => row.email?.toLowerCase() === normalizedEmail)
    if (matched) return matched
  }

  const perPage = 100
  const maxPages = 10
  for (let page = 1; page <= maxPages; page += 1) {
    const paged = await supabaseAdminRequest(
      `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { method: 'GET' },
    )
    if (!paged.response.ok) {
      break
    }
    const users = extractUsers(paged.payload)
    const matched = users.find((row) => row.email?.toLowerCase() === normalizedEmail)
    if (matched) return matched
    if (users.length < perPage) {
      break
    }
  }

  return null
}

const createOrUpdateSupabaseUser = async (
  user: LaunchUserSpec,
  password: string,
): Promise<{ userId: string; created: boolean }> => {
  const metadata = {
    role: user.appRole,
    app_role: user.appRole,
    plan_code: user.planCode,
  }

  const createResult = await supabaseAdminRequest('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: metadata,
    }),
  })

  if (createResult.response.ok) {
    const payload = createResult.payload as Record<string, unknown> | null
    const id = (payload?.id as string | undefined) ?? ((payload?.user as { id?: string } | undefined)?.id)
    if (!id) {
      throw new Error(`Supabase create user for ${user.email} returned no user id`)
    }
    return { userId: id, created: true }
  }

  const message = extractMessage(createResult.payload)
  const alreadyExists = /(already|exists|registered|duplicate)/i.test(message)
  if (!alreadyExists) {
    throw new Error(
      `Supabase create user failed for ${user.email}: ${createResult.response.status} ${message || 'unknown error'}`,
    )
  }

  const existing = await findSupabaseUserByEmail(user.email)
  if (!existing) {
    throw new Error(`Supabase reports existing user for ${user.email}, but user lookup failed`)
  }

  const updateResult = await supabaseAdminRequest(`/auth/v1/admin/users/${existing.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: metadata,
    }),
  })
  if (!updateResult.response.ok) {
    const updateMessage = extractMessage(updateResult.payload)
    throw new Error(
      `Supabase update user failed for ${user.email}: ${updateResult.response.status} ${updateMessage || 'unknown error'}`,
    )
  }

  return { userId: existing.id, created: false }
}

const ensureNoConflictingAccount = async (
  pool: ReturnType<typeof createPool>,
  email: string,
  userId: string,
) => {
  const result = await query<{ user_id: string }>(
    `SELECT user_id FROM silver.user_account WHERE LOWER(email) = LOWER($1)`,
    [email],
    pool,
  )
  const existingUserId = result.rows[0]?.user_id
  if (existingUserId && existingUserId !== userId) {
    throw new Error(
      `Email ${email} is linked to a different user_id (${existingUserId}). Resolve manually before seeding.`,
    )
  }
}

const upsertUserAccount = async (
  pool: ReturnType<typeof createPool>,
  userId: string,
  email: string,
  appRole: LaunchUserSpec['appRole'],
) => {
  await query(
    `
    INSERT INTO silver.user_account (user_id, email, app_role, last_seen_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET email = EXCLUDED.email,
                  app_role = EXCLUDED.app_role,
                  last_seen_at = NOW()
    `,
    [userId, email, appRole],
    pool,
  )
}

const upsertUserPlan = async (
  pool: ReturnType<typeof createPool>,
  userId: string,
  planCode: LaunchUserSpec['planCode'],
) => {
  await query(
    `
    INSERT INTO silver.user_plan (user_id, plan_code, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (user_id)
    DO UPDATE SET plan_code = EXCLUDED.plan_code,
                  status = 'active',
                  updated_at = NOW()
    `,
    [userId, planCode],
    pool,
  )
}

const resolvePassword = (user: LaunchUserSpec) => {
  const fromSpecificEnv = process.env[user.passwordEnvKey]
  if (fromSpecificEnv && fromSpecificEnv.trim()) {
    return { value: fromSpecificEnv, source: user.passwordEnvKey }
  }
  const fromDefaultEnv = process.env.DEFAULT_LAUNCH_PASSWORD
  if (fromDefaultEnv && fromDefaultEnv.trim()) {
    return { value: fromDefaultEnv, source: 'DEFAULT_LAUNCH_PASSWORD' }
  }
  const generated = randomBytes(12).toString('hex')
  return { value: generated, source: 'generated' as const }
}

const main = async () => {
  const args = parseArgs()
  requireSupabaseConfig()

  const environment = (process.env.ENVIRONMENT || '').toLowerCase()
  const isProdLike = environment === 'prod' || environment === 'production' || config.env === 'prod' || config.env === 'production'
  if (isProdLike && !args.force) {
    throw new Error('Refusing to run in prod without --force')
  }

  const outputs: Array<Record<string, string>> = []

  const pool = args.supabaseOnly ? null : createPool(config.db.planeAUrl)
  try {
    for (const user of launchUsers) {
      const password = resolvePassword(user)
      const supabase = await createOrUpdateSupabaseUser(user, password.value)

      if (pool) {
        await ensureNoConflictingAccount(pool, user.email, supabase.userId)
        await upsertUserAccount(pool, supabase.userId, user.email, user.appRole)
        await upsertUserPlan(pool, supabase.userId, user.planCode)
      }

      logger.info('launch_user_seeded', {
        email: user.email,
        user_id: supabase.userId,
        created: supabase.created,
        app_role: user.appRole,
        plan_code: user.planCode,
        password_source: password.source,
        supabase_only: args.supabaseOnly,
      })

      outputs.push({
        email: user.email,
        user_id: supabase.userId,
        app_role: user.appRole,
        plan_code: user.planCode,
        password_source: password.source,
        ...(args.printPasswords ? { password: password.value } : {}),
      })
    }
  } finally {
    if (pool) {
      await pool.end()
    }
  }

  console.log(JSON.stringify(outputs, null, 2))
}

main().catch((error) => {
  logger.error('seed_launch_users_failed', {
    error: error instanceof Error ? error.message : String(error),
  })
  usage()
  process.exit(1)
})
