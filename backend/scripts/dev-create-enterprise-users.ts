import { randomBytes } from 'crypto'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createApiKey } from '../plane-a/src/services/api-keys'

type ScriptArgs = {
  emails: string[]
  count: number
  prefix: string
  domain: string
  password: string | null
  tier: '2' | '3'
  keyName: string
  createKey: boolean
  force: boolean
}

const logger = createLogger('script.dev-create-enterprise-users')

const usage = () => {
  console.log(`
Usage:
  tsx backend/scripts/dev-create-enterprise-users.ts --count 2
  tsx backend/scripts/dev-create-enterprise-users.ts --email user@example.com

Options:
  --email <email>        Create a user for this email (repeatable).
  --emails <list>        Comma-separated list of emails.
  --count <n>            Create N generated emails (default: 0).
  --prefix <value>       Prefix for generated emails (default: enterprise-test).
  --domain <value>       Domain for generated emails (default: example.com).
  --password <value>     Use a fixed password for all users.
  --tier <2|3>           API tier for new key scopes (default: 2).
  --key-name <name>      API key label (default: Enterprise Test Key).
  --skip-api-key         Do not create an API key.
  --force                Allow running outside dev.
  --help                 Show this help.
`)
}

const parseArgs = (): ScriptArgs => {
  const argv = process.argv.slice(2)
  const args: ScriptArgs = {
    emails: [],
    count: 0,
    prefix: 'enterprise-test',
    domain: 'example.com',
    password: null,
    tier: '2',
    keyName: 'Enterprise Test Key',
    createKey: true,
    force: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help') {
      usage()
      process.exit(0)
    }
    if (arg === '--email') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --email')
      args.emails.push(value)
      i += 1
      continue
    }
    if (arg === '--emails') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --emails')
      args.emails.push(...value.split(',').map(item => item.trim()).filter(Boolean))
      i += 1
      continue
    }
    if (arg === '--count') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --count')
      args.count = Number(value)
      i += 1
      continue
    }
    if (arg === '--prefix') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --prefix')
      args.prefix = value
      i += 1
      continue
    }
    if (arg === '--domain') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --domain')
      args.domain = value
      i += 1
      continue
    }
    if (arg === '--password') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --password')
      args.password = value
      i += 1
      continue
    }
    if (arg === '--tier') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --tier')
      if (value !== '2' && value !== '3') {
        throw new Error('Tier must be 2 or 3')
      }
      args.tier = value
      i += 1
      continue
    }
    if (arg === '--key-name') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --key-name')
      args.keyName = value
      i += 1
      continue
    }
    if (arg === '--skip-api-key') {
      args.createKey = false
      continue
    }
    if (arg === '--force') {
      args.force = true
      continue
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  args.emails = Array.from(new Set(args.emails.map(email => email.trim()).filter(Boolean)))
  if (Number.isNaN(args.count) || args.count < 0) {
    throw new Error('--count must be a non-negative number')
  }

  if (args.emails.length === 0 && args.count === 0) {
    throw new Error('Provide --email/--emails or --count')
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

const generatePassword = () => randomBytes(12).toString('hex')

const buildGeneratedEmails = (prefix: string, domain: string, count: number) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  return Array.from({ length: count }, (_, index) => {
    const suffix = String(index + 1).padStart(2, '0')
    return `${prefix}+${stamp}-${suffix}@${domain}`
  })
}

const createSupabaseUser = async (email: string, password: string) => {
  const baseUrl = config.auth.supabase.url.replace(/\/$/, '')
  let response: Response
  try {
    response = await fetch(`${baseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: config.auth.supabase.serviceRoleKey,
        Authorization: `Bearer ${config.auth.supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    })
  } catch (error) {
    throw new Error(`Supabase create user request failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!response.ok) {
    let details = ''
    try {
      const payload = await response.json()
      if (payload && typeof payload === 'object') {
        if ('message' in payload) {
          const message = (payload as { message?: unknown }).message
          details = typeof message === 'string' ? message : JSON.stringify(message)
        } else if ('error' in payload) {
          const message = (payload as { error?: unknown }).error
          details = typeof message === 'string' ? message : JSON.stringify(message)
        } else {
          details = JSON.stringify(payload)
        }
      }
    } catch {
      try {
        details = await response.text()
      } catch {
        // Ignore body parsing errors
      }
    }
    const suffix = details ? `: ${details}` : ''
    const errorMessage = `Supabase create user failed with status ${response.status}${suffix}`
    throw new Error(errorMessage)
  }

  const payload = await response.json()
  const userId = (payload?.id || payload?.user?.id) as string | undefined
  if (!userId) {
    throw new Error('Supabase create user succeeded but no user id returned')
  }
  return userId
}

const upsertUserAccount = async (pool: ReturnType<typeof createPool>, userId: string, email: string) => {
  await query(
    `
    INSERT INTO silver.user_account (user_id, email, last_seen_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET email = EXCLUDED.email, last_seen_at = NOW()
    `,
    [userId, email],
    pool,
  )
}

const promoteUser = async (pool: ReturnType<typeof createPool>, userId: string) => {
  await query(
    `
    INSERT INTO silver.user_plan (user_id, plan_code, status)
    VALUES ($1, 'enterprise', 'active')
    ON CONFLICT (user_id)
    DO UPDATE SET plan_code = 'enterprise',
                  status = 'active',
                  updated_at = NOW()
    `,
    [userId],
    pool,
  )
}

const main = async () => {
  const args = parseArgs()

  const isDevEnv = config.env === 'dev' || config.env === 'development'
  if (!isDevEnv && !args.force) {
    throw new Error(`Refusing to run in ${config.env}. Use --force to override.`)
  }

  requireSupabaseConfig()

  const pool = createPool(config.db.planeAUrl)
  const generatedEmails = buildGeneratedEmails(args.prefix, args.domain, args.count)
  const emails = [...args.emails, ...generatedEmails]

  try {
    for (const email of emails) {
      const password = args.password || generatePassword()
      const userId = await createSupabaseUser(email, password)
      await upsertUserAccount(pool, userId, email)
      await promoteUser(pool, userId)

      logger.info('enterprise_user_created', { user_id: userId, email })

      let token: string | null = null
      if (args.createKey) {
        const tierScope = args.tier === '3' ? 'tier:3' : 'tier:2'
        const apiKey = await createApiKey(pool, userId, {
          name: args.keyName,
          scopes: [tierScope, 'indices:read'],
        })
        token = apiKey.token
        logger.info('enterprise_api_key_created', {
          user_id: userId,
          key_prefix: apiKey.key_prefix,
          scopes: apiKey.scopes,
        })
      }

      console.log(
        JSON.stringify(
          {
            email,
            password,
            user_id: userId,
            api_key_token: token,
          },
          null,
          2,
        ),
      )
    }
  } finally {
    await pool.end()
  }

  process.exit(0)
}

main().catch(error => {
  logger.error('enterprise_user_create_failed', { error })
  usage()
  process.exit(1)
})
