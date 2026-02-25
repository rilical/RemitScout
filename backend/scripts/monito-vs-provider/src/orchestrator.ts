import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

import { PRECONFIGURED_PROVIDERS, DEFAULT_CONFIG, createProviderConfig } from './config'
import {
  type ProviderConfig,
  type OrchestratorRunConfig,
  type CorridorConfig,
  type CanonicalProviderIdentity,
  type MonitoSnapshot,
  type RunTickResult,
  type RunEvidence,
  type ProviderMethodEvidence,
  type DiscoverMonitoResult,
  type ProviderMethodEvidenceState,
} from './schema'
import { MonitoClient, mapMonitoSnapshotToRows } from './monitoClient'
import { collectProviderSnapshot, closeProvidersRuntime } from './providers'
import {
  parseCorridorArg,
  parsePositiveNumberList,
  toSortedUniqueAmounts,
  loadCanonicalProviderCatalog,
  parseBoolean,
  detectRepoRoot,
  ensureDirectory,
  ensureCsvHeader,
  appendCsvRows,
  fileNameSafe,
} from './utils'

const MONITO_HEADERS = [
  'run_id',
  'timestamp',
  'from_country',
  'to_country',
  'from_currency',
  'to_currency',
  'amount',
  'comparison_id',
  'mid_market_rate',
  'amount_usd',
  'provider_slug',
  'provider_name',
  'monito_rate',
  'monito_fee',
  'monito_total_received',
  'monito_rank',
  'monito_is_best',
  'monito_method',
  'monito_status',
  'monito_error',
  'raw_graphql_json_path',
] as const

const PROVIDER_HEADERS = [
  'run_id',
  'timestamp',
  'provider_slug',
  'provider_label',
  'from_currency',
  'to_currency',
  'from_country',
  'to_country',
  'amount',
  'provider_effective_rate',
  'provider_fee',
  'provider_total_received',
  'method',
  'status',
  'error',
  'raw',
] as const

interface RunState {
  runId: string
  config: OrchestratorRunConfig
  monitoClient: MonitoClient
  providers: ProviderConfig[]
  evidence: RunEvidence
  rawGraphqlDir: string
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const runWithConcurrency = async <I, O>(
  items: I[],
  maxConcurrency: number,
  task: (item: I) => Promise<O>,
): Promise<O[]> => {
  const limit = Math.max(1, Math.min(maxConcurrency, items.length))
  const results = new Array<O>(items.length)
  let cursor = 0

  const worker = async (): Promise<void> => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await task(items[index] as I)
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()))
  return results
}

const isApiCollectorPresent = (repoRoot: string, slug: string): boolean => {
  const providerDir = path.join(repoRoot, 'backend/plane-b/src/providers', slug)
  const candidates = [
    'fetch.ts',
    'collector.ts',
    'fetch/index.ts',
    `${slug}.ts`,
  ].map((file) => path.join(providerDir, file))

  return candidates.some((candidate) => existsSync(candidate))
}

const catalogBySlug = (catalog: CanonicalProviderIdentity[]): Map<string, CanonicalProviderIdentity> => {
  const map = new Map<string, CanonicalProviderIdentity>()
  for (const provider of catalog) {
    map.set(provider.slug, provider)
  }
  return map
}

const labelForSlug = (catalog: Map<string, CanonicalProviderIdentity>, slug: string): string => {
  return catalog.get(slug)?.label || slug
}

export const discoverMonitoProviders = async (
  corridor: CorridorConfig,
  amounts: number[],
  config: OrchestratorRunConfig,
  rawGraphqlDir: string,
): Promise<DiscoverMonitoResult> => {
  const monitoClient = new MonitoClient({
    config: {
      monitoBaseUrl: config.monitoBaseUrl,
      timeoutMs: config.monitoTimeoutMs,
      headless: config.headlessBrowser,
    },
  })

  try {
    const snapshots: MonitoSnapshot[] = []
    const seen = new Map<string, number>()

    const tasks = toSortedUniqueAmounts(amounts).map((amount) => async () => {
      return monitoClient.captureSnapshotWithRetry(
        corridor,
        amount,
        config.runId ?? randomUUID(),
        rawGraphqlDir,
        config.providerRetryCount,
        500,
      )
    })

    const results = await runWithConcurrency(tasks, Math.max(1, config.maxConcurrency), (task) => task())

    for (const snapshot of results) {
      snapshots.push(snapshot)
      for (const quote of snapshot.providerQuotes) {
        if (!quote.pspSlug) continue
        if (!seen.has(quote.pspSlug)) seen.set(quote.pspSlug, seen.size)
      }
    }

    return {
      snapshots,
      seenProviderSlugs: Array.from(seen.keys()),
    }
  } finally {
    await monitoClient.close().catch(() => undefined)
  }
}

const probeProvider = async (
  config: ProviderConfig,
  corridor: CorridorConfig,
  amount: number,
  runId: string,
  evidence: ProviderMethodEvidence,
): Promise<{ provider: ProviderConfig; status: ProviderMethodEvidenceState }> => {
  const now = new Date().toISOString()

  if (config.method === 'api') {
    if (!config.api.enabled || !config.api.endpoint) {
      evidence.status = 'API_ACCESS_REQUESTED'
      evidence.evidence.push('API method configured without endpoint')
      return { provider: { ...config, enabled: false }, status: evidence.status }
    }

    try {
      const apiSnapshot = await collectProviderSnapshot(config, corridor, amount, now, runId, false)
      if (
        apiSnapshot.effectiveRate === null
        && apiSnapshot.totalReceived === null
        && apiSnapshot.fee === null
      ) {
        throw new Error('API returned no usable values')
      }

      evidence.status = 'API_VERIFIED'
      evidence.evidence.push('API probe succeeded')
      return { provider: { ...config, enabled: true }, status: evidence.status }
    } catch (error) {
      evidence.status = 'API_ATTEMPTED_FAILED'
      evidence.evidence.push(error instanceof Error ? error.message : String(error))

      if (config.scrape.enabled) {
        try {
          const scrapeSnapshot = await collectProviderSnapshot(
            { ...config, method: 'scrape' },
            corridor,
            amount,
            now,
            runId,
            false,
          )

          if (
            scrapeSnapshot.effectiveRate === null
            && scrapeSnapshot.totalReceived === null
            && scrapeSnapshot.fee === null
          ) {
            throw new Error('Scrape fallback returned no usable values')
          }

          evidence.status = 'SCRAPE_REQUIRED'
          evidence.evidence.push('API failed; scrape probe succeeded')
          return { provider: { ...config, method: 'scrape', enabled: true }, status: evidence.status }
        } catch (scrapeError) {
          evidence.status = 'SCRAPE_FAILED'
          evidence.evidence.push(`Scrape fallback failed: ${scrapeError instanceof Error ? scrapeError.message : String(scrapeError)}`)
          return { provider: { ...config, enabled: false }, status: evidence.status }
        }
      }

      return { provider: { ...config, enabled: false }, status: evidence.status }
    }
  }

  if (!config.scrape.enabled || !config.scrape.urlTemplate) {
    evidence.status = 'API_ACCESS_REQUESTED'
    evidence.evidence.push('Scrape method configured without stable selector/template')
    return { provider: { ...config, enabled: false }, status: evidence.status }
  }

  try {
    const scrapeSnapshot = await collectProviderSnapshot(config, corridor, amount, now, runId, false)
    if (scrapeSnapshot.effectiveRate === null && scrapeSnapshot.totalReceived === null && scrapeSnapshot.fee === null) {
      throw new Error('Scrape returned no usable values')
    }

    evidence.status = 'SCRAPE_REQUIRED'
    evidence.evidence.push('Scrape probe succeeded')
    return { provider: { ...config, enabled: true }, status: evidence.status }
  } catch (error) {
    evidence.status = 'SCRAPE_FAILED'
    evidence.evidence.push(error instanceof Error ? error.message : String(error))
    return { provider: { ...config, enabled: false }, status: evidence.status }
  }
}

export const classifyProviders = async (
  monitoProviderSlugs: string[],
  catalog: CanonicalProviderIdentity[],
  config: OrchestratorRunConfig,
): Promise<{
  providers: ProviderConfig[]
  evidence: ProviderMethodEvidence[]
  catalogMismatch: string[]
  discoveredEnabledCount: number
}> => {
  const repoRoot = detectRepoRoot(process.cwd())
  const catalogMap = catalogBySlug(catalog)
  const configured = new Map<string, ProviderConfig>()

  for (const provider of PRECONFIGURED_PROVIDERS.concat(config.providers || [])) {
    configured.set(provider.slug, provider)
  }

  const evidenceRows: ProviderMethodEvidence[] = []
  const providers: ProviderConfig[] = []
  const catalogMismatch: string[] = []

  const sampleAmount = config.amounts[0] ?? 100
  const sampleCorridor = config.corridor
  const runId = config.runId ?? randomUUID()

  for (const [index, slug] of monitoProviderSlugs.entries()) {
    const existing = configured.get(slug)
    const hasApiCollector = isApiCollectorPresent(repoRoot, slug)
    const defaultMethod: ProviderConfig['method'] = hasApiCollector ? 'api' : 'scrape'

    const base = existing
      ? { ...existing }
      : createProviderConfig(slug, labelForSlug(catalogMap, slug), {
          method: defaultMethod,
          api: {
            enabled: hasApiCollector,
          },
          scrape: {
            enabled: !hasApiCollector,
            urlTemplate: !hasApiCollector ? `https://${slug}.com` : null,
          },
          source: 'discovery',
        })
    base.maxRetries = base.maxRetries ?? config.providerRetryCount

    base.discoveredIndex = index
    base.source = 'discovery'

    if (base.method === 'api' && !hasApiCollector) {
      base.method = 'scrape'
      base.api.enabled = false
      base.scrape.enabled = true
    }

    if (!catalogMap.has(slug)) catalogMismatch.push(slug)

    const row: ProviderMethodEvidence = {
      slug,
      monitoSeen: true,
      methodAssigned: base.method,
      evidence: [],
      status: 'PENDING',
    }

    const probed = await probeProvider(base, sampleCorridor, sampleAmount, runId, row).catch((error) => {
      row.status = 'API_ACCESS_REQUESTED'
      row.evidence.push(error instanceof Error ? error.message : String(error))
      return { provider: { ...base, enabled: false }, status: row.status as ProviderMethodEvidenceState }
    })

    row.methodAssigned = probed.provider.method
    providers.push(probed.provider)
    evidenceRows.push(row)
  }

  const sorted = providers.slice().sort((left, right) => {
    const leftIndex = left.discoveredIndex ?? 0
    const rightIndex = right.discoveredIndex ?? 0
    if (leftIndex !== rightIndex) return leftIndex - rightIndex
    return left.slug.localeCompare(right.slug)
  })

  const enabled = sorted.filter((entry) => entry.enabled)

  if (config.topNProviders && config.topNProviders > 0) {
    enabled.slice(config.topNProviders).forEach((entry) => {
      entry.enabled = false
      const row = evidenceRows.find((item) => item.slug === entry.slug)
      if (!row) return
      row.evidence.push(`Disabled by topNProviders=${config.topNProviders}`)
      if (row.status === 'PENDING') row.status = 'API_ACCESS_REQUESTED'
    })
  }

  return {
    providers: sorted,
    evidence: evidenceRows,
    catalogMismatch: [...new Set(catalogMismatch)],
    discoveredEnabledCount: sorted.filter((entry) => entry.enabled).length,
  }
}

const toMonitoRows = (
  tick: RunTickResult,
  runId: string,
): Array<Record<string, string | number | boolean | null>> => {
  if (!tick.monito) {
    return [
      {
        run_id: runId,
        timestamp: new Date().toISOString(),
        from_country: '',
        to_country: '',
        from_currency: '',
        to_currency: '',
        amount: tick.amount,
        comparison_id: null,
        mid_market_rate: null,
        amount_usd: null,
        provider_slug: 'none',
        provider_name: 'none',
        monito_rate: null,
        monito_fee: null,
        monito_total_received: null,
        monito_rank: null,
        monito_is_best: false,
        monito_method: 'monito',
        monito_status: 'error',
        monito_error: tick.monitoError ?? 'Monito capture failed',
        raw_graphql_json_path: null,
      },
    ]
  }

  return mapMonitoSnapshotToRows(
    tick.monito,
    runId,
    tick.monito.rawGraphqlArchivePath ?? null,
    'ok',
    tick.monitoError ?? null,
  ).map((row) => ({
    ...row,
    monito_status: row.monito_status ?? 'ok',
    monito_error: row.monito_error ?? null,
  }))
}

const toProviderRows = (
  tick: RunTickResult,
  runId: string,
): Array<Record<string, string | number | boolean | null>> => {
  const rows: Array<Record<string, string | number | boolean | null>> = []
  const seen = new Set<string>()

  for (const snapshot of tick.providerSnapshots) {
    seen.add(snapshot.providerSlug)

    rows.push({
      run_id: runId,
      timestamp: snapshot.timestamp,
      provider_slug: snapshot.providerSlug,
      provider_label: snapshot.providerLabel,
      from_currency: snapshot.fromCurrency,
      to_currency: snapshot.toCurrency,
      from_country: snapshot.corridorFromCountry,
      to_country: snapshot.corridorToCountry,
      amount: snapshot.amount,
      provider_effective_rate: snapshot.effectiveRate,
      provider_fee: snapshot.fee,
      provider_total_received: snapshot.totalReceived,
      method: snapshot.method,
      status: 'ok',
      error: null,
      raw: snapshot.raw === null || snapshot.raw === undefined ? '' : JSON.stringify(snapshot.raw),
    })
  }

  for (const item of tick.providerErrors) {
    if (seen.has(item.slug)) continue

    rows.push({
      run_id: runId,
      timestamp: new Date().toISOString(),
      provider_slug: item.slug,
      provider_label: item.slug,
      from_currency: '',
      to_currency: '',
      from_country: '',
      to_country: '',
      amount: tick.amount,
      provider_effective_rate: null,
      provider_fee: null,
      provider_total_received: null,
      method: 'unknown',
      status: 'error',
      error: item.error,
      raw: '',
    })
  }

  return rows
}

export const runTick = async (
  runState: RunState,
  corridor: CorridorConfig,
  amount: number,
): Promise<RunTickResult> => {
  const timestamp = new Date().toISOString()

  const enabledProviders = runState.providers.filter((provider) => provider.enabled)

  const providerTasks = enabledProviders.map((provider) => async () => {
    try {
      const providerSnapshot = await collectProviderSnapshot(
        provider,
        corridor,
        amount,
        timestamp,
        runState.runId,
        runState.config.headlessBrowser,
      )
      return { providerSlug: provider.slug, snapshot: providerSnapshot, error: null }
    } catch (error) {
      return {
        providerSlug: provider.slug,
        snapshot: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  const providerWorkerConcurrency = Math.max(1, Math.floor(runState.config.maxConcurrency / 2))

  const [providerResults, monitoResult] = await Promise.all([
    runWithConcurrency(providerTasks, providerWorkerConcurrency, (task) => task()),
      runState.monitoClient
      .captureSnapshotWithRetry(
        corridor,
        amount,
        runState.runId,
        runState.rawGraphqlDir,
        runState.config.providerRetryCount,
        500,
      )
      .then(
        (snapshot) => ({ status: 'ok' as const, snapshot }),
        (error) => ({ status: 'error' as const, error: error instanceof Error ? error.message : String(error) }),
      ),
  ])

  const result: RunTickResult = {
    amount,
    providerSnapshots: [],
    providerErrors: [],
  }

  for (const providerResult of providerResults) {
    if (providerResult.snapshot) {
      result.providerSnapshots.push(providerResult.snapshot)
    } else {
      result.providerErrors.push({ slug: providerResult.providerSlug, error: providerResult.error ?? 'provider capture failed' })
    }
  }

  if (monitoResult.status === 'ok') {
    result.monito = monitoResult.snapshot
  } else {
    result.monitoError = monitoResult.error
  }

  return result
}

const toSortedProviders = (providers: ProviderConfig[]): ProviderConfig[] => {
  const byIndex = providers.slice().sort((left, right) => {
    const leftIndex = left.discoveredIndex ?? Number.MAX_SAFE_INTEGER
    const rightIndex = right.discoveredIndex ?? Number.MAX_SAFE_INTEGER

    if (leftIndex !== rightIndex) return leftIndex - rightIndex
    if (left.enabled !== right.enabled) return left.enabled ? -1 : 1
    return left.slug.localeCompare(right.slug)
  })

  return byIndex
}

export const runExperiment = async (
  inputConfig: OrchestratorRunConfig,
): Promise<{ runId: string; evidencePath: string }> => {
  const config: OrchestratorRunConfig = {
    ...DEFAULT_CONFIG,
    ...inputConfig,
    runId: inputConfig.runId ?? randomUUID(),
    amounts: toSortedUniqueAmounts(inputConfig.amounts),
  }

  const repoRoot = detectRepoRoot(process.cwd())
  const runId = config.runId as string
  const outputDir = path.resolve(repoRoot, config.outputDir)
  const rawGraphqlDir = path.join(outputDir, 'raw-graphql', runId)
  const monitoCsvPath = path.join(outputDir, 'monito_snapshots.csv')
  const providerCsvPath = path.join(outputDir, 'provider_snapshots.csv')
  const evidencePath = path.join(outputDir, `${fileNameSafe(runId)}-manifest.json`)

  await ensureDirectory(outputDir)
  await ensureDirectory(rawGraphqlDir)
  await ensureCsvHeader(monitoCsvPath, MONITO_HEADERS)
  await ensureCsvHeader(providerCsvPath, PROVIDER_HEADERS)

  const evidence: RunEvidence = {
    runId,
    corridor: config.corridor,
    startedAt: new Date().toISOString(),
    amounts: config.amounts,
    discoveredProviders: [],
    catalogMismatch: [],
    providerMethodReport: [],
  }

  const runState: RunState = {
    runId,
    config,
    monitoClient: new MonitoClient({
      config: {
        monitoBaseUrl: config.monitoBaseUrl,
        timeoutMs: config.monitoTimeoutMs,
        headless: config.headlessBrowser,
      },
    }),
    providers: [],
    evidence,
    rawGraphqlDir,
  } as RunState

  try {
    const catalog = await loadCanonicalProviderCatalog(repoRoot)

    const discovery = await discoverMonitoProviders(config.corridor, config.amounts, config, rawGraphqlDir)
    evidence.discoveredProviders = discovery.seenProviderSlugs

    const classified = await classifyProviders(discovery.seenProviderSlugs, catalog, {
      ...config,
      runId,
    })

    evidence.providerMethodReport = classified.evidence
    evidence.catalogMismatch = classified.catalogMismatch
    runState.providers = toSortedProviders(classified.providers)

    const intervalMs = config.intervalSeconds * 1000
    const stopAt = Date.now() + config.runDurationMinutes * 60_000

    while (Date.now() < stopAt) {
      const tickStartedAt = Date.now()

      const tickResults = await runWithConcurrency(
        config.amounts,
        Math.max(1, config.maxConcurrency),
        (amount) => runTick(runState, config.corridor, amount),
      )

      for (const tick of tickResults) {
        await appendCsvRows(monitoCsvPath, toMonitoRows(tick, runId), MONITO_HEADERS)
        await appendCsvRows(providerCsvPath, toProviderRows(tick, runId), PROVIDER_HEADERS)
      }

      const elapsed = Date.now() - tickStartedAt
      const elapsedForNextTick = intervalMs - elapsed
      const remainingRun = stopAt - Date.now()
      const nextWait = Math.min(elapsedForNextTick, remainingRun)

      if (nextWait > 0) {
        await sleep(nextWait)
      }
    }

    return { runId, evidencePath }
  } finally {
    evidence.endedAt = new Date().toISOString()
    await runState.monitoClient.close().catch(() => undefined)
    await closeProvidersRuntime().catch(() => undefined)

    await fs.writeFile(
      evidencePath,
      JSON.stringify(
        {
          ...evidence,
          config,
          monitoCsvPath,
          providerCsvPath,
          rawGraphqlDir,
        },
        null,
        2,
      ),
      'utf8',
    )
  }
}

export const parseRunOverrides = (rawArgs: string[]): {
  corridor?: CorridorConfig
  amounts?: number[]
  intervalSeconds?: number
  runDurationMinutes?: number
  topNProviders?: number | null
  maxConcurrency?: number
  providerRetryCount?: number
  headlessBrowser?: boolean
  dataMatchWindowSeconds?: number
} => {
  const out: {
    corridor?: CorridorConfig
    amounts?: number[]
    intervalSeconds?: number
    runDurationMinutes?: number
    topNProviders?: number | null
    maxConcurrency?: number
    providerRetryCount?: number
    headlessBrowser?: boolean
    dataMatchWindowSeconds?: number
  } = {}

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i]
    if (!arg.startsWith('--')) continue

    const value = rawArgs[i + 1]

    if (!value && !['--help'].includes(arg)) continue

    if (arg === '--corridor') {
      out.corridor = parseCorridorArg(value)
      i += 1
      continue
    }

    if (arg === '--amounts') {
      out.amounts = parsePositiveNumberList(value)
      i += 1
      continue
    }

    if (arg === '--interval') {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) out.intervalSeconds = Math.floor(parsed)
      i += 1
      continue
    }

    if (arg === '--duration') {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) out.runDurationMinutes = Math.floor(parsed)
      i += 1
      continue
    }

    if (arg === '--top-n') {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) out.topNProviders = Math.floor(parsed)
      i += 1
      continue
    }

    if (arg === '--concurrency') {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) out.maxConcurrency = Math.floor(parsed)
      i += 1
      continue
    }

    if (arg === '--retries') {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) out.providerRetryCount = Math.floor(parsed)
      i += 1
      continue
    }

    if (arg === '--headless') {
      const parsed = parseBoolean(value)
      if (parsed !== null) out.headlessBrowser = parsed
      i += 1
      continue
    }

    if (arg === '--match-window') {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) out.dataMatchWindowSeconds = Math.floor(parsed)
      i += 1
      continue
    }
  }

  return out
}
