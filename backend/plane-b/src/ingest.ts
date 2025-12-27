import type { Pool } from 'pg'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { pulseDefaults, buildChartData } from '../../shared/pulse-defaults'
import {
  rightsMatrix,
  providers,
  corridors,
  providerQuotes,
  fxRates,
  fxProviderRates,
  popularCorridors,
  countries,
} from './data/sample-data'

type IngestOptions = {
  pool?: Pool
}

const pulseCacheEntries = () => {
  const baseEntries: Record<string, unknown> = {
    'pulse:corridors': pulseDefaults.corridors,
    'pulse:overview': pulseDefaults.overview,
    'pulse:method-coverage': pulseDefaults.methodCoverage,
    'pulse:table': pulseDefaults.table,
    'pulse:hero': pulseDefaults.hero,
    'pulse:coverage-summary': pulseDefaults.coverageSummary,
    'pulse:snapshot-summary': pulseDefaults.snapshotSummary,
    'pulse:provider-benchmarking': pulseDefaults.providerBenchmarking,
    'pulse:events': pulseDefaults.events,
    'pulse:provider-heatmap': pulseDefaults.providerHeatmap,
    'pulse:smart-send': pulseDefaults.smartSend,
    'pulse:market-snapshot': pulseDefaults.marketSnapshot,
    'pulse:true-cost': pulseDefaults.trueCost,
    'pulse:market-depth': pulseDefaults.marketDepth,
    'pulse:arbitrage': pulseDefaults.arbitrage,
    'pulse:bank-comparison': pulseDefaults.bankComparison,
    'pulse:cost-trend': pulseDefaults.costTrend,
  }

  const chartIds = ['all-in-cost', 'fx-markup', 'provider-winner', 'volatility-pulse', 'quote-success', 'market-depth']
  for (const chartId of chartIds) {
    baseEntries[`pulse:chart:${chartId}`] = buildChartData(chartId)
  }

  return baseEntries
}

export const runIngestion = async (options: IngestOptions = {}) => {
  const db = options.pool || createPool(config.db.planeBUrl)
  const shouldClose = !options.pool

  const allowedProviders = new Set(
    rightsMatrix.filter(entry => entry.allowedCollect).map(entry => entry.providerId),
  )

  try {
    await db.query('BEGIN')

    for (const country of countries) {
      await db.query(
        `INSERT INTO silver.countries (code, name, currency)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency`,
        [country.code, country.name, country.currency],
      )
    }

    for (const rights of rightsMatrix) {
      await db.query(
        `INSERT INTO silver.rights_matrix (provider_id, allowed_collect, allowed_b2c, allowed_b2b, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider_id) DO UPDATE SET
           allowed_collect = EXCLUDED.allowed_collect,
           allowed_b2c = EXCLUDED.allowed_b2c,
           allowed_b2b = EXCLUDED.allowed_b2b,
           notes = EXCLUDED.notes,
           updated_at = NOW()`,
        [rights.providerId, rights.allowedCollect, rights.allowedB2c, rights.allowedB2b, rights.notes],
      )
    }

    const stoplistResult = await db.query(
      'SELECT provider_id, stoplist_status FROM silver.rights_matrix',
    )
    const stoplistByProvider = new Map(
      stoplistResult.rows.map(row => [row.provider_id, row.stoplist_status]),
    )

    const circuitResult = await db.query(
      'SELECT provider_id, corridor_id, state, cooldown_until FROM silver.circuit_breaker',
    )

    const now = new Date()
    const isCircuitOpen = (providerId: string, corridorId: string | null) => {
      return circuitResult.rows.some(row => {
        if (row.provider_id !== providerId) return false
        if (row.corridor_id !== null && row.corridor_id !== corridorId) return false
        if (row.state !== 'open') return false
        if (!row.cooldown_until) return true
        return new Date(row.cooldown_until) > now
      })
    }

    const logSkip = (providerId: string, corridorId: string | null, reason: string) => {
      const corridorLabel = corridorId || 'all'
      console.log(`skip provider_id=${providerId} corridor_id=${corridorLabel} reason=${reason}`)
    }

    const ingestionRunIds = new Map<string, string>()

    for (const provider of providers) {
      if (!allowedProviders.has(provider.id)) continue
      const stoplistStatus = stoplistByProvider.get(provider.id) || 'active'
      if (stoplistStatus !== 'active') {
        logSkip(provider.id, null, `stoplist_${stoplistStatus}`)
        continue
      }
      if (isCircuitOpen(provider.id, null)) {
        logSkip(provider.id, null, 'circuit_open')
        continue
      }

      await db.query(
        `INSERT INTO silver.provider (provider_id, display_name)
         VALUES ($1, $2)
         ON CONFLICT (provider_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           updated_at = NOW()`,
        [provider.id, provider.name],
      )

      await db.query(
        `INSERT INTO silver.providers (id, name, logo_url, reliability, methods, best_for, homepage_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           logo_url = EXCLUDED.logo_url,
           reliability = EXCLUDED.reliability,
           methods = EXCLUDED.methods,
           best_for = EXCLUDED.best_for,
           homepage_url = EXCLUDED.homepage_url,
           updated_at = NOW()`,
        [
          provider.id,
          provider.name,
          provider.logoUrl,
          provider.reliability,
          provider.methods,
          provider.bestFor,
          provider.homepageUrl,
        ],
      )

      const ingestionRunResult = await db.query(
        `INSERT INTO silver.ingestion_run (provider_id, collector_type, started_at, finished_at, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING run_id`,
        [provider.id, 'seed', now, now, 'success'],
      )
      if (ingestionRunResult.rows[0]?.run_id) {
        ingestionRunIds.set(provider.id, ingestionRunResult.rows[0].run_id)
      }
    }

    for (const corridor of corridors) {
      await db.query(
        `INSERT INTO silver.corridor (corridor_id, send_currency, receive_currency, send_country, receive_country)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (corridor_id) DO UPDATE SET
           send_currency = EXCLUDED.send_currency,
           receive_currency = EXCLUDED.receive_currency,
           send_country = EXCLUDED.send_country,
           receive_country = EXCLUDED.receive_country,
           updated_at = NOW()`,
        [
          corridor.id,
          corridor.sendCurrency,
          corridor.recvCurrency,
          corridor.fromCountry,
          corridor.toCountry,
        ],
      )

      await db.query(
        `INSERT INTO silver.corridors (id, from_country, to_country, send_currency, recv_currency, label)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           from_country = EXCLUDED.from_country,
           to_country = EXCLUDED.to_country,
           send_currency = EXCLUDED.send_currency,
           recv_currency = EXCLUDED.recv_currency,
           label = EXCLUDED.label,
           updated_at = NOW()`,
        [
          corridor.id,
          corridor.fromCountry,
          corridor.toCountry,
          corridor.sendCurrency,
          corridor.recvCurrency,
          corridor.label,
        ],
      )
    }

    const corridorIds = corridors.map(corridor => corridor.id)
    await db.query('DELETE FROM silver.provider_quotes WHERE corridor_id = ANY($1::text[])', [corridorIds])

    for (const quote of providerQuotes) {
      if (!allowedProviders.has(quote.providerId)) continue
      const stoplistStatus = stoplistByProvider.get(quote.providerId) || 'active'
      if (stoplistStatus !== 'active') {
        logSkip(quote.providerId, quote.corridorId, `stoplist_${stoplistStatus}`)
        continue
      }
      if (isCircuitOpen(quote.providerId, quote.corridorId)) {
        logSkip(quote.providerId, quote.corridorId, 'circuit_open')
        continue
      }

      const ingestionRunId = ingestionRunIds.get(quote.providerId)
      if (!ingestionRunId) {
        logSkip(quote.providerId, quote.corridorId, 'missing_ingestion_run')
        continue
      }

      const sendAmount = 100
      const feeAmount = quote.fee
      const receiveAmount = (sendAmount - feeAmount) * quote.fxRate
      const impliedFxRate = quote.fxRate
      const collectedAt = new Date()
      const ingestedAt = new Date()
      const amountBucket = Math.round(sendAmount)
      const payin = quote.methods[0] || 'bank'
      const payout = quote.methods.includes('cash') ? 'cash' : 'bank'
      const bronzeObjectKey = `provider_raw/${quote.providerId}/${quote.corridorId}/${Date.now()}`

      await db.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, send_amount, fee_amount, receive_amount, implied_fx_rate, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          quote.providerId,
          quote.corridorId,
          sendAmount,
          feeAmount,
          receiveAmount,
          impliedFxRate,
          collectedAt,
          ingestedAt,
          ingestionRunId,
          bronzeObjectKey,
        ],
      )

      await db.query(
        `INSERT INTO silver.latest_quote_by_provider
         (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, receive_amount, implied_fx_rate, quality_flags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (corridor_id, amount_bucket, payin, payout, provider_id) DO UPDATE SET
           collected_at = EXCLUDED.collected_at,
           send_amount = EXCLUDED.send_amount,
           fee_amount = EXCLUDED.fee_amount,
           receive_amount = EXCLUDED.receive_amount,
           implied_fx_rate = EXCLUDED.implied_fx_rate,
           quality_flags = EXCLUDED.quality_flags,
           updated_at = NOW()`,
        [
          quote.corridorId,
          amountBucket,
          payin,
          payout,
          quote.providerId,
          collectedAt,
          sendAmount,
          feeAmount,
          receiveAmount,
          impliedFxRate,
          null,
        ],
      )

      await db.query(
        `INSERT INTO silver.provider_quotes
         (provider_id, corridor_id, fee, margin_pct, fx_rate, delivery, methods, reliability, best_for)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          quote.providerId,
          quote.corridorId,
          quote.fee,
          quote.marginPct,
          quote.fxRate,
          quote.delivery,
          quote.methods,
          quote.reliability,
          quote.bestFor,
        ],
      )

      await db.query(
        `INSERT INTO bronze.provider_raw (provider_id, corridor, payload)
         VALUES ($1, $2, $3)`,
        [
          quote.providerId,
          quote.corridorId,
          {
            providerId: quote.providerId,
            corridorId: quote.corridorId,
            fee: quote.fee,
            marginPct: quote.marginPct,
            fxRate: quote.fxRate,
            delivery: quote.delivery,
            methods: quote.methods,
            reliability: quote.reliability,
          },
        ],
      )
    }

    for (const rate of fxRates) {
      await db.query(
        `INSERT INTO gold.fx_rates (base_currency, quote_currency, rate)
         VALUES ($1, $2, $3)
         ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
           rate = EXCLUDED.rate,
           updated_at = NOW()`,
        [rate.base, rate.quote, rate.rate],
      )
    }

    for (const rate of fxProviderRates) {
      await db.query(
        `INSERT INTO gold.fx_provider_rates (provider_name, base_currency, quote_currency, rate, markup_bps, speed)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (provider_name, base_currency, quote_currency) DO UPDATE SET
           rate = EXCLUDED.rate,
           markup_bps = EXCLUDED.markup_bps,
           speed = EXCLUDED.speed,
           updated_at = NOW()`,
        [rate.providerName, rate.base, rate.quote, rate.rate, rate.markupBps, rate.speed],
      )
    }

    await db.query('DELETE FROM gold.popular_corridors')
    for (const corridor of popularCorridors) {
      await db.query(
        `INSERT INTO gold.popular_corridors (route, count_24h, top_provider, fee_range, speed_range, best_for)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          corridor.route,
          corridor.count24h,
          corridor.topProvider,
          corridor.feeRange,
          corridor.speedRange,
          corridor.bestFor,
        ],
      )
    }

    const cacheEntries = pulseCacheEntries()
    for (const [key, payload] of Object.entries(cacheEntries)) {
      await db.query(
        `INSERT INTO gold.pulse_cache (key, payload)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET
           payload = EXCLUDED.payload,
           updated_at = NOW()`,
        [key, payload],
      )
    }

    await db.query('COMMIT')
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    if (shouldClose) {
      await db.end()
    }
  }
}

if (require.main === module) {
  runIngestion()
    .then(() => {
      console.log('Plane B ingestion complete.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Plane B ingestion failed:', error)
      process.exit(1)
    })
}
