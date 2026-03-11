import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { resolveDbConnectionStringForIpv4 } from '../shared/db-ipv4'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import {
  getRegisteredDiscoveryProviders,
  runDiscoveryForProvider,
} from '../plane-b/src/discovery/discovery-runner'
import type { DiscoveryResult, DiscoveryRunOptions } from '../plane-b/src/discovery/discovery-types'
import { generateBatchDiff } from '../plane-b/src/discovery/reports/diff-reporter'
import { runRightsMatrixDifferential } from './rights-matrix-differential'
import { runRightsMatrixCapabilityDelta } from './rights-matrix-capability-delta'
import { runProviderDeliveryDiscovery } from './provider-delivery-discovery'
import { runProviderCapabilityProbe } from './provider-capability-probe'
import { runCorridorCoverageAudit } from './corridor-coverage-audit'
import { approveDiscoveryScan, applyDiscoveryScan } from '../plane-b/src/discovery/discovery-review'
import { runProviderCertification } from './lib/provider-certification'
import { evaluateDiscoveryAutoApplyPolicy } from './lib/provider-automation-policy'

initTracing('provider-coverage-audit')
initErrorTracking('provider-coverage-audit')

const logger = createLogger('script.provider-coverage-audit')

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

const normalizeLower = (value: string): string => value.trim().toLowerCase()

type AuditMethodLane = {
  label: string
  payinMethod: string
  payoutMethod: string
}

const resolveAuditMethodLanes = (methods: string[]): AuditMethodLane[] => {
  const lanes = new Map<string, AuditMethodLane>()
  const register = (label: string, payinMethod: string, payoutMethod: string) => {
    if (!lanes.has(label)) {
      lanes.set(label, { label, payinMethod, payoutMethod })
    }
  }

  for (const method of methods) {
    const token = normalizeLower(method).replace(/[\s-]+/g, '_')
    if (!token) continue
    if (token === 'cash' || token === 'cash_pickup') {
      register('cash', 'bank_transfer', 'cash_pickup')
      continue
    }
    if (token === 'wallet' || token === 'mobile_wallet') {
      register('wallet', 'bank_transfer', 'mobile_wallet')
      continue
    }
    if (token === 'airtime') {
      register('airtime', 'bank_transfer', 'airtime')
      continue
    }
    if (token === 'home' || token === 'home_delivery') {
      register('home', 'bank_transfer', 'home_delivery')
      continue
    }
    if (token === 'card' || token === 'card_delivery' || token === 'debit_card') {
      register('card', 'debit_card', 'debit_card')
      continue
    }
    register('bank', 'bank_transfer', 'bank_deposit')
  }

  if (lanes.size === 0) {
    register('bank', 'bank_transfer', 'bank_deposit')
  }

  return Array.from(lanes.values())
}

const truthy = (value: string | undefined): boolean => {
  const normalized = (value || '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

const toPositiveNumber = (value: string | undefined, fallback: number, minimum = 1): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(minimum, Math.floor(parsed))
}

const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true })
}

const writeJson = (filePath: string, payload: unknown): void => {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const chunk = <T>(items: T[], size: number): T[][] => {
  if (!Number.isFinite(size) || size <= 0) return [items]
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size))
  }
  return output
}

const listArtifacts = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return []
  const artifacts: string[] = []

  const walk = (currentDir: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        artifacts.push(fullPath)
      }
    }
  }

  walk(dir)
  return artifacts.sort()
}

const withEnv = async <T>(
  overrides: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> => {
  const originalValues = new Map<string, string | undefined>()
  for (const [key, value] of Object.entries(overrides)) {
    originalValues.set(key, process.env[key])
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    return await fn()
  } finally {
    for (const [key, value] of originalValues.entries()) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

type ProviderCoverageAuditOptions = {
  runId: string
  outputDir: string
  providerIds: string[]
  batchSize: number
  batchDelayMs: number
  applyProviders: string[]
  rightsScope: string
  rightsChannel: 'b2c' | 'b2b'
  sendCurrencies: string[]
  methods: string[]
  amount: number
  capabilityProbeTiers: string[]
  capabilityProbeLimit: number
}

type DiscoveryScanIdRow = {
  provider_id: string
  id: number
}

type DiscoverySummary = {
  providerId: string
  applied: boolean
  scanId: number | null
  corridors: number
  deliveryMethods: number
  promotions: number
  errors: number
}

type AuditManifest = {
  runId: string
  generatedAt: string
  environment: string
  reviewOnly: boolean
  providerIds: string[]
  applyProviders: string[]
  discovery: {
    correlationId: string
    batchSize: number
    batchDelayMs: number
    summaries: DiscoverySummary[]
  }
  artifacts: {
    discovery: string[]
    rightsDifferential: string[]
    rightsCapabilityDelta: string[]
    providerDeliveryDiscovery: string[]
    capabilityProbe: string[]
    corridorCoverage: string[]
    certification: string[]
    apply: string[]
  }
}

const resolveOutputDir = (env: NodeJS.ProcessEnv, runId: string): string => {
  if (env.OUTPUT_DIR && env.OUTPUT_DIR.trim()) {
    return path.resolve(env.OUTPUT_DIR)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return path.join(
    os.tmpdir(),
    'remit-scout-artifacts',
    'provider-coverage-audit',
    config.env,
    `${timestamp}-${runId}`,
  )
}

export const parseProviderCoverageAuditOptions = (
  env: NodeJS.ProcessEnv = process.env,
): ProviderCoverageAuditOptions => {
  const registeredProviders = getRegisteredDiscoveryProviders()
  const providerFilter = splitCsv(env.DISCOVERY_PROVIDERS).map(normalizeLower)
  const providerIds = (providerFilter.length ? providerFilter : registeredProviders)
    .filter((providerId, index, list) => list.indexOf(providerId) === index)
    .filter((providerId) => registeredProviders.includes(providerId))

  const applyProviders = splitCsv(env.AUDIT_APPLY_PROVIDERS)
    .map(normalizeLower)
    .filter((providerId, index, list) => list.indexOf(providerId) === index)

  const applyEnabled = truthy(env.AUDIT_APPLY) || applyProviders.length > 0
  if (applyEnabled && applyProviders.length === 0) {
    throw new Error('AUDIT_APPLY requires AUDIT_APPLY_PROVIDERS')
  }
  if (config.env === 'prod' && applyProviders.length > 0) {
    throw new Error('Selective apply is disabled in production. Run this audit in review mode only.')
  }

  const runId = env.RUN_ID?.trim() || randomUUID()

  return {
    runId,
    outputDir: resolveOutputDir(env, runId),
    providerIds,
    batchSize: toPositiveNumber(env.DISCOVERY_BATCH_SIZE, 4),
    batchDelayMs: toPositiveNumber(env.DISCOVERY_BATCH_DELAY_MS, 2_000, 0),
    applyProviders,
    rightsScope: (env.RIGHTS_SCOPE || 'all').trim().toLowerCase(),
    rightsChannel: normalizeLower(env.RIGHTS_CHANNEL || 'b2c') === 'b2b' ? 'b2b' : 'b2c',
    sendCurrencies: splitCsv(env.SEND_CURRENCIES),
    methods: splitCsv(env.METHODS),
    amount: toPositiveNumber(env.AMOUNT, 500),
    capabilityProbeTiers: splitCsv(env.CAPABILITY_PROBE_TIERS || 'tier_1,tier_2'),
    capabilityProbeLimit: toPositiveNumber(env.CAPABILITY_PROBE_LIMIT, 25),
  }
}

const loadScanIds = async (
  pool: ReturnType<typeof createPool>,
  correlationId: string,
  providerIds: string[],
): Promise<Map<string, number>> => {
  if (!providerIds.length) return new Map()

  const result = await query<DiscoveryScanIdRow>(
    `SELECT DISTINCT ON (provider_id) provider_id, id
       FROM silver.discovery_scan
      WHERE correlation_id = $1
        AND provider_id = ANY($2::text[])
      ORDER BY provider_id, id DESC`,
    [correlationId, providerIds],
    pool,
  )

  return new Map(
    result.rows
      .filter((row) => row.provider_id && Number.isFinite(row.id))
      .map((row) => [normalizeLower(row.provider_id), row.id]),
  )
}

export const runProviderCoverageAudit = async (
  overrides: Partial<ProviderCoverageAuditOptions> = {},
): Promise<AuditManifest> => {
  const parsed = parseProviderCoverageAuditOptions(process.env)
  const options: ProviderCoverageAuditOptions = {
    ...parsed,
    ...overrides,
    providerIds: overrides.providerIds ?? parsed.providerIds,
    applyProviders: overrides.applyProviders ?? parsed.applyProviders,
    sendCurrencies: overrides.sendCurrencies ?? parsed.sendCurrencies,
    methods: overrides.methods ?? parsed.methods,
    capabilityProbeTiers: overrides.capabilityProbeTiers ?? parsed.capabilityProbeTiers,
  }
  if (!options.providerIds.length) {
    throw new Error('No registered discovery providers matched the requested filter')
  }

  const providerIdSet = new Set(options.providerIds.map(normalizeLower))
  options.applyProviders = options.applyProviders
    .map(normalizeLower)
    .filter((providerId, index, list) => list.indexOf(providerId) === index)
    .filter((providerId) => providerIdSet.has(providerId))

  if (config.env === 'prod' && options.applyProviders.length > 0) {
    throw new Error('Selective apply is disabled in production. Run this audit in review mode only.')
  }

  ensureDir(options.outputDir)

  const discoveryDir = path.join(options.outputDir, 'discovery')
  const rightsDifferentialDir = path.join(options.outputDir, 'rights-differential')
  const rightsCapabilityDeltaDir = path.join(options.outputDir, 'rights-capability-delta')
  const capabilityProbeDir = path.join(options.outputDir, 'capability-probe')
  const corridorCoverageDir = path.join(options.outputDir, 'corridor-coverage')
  const certificationDir = path.join(options.outputDir, 'certification')
  const applyDir = path.join(options.outputDir, 'apply')
  ensureDir(discoveryDir)
  ensureDir(rightsDifferentialDir)
  ensureDir(rightsCapabilityDeltaDir)
  ensureDir(capabilityProbeDir)
  ensureDir(corridorCoverageDir)
  ensureDir(certificationDir)
  ensureDir(applyDir)

  const pool = createPool(await resolveDbConnectionStringForIpv4(config.db.planeBUrl, logger))
  const correlationId = options.runId
  const applyProviderSet = new Set(options.applyProviders.map(normalizeLower))
  const discoveryResults = new Map<string, DiscoveryResult>()
  const auditMethodLanes = resolveAuditMethodLanes(options.methods)

  try {
    logger.info('provider_coverage_audit_start', {
      run_id: options.runId,
      environment: config.env,
      review_only: applyProviderSet.size === 0,
      providers: options.providerIds,
      batch_size: options.batchSize,
      batch_delay_ms: options.batchDelayMs,
      apply_providers: options.applyProviders,
    })

    const discoveryOptionsBase: DiscoveryRunOptions = {
      triggeredBy: 'manual',
      correlationId,
    }

    const batches = chunk(options.providerIds, options.batchSize)
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex]
      const batchResults = await Promise.all(
        batch.map(async (providerId) => {
          const result = await runDiscoveryForProvider(pool, providerId, discoveryOptionsBase)
          return { providerId, result }
        }),
      )

      for (const entry of batchResults) {
        if (entry.result) {
          discoveryResults.set(entry.providerId, entry.result)
        }
      }

      if (batchIndex < batches.length - 1 && options.batchDelayMs > 0) {
        await sleep(options.batchDelayMs)
      }
    }

    const scanIds = await loadScanIds(pool, correlationId, options.providerIds)
    const diffReport = await generateBatchDiff(pool, discoveryResults, scanIds)

    const discoverySummaries: DiscoverySummary[] = options.providerIds.map((providerId) => {
      const result = discoveryResults.get(providerId)
      return {
        providerId,
        applied: applyProviderSet.has(providerId),
        scanId: scanIds.get(providerId) ?? null,
        corridors: result?.corridors.length ?? 0,
        deliveryMethods: result?.deliveryMethods.length ?? 0,
        promotions: result?.promotions.length ?? 0,
        errors: result?.errors.length ?? 0,
      }
    })

    writeJson(
      path.join(discoveryDir, 'discovery-results.json'),
      Object.fromEntries(
        Array.from(discoveryResults.entries()).map(([providerId, result]) => [providerId, result]),
      ),
    )
    writeJson(path.join(discoveryDir, 'scan-ids.json'), Object.fromEntries(scanIds.entries()))
    writeJson(path.join(discoveryDir, 'batch-diff.json'), diffReport)
    writeJson(path.join(discoveryDir, 'summary.json'), discoverySummaries)

    await withEnv(
      {
        OUTPUT_DIR: rightsDifferentialDir,
        RIGHTS_SCOPE: options.rightsScope,
        RIGHTS_CHANNEL: options.rightsChannel,
        SEND_CURRENCIES: options.sendCurrencies.length ? options.sendCurrencies.join(',') : undefined,
        METHODS: options.methods.length ? options.methods.join(',') : undefined,
        AMOUNT: String(options.amount),
      },
      async () => {
        await runRightsMatrixDifferential()
      },
    )

    await withEnv(
      {
        OUTPUT_DIR: rightsCapabilityDeltaDir,
        RIGHTS_SCOPE: options.rightsScope,
        CHANNEL: options.rightsChannel,
        SEND_CURRENCIES: options.sendCurrencies.length ? options.sendCurrencies.join(',') : undefined,
        APPLY: applyProviderSet.size > 0 ? '1' : '0',
        APPLY_PROVIDERS: options.applyProviders.length ? options.applyProviders.join(',') : undefined,
      },
      async () => {
        await runRightsMatrixCapabilityDelta()
      },
    )

    const deliveryDiscoveryOutput = await runProviderDeliveryDiscovery({
      providerIds: options.providerIds,
      outputFormat: 'log',
      pool,
    })
    const deliveryDiscoveryPath = path.join(options.outputDir, 'provider-delivery-discovery.json')
    writeJson(deliveryDiscoveryPath, deliveryDiscoveryOutput)

    for (const lane of auditMethodLanes) {
      const capabilityProbeOutput = await runProviderCapabilityProbe({
        providerIds: options.providerIds,
        targetTiers: options.capabilityProbeTiers,
        limitPerProvider: options.capabilityProbeLimit,
        payinMethod: lane.payinMethod,
        payoutMethod: lane.payoutMethod,
        outputFormat: 'log',
        pool,
      })
      writeJson(
        path.join(capabilityProbeDir, `${lane.label}.json`),
        {
          method: lane.label,
          payinMethod: lane.payinMethod,
          payoutMethod: lane.payoutMethod,
          reports: capabilityProbeOutput,
        },
      )
    }

    for (const lane of auditMethodLanes) {
      const laneOutputDir = path.join(corridorCoverageDir, lane.label)
      ensureDir(laneOutputDir)
      await withEnv(
        {
          OUTPUT_DIR: laneOutputDir,
          SEND_CURRENCIES: options.sendCurrencies.length ? options.sendCurrencies.join(',') : undefined,
          LANE_PAYOUT_METHOD: lane.payoutMethod,
        },
        async () => {
          await runCorridorCoverageAudit()
        },
      )
    }

    const certificationRun = await runProviderCertification({
      runId: `${options.runId}-certification`,
      providerIds: options.providerIds,
      triggeredBy: 'manual',
      requestedBy: 'provider-coverage-audit@system',
      reviewOnly: applyProviderSet.size === 0,
      planeABaseUrl: process.env.PLANE_A_BASE_URL || process.env.API_BASE_URL,
      method: (options.methods[0] as any) || 'bank',
      amount: options.amount,
      persist: true,
      pool,
    })
    const certificationSummaryPath = path.join(certificationDir, 'run.json')
    writeJson(certificationSummaryPath, certificationRun)

    const applyDecisions: Array<Record<string, unknown>> = []
    if (applyProviderSet.size > 0) {
      const certificationByProvider = new Map(
        certificationRun.results.map((result) => [result.provider_id, result] as const),
      )

      for (const providerId of options.applyProviders) {
        const scanId = scanIds.get(providerId) ?? null
        if (!scanId) {
          applyDecisions.push({
            providerId,
            allowed: false,
            reasons: ['scan_not_found_for_provider'],
          })
          continue
        }

        const policy = await evaluateDiscoveryAutoApplyPolicy(pool, {
          providerId,
          scanId,
          certificationResult: certificationByProvider.get(providerId) ?? null,
          environment: config.env,
        })

        if (!policy.allowed) {
          applyDecisions.push({
            providerId,
            scanId,
            allowed: false,
            reasons: policy.reasons,
            gating: policy.gating,
          })
          continue
        }

        try {
          const approved = await approveDiscoveryScan(pool, scanId, {
            approvedBy: 'provider-coverage-audit@system',
            mode: 'automation',
          })
          const applied = await applyDiscoveryScan(pool, scanId, {
            appliedBy: 'provider-coverage-audit@system',
          })
          applyDecisions.push({
            providerId,
            scanId,
            allowed: true,
            gating: policy.gating,
            approved,
            applied,
          })
        } catch (error) {
          applyDecisions.push({
            providerId,
            scanId,
            allowed: false,
            reasons: ['apply_execution_failed'],
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }
    const applyResultsPath = path.join(applyDir, 'apply-results.json')
    writeJson(applyResultsPath, applyDecisions)

    const manifest: AuditManifest = {
      runId: options.runId,
      generatedAt: new Date().toISOString(),
      environment: config.env,
      reviewOnly: applyProviderSet.size === 0,
      providerIds: options.providerIds,
      applyProviders: options.applyProviders,
      discovery: {
        correlationId,
        batchSize: options.batchSize,
        batchDelayMs: options.batchDelayMs,
        summaries: discoverySummaries,
      },
      artifacts: {
        discovery: listArtifacts(discoveryDir),
        rightsDifferential: listArtifacts(rightsDifferentialDir),
        rightsCapabilityDelta: listArtifacts(rightsCapabilityDeltaDir),
        providerDeliveryDiscovery: [deliveryDiscoveryPath],
        capabilityProbe: listArtifacts(capabilityProbeDir),
        corridorCoverage: listArtifacts(corridorCoverageDir),
        certification: [certificationSummaryPath],
        apply: [applyResultsPath],
      },
    }

    writeJson(path.join(options.outputDir, 'manifest.json'), manifest)

    logger.info('provider_coverage_audit_complete', {
      run_id: options.runId,
      output_dir: options.outputDir,
      review_only: manifest.reviewOnly,
      providers: options.providerIds.length,
    })

    return manifest
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runProviderCoverageAudit().catch((error) => {
    logger.error('provider_coverage_audit_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
