import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'

const mockQuery = vi.fn()
const mockDeleteStripeCustomer = vi.fn()
const mockDeleteSupabaseAccount = vi.fn()
const mockAnonymizeTelemetryData = vi.fn()
const mockLogAuditEvent = vi.fn().mockResolvedValue('evt')
const mockGetRequestContext = vi.fn().mockReturnValue({})
const mockGetUserPlan = vi.fn()
const mockS3Send = vi.fn()

vi.mock('../shared/db', () => ({
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../plane-a/src/services/stripe-admin', () => ({
  deleteStripeCustomer: (...args: any[]) => mockDeleteStripeCustomer(...args),
}))

vi.mock('../plane-a/src/services/supabase-admin', () => ({
  deleteSupabaseAccount: (...args: any[]) => mockDeleteSupabaseAccount(...args),
}))

vi.mock('../plane-a/src/services/telemetry-anonymization', () => ({
  anonymizeTelemetryData: (...args: any[]) => mockAnonymizeTelemetryData(...args),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  logAuditEvent: (...args: any[]) => mockLogAuditEvent(...args),
  getRequestContext: (...args: any[]) => mockGetRequestContext(...args),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: (...args: any[]) => mockS3Send(...args) })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
}))

const loadModule = async (overrides?: Partial<any>) => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      observability: {
        cloudwatch: {
          enabled: false,
        },
        newRelicMetrics: {
          enabled: false,
          ingestKey: '',
          endpoint: 'https://metric-api.newrelic.com/metric/v1',
          batchSize: 100,
          flushIntervalMs: 10_000,
          maxQueue: 5_000,
          serviceName: '',
          normalizedEnvironment: 'test',
        },
      },
      storage: {
        exports: {
          bucket: '',
          prefix: 'exports',
        },
      },
      billing: {
        stripe: {
          secretKey: '',
        },
      },
      auth: {
        supabase: {
          serviceRoleKey: '',
          url: '',
        },
      },
      ...overrides,
    },
  }))

  return await import('../plane-a/src/services/account-deletion')
}

const makePool = (): Pool => {
  return {
    connect: vi.fn().mockResolvedValue({
      query: (sql: string, params?: any[]) => mockQuery(sql, params),
      release: vi.fn(),
    }),
  } as any as Pool
}

describe('account-deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
    mockGetUserPlan.mockResolvedValue(null)
    mockAnonymizeTelemetryData.mockResolvedValue(undefined)
  })

  it('returns user_not_found when account missing', async () => {
    const { deleteUserAccount } = await loadModule()

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [], rowCount: 0 }
      }
      return { rows: [], rowCount: 0 }
    })

    const result = await deleteUserAccount(makePool(), 'user-1')

    expect(result.deleted).toBe(false)
    expect(result.errors).toContain('user_not_found')
  })

  it('adds warnings when external services are not configured', async () => {
    const { deleteUserAccount } = await loadModule()

    mockGetUserPlan.mockResolvedValue({
      user_id: 'user-1',
      stripe_customer_id: 'cus_123',
      plan_code: 'plus',
    })

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [{ email: 'user@example.com' }], rowCount: 1 }
      }
      if (sql.includes('FROM silver.export_job')) {
        return { rows: [{ s3_key: 'exports/file.csv' }], rowCount: 1 }
      }
      if (sql.includes('DELETE FROM silver.user_account')) {
        return { rows: [{ user_id: 'user-1' }], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })

    const result = await deleteUserAccount(makePool(), 'user-1')

    expect(result.deleted).toBe(true)
    expect(result.warnings).toEqual(expect.arrayContaining([
      'stripe_secret_missing',
      'exports_bucket_not_configured',
      'supabase_service_role_missing',
    ]))
    expect(mockDeleteStripeCustomer).not.toHaveBeenCalled()
    expect(mockS3Send).not.toHaveBeenCalled()
  })

  it('calls external cleanups when configured', async () => {
    const { deleteUserAccount } = await loadModule({
      storage: {
        exports: {
          bucket: 'exports-bucket',
          prefix: 'exports',
        },
      },
      billing: {
        stripe: {
          secretKey: 'sk_test', // pragma: allowlist secret
        },
      },
      auth: {
        supabase: {
          serviceRoleKey: 'service-key',
          url: 'https://supabase.test',
        },
      },
    })

    mockGetUserPlan.mockResolvedValue({
      user_id: 'user-1',
      stripe_customer_id: 'cus_123',
      plan_code: 'plus',
    })

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [{ email: 'user@example.com' }], rowCount: 1 }
      }
      if (sql.includes('FROM silver.export_job')) {
        return { rows: [{ s3_key: 'exports/file.csv' }, { s3_key: 'exports/file.csv' }], rowCount: 2 }
      }
      if (sql.includes('DELETE FROM silver.user_account')) {
        return { rows: [{ user_id: 'user-1' }], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })

    const result = await deleteUserAccount(makePool(), 'user-1')

    expect(result.deleted).toBe(true)
    expect(mockDeleteStripeCustomer).toHaveBeenCalledWith('cus_123')
    expect(mockDeleteSupabaseAccount).toHaveBeenCalledWith('user-1', 'service-key', 'https://supabase.test')
    expect(mockS3Send).toHaveBeenCalledTimes(1)
  })
})
