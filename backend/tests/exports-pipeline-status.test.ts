import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLoadAwsOpsServiceHealth = vi.hoisted(() => vi.fn())
const mockConfig = vi.hoisted(() => ({
  env: 'staging',
  envName: 'staging',
  queues: {
    exports: {
      mode: 'queue',
      url: 'https://example.com/export-queue',
    },
  },
  storage: {
    exports: {
      bucket: 'remit-scout-exports-staging',
    },
  },
}))

vi.mock('../shared/config', () => ({
  config: mockConfig,
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/sqs', () => ({
  sendJsonMessage: vi.fn(),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: class {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  },
  S3Client: class {},
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}))

vi.mock('../plane-a/src/services/aws-ops-health', () => ({
  loadAwsOpsServiceHealth: (...args: unknown[]) => mockLoadAwsOpsServiceHealth(...args),
}))

describe('getExportPipelineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig.env = 'staging'
    mockConfig.envName = 'staging'
    mockConfig.queues.exports.mode = 'queue'
    mockConfig.queues.exports.url = 'https://example.com/export-queue'
    mockConfig.storage.exports.bucket = 'remit-scout-exports-staging'
  })

  it('accepts exports when ops are active and the export worker is healthy', async () => {
    mockLoadAwsOpsServiceHealth.mockResolvedValue({
      source: 'aws',
      updatedAt: '2026-03-07T02:00:00.000Z',
      services: [
        { service_id: 'ops-pause-state', status: 'healthy', display_name: 'Ops Pause State', last_active_at: null, message: null },
        { service_id: 'export-worker', status: 'healthy', display_name: 'Export Worker', last_active_at: null, message: 'desired=1 | running=1 | pending=0' },
      ],
    })

    const { getExportPipelineStatus } = await import('../plane-a/src/routes/exports.service')
    await expect(getExportPipelineStatus()).resolves.toEqual({ ok: true })
  })

  it('blocks exports when ops pause is active', async () => {
    mockLoadAwsOpsServiceHealth.mockResolvedValue({
      source: 'aws',
      updatedAt: '2026-03-07T02:00:00.000Z',
      services: [
        { service_id: 'ops-pause-state', status: 'degraded', display_name: 'Ops Pause State', last_active_at: null, message: 'Paused via /remit-scout/staging/ops/paused' },
        { service_id: 'export-worker', status: 'degraded', display_name: 'Export Worker', last_active_at: null, message: 'desired=0 | running=0 | baseline=1 | paused-by-ops' },
      ],
    })

    const { getExportPipelineStatus } = await import('../plane-a/src/routes/exports.service')
    await expect(getExportPipelineStatus()).resolves.toMatchObject({
      ok: false,
      error: 'exports_paused',
    })
  })

  it('blocks exports when the export worker is offline', async () => {
    mockLoadAwsOpsServiceHealth.mockResolvedValue({
      source: 'aws',
      updatedAt: '2026-03-07T02:00:00.000Z',
      services: [
        { service_id: 'ops-pause-state', status: 'healthy', display_name: 'Ops Pause State', last_active_at: null, message: null },
        { service_id: 'export-worker', status: 'offline', display_name: 'Export Worker', last_active_at: null, message: 'Service not found in ECS cluster remit-scout-staging' },
      ],
    })

    const { getExportPipelineStatus } = await import('../plane-a/src/routes/exports.service')
    await expect(getExportPipelineStatus()).resolves.toMatchObject({
      ok: false,
      error: 'exports_worker_unavailable',
      message: 'Service not found in ECS cluster remit-scout-staging',
    })
  })

  it('fails closed when export worker health cannot be verified', async () => {
    mockLoadAwsOpsServiceHealth.mockRejectedValue(new Error('ecs unavailable'))

    const { getExportPipelineStatus } = await import('../plane-a/src/routes/exports.service')
    await expect(getExportPipelineStatus()).resolves.toMatchObject({
      ok: false,
      error: 'exports_health_check_failed',
    })
  })

  it('skips AWS health checks outside prod-like environments', async () => {
    mockConfig.env = 'development'
    mockConfig.envName = 'dev'

    const { getExportPipelineStatus } = await import('../plane-a/src/routes/exports.service')
    await expect(getExportPipelineStatus()).resolves.toEqual({ ok: true })
    expect(mockLoadAwsOpsServiceHealth).not.toHaveBeenCalled()
  })
})
