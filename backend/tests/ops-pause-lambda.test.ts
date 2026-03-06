import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mockEcsSend = vi.fn()
const mockEventsSend = vi.fn()
const mockSqsSend = vi.fn()
const mockSsmSend = vi.fn()
const mockRdsSend = vi.fn()
const mockElastiCacheSend = vi.fn()
const mockRecordCloudWatchMetric = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}

vi.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: vi.fn().mockImplementation(() => ({ send: mockEcsSend })),
  DescribeServicesCommand: vi.fn().mockImplementation((input) => ({ __name: 'DescribeServicesCommand', input })),
  DescribeTasksCommand: vi.fn().mockImplementation((input) => ({ __name: 'DescribeTasksCommand', input })),
  ListServicesCommand: vi.fn().mockImplementation((input) => ({ __name: 'ListServicesCommand', input })),
  ListTasksCommand: vi.fn().mockImplementation((input) => ({ __name: 'ListTasksCommand', input })),
  StopTaskCommand: vi.fn().mockImplementation((input) => ({ __name: 'StopTaskCommand', input })),
  UpdateServiceCommand: vi.fn().mockImplementation((input) => ({ __name: 'UpdateServiceCommand', input })),
}))

vi.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: vi.fn().mockImplementation(() => ({ send: mockEventsSend })),
  DisableRuleCommand: vi.fn().mockImplementation((input) => ({ __name: 'DisableRuleCommand', input })),
  EnableRuleCommand: vi.fn().mockImplementation((input) => ({ __name: 'EnableRuleCommand', input })),
  ListRulesCommand: vi.fn().mockImplementation((input) => ({ __name: 'ListRulesCommand', input })),
}))

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn().mockImplementation(() => ({ send: mockSqsSend })),
  GetQueueAttributesCommand: vi.fn().mockImplementation((input) => ({ __name: 'GetQueueAttributesCommand', input })),
  PurgeQueueCommand: vi.fn().mockImplementation((input) => ({ __name: 'PurgeQueueCommand', input })),
}))

vi.mock('@aws-sdk/client-rds', () => ({
  RDSClient: vi.fn().mockImplementation(() => ({ send: mockRdsSend })),
  DescribeDBClustersCommand: vi.fn().mockImplementation((input) => ({ __name: 'DescribeDBClustersCommand', input })),
  StartDBClusterCommand: vi.fn().mockImplementation((input) => ({ __name: 'StartDBClusterCommand', input })),
  StopDBClusterCommand: vi.fn().mockImplementation((input) => ({ __name: 'StopDBClusterCommand', input })),
}))

vi.mock('@aws-sdk/client-elasticache', () => ({
  ElastiCacheClient: vi.fn().mockImplementation(() => ({ send: mockElastiCacheSend })),
  CreateReplicationGroupCommand: vi.fn().mockImplementation((input) => ({ __name: 'CreateReplicationGroupCommand', input })),
  DeleteReplicationGroupCommand: vi.fn().mockImplementation((input) => ({ __name: 'DeleteReplicationGroupCommand', input })),
  DescribeReplicationGroupsCommand: vi.fn().mockImplementation((input) => ({ __name: 'DescribeReplicationGroupsCommand', input })),
}))

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn().mockImplementation(() => ({ send: mockSsmSend })),
  GetParameterCommand: vi.fn().mockImplementation((input) => ({ __name: 'GetParameterCommand', input })),
  PutParameterCommand: vi.fn().mockImplementation((input) => ({ __name: 'PutParameterCommand', input })),
}))

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: mockRecordCloudWatchMetric,
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => mockLogger),
}))

type RuntimeMocksOptions = {
  initialRuleStates?: Record<string, string>
  mutableRuleStates?: boolean
  listRuleSnapshots?: Array<Record<string, string>>
  initialDesiredCounts?: Record<string, number>
  mutableDesiredCounts?: boolean
  purgeFailures?: Record<string, Error>
}

const RULE_NAME = 'remit-scout-dev-b2b-sweep-scheduler'
const SERVICE_NAME = 'svc-a'
const QUEUE_URL_1 = 'https://sqs.us-east-1.amazonaws.com/123456789012/remit-scout-dev-ingest-fanout'
const QUEUE_URL_2 = 'https://sqs.us-east-1.amazonaws.com/123456789012/remit-scout-dev-gold-live'

const originalEnv = process.env

const setBaseEnv = (overrides: Record<string, string | undefined> = {}): void => {
  process.env = {
    ...originalEnv,
    ENVIRONMENT: 'dev',
    PAUSE_PARAM_NAME: '/remit-scout/dev/ops/paused',
    HARD_STOP_ENABLED: '0',
    PAUSE_ECS: '1',
    ECS_CLUSTER_NAME: 'remit-scout-dev',
    ECS_SERVICES_JSON: JSON.stringify([SERVICE_NAME]),
    ECS_BASELINE_JSON: JSON.stringify({ [SERVICE_NAME]: 2 }),
    EVENT_RULE_PREFIX: 'remit-scout-dev-',
    EVENT_RULE_ALLOWLIST: JSON.stringify(['b2b-sweep-scheduler']),
    PURGE_QUEUES_ON_RESUME: '1',
    PURGE_QUEUE_URLS_JSON: JSON.stringify([QUEUE_URL_1, QUEUE_URL_2]),
    DB_CLUSTER_ID: '',
    REDIS_REPLICATION_GROUP_ID: '',
    REDIS_SUBNET_GROUP_NAME: '',
    REDIS_SECURITY_GROUP_IDS: '[]',
    REDIS_ALLOW_DELETE: '0',
    ...overrides,
  }
}

const setupRuntimeMocks = (options: RuntimeMocksOptions = {}): void => {
  const {
    initialRuleStates = { [RULE_NAME]: 'DISABLED' },
    mutableRuleStates = true,
    listRuleSnapshots = [],
    initialDesiredCounts = { [SERVICE_NAME]: 0 },
    mutableDesiredCounts = true,
    purgeFailures = {},
  } = options
  const ruleStates = { ...initialRuleStates }
  const desiredCounts = { ...initialDesiredCounts }
  let listRulesCall = 0

  mockSsmSend.mockImplementation(async () => ({}))
  mockRdsSend.mockImplementation(async () => ({}))
  mockElastiCacheSend.mockImplementation(async () => ({}))

  mockEventsSend.mockImplementation(async (command: { __name: string; input: Record<string, string> }) => {
    if (command.__name === 'ListRulesCommand') {
      const snapshot = listRuleSnapshots[listRulesCall]
      listRulesCall += 1
      const activeStates = snapshot ?? ruleStates
      return {
        Rules: Object.entries(activeStates).map(([Name, State]) => ({ Name, State })),
      }
    }
    if (command.__name === 'DisableRuleCommand') {
      if (mutableRuleStates) {
        ruleStates[command.input.Name] = 'DISABLED'
      }
      return {}
    }
    if (command.__name === 'EnableRuleCommand') {
      if (mutableRuleStates) {
        ruleStates[command.input.Name] = 'ENABLED'
      }
      return {}
    }
    return {}
  })

  mockEcsSend.mockImplementation(async (command: { __name: string; input: any }) => {
    if (command.__name === 'UpdateServiceCommand') {
      if (mutableDesiredCounts) {
        desiredCounts[command.input.service] = command.input.desiredCount
      }
      return {}
    }
    if (command.__name === 'ListServicesCommand') {
      return {
        serviceArns: Object.keys(desiredCounts).map(
          (serviceName) => `arn:aws:ecs:us-east-1:123456789012:service/${command.input.cluster}/${serviceName}`,
        ),
      }
    }
    if (command.__name === 'DescribeServicesCommand') {
      return {
        services: (command.input.services as string[]).map((serviceName) => ({
          serviceName,
          desiredCount: desiredCounts[serviceName] ?? 0,
        })),
      }
    }
    if (command.__name === 'ListTasksCommand') {
      return { taskArns: [] }
    }
    if (command.__name === 'DescribeTasksCommand') {
      return { tasks: [] }
    }
    return {}
  })

  mockSqsSend.mockImplementation(async (command: { __name: string; input: Record<string, string> }) => {
    if (command.__name === 'GetQueueAttributesCommand') {
      return {
        Attributes: {
          ApproximateNumberOfMessages: '3',
          ApproximateNumberOfMessagesNotVisible: '1',
        },
      }
    }
    if (command.__name === 'PurgeQueueCommand') {
      const failure = purgeFailures[command.input.QueueUrl]
      if (failure) {
        throw failure
      }
      return {}
    }
    return {}
  })
}

const loadHandler = async (): Promise<(event: { paused?: boolean }) => Promise<{ paused: boolean }>> => {
  vi.resetModules()
  const module = await import('../scripts/aws/ops-pause-lambda')
  return module.handler
}

describe('ops-pause-lambda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setBaseEnv()
    setupRuntimeMocks()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('purges all allowlisted queues on resume when enabled', async () => {
    const handler = await loadHandler()
    await handler({ paused: false })

    const purgeCalls = mockSqsSend.mock.calls
      .map(([command]) => command)
      .filter((command) => command.__name === 'PurgeQueueCommand')
    expect(purgeCalls).toHaveLength(2)
    expect(purgeCalls.map((command) => command.input.QueueUrl)).toEqual([QUEUE_URL_1, QUEUE_URL_2])
  })

  it('does not purge queues on resume when purge is disabled', async () => {
    setBaseEnv({
      PURGE_QUEUES_ON_RESUME: '0',
    })
    const handler = await loadHandler()
    await handler({ paused: false })

    const purgeCalls = mockSqsSend.mock.calls
      .map(([command]) => command)
      .filter((command) => command.__name === 'PurgeQueueCommand')
    expect(purgeCalls).toHaveLength(0)
  })

  it('does not purge queues when pausing', async () => {
    const handler = await loadHandler()
    await handler({ paused: true })

    const purgeCalls = mockSqsSend.mock.calls
      .map(([command]) => command)
      .filter((command) => command.__name === 'PurgeQueueCommand')
    expect(purgeCalls).toHaveLength(0)
  })

  it('continues resume when purge returns PurgeQueueInProgress', async () => {
    setupRuntimeMocks({
      purgeFailures: {
        [QUEUE_URL_1]: new Error('PurgeQueueInProgress'),
      },
    })
    const handler = await loadHandler()
    const result = await handler({ paused: false })

    expect(result.paused).toBe(false)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'queue_purge_in_progress',
      expect.objectContaining({ queueUrl: QUEUE_URL_1 }),
    )
    const ecsUpdateCalls = mockEcsSend.mock.calls
      .map(([command]) => command)
      .filter((command) => command.__name === 'UpdateServiceCommand')
    expect(ecsUpdateCalls.length).toBeGreaterThan(0)
  })

  it('logs drift when EventBridge rule state mismatches expected state', async () => {
    setBaseEnv({
      EVENT_RULE_ALLOWLIST: '[]',
    })
    setupRuntimeMocks({
      mutableRuleStates: false,
      initialRuleStates: { [RULE_NAME]: 'ENABLED' },
    })
    const handler = await loadHandler()
    await handler({ paused: false })

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'pause_state_validation_drift',
      expect.objectContaining({
        drift: expect.arrayContaining([
          expect.stringContaining(`rule:${RULE_NAME}`),
        ]),
      }),
    )
  })

  it('logs drift when ECS desired count mismatches expected count', async () => {
    setupRuntimeMocks({
      mutableDesiredCounts: false,
      initialDesiredCounts: { [SERVICE_NAME]: 0 },
    })
    const handler = await loadHandler()
    await handler({ paused: false })

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'pause_state_validation_drift',
      expect.objectContaining({
        drift: expect.arrayContaining([
          expect.stringContaining(`service:${SERVICE_NAME}`),
        ]),
      }),
    )
  })

  it('emits purge and drift metrics', async () => {
    setupRuntimeMocks({
      purgeFailures: {
        [QUEUE_URL_2]: new Error('PurgeQueueInProgress'),
      },
    })
    const handler = await loadHandler()
    await handler({ paused: false })

    expect(mockRecordCloudWatchMetric).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ops_pause_queues_purged',
      value: 1,
    }))
    expect(mockRecordCloudWatchMetric).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ops_pause_purge_failed',
      value: 1,
    }))
    expect(mockRecordCloudWatchMetric).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ops_pause_drift_detected',
      value: expect.any(Number),
    }))
  })
})
