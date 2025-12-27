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

    for (const provider of providers) {
      if (!allowedProviders.has(provider.id)) continue
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
    }

    for (const corridor of corridors) {
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
