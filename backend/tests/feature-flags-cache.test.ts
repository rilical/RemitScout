import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.hoisted(() => vi.fn())
const mockRedisGet = vi.hoisted(() => vi.fn())
const mockRedisSet = vi.hoisted(() => vi.fn())
const mockRedisDel = vi.hoisted(() => vi.fn())

vi.mock('../shared/config', () => ({
  config: {
    envName: 'staging',
    planeA: {
      featureFlagsCacheTtlSeconds: 60,
    },
  },
}))

vi.mock('../shared/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
  }),
}))

describe('feature flags cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caches feature flags with 60s TTL', async () => {
    const { listFeatureFlags } = await import('../plane-a/src/services/feature-flags')

    mockRedisGet.mockResolvedValue(null)
    mockQuery.mockResolvedValue({
      rows: [{
        key: 'ops.new_pipeline',
        enabled: true,
        audience_rules: { global: true },
        metadata: {},
        updated_by: null,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }],
    })

    const flags = await listFeatureFlags({} as any)
    expect(flags).toHaveLength(1)
    expect(mockRedisSet).toHaveBeenCalledWith(
      'plane-a:feature-flags:v1',
      expect.any(String),
      expect.objectContaining({ EX: 60 }),
    )
  })

  it('invalidates cache after update', async () => {
    const { updateFeatureFlag } = await import('../plane-a/src/services/feature-flags')

    const now = new Date().toISOString()
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          key: 'ops.new_pipeline',
          enabled: false,
          audience_rules: { global: true },
          metadata: {},
          updated_by: null,
          updated_at: now,
          created_at: now,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          key: 'ops.new_pipeline',
          enabled: true,
          audience_rules: { global: true },
          metadata: {},
          updated_by: null,
          updated_at: now,
          created_at: now,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })

    const updated = await updateFeatureFlag({} as any, {
      key: 'ops.new_pipeline',
      enabled: true,
      updatedBy: null,
    })

    expect(updated?.enabled).toBe(true)
    expect(mockRedisDel).toHaveBeenCalledWith('plane-a:feature-flags:v1')
  })

  it('normalizes nullable runtime flag context values', async () => {
    const { getEffectiveRuntimeFlags } = await import('../plane-a/src/services/feature-flags')

    mockRedisGet.mockResolvedValue(null)
    mockQuery.mockResolvedValue({ rows: [] })

    const runtime = await getEffectiveRuntimeFlags({} as any, {
      effectivePlanCode: null,
      pulseAccess: null,
      envName: null,
    })

    expect(runtime.flags).toHaveLength(4)
    expect(runtime.flags.every((flag) => flag.plan_code === 'free')).toBe(true)
    expect(runtime.flags.every((flag) => flag.pulse_access === 'none')).toBe(true)
  })
})
