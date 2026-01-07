import { createHash } from 'node:crypto'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.local-seed')

type SeedProvider = {
  id: string
  name: string
  fee: number
  rate: number
}

const providers: SeedProvider[] = [
  { id: 'remitly', name: 'Remitly', fee: 4.99, rate: 17.7 },
  { id: 'wise', name: 'Wise', fee: 5.75, rate: 17.6 },
  { id: 'westernunion', name: 'Western Union', fee: 6.25, rate: 17.4 },
]

const corridor = {
  id: 'US-MX-USD-MXN',
  sourceCountry: 'US',
  destCountry: 'MX',
  sourceCurrency: 'USD',
  destCurrency: 'MXN',
}

const amountBucket = 500
const payin = 'bank_transfer'
const payout = 'bank_deposit'

const roundTo = (value: number, decimals: number) => {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const toDeterministicUuid = (value: string) => {
  const hash = createHash('sha256').update(value).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

const resolveMockUserId = (value: string, fallback: string) => {
  const candidate = value || fallback
  return uuidPattern.test(candidate) ? candidate : toDeterministicUuid(candidate)
}

const popularCorridors = [
  {
    from: 'US',
    to: 'MX',
    count24h: 142,
    topProvider: 'remitly',
    feeRange: '$4.99-$6.25',
    speedRange: 'minutes-1 day',
    bestFor: 'bank_transfer',
  },
  {
    from: 'US',
    to: 'PH',
    count24h: 98,
    topProvider: 'wise',
    feeRange: '$5.00-$7.25',
    speedRange: 'hours-2 days',
    bestFor: 'bank_transfer',
  },
  {
    from: 'GB',
    to: 'PK',
    count24h: 76,
    topProvider: 'westernunion',
    feeRange: 'GBP 1.99-3.99',
    speedRange: 'minutes-1 day',
    bestFor: 'cash_pickup',
  },
]

const run = async () => {
  const pool = createPool(config.db.planeBUrl)
  const collectedAt = new Date()
  const arrow = String.fromCharCode(0x2192)
  const mockUserId = resolveMockUserId(
    config.auth.supabase.mock.userId,
    config.auth.supabase.mock.token,
  )
  const mockEmail = config.auth.supabase.mock.email
  const recentSearches = [
    {
      from_country: 'US',
      to_country: 'MX',
      amount: 500,
      method: 'bank',
      best_provider_name: 'Remitly',
      best_provider_recipient: 8761.68,
    },
    {
      from_country: 'US',
      to_country: 'PH',
      amount: 300,
      method: 'bank',
      best_provider_name: 'Wise',
      best_provider_recipient: 16500,
    },
    {
      from_country: 'GB',
      to_country: 'PK',
      amount: 250,
      method: 'cash',
      best_provider_name: 'Western Union',
      best_provider_recipient: 87000,
    },
  ]

  try {
    await pool.query('BEGIN')

    await pool.query(
      `INSERT INTO silver.user_account (user_id, email, created_at, last_seen_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         email = EXCLUDED.email,
         last_seen_at = NOW()`,
      [mockUserId, mockEmail],
    )

    await pool.query(
      `DELETE FROM silver.recent_searches WHERE user_id = $1`,
      [mockUserId],
    )

    for (const search of recentSearches) {
      await pool.query(
        `INSERT INTO silver.recent_searches (
           user_id,
           from_country,
           to_country,
           amount,
           method,
           best_provider_name,
           best_provider_recipient
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          mockUserId,
          search.from_country,
          search.to_country,
          search.amount,
          search.method,
          search.best_provider_name,
          search.best_provider_recipient,
        ],
      )
    }

    for (const corridorRow of popularCorridors) {
      const route = `${corridorRow.from}${arrow}${corridorRow.to}`
      await pool.query(
        `INSERT INTO gold.popular_corridors (
           route,
           count_24h,
           top_provider,
           fee_range,
           speed_range,
           best_for
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (route) DO UPDATE SET
           count_24h = EXCLUDED.count_24h,
           top_provider = EXCLUDED.top_provider,
           fee_range = EXCLUDED.fee_range,
           speed_range = EXCLUDED.speed_range,
           best_for = EXCLUDED.best_for,
           updated_at = NOW()`,
        [
          route,
          corridorRow.count24h,
          corridorRow.topProvider,
          corridorRow.feeRange,
          corridorRow.speedRange,
          corridorRow.bestFor,
        ],
      )
    }

    await pool.query(
      `INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (corridor_id) DO UPDATE SET
         source_country = EXCLUDED.source_country,
         dest_country = EXCLUDED.dest_country,
         source_currency = EXCLUDED.source_currency,
         dest_currency = EXCLUDED.dest_currency,
         updated_at = NOW()`,
      [
        corridor.id,
        corridor.sourceCountry,
        corridor.destCountry,
        corridor.sourceCurrency,
        corridor.destCurrency,
      ],
    )

    for (const provider of providers) {
      await pool.query(
        `INSERT INTO silver.provider (provider_id, display_name)
         VALUES ($1, $2)
         ON CONFLICT (provider_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           updated_at = NOW()`,
        [provider.id, provider.name],
      )

      const sendAmount = amountBucket
      const totalDebit = roundTo(sendAmount + provider.fee, 2)
      const receiveAmount = roundTo((sendAmount - provider.fee) * provider.rate, 2)

      await pool.query(
        `INSERT INTO silver.latest_quote_by_provider (
           corridor_id,
           amount_bucket,
           payin,
           payout,
           provider_id,
           collected_at,
           send_amount,
           fee_amount,
           total_debit_amount,
           receive_amount,
           implied_fx_rate,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         ON CONFLICT (corridor_id, amount_bucket, payin, payout, provider_id) DO UPDATE SET
           collected_at = EXCLUDED.collected_at,
           send_amount = EXCLUDED.send_amount,
           fee_amount = EXCLUDED.fee_amount,
           total_debit_amount = EXCLUDED.total_debit_amount,
           receive_amount = EXCLUDED.receive_amount,
           implied_fx_rate = EXCLUDED.implied_fx_rate,
           updated_at = NOW()`,
        [
          corridor.id,
          amountBucket,
          payin,
          payout,
          provider.id,
          collectedAt,
          sendAmount,
          provider.fee,
          totalDebit,
          receiveAmount,
          provider.rate,
        ],
      )
    }

    await pool.query('COMMIT')
    logger.info('local_seed_complete', {
      corridor: corridor.id,
      providers: providers.map((provider) => provider.id),
      popular_corridors: popularCorridors.length,
      recent_searches: recentSearches.length,
    })
  } catch (error) {
    await pool.query('ROLLBACK')
    logger.error('local_seed_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    await pool.end()
  }
}

run().catch(() => {
  process.exit(1)
})
