/**
 * Populate provider_corridor_capability with delivery methods for all 24 providers.
 *
 * Reads rights_matrix (source_countries × destination_countries) per provider,
 * crosses them with canonical payin/payout methods from each provider's code-map,
 * and batch-inserts into silver.provider_corridor_capability.
 *
 * Usage:
 *   npx tsx scripts/delivery-methods-apply-local.ts
 *
 * Prerequisites:
 *   - Local Postgres running (docker compose up -d postgres)
 *   - Migrations applied (pnpm db:migrate)
 *   - discovery-apply-local.ts already ran (rights_matrix populated)
 */

/* eslint-disable no-console */

import pg from 'pg'

const DB_URL = process.env.DATABASE_URL ?? 'postgres://remit:remit-local-dev@localhost:5432/remit'

// ── Country → Currency mapping (subset covering all corridors) ────────────────
// Sourced from backend/shared/countries-currencies.ts COUNTRIES array
const COUNTRY_CURRENCY: Record<string, string> = {
  AF: 'AFN', AL: 'ALL', DZ: 'DZD', AS: 'USD', AD: 'EUR', AO: 'AOA', AI: 'XCD',
  AG: 'XCD', AR: 'ARS', AM: 'AMD', AW: 'AWG', AU: 'AUD', AT: 'EUR', AZ: 'AZN',
  BS: 'BSD', BH: 'BHD', BD: 'BDT', BB: 'BBD', BY: 'BYN', BE: 'EUR', BZ: 'BZD',
  BJ: 'XOF', BM: 'BMD', BT: 'BTN', BO: 'BOB', BA: 'BAM', BW: 'BWP', BR: 'BRL',
  VG: 'USD', BN: 'BND', BG: 'BGN', BF: 'XOF', BI: 'BIF', KH: 'KHR', CM: 'XAF',
  CA: 'CAD', CV: 'CVE', KY: 'KYD', CF: 'XAF', TD: 'XAF', CL: 'CLP', CN: 'CNY',
  CO: 'COP', KM: 'KMF', CG: 'XAF', CD: 'CDF', CK: 'NZD', CR: 'CRC', CI: 'XOF',
  HR: 'EUR', CU: 'CUP', CW: 'ANG', CY: 'EUR', CZ: 'CZK', DK: 'DKK', DJ: 'DJF',
  DM: 'XCD', DO: 'DOP', EC: 'USD', EG: 'EGP', SV: 'USD', GQ: 'XAF', ER: 'ERN',
  EE: 'EUR', SZ: 'SZL', ET: 'ETB', FJ: 'FJD', FI: 'EUR', FR: 'EUR', GA: 'XAF',
  GM: 'GMD', GE: 'GEL', DE: 'EUR', GH: 'GHS', GI: 'GIP', GR: 'EUR', GD: 'XCD',
  GT: 'GTQ', GN: 'GNF', GW: 'XOF', GY: 'GYD', HT: 'HTG', HN: 'HNL', HK: 'HKD',
  HU: 'HUF', IS: 'ISK', IN: 'INR', ID: 'IDR', IR: 'IRR', IQ: 'IQD', IE: 'EUR',
  IL: 'ILS', IT: 'EUR', JM: 'JMD', JP: 'JPY', JO: 'JOD', KZ: 'KZT', KE: 'KES',
  KI: 'AUD', KP: 'KPW', KR: 'KRW', KW: 'KWD', KG: 'KGS', LA: 'LAK', LV: 'EUR',
  LB: 'LBP', LS: 'LSL', LR: 'LRD', LY: 'LYD', LI: 'CHF', LT: 'EUR', LU: 'EUR',
  MO: 'MOP', MK: 'MKD', MG: 'MGA', MW: 'MWK', MY: 'MYR', MV: 'MVR', ML: 'XOF',
  MT: 'EUR', MH: 'USD', MR: 'MRU', MU: 'MUR', MX: 'MXN', FM: 'USD', MD: 'MDL',
  MC: 'EUR', MN: 'MNT', ME: 'EUR', MA: 'MAD', MZ: 'MZN', MM: 'MMK', NA: 'NAD',
  NR: 'AUD', NP: 'NPR', NL: 'EUR', NZ: 'NZD', NI: 'NIO', NE: 'XOF', NG: 'NGN',
  NO: 'NOK', OM: 'OMR', PK: 'PKR', PW: 'USD', PA: 'PAB', PG: 'PGK', PY: 'PYG',
  PE: 'PEN', PH: 'PHP', PL: 'PLN', PT: 'EUR', QA: 'QAR', RO: 'RON', RU: 'RUB',
  RW: 'RWF', KN: 'XCD', LC: 'XCD', VC: 'XCD', WS: 'WST', SM: 'EUR', ST: 'STN',
  SA: 'SAR', SN: 'XOF', RS: 'RSD', SC: 'SCR', SL: 'SLE', SG: 'SGD', SK: 'EUR',
  SI: 'EUR', SB: 'SBD', SO: 'SOS', ZA: 'ZAR', SS: 'SSP', ES: 'EUR', LK: 'LKR',
  SD: 'SDG', SR: 'SRD', SE: 'SEK', CH: 'CHF', SY: 'SYP', TW: 'TWD', TJ: 'TJS',
  TZ: 'TZS', TH: 'THB', TL: 'USD', TG: 'XOF', TO: 'TOP', TT: 'TTD', TN: 'TND',
  TR: 'TRY', TM: 'TMT', TC: 'USD', TV: 'AUD', UG: 'UGX', UA: 'UAH', AE: 'AED',
  GB: 'GBP', US: 'USD', UY: 'UYU', UZ: 'UZS', VU: 'VUV', VE: 'VES', VN: 'VND',
  YE: 'YER', ZM: 'ZMW', ZW: 'ZWL', XK: 'EUR',
}

// ── Canonical delivery methods per provider (extracted from code-maps) ────────
type ProviderMethods = { payin: string[]; payout: string[] }

const PROVIDER_METHODS: Record<string, ProviderMethods> = {
  wise: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime'],
  },
  paysend: {
    payin: ['debit_card', 'credit_card', 'bank_transfer', 'apple_pay', 'google_pay'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'debit_card'],
  },
  remitly: {
    payin: ['apple_pay', 'bank_transfer', 'cash', 'credit_card', 'debit_card', 'google_pay'],
    payout: ['bank_deposit', 'cash_pickup', 'home_delivery', 'mobile_wallet', 'debit_card'],
  },
  worldremit: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime'],
  },
  xe: {
    payin: ['bank_transfer'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  transfergo: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime'],
  },
  westernunion: {
    payin: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'apple_pay', 'google_pay'],
    payout: ['cash_pickup', 'bank_deposit', 'home_delivery', 'mobile_wallet', 'debit_card'],
  },
  ria: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  xoom: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash'],
    payout: ['bank_deposit', 'cash_pickup', 'home_delivery', 'mobile_wallet'],
  },
  instarem: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime'],
  },
  sendwave: {
    payin: ['debit_card', 'credit_card', 'bank_transfer'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  wirebarley: {
    payin: ['bank_transfer', 'debit_card', 'credit_card'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  pangea: {
    payin: ['bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  bossmoney: {
    payin: ['credit_card', 'debit_card', 'bank_transfer', 'apple_pay', 'google_pay'],
    payout: ['bank_deposit'],
  },
  dahabshiil: {
    payin: ['cash', 'bank_transfer'],
    payout: ['cash_pickup', 'bank_deposit', 'mobile_wallet'],
  },
  alansari: {
    payin: ['bank_transfer'],
    payout: ['bank_deposit', 'cash_pickup'],
  },
  intermex: {
    payin: ['debit_card', 'credit_card'],
    payout: ['cash_pickup', 'bank_deposit'],
  },
  koronapay: {
    payin: ['debit_card', 'credit_card'],
    payout: ['cash_pickup', 'bank_deposit', 'mobile_wallet'],
  },
  mukuru: {
    payin: ['bank_transfer', 'debit_card', 'credit_card'],
    payout: ['cash_pickup', 'bank_deposit', 'mobile_wallet', 'airtime'],
  },
  orbitremit: {
    payin: ['bank_transfer', 'debit_card', 'credit_card'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  placid: {
    payin: ['debit_card', 'credit_card', 'bank_transfer'],
    payout: ['bank_deposit', 'cash_pickup'],
  },
  remitbee: {
    payin: ['debit_card', 'credit_card', 'bank_transfer'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  singx: {
    payin: ['bank_transfer', 'debit_card', 'credit_card'],
    payout: ['bank_deposit', 'cash_pickup', 'mobile_wallet'],
  },
  wellsfargo: {
    payin: ['bank_transfer'],
    payout: ['bank_deposit'],
  },
}

function getCurrency(countryCode: string): string | null {
  return COUNTRY_CURRENCY[countryCode] ?? null
}

async function main() {
  const pool = new pg.Pool({ connectionString: DB_URL })

  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║  DELIVERY METHODS — Populating provider_corridor_capability  ║')
  console.log(`║  ${new Date().toISOString()}                    ║`)
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log()

  // Load rights_matrix for all providers
  const { rows: matrixRows } = await pool.query(
    `SELECT provider_id, source_countries, destination_countries
     FROM silver.rights_matrix
     ORDER BY provider_id`,
  )

  let totalInserted = 0
  let providersProcessed = 0

  for (const row of matrixRows) {
    const providerId: string = row.provider_id
    const sources: string[] = row.source_countries ?? []
    const destinations: string[] = row.destination_countries ?? []
    const methods = PROVIDER_METHODS[providerId]

    if (!methods) {
      console.log(`  ⏭️  ${providerId.padEnd(14)} — no delivery method data`)
      continue
    }

    if (sources.length === 0 || destinations.length === 0) {
      console.log(`  ⏭️  ${providerId.padEnd(14)} — empty corridors (${sources.length} src, ${destinations.length} dst)`)
      continue
    }

    // Build corridor records
    const corridors: Array<{ corridorId: string; src: string; dst: string }> = []
    for (const src of sources) {
      const srcCurrency = getCurrency(src)
      if (!srcCurrency) continue
      for (const dst of destinations) {
        if (src === dst) continue
        const dstCurrency = getCurrency(dst)
        if (!dstCurrency) continue
        corridors.push({
          corridorId: `${src}-${dst}-${srcCurrency}-${dstCurrency}`,
          src,
          dst,
        })
      }
    }

    if (corridors.length === 0) {
      console.log(`  ⏭️  ${providerId.padEnd(14)} — no valid corridors`)
      continue
    }

    // Batch insert in chunks of 500
    const BATCH_SIZE = 500
    let providerInserted = 0

    for (let i = 0; i < corridors.length; i += BATCH_SIZE) {
      const batch = corridors.slice(i, i + BATCH_SIZE)
      const values: unknown[] = []
      const placeholders: string[] = []
      let paramIdx = 1

      for (const c of batch) {
        placeholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
        )
        values.push(
          providerId,
          c.corridorId,
          `{${methods.payin.join(',')}}`,
          `{${methods.payout.join(',')}}`,
          true,
          'code-map',
        )
      }

      await pool.query(
        `INSERT INTO silver.provider_corridor_capability
           (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
           payin_methods = EXCLUDED.payin_methods,
           payout_methods = EXCLUDED.payout_methods,
           is_supported = true,
           source = CASE
             WHEN silver.provider_corridor_capability.source = 'code-map' THEN 'code-map'
             ELSE silver.provider_corridor_capability.source || '+code-map'
           END,
           last_verified_at = NOW(),
           updated_at = NOW()`,
        values,
      )

      providerInserted += batch.length
    }

    totalInserted += providerInserted
    providersProcessed++

    console.log(
      `  ✅ ${providerId.padEnd(14)} — ${providerInserted} corridors (${sources.length} src × ${destinations.length} dst) | payin: ${methods.payin.length} | payout: ${methods.payout.length}`,
    )
  }

  // Summary
  console.log()
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  DELIVERY METHODS SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Providers processed:        ${providersProcessed}`)
  console.log(`  Total corridor capabilities: ${totalInserted}`)
  console.log()

  // Final state
  const finalState = await pool.query(
    `SELECT provider_id,
            COUNT(*) AS corridors,
            payin_methods[1] IS NOT NULL AS has_payin,
            payout_methods[1] IS NOT NULL AS has_payout,
            COALESCE(array_length(payin_methods, 1), 0) AS payin_count,
            COALESCE(array_length(payout_methods, 1), 0) AS payout_count
     FROM silver.provider_corridor_capability
     GROUP BY provider_id, payin_methods, payout_methods
     ORDER BY corridors DESC`,
  )

  console.log('  Provider        Corridors  Payin#  Payout#')
  console.log('  ─────────────── ───────── ─────── ────────')
  for (const r of finalState.rows) {
    console.log(
      `  ${r.provider_id.padEnd(16)} ${String(r.corridors).padStart(8)}  ${String(r.payin_count).padStart(6)}  ${String(r.payout_count).padStart(7)}`,
    )
  }

  // Method coverage summary
  const methodCoverage = await pool.query(
    `SELECT
       unnest(payin_methods) AS method, 'payin' AS type, COUNT(*) AS corridors
     FROM silver.provider_corridor_capability
     GROUP BY method
     UNION ALL
     SELECT
       unnest(payout_methods) AS method, 'payout' AS type, COUNT(*) AS corridors
     FROM silver.provider_corridor_capability
     GROUP BY method
     ORDER BY type, corridors DESC`,
  )

  console.log()
  console.log('  METHOD COVERAGE (across all corridors):')
  console.log('  Type    Method            Corridors')
  console.log('  ─────── ───────────────── ─────────')
  for (const r of methodCoverage.rows) {
    console.log(
      `  ${r.type.padEnd(8)} ${r.method.padEnd(18)} ${String(r.corridors).padStart(8)}`,
    )
  }

  await pool.end()
  console.log()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
