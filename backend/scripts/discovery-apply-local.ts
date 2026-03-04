/**
 * Apply discovery dry-run results to local database.
 *
 * Reads the JSON output from discovery-dry-run.ts, merges discovered
 * destination countries with existing rights_matrix, and writes updates.
 * Also infers source countries from provider configurations.
 *
 * Usage:
 *   npx tsx scripts/discovery-apply-local.ts
 *
 * Prerequisites:
 *   - Local Postgres running (docker compose up -d postgres)
 *   - Migrations applied (pnpm db:migrate)
 *   - discovery-dry-run.ts already ran (generates discovery-results.json)
 */

/* eslint-disable no-console */

import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DB_URL = process.env.DATABASE_URL ?? 'postgres://remit:remit-local-dev@localhost:5432/remit'

// Provider → all known source countries (from discovery scripts)
const PROVIDER_SOURCES: Record<string, string[]> = {
  wise: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'PT', 'IE', 'SG', 'HK', 'JP', 'BR', 'NZ'],
  paysend: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'IE'],
  remitly: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT', 'SE', 'NO', 'DK', 'SG'],
  worldremit: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'SE', 'NO', 'DK', 'FI', 'NZ'],
  xe: ['US', 'GB', 'CA', 'AU', 'NZ', 'SG', 'HK', 'DE', 'FR', 'ES', 'IT'],
  transfergo: ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'PL', 'LT', 'LV', 'EE', 'SE', 'NO', 'DK', 'FI', 'CZ', 'HU', 'RO', 'BG', 'HR', 'GR', 'CY', 'LU', 'MT', 'SK', 'SI', 'PT'],
  westernunion: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE'],
  ria: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT'],
  xoom: ['US', 'GB', 'CA', 'AU', 'DE', 'FR'],
  instarem: ['SG', 'AU', 'HK', 'MY', 'IN', 'GB', 'US', 'CA', 'DE', 'FR', 'NL', 'BE', 'AT', 'IE', 'FI', 'PT', 'ES', 'IT', 'LU'],
  sendwave: ['US', 'GB', 'CA', 'IE', 'IT', 'FR', 'ES'],
  wirebarley: ['KR'],
  pangea: ['US'],
  bossmoney: ['US'],
  dahabshiil: ['US', 'GB', 'HR', 'GR', 'AT', 'BG', 'FI', 'ES', 'BE', 'NL', 'DE', 'NO', 'DK', 'SE', 'IT', 'IE', 'FR', 'CH', 'PT', 'CA'],
  alansari: ['AE'],
  intermex: ['US'],
  koronapay: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'GR', 'PT', 'CZ', 'PL'],
  mukuru: ['US', 'GB', 'ZA', 'BW', 'KE', 'LS', 'MW', 'RW', 'UG', 'ZM', 'ZW'],
  orbitremit: ['AU', 'NZ', 'GB'],
  placid: ['US'],
  remitbee: ['CA'],
  singx: ['SG'],
  wellsfargo: ['US'],
}

type DryRunResult = {
  providerId: string
  sourceCountry: string
  destinations: string[]
  destinationCount: number
  method: 'api' | 'static_fallback' | 'error'
  error?: string
}

async function main() {
  // Read dry-run results
  const resultsPath = resolve(process.cwd(), 'scripts', 'discovery-results.json')
  let results: DryRunResult[]
  try {
    results = JSON.parse(readFileSync(resultsPath, 'utf-8'))
  } catch {
    console.error('❌ No discovery-results.json found. Run discovery-dry-run.ts first.')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: DB_URL })

  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║       DISCOVERY APPLY — Updating local rights_matrix         ║')
  console.log(`║       ${new Date().toISOString()}                    ║`)
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log()

  let totalSourcesAdded = 0
  let totalDestsAdded = 0
  let providersUpdated = 0

  for (const result of results) {
    if (result.error || result.destinationCount === 0) {
      console.log(`  ⏭️  ${result.providerId.padEnd(14)} — skipped (${result.error ? 'error' : 'no data'})`)
      continue
    }

    const providerId = result.providerId

    // Load existing
    const existing = await pool.query(
      `SELECT source_countries, destination_countries
       FROM silver.rights_matrix WHERE provider_id = $1`,
      [providerId],
    )

    const existingSources: string[] = existing.rows[0]?.source_countries ?? []
    const existingDests: string[] = existing.rows[0]?.destination_countries ?? []

    // Merge source countries from provider config + dry-run source
    const providerSources = PROVIDER_SOURCES[providerId] ?? [result.sourceCountry]
    const mergedSources = [...new Set([...existingSources, ...providerSources])].sort()

    // Merge destination countries
    const mergedDests = [...new Set([...existingDests, ...result.destinations])].sort()

    // Compute deltas
    const existingSourceSet = new Set(existingSources)
    const existingDestSet = new Set(existingDests)
    const newSources = mergedSources.filter((c) => !existingSourceSet.has(c))
    const newDests = mergedDests.filter((c) => !existingDestSet.has(c))

    if (newSources.length === 0 && newDests.length === 0) {
      console.log(`  ✅ ${providerId.padEnd(14)} — no changes needed`)
      continue
    }

    // Upsert
    await pool.query(
      `INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider_id) DO UPDATE SET
         source_countries = $2,
         destination_countries = $3,
         updated_at = NOW(),
         last_audited_at = NOW()`,
      [providerId, mergedSources, mergedDests],
    )

    totalSourcesAdded += newSources.length
    totalDestsAdded += newDests.length
    providersUpdated++

    console.log(
      `  ✅ ${providerId.padEnd(14)} — +${newSources.length} sources, +${newDests.length} dests → ${mergedSources.length} src / ${mergedDests.length} dst total`,
    )
    if (newSources.length > 0) {
      console.log(`     New sources: ${newSources.join(', ')}`)
    }
    if (newDests.length > 0 && newDests.length <= 20) {
      console.log(`     New dests:   ${newDests.join(', ')}`)
    } else if (newDests.length > 20) {
      console.log(`     New dests:   ${newDests.slice(0, 20).join(', ')} ... and ${newDests.length - 20} more`)
    }
  }

  // Summary
  console.log()
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  APPLY SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Providers updated:       ${providersUpdated}`)
  console.log(`  Total source countries:  +${totalSourcesAdded}`)
  console.log(`  Total dest countries:    +${totalDestsAdded}`)

  // Print final state
  console.log()
  console.log('  FINAL RIGHTS MATRIX STATE:')
  console.log('  Provider        Sources  Destinations')
  console.log('  ─────────────── ─────── ────────────')
  const finalState = await pool.query(
    `SELECT provider_id,
            COALESCE(array_length(source_countries, 1), 0) AS src,
            COALESCE(array_length(destination_countries, 1), 0) AS dst
     FROM silver.rights_matrix
     ORDER BY dst DESC, provider_id`,
  )
  for (const row of finalState.rows) {
    console.log(`  ${row.provider_id.padEnd(16)} ${String(row.src).padStart(6)}  ${String(row.dst).padStart(11)}`)
  }

  await pool.end()
  console.log()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
