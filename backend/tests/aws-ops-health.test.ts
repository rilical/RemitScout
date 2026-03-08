import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockEcsSend = vi.hoisted(() => vi.fn())
const mockSsmSend = vi.hoisted(() => vi.fn())

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn().mockImplementation(() => ({ send: mockEcsSend })),
  ListServicesCommand: vi.fn().mockImplementation((input) => ({ __name: 'ListServicesCommand', input })),
  DescribeServicesCommand: vi.fn().mockImplementation((input) => ({ __name: 'DescribeServicesCommand', input })),
}))

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn().mockImplementation(() => ({ send: mockSsmSend })),
  GetParameterCommand: vi.fn().mockImplementation((input) => ({ __name: 'GetParameterCommand', input })),
}))

vi.mock('../shared/config', () => ({
  config: {
    env: 'staging',
    envName: 'staging',
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('loadAwsOpsServiceHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSsmSend.mockImplementation(async (command: { input: { Name: string } }) => {
      if (command.input.Name.endsWith('/ops/paused')) {
        return {
          Parameter: {
            Value: 'true',
            LastModifiedDate: new Date('2026-03-07T01:00:00.000Z'),
          },
        }
      }

      if (command.input.Name.endsWith('/ops/pause/ecs-baseline')) {
        return {
          Parameter: {
            Value: JSON.stringify({
              PlaneBIngestService: 1,
              ExportWorkerService: 0,
            }),
          },
        }
      }

      return { Parameter: {} }
    })

    mockEcsSend.mockImplementation(async (command: { __name: string }) => {
      if (command.__name === 'ListServicesCommand') {
        return {
          serviceArns: [
            'arn:aws:ecs:us-east-1:123456789012:service/remit-scout-staging/PlaneAService',
            'arn:aws:ecs:us-east-1:123456789012:service/remit-scout-staging/PlaneBIngestService',
            'arn:aws:ecs:us-east-1:123456789012:service/remit-scout-staging/ExportWorkerService',
          ],
        }
      }

      if (command.__name === 'DescribeServicesCommand') {
        return {
          services: [
            {
              serviceName: 'PlaneAService',
              status: 'ACTIVE',
              desiredCount: 0,
              runningCount: 0,
              pendingCount: 0,
              events: [{ createdAt: new Date('2026-03-07T01:06:00.000Z'), message: 'legacy idle' }],
            },
            {
              serviceName: 'PlaneBIngestService',
              status: 'ACTIVE',
              desiredCount: 0,
              runningCount: 0,
              pendingCount: 0,
              events: [{ createdAt: new Date('2026-03-07T01:05:00.000Z'), message: 'scaled to zero' }],
            },
            {
              serviceName: 'ExportWorkerService',
              status: 'ACTIVE',
              desiredCount: 0,
              runningCount: 0,
              pendingCount: 0,
              events: [{ createdAt: new Date('2026-03-07T01:04:00.000Z'), message: 'idle' }],
            },
          ],
        }
      }

      return {}
    })
  })

  it('classifies paused baseline services separately from intentionally idle services', async () => {
    const { loadAwsOpsServiceHealth } = await import('../plane-a/src/services/aws-ops-health')
    const result = await loadAwsOpsServiceHealth()

    expect(result.source).toBe('aws')
    expect(result.services[0]).toMatchObject({
      service_id: 'ops-pause-state',
      status: 'degraded',
    })
    expect(result.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: 'plane-b-ingest',
          status: 'degraded',
        }),
        expect.objectContaining({
          service_id: 'export-worker',
          status: 'healthy',
        }),
        expect.objectContaining({
          service_id: 'agent-orchestrator',
          status: 'offline',
          message: expect.stringContaining('Service not found in ECS cluster remit-scout-staging'),
        }),
      ]),
    )
    expect(result.services).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: 'plane-a-api',
        }),
      ]),
    )
  })

  it('surfaces missing tracked services instead of silently omitting them', async () => {
    mockEcsSend.mockImplementation(async (command: { __name: string }) => {
      if (command.__name === 'ListServicesCommand') {
        return {
          serviceArns: [
            'arn:aws:ecs:us-east-1:123456789012:service/remit-scout-staging/PlaneBIngestService',
          ],
        }
      }

      if (command.__name === 'DescribeServicesCommand') {
        return {
          services: [
            {
              serviceName: 'PlaneBIngestService',
              status: 'ACTIVE',
              desiredCount: 1,
              runningCount: 1,
              pendingCount: 0,
              events: [{ createdAt: new Date('2026-03-07T01:05:00.000Z'), message: 'steady state' }],
            },
          ],
        }
      }

      return {}
    })

    const { loadAwsOpsServiceHealth } = await import('../plane-a/src/services/aws-ops-health')
    const result = await loadAwsOpsServiceHealth()

    expect(result.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: 'plane-b-ingest',
          status: 'healthy',
        }),
        expect.objectContaining({
          service_id: 'export-worker',
          status: 'offline',
          message: expect.stringContaining('Service not found in ECS cluster remit-scout-staging'),
        }),
        expect.objectContaining({
          service_id: 'agent-orchestrator',
          status: 'offline',
          message: expect.stringContaining('Service not found in ECS cluster remit-scout-staging'),
        }),
      ]),
    )
  })

  it('falls back to an active default when pause parameters are not present', async () => {
    mockSsmSend.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'ParameterNotFound' }))
    mockSsmSend.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'ParameterNotFound' }))

    const { loadAwsOpsServiceHealth } = await import('../plane-a/src/services/aws-ops-health')
    const result = await loadAwsOpsServiceHealth()

    expect(result.source).toBe('aws')
    expect(result.message).toBeNull()
    expect(result.services[0]).toMatchObject({
      service_id: 'ops-pause-state',
      status: 'healthy',
      message: 'Active via /remit-scout/staging/ops/paused',
    })
    expect(result.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: 'plane-b-ingest',
          status: 'healthy',
        }),
      ]),
    )
  })
})
