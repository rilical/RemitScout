/**
 * Discovery dry-run — tests provider API probes without a database.
 *
 * Directly instantiates each provider's discovery class and calls its
 * discoverDestinationCountries() method for a representative source country.
 * No DB writes, no scan records — just raw API probing.
 *
 * Usage:
 *   npx tsx scripts/discovery-dry-run.ts [provider1,provider2,...]
 *   npx tsx scripts/discovery-dry-run.ts           # all providers
 *   npx tsx scripts/discovery-dry-run.ts wise,singx # specific providers
 */

/* eslint-disable no-console */

// Provider configs: providerId → { factory, sourceCountries, sampleSource }
type ProviderConfig = {
  factory: () => Promise<any>
  sampleSource: string
}

const PROVIDERS: Record<string, ProviderConfig> = {
  wise: { factory: async () => (await import('../plane-b/src/discovery/providers/wise')).WiseDiscovery, sampleSource: 'US' },
  paysend: { factory: async () => (await import('../plane-b/src/discovery/providers/paysend')).PaysendDiscovery, sampleSource: 'US' },
  remitly: { factory: async () => (await import('../plane-b/src/discovery/providers/remitly')).RemitlyDiscovery, sampleSource: 'US' },
  worldremit: { factory: async () => (await import('../plane-b/src/discovery/providers/worldremit')).WorldRemitDiscovery, sampleSource: 'US' },
  xe: { factory: async () => (await import('../plane-b/src/discovery/providers/xe')).XeDiscovery, sampleSource: 'US' },
  transfergo: { factory: async () => (await import('../plane-b/src/discovery/providers/transfergo')).TransferGoDiscovery, sampleSource: 'GB' },
  westernunion: { factory: async () => (await import('../plane-b/src/discovery/providers/westernunion')).WesternUnionDiscovery, sampleSource: 'US' },
  ria: { factory: async () => (await import('../plane-b/src/discovery/providers/ria')).RiaDiscovery, sampleSource: 'US' },
  xoom: { factory: async () => (await import('../plane-b/src/discovery/providers/xoom')).XoomDiscovery, sampleSource: 'US' },
  instarem: { factory: async () => (await import('../plane-b/src/discovery/providers/instarem')).InstaremDiscovery, sampleSource: 'SG' },
  sendwave: { factory: async () => (await import('../plane-b/src/discovery/providers/sendwave')).SendwaveDiscovery, sampleSource: 'US' },
  wirebarley: { factory: async () => (await import('../plane-b/src/discovery/providers/wirebarley')).WireBarleyDiscovery, sampleSource: 'KR' },
  pangea: { factory: async () => (await import('../plane-b/src/discovery/providers/pangea')).PangeaDiscovery, sampleSource: 'US' },
  bossmoney: { factory: async () => (await import('../plane-b/src/discovery/providers/bossmoney')).BossMoneyDiscovery, sampleSource: 'US' },
  dahabshiil: { factory: async () => (await import('../plane-b/src/discovery/providers/dahabshiil')).DahabshiilDiscovery, sampleSource: 'GB' },
  alansari: { factory: async () => (await import('../plane-b/src/discovery/providers/alansari')).AlAnsariDiscovery, sampleSource: 'AE' },
  intermex: { factory: async () => (await import('../plane-b/src/discovery/providers/intermex')).IntermexDiscovery, sampleSource: 'US' },
  koronapay: { factory: async () => (await import('../plane-b/src/discovery/providers/koronapay')).KoronaPayDiscovery, sampleSource: 'DE' },
  mukuru: { factory: async () => (await import('../plane-b/src/discovery/providers/mukuru')).MukuruDiscovery, sampleSource: 'GB' },
  orbitremit: { factory: async () => (await import('../plane-b/src/discovery/providers/orbitremit')).OrbitRemitDiscovery, sampleSource: 'AU' },
  placid: { factory: async () => (await import('../plane-b/src/discovery/providers/placid')).PlacidDiscovery, sampleSource: 'US' },
  remitbee: { factory: async () => (await import('../plane-b/src/discovery/providers/remitbee')).RemitBeeDiscovery, sampleSource: 'CA' },
  singx: { factory: async () => (await import('../plane-b/src/discovery/providers/singx')).SingXDiscovery, sampleSource: 'SG' },
  wellsfargo: { factory: async () => (await import('../plane-b/src/discovery/providers/wellsfargo')).WellsFargoDiscovery, sampleSource: 'US' },
}

// Stub browser that returns empty content (we only test API-based discovery)
// page() throws so providers fall back to static corridor lists
const stubBrowser = {
  content: async () => '',
  goto: async () => ({ blocked: false, robotsDisallowed: false }),
  close: async () => {},
  screenshot: async () => Buffer.from(''),
  page: () => { throw new Error('No Playwright browser in dry-run mode') },
}

type ProviderResult = {
  providerId: string
  sourceCountry: string
  destinations: string[]
  destinationCount: number
  method: 'api' | 'static_fallback' | 'error'
  durationMs: number
  error?: string
}

async function probeProvider(providerId: string, config: ProviderConfig): Promise<ProviderResult> {
  const start = Date.now()
  try {
    const DiscoveryClass = await config.factory()
    const instance = new DiscoveryClass()

    // Access protected method via any cast (dry-run only)
    const destinations: string[] = await (instance as any).discoverDestinationCountries(
      stubBrowser,
      config.sampleSource,
    )

    return {
      providerId,
      sourceCountry: config.sampleSource,
      destinations,
      destinationCount: destinations.length,
      method: 'api',
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return {
      providerId,
      sourceCountry: config.sampleSource,
      destinations: [],
      destinationCount: 0,
      method: 'error',
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  const filterArg = process.argv[2]
  const providerIds = filterArg
    ? filterArg.split(',').map((id) => id.trim()).filter((id) => PROVIDERS[id])
    : Object.keys(PROVIDERS)

  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║       DISCOVERY DRY-RUN — API PROBE TEST (no database)      ║')
  console.log(`║       Testing ${providerIds.length} providers                                   ║`)
  console.log(`║       ${new Date().toISOString()}                    ║`)
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log()

  const results: ProviderResult[] = []
  let totalCorridors = 0

  for (const providerId of providerIds) {
    const config = PROVIDERS[providerId]
    if (!config) continue

    process.stdout.write(`  ⏳ ${providerId.padEnd(14)} (${config.sampleSource}) ... `)

    const result = await probeProvider(providerId, config)
    results.push(result)

    if (result.error) {
      console.log(`❌ ERROR: ${result.error.slice(0, 60)} (${result.durationMs}ms)`)
    } else {
      totalCorridors += result.destinationCount
      const flag = result.destinationCount > 0 ? '✅' : '⚠️'
      console.log(`${flag} ${result.destinationCount} destinations (${result.durationMs}ms)`)
    }

    // 1s delay between providers to be polite
    if (providerIds.indexOf(providerId) < providerIds.length - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // Summary
  console.log()
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')

  const successful = results.filter((r) => r.destinationCount > 0)
  const noData = results.filter((r) => r.destinationCount === 0 && !r.error)
  const errored = results.filter((r) => r.error)

  console.log(`  Total providers tested: ${results.length}`)
  console.log(`  Successful (>0 dests):  ${successful.length}`)
  console.log(`  No data returned:       ${noData.length}`)
  console.log(`  Errors:                 ${errored.length}`)
  console.log(`  Total destinations:     ${totalCorridors}`)
  console.log()

  // Detailed results table
  console.log('  Provider        Source  Dests  Time     Status')
  console.log('  ─────────────── ────── ────── ──────── ──────────')
  for (const r of results.sort((a, b) => b.destinationCount - a.destinationCount)) {
    const status = r.error ? `ERR: ${r.error.slice(0, 30)}` : r.destinationCount > 0 ? 'OK' : 'NO DATA'
    console.log(
      `  ${r.providerId.padEnd(16)} ${r.sourceCountry.padEnd(6)} ${String(r.destinationCount).padStart(5)}  ${String(r.durationMs + 'ms').padStart(8)}  ${status}`,
    )
  }

  // Show discovered destinations per provider
  console.log()
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  DISCOVERED DESTINATIONS PER PROVIDER')
  console.log('═══════════════════════════════════════════════════════════════')
  for (const r of successful.sort((a, b) => b.destinationCount - a.destinationCount)) {
    console.log(`\n  ${r.providerId} (${r.sourceCountry} → ${r.destinationCount} destinations):`)
    console.log(`    ${r.destinations.join(', ')}`)
  }

  // Write JSON results for the apply script
  const { writeFileSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  const jsonPath = resolve(process.cwd(), 'scripts/discovery-results.json')
  writeFileSync(jsonPath, JSON.stringify(results, null, 2))
  console.log(`\n  📁 Results saved to: ${jsonPath}`)

  console.log()
  process.exit(errored.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
