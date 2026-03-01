import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * FailureDetector unit tests — validates failure detection, bundle creation,
 * severity/category classification, DOM drift detection, and quarantine logic.
 */

// Mock shared dependencies
vi.mock('../../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../../shared/config', () => ({
  config: {
    envName: 'test',
    env: 'test',
    agent: {
      llmConnector: 'anthropic',
      llmModel: 'claude-3-haiku-20240307',
    },
  },
}))

vi.mock('../../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: vi.fn(),
}))

vi.mock('../../shared/error-tracker', () => ({
  addBreadcrumb: vi.fn(),
}))

import { FailureDetector } from '../plane-b/src/agents/failure-detector'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockQueryResult<T = Record<string, unknown>> = { rows: T[] }

/**
 * Create a minimal mock Pool with configurable query results.
 * Each call to pool.query() pops the next result from the queue.
 */
function createMockPool(queryResults: MockQueryResult[]) {
  let callIndex = 0
  return {
    query: vi.fn(async () => {
      if (callIndex >= queryResults.length) {
        return { rows: [] }
      }
      return queryResults[callIndex++]
    }),
  } as unknown as import('pg').Pool
}

/**
 * Build a failure observation row for testing.
 */
function makeFailureObservation(overrides: Partial<{
  observation_id: string
  corridor_id: string | null
  payload: Record<string, unknown>
  observed_at: string
}> = {}) {
  return {
    observation_id: overrides.observation_id ?? 'obs-1',
    corridor_id: overrides.corridor_id ?? 'US-MX-USD-MXN',
    payload: overrides.payload ?? {
      errorMessage: 'Cannot read property of undefined',
      errorType: 'TypeError',
      httpStatus: 200,
    },
    observed_at: overrides.observed_at ?? '2026-03-01T10:00:00Z',
  }
}

/**
 * Build a module registry row for testing.
 */
function makeModuleRow(overrides: Partial<{
  module_id: string
  provider_id: string
  collector_type: string
  consecutive_failures: number
  parse_error_rate: number
  status: string
}> = {}) {
  return {
    module_id: overrides.module_id ?? 'mod-wise-1',
    provider_id: overrides.provider_id ?? 'wise',
    collector_type: overrides.collector_type ?? 'http-collector',
    consecutive_failures: overrides.consecutive_failures ?? 6,
    parse_error_rate: overrides.parse_error_rate ?? 0.4,
    status: overrides.status ?? 'production',
  }
}

describe('FailureDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Basic detection flow
  // -------------------------------------------------------------------------

  describe('detectFailures()', () => {
    it('creates a failure bundle when a module has failures and no existing bundle', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation()

      // Query sequence:
      // 1. module_registry scan -> returns one module
      // 2. existing bundle check -> none
      // 3. failure observations -> returns one failure
      // 4. persistBundle (INSERT)
      // 5. quarantineModule is NOT called (severity is 'degraded' for 6 failures)
      const pool = createMockPool([
        { rows: [moduleRow] },           // module_registry query
        { rows: [] },                     // existing bundle check
        { rows: [failureObs] },           // failure observations
        { rows: [] },                     // INSERT failure_bundle
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].moduleId).toBe('mod-wise-1')
      expect(bundles[0].providerId).toBe('wise')
      expect(bundles[0].category).toBe('parse') // TypeError -> parse category
      expect(bundles[0].severity).toBe('degraded') // 6 consecutive failures -> degraded
      expect(bundles[0].affectedCorridors).toContain('US-MX-USD-MXN')
      expect(bundles[0].repairAttempted).toBe(false)
      expect(bundles[0].fetcherSource).toBe('http')
      expect(bundles[0].failureLayer).toBe('parse')
    })

    it('returns empty array when no modules have failures', async () => {
      const pool = createMockPool([
        { rows: [] }, // module_registry scan returns nothing
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(0)
    })

    it('skips modules that already have an open (unrepaired) bundle', async () => {
      const moduleRow = makeModuleRow()

      const pool = createMockPool([
        { rows: [moduleRow] },                                   // module_registry
        { rows: [{ bundle_id: 'existing-bundle-1' }] },         // existing bundle found
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(0)
    })

    it('skips modules that have no failure observations in the window', async () => {
      const moduleRow = makeModuleRow()

      const pool = createMockPool([
        { rows: [moduleRow] },  // module_registry
        { rows: [] },            // no existing bundle
        { rows: [] },            // no failure observations
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // Severity classification
  // -------------------------------------------------------------------------

  describe('severity classification', () => {
    it('classifies critical severity at 20+ consecutive failures', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 25, parse_error_rate: 0.2 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT bundle
        { rows: [] }, // UPDATE quarantine (critical severity triggers this)
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].severity).toBe('critical')
    })

    it('classifies critical severity at 0.8+ parse error rate', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 3, parse_error_rate: 0.85 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT bundle
        { rows: [] }, // UPDATE quarantine
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].severity).toBe('critical')
    })

    it('classifies persistent severity at 10-19 consecutive failures', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 15, parse_error_rate: 0.2 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT
        { rows: [] }, // quarantine (persistent triggers it)
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].severity).toBe('persistent')
    })

    it('classifies degraded severity at 5-9 consecutive failures', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 7, parse_error_rate: 0.1 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].severity).toBe('degraded')
    })

    it('classifies transient severity below 5 consecutive failures', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 3, parse_error_rate: 0.1 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].severity).toBe('transient')
    })
  })

  // -------------------------------------------------------------------------
  // Category classification
  // -------------------------------------------------------------------------

  describe('category classification', () => {
    it('classifies dom_change when DOM signature hashes differ', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'Parse failed',
          errorType: 'ParseError',
          domSignatureHash: 'hash-new',
          previousDomSignatureHash: 'hash-old',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('dom_change')
    })

    it('classifies parse when error type contains TypeError', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'Cannot read property x',
          errorType: 'TypeError',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('parse')
    })

    it('classifies rate_limit when error message includes 429', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'HTTP 429 Too Many Requests',
          errorType: 'HttpError',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('rate_limit')
    })

    it('classifies auth when error message includes 401 or 403', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'HTTP 401 Unauthorized',
          errorType: 'HttpError',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('auth')
    })

    it('classifies timeout when error type includes ETIMEDOUT', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'Connection timed out',
          errorType: 'ETIMEDOUT',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('timeout')
    })

    it('classifies server_error when error message includes 500', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'HTTP 500 Internal Server Error',
          errorType: 'HttpError',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('server_error')
    })

    it('classifies unknown when no pattern matches', async () => {
      const moduleRow = makeModuleRow()
      const failureObs = makeFailureObservation({
        payload: {
          errorMessage: 'Something unexpected happened',
          errorType: 'CustomError',
        },
      })

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].category).toBe('unknown')
    })
  })

  // -------------------------------------------------------------------------
  // Quarantine behavior
  // -------------------------------------------------------------------------

  describe('quarantine', () => {
    it('quarantines module when severity is critical', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 25 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT bundle
        { rows: [] }, // UPDATE quarantine
      ])

      const detector = new FailureDetector(pool)
      await detector.detectFailures()

      // Check that pool.query was called with quarantine UPDATE
      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls
      const quarantineCall = calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('quarantined'),
      )
      expect(quarantineCall).toBeDefined()
    })

    it('quarantines module when severity is persistent', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 12 })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT bundle
        { rows: [] }, // UPDATE quarantine
      ])

      const detector = new FailureDetector(pool)
      await detector.detectFailures()

      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls
      const quarantineCall = calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('quarantined'),
      )
      expect(quarantineCall).toBeDefined()
    })

    it('does NOT quarantine module when severity is degraded or transient', async () => {
      const moduleRow = makeModuleRow({ consecutive_failures: 6 }) // -> degraded
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] }, // INSERT bundle
      ])

      const detector = new FailureDetector(pool)
      await detector.detectFailures()

      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls
      const quarantineCall = calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('quarantined'),
      )
      expect(quarantineCall).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Bundle metadata
  // -------------------------------------------------------------------------

  describe('bundle metadata', () => {
    it('extracts HTTP statuses from failure payloads', async () => {
      const moduleRow = makeModuleRow()
      const failures = [
        makeFailureObservation({ observation_id: 'obs-1', payload: { errorMessage: 'NaN', errorType: 'ParseError', httpStatus: 200 } }),
        makeFailureObservation({ observation_id: 'obs-2', payload: { errorMessage: 'NaN', errorType: 'ParseError', httpStatus: 403 } }),
      ]

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: failures },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].httpStatuses).toEqual(expect.arrayContaining([200, 403]))
    })

    it('deduplicates affected corridors', async () => {
      const moduleRow = makeModuleRow()
      const failures = [
        makeFailureObservation({ observation_id: 'obs-1', corridor_id: 'US-MX-USD-MXN' }),
        makeFailureObservation({ observation_id: 'obs-2', corridor_id: 'US-MX-USD-MXN' }),
        makeFailureObservation({ observation_id: 'obs-3', corridor_id: 'US-IN-USD-INR' }),
      ]

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: failures },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].affectedCorridors).toHaveLength(2)
      expect(bundles[0].affectedCorridors).toContain('US-MX-USD-MXN')
      expect(bundles[0].affectedCorridors).toContain('US-IN-USD-INR')
    })

    it('collects quality flags from failure observations', async () => {
      const moduleRow = makeModuleRow()
      const failures = [
        makeFailureObservation({
          observation_id: 'obs-1',
          payload: { errorMessage: 'NaN', errorType: 'ParseError', qualityFlags: ['parse_error', 'negative_fee'] },
        }),
        makeFailureObservation({
          observation_id: 'obs-2',
          payload: { errorMessage: 'NaN', errorType: 'ParseError', qualityFlags: ['parse_error', 'stale_data'] },
        }),
      ]

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: failures },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].qualityFlags).toEqual(expect.arrayContaining(['parse_error', 'negative_fee', 'stale_data']))
      // parse_error should appear only once (deduplicated via Set)
      const parseErrorCount = bundles[0].qualityFlags.filter((f) => f === 'parse_error').length
      expect(parseErrorCount).toBe(1)
    })

    it('includes observation IDs in the bundle', async () => {
      const moduleRow = makeModuleRow()
      const failures = [
        makeFailureObservation({ observation_id: 'obs-aaa' }),
        makeFailureObservation({ observation_id: 'obs-bbb' }),
      ]

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: failures },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      expect(bundles[0].observationIds).toEqual(['obs-aaa', 'obs-bbb'])
    })

    it('sets firstFailureAt and lastFailureAt from observation timestamps', async () => {
      const moduleRow = makeModuleRow()
      const failures = [
        makeFailureObservation({ observation_id: 'obs-1', observed_at: '2026-03-01T10:30:00Z' }),
        makeFailureObservation({ observation_id: 'obs-2', observed_at: '2026-03-01T10:15:00Z' }),
        makeFailureObservation({ observation_id: 'obs-3', observed_at: '2026-03-01T10:00:00Z' }),
      ]

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: failures },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(1)
      // lastFailureAt = first element (DESC order), firstFailureAt = last element
      expect(bundles[0].lastFailureAt).toBe('2026-03-01T10:30:00Z')
      expect(bundles[0].firstFailureAt).toBe('2026-03-01T10:00:00Z')
    })
  })

  // -------------------------------------------------------------------------
  // Fetcher source inference
  // -------------------------------------------------------------------------

  describe('fetcher source inference', () => {
    it('infers "playwright" from playwright collector type', async () => {
      const moduleRow = makeModuleRow({ collector_type: 'playwright-collector' })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles[0].fetcherSource).toBe('playwright')
    })

    it('infers "api" from api collector type', async () => {
      const moduleRow = makeModuleRow({ collector_type: 'api-collector' })
      const failureObs = makeFailureObservation()

      const pool = createMockPool([
        { rows: [moduleRow] },
        { rows: [] },
        { rows: [failureObs] },
        { rows: [] },
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles[0].fetcherSource).toBe('api')
    })
  })

  // -------------------------------------------------------------------------
  // Multiple modules
  // -------------------------------------------------------------------------

  describe('multiple modules', () => {
    it('processes multiple failing modules in a single run', async () => {
      const mod1 = makeModuleRow({ module_id: 'mod-1', provider_id: 'wise' })
      const mod2 = makeModuleRow({ module_id: 'mod-2', provider_id: 'remitly' })
      const fail1 = makeFailureObservation({ observation_id: 'obs-1' })
      const fail2 = makeFailureObservation({ observation_id: 'obs-2' })

      const pool = createMockPool([
        { rows: [mod1, mod2] },  // module_registry scan returns 2 modules
        { rows: [] },             // mod-1: no existing bundle
        { rows: [fail1] },        // mod-1: failure observations
        { rows: [] },             // mod-1: INSERT bundle
        { rows: [] },             // mod-2: no existing bundle
        { rows: [fail2] },        // mod-2: failure observations
        { rows: [] },             // mod-2: INSERT bundle
      ])

      const detector = new FailureDetector(pool)
      const bundles = await detector.detectFailures()

      expect(bundles).toHaveLength(2)
      expect(bundles[0].providerId).toBe('wise')
      expect(bundles[1].providerId).toBe('remitly')
    })
  })
})
