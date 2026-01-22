import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createApiKey } from '../plane-a/src/services/api-keys'

type ScriptArgs = {
  emails: string[]
  userIds: string[]
  tier: '2' | '3'
  keyName: string
  createKey: boolean
  force: boolean
}

const logger = createLogger('script.dev-promote-enterprise-user')

const usage = () => {
  console.log(`
Usage:
  tsx backend/scripts/dev-promote-enterprise-user.ts --email user@example.com
  tsx backend/scripts/dev-promote-enterprise-user.ts --user-id <uuid>

Options:
  --email <email>        Promote user by email (repeatable).
  --emails <list>        Comma-separated list of emails.
  --user-id <uuid>       Promote user by ID (repeatable).
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
    userIds: [],
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
    if (arg === '--user-id') {
      const value = argv[i + 1]
      if (!value) throw new Error('Missing value for --user-id')
      args.userIds.push(value)
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
  args.userIds = Array.from(new Set(args.userIds.map(id => id.trim()).filter(Boolean)))

  if (args.emails.length === 0 && args.userIds.length === 0) {
    throw new Error('Provide at least one --email or --user-id')
  }

  return args
}

const resolveUserIds = async (pool: ReturnType<typeof createPool>, emails: string[]) => {
  if (emails.length === 0) return []
  const result = await query<{ user_id: string; email: string }>(
    `
    SELECT user_id, email
    FROM silver.user_account
    WHERE LOWER(email) = ANY($1)
    `,
    [emails.map(email => email.toLowerCase())],
    pool,
  )
  return result.rows
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

  const pool = createPool(config.db.planeAUrl)
  try {
    const resolved = await resolveUserIds(pool, args.emails)
    const missingEmails = args.emails.filter(
      email => !resolved.some(row => row.email.toLowerCase() === email.toLowerCase()),
    )

    if (missingEmails.length > 0) {
      logger.warn('enterprise_user_missing', { emails: missingEmails })
    }

    const targetUserIds = Array.from(
      new Set([
        ...args.userIds,
        ...resolved.map(row => row.user_id),
      ]),
    )

    if (targetUserIds.length === 0) {
      throw new Error('No matching users found in silver.user_account')
    }

    for (const userId of targetUserIds) {
      await promoteUser(pool, userId)
      logger.info('enterprise_user_promoted', { user_id: userId })

      if (args.createKey) {
        const tierScope = args.tier === '3' ? 'tier:3' : 'tier:2'
        const apiKey = await createApiKey(pool, userId, {
          name: args.keyName,
          scopes: [tierScope, 'indices:read'],
        })
        logger.info('enterprise_api_key_created', {
          user_id: userId,
          key_prefix: apiKey.key_prefix,
          scopes: apiKey.scopes,
          token: apiKey.token,
        })
      }
    }
  } finally {
    await pool.end()
  }
}

main().catch(error => {
  logger.error('enterprise_user_promotion_failed', {
    error: error instanceof Error ? error.message : String(error),
  })
  usage()
  process.exit(1)
})
