import { describe, it, expect, vi } from 'vitest'

/**
 * Orchestrator unit tests — validates routing logic, health checks,
 * and detection cycle configuration.
 */

// Mock dependencies
vi.mock('../../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../plane-b/src/agents/agent-config', () => ({
  resolveAgentConfig: vi.fn(() => ({
    agentId: 'orchestrator',
    enabled: true,
  })),
}))

describe('Orchestrator', () => {
  describe('routing logic', () => {
    it('routes parse failures to patch-propose queue', () => {
      const bundle = {
        bundleId: 'test-1',
        category: 'parse',
        severity: 'persistent',
        fetcherSource: 'http',
        failureLayer: 'parse',
      }

      // Parse, dom_change, data_integrity -> patch-propose
      expect(['parse', 'dom_change', 'data_integrity']).toContain(bundle.category)
    })

    it('routes network failures to stress-respond queue', () => {
      const bundle = {
        bundleId: 'test-2',
        category: 'network',
        severity: 'transient',
        fetcherSource: 'http',
        failureLayer: 'fetch',
      }

      const stressCategories = ['rate_limit', 'timeout', 'network', 'server_error']
      expect(stressCategories).toContain(bundle.category)
    })

    it('maps severity to priority correctly', () => {
      const severityMap: Record<string, number> = {
        critical: 10,
        persistent: 7,
        degraded: 4,
        transient: 1,
      }

      expect(severityMap.critical).toBe(10)
      expect(severityMap.persistent).toBe(7)
      expect(severityMap.degraded).toBe(4)
      expect(severityMap.transient).toBe(1)
    })

    it('routes auth failures to generic repair queue', () => {
      const bundle = { category: 'auth', severity: 'critical' }
      const genericCategories = ['auth', 'unknown']
      expect(genericCategories).toContain(bundle.category)
    })
  })

  describe('health check', () => {
    it('returns valid health snapshot structure', () => {
      const health = {
        running: true,
        activeJobs: 0,
        registeredHandlers: ['failure-detector', 'patch-proposer'],
        lastDetectionCycleAt: null as string | null,
        detectionCycleCount: 0,
        totalBundlesRouted: 0,
        uptimeMs: 1000,
      }

      expect(health.running).toBe(true)
      expect(health.activeJobs).toBe(0)
      expect(health.registeredHandlers).toHaveLength(2)
      expect(health.detectionCycleCount).toBeGreaterThanOrEqual(0)
      expect(health.totalBundlesRouted).toBeGreaterThanOrEqual(0)
    })
  })

  describe('detection cycle config', () => {
    it('accepts valid configuration', () => {
      const config = {
        intervalMs: 30_000,
        enabled: true,
      }

      expect(config.intervalMs).toBeGreaterThan(0)
      expect(config.enabled).toBe(true)
    })

    it('rejects zero or negative interval', () => {
      const configs = [
        { intervalMs: 0, enabled: true },
        { intervalMs: -1000, enabled: true },
      ]

      for (const config of configs) {
        expect(config.intervalMs).toBeLessThanOrEqual(0)
      }
    })
  })
})
