import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: vi.fn(),
}))

vi.mock('../shared/agent-notifications', () => ({
  notifyAgent: vi.fn(() => Promise.resolve()),
}))

vi.mock('../shared/error-tracker', () => ({
  addBreadcrumb: vi.fn(),
  captureExceptionWithContext: vi.fn(),
}))

vi.mock('../plane-b/src/agents/patch-proposer', () => {
  return {
    PatchProposer: vi.fn().mockImplementation(() => ({
      propose: vi.fn(),
    })),
  }
})

vi.mock('../plane-b/src/agents/patch-validator', () => {
  return {
    PatchValidator: vi.fn().mockImplementation(() => ({
      validate: vi.fn(),
    })),
  }
})

vi.mock('../plane-b/src/agents/patch-deployer', () => {
  return {
    PatchDeployer: vi.fn().mockImplementation(() => ({
      deploy: vi.fn(),
    })),
  }
})

import { PatchPipelineHandler } from '../plane-b/src/handlers/patch-pipeline'
import { PatchProposer } from '../plane-b/src/agents/patch-proposer'
import { PatchValidator } from '../plane-b/src/agents/patch-validator'
import { PatchDeployer } from '../plane-b/src/agents/patch-deployer'
import {
  registerBuiltInHandlers,
} from '../scripts/aws/agent-orchestrator-ecs'

type MockPool = {
  query: ReturnType<typeof vi.fn>
}

const createPool = (rowsByCall: Array<{ rows?: unknown[] }> = []): MockPool => {
  let index = 0
  return {
    query: vi.fn(async () => rowsByCall[index++] ?? { rows: [] }),
  }
}

const makeBundleRow = (overrides: Record<string, unknown> = {}) => ({
  bundle_id: 'bundle-1',
  module_id: 'module-wise-http',
  provider_id: 'wise',
  collector_type: 'http',
  category: 'parse',
  severity: 'persistent',
  error_message: 'Cannot read properties of undefined',
  error_type: 'TypeError',
  dom_signature_hash: null,
  previous_dom_signature_hash: null,
  affected_corridors: ['US-MX-USD-MXN'],
  observation_ids: ['obs-1'],
  consecutive_failures: 5,
  first_failure_at: '2026-03-09T00:00:00Z',
  last_failure_at: '2026-03-09T01:00:00Z',
  created_at: '2026-03-09T01:00:00Z',
  http_statuses: [],
  quality_flags: [],
  fetcher_source: 'http',
  failure_layer: 'parse',
  ...overrides,
})

describe('PatchPipelineHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success with zero items when no bundles exist', async () => {
    const pool = createPool([
      { rows: [] },
      { rows: [] },
    ])

    const handler = new PatchPipelineHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {},
    })

    expect(result.success).toBe(true)
    expect(result.itemsProcessed).toBe(0)
  })

  it('fast-path resolves parse bundles with high-confidence diagnosis', async () => {
    const bundle = makeBundleRow({
      error_type: 'TypeError',
      error_message: 'Cannot read properties of undefined',
    })

    const pool = createPool([
      { rows: [] },
      { rows: [bundle] },
      { rows: [{ observation_id: 'obs-1', payload: {}, observed_at: '2026-03-09T00:00:00Z' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    const handler = new PatchPipelineHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {},
    })

    expect(result.success).toBe(true)
    expect(result.itemsProcessed).toBe(1)

    const updateCalls = pool.query.mock.calls.filter(
      ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE silver.failure_bundle'),
    )
    expect(updateCalls.length).toBeGreaterThanOrEqual(1)
    expect(updateCalls[0][1]).toContain('bundle-1')
  })

  it('escalates dom_change bundles to the full patch pipeline', async () => {
    const bundle = makeBundleRow({
      category: 'dom_change',
      error_type: 'SelectorError',
      error_message: 'Element not found',
    })

    const mockProposal = {
      bundleId: 'bundle-1',
      moduleId: 'module-wise-http',
      providerId: 'wise',
      route: 'US-MX-USD-MXN',
      detectedIssueClass: 'dom_change',
      riskLevel: 'low',
      correlationId: 'bundle-1',
      description: 'Update selectors',
      affectedFiles: ['collector.ts'],
      changes: [],
      confidence: 'high',
      reasoning: 'DOM changed',
    }

    const mockValidation = {
      proposalBundleId: 'bundle-1',
      moduleId: 'module-wise-http',
      valid: true,
      checks: [],
      overallConfidence: 'high',
      confidenceScore: 0.9,
      summary: 'All checks passed',
    }

    const mockDeploy = {
      bundleId: 'bundle-1',
      moduleId: 'module-wise-http',
      deployed: true,
      method: 'pr',
      prUrl: 'https://github.com/org/repo/pull/42',
      reason: 'PR created',
    }

    const proposerInstance = { propose: vi.fn().mockResolvedValue(mockProposal) }
    const validatorInstance = { validate: vi.fn().mockResolvedValue(mockValidation) }
    const deployerInstance = { deploy: vi.fn().mockResolvedValue(mockDeploy) }
    vi.mocked(PatchProposer).mockImplementation(() => proposerInstance as never)
    vi.mocked(PatchValidator).mockImplementation(() => validatorInstance as never)
    vi.mocked(PatchDeployer).mockImplementation(() => deployerInstance as never)

    const pool = createPool([
      { rows: [] },
      { rows: [bundle] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    const handler = new PatchPipelineHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {},
    })

    expect(result.success).toBe(true)
    expect(result.itemsProcessed).toBe(1)
    expect(proposerInstance.propose).toHaveBeenCalledTimes(1)
    expect(validatorInstance.validate).toHaveBeenCalledWith(mockProposal)
    expect(deployerInstance.deploy).toHaveBeenCalledWith(mockProposal, mockValidation)
  })

  it('records rejection when proposer returns null', async () => {
    const bundle = makeBundleRow({ category: 'data_integrity' })

    const proposerInstance = { propose: vi.fn().mockResolvedValue(null) }
    vi.mocked(PatchProposer).mockImplementation(() => proposerInstance as never)

    const pool = createPool([
      { rows: [] },
      { rows: [bundle] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    const handler = new PatchPipelineHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {},
    })

    expect(result.success).toBe(true)
    expect(result.itemsProcessed).toBe(1)

    const updateCalls = pool.query.mock.calls.filter(
      ([sql]: [string]) => typeof sql === 'string' && sql.includes('UPDATE silver.failure_bundle'),
    )
    expect(updateCalls.length).toBeGreaterThanOrEqual(1)
    const rejectedCall = updateCalls.find(([, params]: [string, unknown[]]) => params?.includes('rejected'))
    expect(rejectedCall).toBeTruthy()
  })

  it('escalates low-confidence parse diagnoses to the full pipeline', async () => {
    const bundle = makeBundleRow({
      error_type: 'CustomError',
      error_message: 'something unexpected happened',
    })

    const proposerInstance = { propose: vi.fn().mockResolvedValue(null) }
    vi.mocked(PatchProposer).mockImplementation(() => proposerInstance as never)

    const pool = createPool([
      { rows: [] },
      { rows: [bundle] },
      { rows: [{ observation_id: 'obs-1', payload: {}, observed_at: '2026-03-09T00:00:00Z' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    const handler = new PatchPipelineHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {},
    })

    expect(result.success).toBe(true)
    expect(proposerInstance.propose).toHaveBeenCalledTimes(1)
  })

  it('counts bundle processing errors as itemsFailed', async () => {
    const bundle = makeBundleRow({ category: 'dom_change' })

    const proposerInstance = { propose: vi.fn().mockRejectedValue(new Error('LLM down')) }
    vi.mocked(PatchProposer).mockImplementation(() => proposerInstance as never)

    const pool = createPool([
      { rows: [] },
      { rows: [bundle] },
      { rows: [] },
    ])

    const handler = new PatchPipelineHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {},
    })

    expect(result.itemsFailed).toBe(1)
  })
})

describe('registerBuiltInHandlers with patchPipeline', () => {
  it('registers patchPipeline handler for agent-patch-propose when provided', () => {
    const registerHandler = vi.fn()
    const mockHandler = (type: string) => ({
      handlerType: type,
      execute: async () => ({ success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: 0 }),
    })

    registerBuiltInHandlers(
      { registerHandler },
      {
        parser: mockHandler('parser'),
        patchPipeline: mockHandler('patch-pipeline'),
        contractTest: mockHandler('contract_test'),
        stressResponse: mockHandler('stress_response'),
        repairFallback: mockHandler('repair_fallback'),
      },
    )

    const patchCall = registerHandler.mock.calls.find(([q]: [string]) => q === 'agent-patch-propose')
    expect(patchCall).toBeTruthy()
    expect(patchCall![1].handlerType).toBe('patch-pipeline')
  })

  it('falls back to parser handler when patchPipeline is undefined', () => {
    const registerHandler = vi.fn()
    const mockHandler = (type: string) => ({
      handlerType: type,
      execute: async () => ({ success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: 0 }),
    })

    registerBuiltInHandlers(
      { registerHandler },
      {
        parser: mockHandler('parser'),
        contractTest: mockHandler('contract_test'),
        stressResponse: mockHandler('stress_response'),
        repairFallback: mockHandler('repair_fallback'),
      },
    )

    const patchCall = registerHandler.mock.calls.find(([q]: [string]) => q === 'agent-patch-propose')
    expect(patchCall).toBeTruthy()
    expect(patchCall![1].handlerType).toBe('parser')
  })
})
