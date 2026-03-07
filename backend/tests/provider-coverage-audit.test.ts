import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreatePool = vi.fn()
const mockQuery = vi.fn()
const mockRunDiscoveryForProvider = vi.fn()
const mockGetRegisteredDiscoveryProviders = vi.fn()
const mockGenerateBatchDiff = vi.fn()
const mockRunRightsMatrixDifferential = vi.fn()
const mockRunRightsMatrixCapabilityDelta = vi.fn()
const mockRunProviderDeliveryDiscovery = vi.fn()
const mockRunProviderCapabilityProbe = vi.fn()
const mockRunCorridorCoverageAudit = vi.fn()
const mockApproveDiscoveryScan = vi.fn()
const mockApplyDiscoveryScan = vi.fn()
const mockRunProviderCertification = vi.fn()
const mockEvaluateDiscoveryAutoApplyPolicy = vi.fn()

vi.mock('../shared/db', () => ({
  createPool: mockCreatePool,
  query: mockQuery,
}))

vi.mock('../shared/config', () => ({
  config: {
    env: 'staging',
    db: {
      planeBUrl: 'postgres://remit-scout.test/plane-b',
    },
    anomaly: {
      zScoreThreshold: 2,
      minSampleCount: 10,
      baselineWindowHours: 24,
    },
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../shared/tracing', () => ({
  initTracing: vi.fn(),
}))

vi.mock('../shared/error-tracker', () => ({
  initErrorTracking: vi.fn(),
}))

vi.mock('../plane-b/src/discovery/discovery-runner', () => ({
  getRegisteredDiscoveryProviders: mockGetRegisteredDiscoveryProviders,
  runDiscoveryForProvider: mockRunDiscoveryForProvider,
}))

vi.mock('../plane-b/src/discovery/reports/diff-reporter', () => ({
  generateBatchDiff: mockGenerateBatchDiff,
}))

vi.mock('../scripts/rights-matrix-differential', () => ({
  runRightsMatrixDifferential: mockRunRightsMatrixDifferential,
}))

vi.mock('../scripts/rights-matrix-capability-delta', () => ({
  runRightsMatrixCapabilityDelta: mockRunRightsMatrixCapabilityDelta,
}))

vi.mock('../scripts/provider-delivery-discovery', () => ({
  runProviderDeliveryDiscovery: mockRunProviderDeliveryDiscovery,
}))

vi.mock('../scripts/provider-capability-probe', () => ({
  runProviderCapabilityProbe: mockRunProviderCapabilityProbe,
}))

vi.mock('../scripts/corridor-coverage-audit', () => ({
  runCorridorCoverageAudit: mockRunCorridorCoverageAudit,
}))

vi.mock('../plane-b/src/discovery/discovery-review', () => ({
  approveDiscoveryScan: mockApproveDiscoveryScan,
  applyDiscoveryScan: mockApplyDiscoveryScan,
}))

vi.mock('../scripts/lib/provider-certification', () => ({
  runProviderCertification: mockRunProviderCertification,
}))

vi.mock('../scripts/lib/provider-automation-policy', () => ({
  evaluateDiscoveryAutoApplyPolicy: mockEvaluateDiscoveryAutoApplyPolicy,
}))

const buildDiscoveryResult = (providerId: string) => ({
  providerId,
  corridors: [{ corridorId: `US-${providerId.toUpperCase()}-USD-XXX` }],
  deliveryMethods: [{ corridorId: `US-${providerId.toUpperCase()}-USD-XXX`, normalizedPayout: 'bank' }],
  promotions: [],
  errors: [],
  scannedAt: new Date().toISOString(),
  metadata: { durationMs: 1 },
})

describe('provider coverage audit', () => {
  let tmpDir: string
  let pool: { end: ReturnType<typeof vi.fn> }
  let rightsCapabilityDeltaEnv: { APPLY?: string, APPLY_PROVIDERS?: string } | null

  beforeEach(() => {
    vi.clearAllMocks()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-coverage-audit-'))
    pool = { end: vi.fn().mockResolvedValue(undefined) }
    rightsCapabilityDeltaEnv = null

    mockCreatePool.mockReturnValue(pool)
    mockGetRegisteredDiscoveryProviders.mockReturnValue(['ria', 'wise'])
    mockRunDiscoveryForProvider.mockImplementation(async (_pool, providerId: string) => buildDiscoveryResult(providerId))
    mockQuery.mockResolvedValue({
      rows: [
        { provider_id: 'ria', id: 101 },
        { provider_id: 'wise', id: 102 },
      ],
    })
    mockGenerateBatchDiff.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      providerReports: [],
      summary: {},
    })
    mockRunRightsMatrixDifferential.mockImplementation(async () => {
      fs.writeFileSync(path.join(process.env.OUTPUT_DIR!, 'rights-differential.json'), '{}')
    })
    mockRunRightsMatrixCapabilityDelta.mockImplementation(async () => {
      rightsCapabilityDeltaEnv = {
        APPLY: process.env.APPLY,
        APPLY_PROVIDERS: process.env.APPLY_PROVIDERS,
      }
      fs.writeFileSync(path.join(process.env.OUTPUT_DIR!, 'rights-capability-delta.json'), '{}')
    })
    mockRunProviderDeliveryDiscovery.mockResolvedValue([
      {
        providerId: 'ria',
        corridorsWithCapability: 1,
        dbPayoutMethods: ['bank_deposit'],
        codeMapPayoutMethods: ['bank_deposit'],
        unmappedInDb: [],
        missingFromDb: [],
        hasCapabilityProbe: true,
        corridorBreakdown: [],
      },
    ])
    mockRunProviderCapabilityProbe.mockResolvedValue([
      {
        providerId: 'ria',
        candidates: 1,
        probed: 1,
        results: [{ corridorId: 'US-AL-USD-ALL', supported: true, reason: null, source: 'probe' }],
      },
    ])
    mockRunCorridorCoverageAudit.mockImplementation(async () => {
      fs.writeFileSync(path.join(process.env.OUTPUT_DIR!, 'corridor-coverage.json'), '{}')
    })
    mockRunProviderCertification.mockResolvedValue({
      run_id: 'certification-run-1',
      results: [
        { provider_id: 'ria', status: 'passed' },
        { provider_id: 'wise', status: 'passed' },
      ],
    })
    mockEvaluateDiscoveryAutoApplyPolicy.mockResolvedValue({
      allowed: true,
      reasons: [],
      gating: { certification: 'passed' },
    })
    mockApproveDiscoveryScan.mockResolvedValue({ approved: true })
    mockApplyDiscoveryScan.mockResolvedValue({ applied: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('requires an explicit allowlist when apply mode is requested', async () => {
    const { parseProviderCoverageAuditOptions } = await import('../scripts/provider-coverage-audit')

    expect(() => parseProviderCoverageAuditOptions({
      AUDIT_APPLY: '1',
      AUDIT_APPLY_PROVIDERS: '',
    } as NodeJS.ProcessEnv)).toThrow('AUDIT_APPLY requires AUDIT_APPLY_PROVIDERS')
  })

  it('writes audit artifacts and only applies discovery/rights changes for allowlisted providers', async () => {
    const { runProviderCoverageAudit } = await import('../scripts/provider-coverage-audit')

    const manifest = await runProviderCoverageAudit({
      runId: 'audit-run-1',
      outputDir: tmpDir,
      providerIds: ['ria', 'wise'],
      batchSize: 2,
      batchDelayMs: 0,
      applyProviders: ['ria'],
      rightsScope: 'ids',
      rightsChannel: 'b2c',
      sendCurrencies: ['USD'],
      methods: ['bank'],
      amount: 500,
      capabilityProbeTiers: ['tier_1'],
      capabilityProbeLimit: 5,
    })

    expect(mockRunDiscoveryForProvider).toHaveBeenCalledTimes(2)
    expect(mockRunDiscoveryForProvider.mock.calls[0]?.[2]).toEqual(expect.objectContaining({
      correlationId: 'audit-run-1',
      triggeredBy: 'manual',
    }))
    expect(mockRunDiscoveryForProvider.mock.calls[1]?.[2]).toEqual(expect.objectContaining({
      correlationId: 'audit-run-1',
      triggeredBy: 'manual',
    }))

    expect(mockRunRightsMatrixCapabilityDelta).toHaveBeenCalledTimes(1)
    expect(mockRunProviderCertification).toHaveBeenCalledTimes(1)
    expect(mockEvaluateDiscoveryAutoApplyPolicy).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({
        providerId: 'ria',
        scanId: 101,
        environment: 'staging',
      }),
    )
    expect(mockApproveDiscoveryScan).toHaveBeenCalledWith(
      pool,
      101,
      expect.objectContaining({
        approvedBy: 'provider-coverage-audit@system',
        mode: 'automation',
      }),
    )
    expect(mockApplyDiscoveryScan).toHaveBeenCalledWith(
      pool,
      101,
      expect.objectContaining({
        appliedBy: 'provider-coverage-audit@system',
      }),
    )
    expect(rightsCapabilityDeltaEnv).toEqual({
      APPLY: '1',
      APPLY_PROVIDERS: 'ria',
    })
    expect(process.env.APPLY).toBeUndefined()
    expect(fs.existsSync(path.join(tmpDir, 'discovery', 'discovery-results.json'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'discovery', 'batch-diff.json'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'manifest.json'))).toBe(true)
    expect(manifest.reviewOnly).toBe(false)
    expect(manifest.applyProviders).toEqual(['ria'])
    expect(manifest.artifacts.rightsDifferential.length).toBeGreaterThan(0)
    expect(manifest.artifacts.rightsCapabilityDelta.length).toBeGreaterThan(0)
    expect(manifest.artifacts.providerDeliveryDiscovery).toEqual([
      path.join(tmpDir, 'provider-delivery-discovery.json'),
    ])
    expect(manifest.artifacts.capabilityProbe).toEqual([
      path.join(tmpDir, 'capability-probe', 'bank.json'),
    ])
    expect(manifest.artifacts.corridorCoverage.length).toBeGreaterThan(0)
    expect(manifest.artifacts.certification).toEqual([
      path.join(tmpDir, 'certification', 'run.json'),
    ])
    expect(manifest.artifacts.apply).toEqual([
      path.join(tmpDir, 'apply', 'apply-results.json'),
    ])
    expect(pool.end).toHaveBeenCalledTimes(1)
  })
})
