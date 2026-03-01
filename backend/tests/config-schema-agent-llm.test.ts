import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  config: {} as Record<string, unknown>,
}))

vi.mock('../shared/config', () => ({
  get config() {
    return state.config
  },
}))

import { validateConfigOrThrow } from '../shared/config-schema'

const makeBaseConfig = () => ({
  env: 'test',
  envName: 'staging',
  runtime: {
    isAwsRuntime: true,
    isStrictConfig: true,
    isLambda: false,
    isEcs: true,
  },
  aws: {
    region: 'us-east-1',
    sesRegion: 'us-east-1',
    snsRegion: 'us-east-1',
  },
  db: {
    url: 'postgres://user:pass@localhost:5432/app',
    planeAUrl: 'postgres://user:pass@localhost:5432/app',
    planeBUrl: 'postgres://user:pass@localhost:5432/app',
    planeCUrl: 'postgres://user:pass@localhost:5432/app',
  },
  redis: {
    url: 'redis://localhost:6379/0',
  },
  queues: {
    quoteRefreshUrl: '',
    fxRateRefreshUrl: '',
    exports: { url: '' },
    ingestFanout: { url: '' },
    notifications: { url: '' },
    opsAlerts: { url: '' },
    goldLive: { url: '' },
    agentFailure: { url: '' },
    agentStress: { url: '' },
    toolRequest: { url: '' },
  },
  storage: {
    bronze: { bucket: '' },
    exports: { bucket: '' },
  },
  planeA: {
    jwtSecret: 'local-dev-jwt-secret',
    planeCBaseUrl: 'https://plane-c.example.com',
    requireJwt: true,
    adminIpAllowlist: ['1.2.3.4/32'],
  },
  agent: {
    enabled: true,
    orchestratorEnabled: true,
    llmConnector: 'bedrock',
    llmModel: 'anthropic.claude-sonnet-4-20250514-v1:0',
    llmMaxTokens: 2048,
    llmTemperature: 0.2,
    anthropicApiKey: '',
    anthropicApiKeySecretArn: '',
    bedrockRegion: 'us-east-1',
    bedrockModelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
    bedrockMaxTokens: 2048,
    bedrockSecretArn: '',
    llmPromptVersion: 'v1',
    telemetryDims: [],
  },
  privacy: {
    hashSalt: 'hash-salt',
    sessionSalt: 'session-salt',
  },
  planeC: {
    internalApiToken: 'internal-token',
    requireInternalAuth: true,
  },
  alerts: {
    slackWebhookUrl: '',
    email: { enabled: false, smtpHost: '', from: '' },
    evaluation: { queueUrl: '', enabled: false, batchSize: 1, concurrency: 1 },
  },
  auth: {
    supabase: { url: '', publishableKey: '' },
  },
  billing: {
    stripe: {
      secretKey: '',
      webhookSecret: '',
      priceIdPlus: '',
      priceIdPlusAnnual: '',
    },
  },
})

describe('config schema agent llm validation', () => {
  beforeEach(() => {
    state.config = makeBaseConfig()
  })

  it('accepts valid bedrock configuration', () => {
    expect(() => validateConfigOrThrow({})).not.toThrow()
  })

  it('rejects bedrock model not in regional allowlist', () => {
    ;(state.config as any).agent.bedrockModelId = 'anthropic.claude-unknown-v1:0'
    expect(() => validateConfigOrThrow({})).toThrow(/not in allowlist/i)
  })

  it('rejects staging anthropic connector without secret arn', () => {
    ;(state.config as any).agent.llmConnector = 'anthropic'
    ;(state.config as any).agent.anthropicApiKey = 'sk-ant-test'
    ;(state.config as any).agent.anthropicApiKeySecretArn = ''

    expect(() => validateConfigOrThrow({})).toThrow(/AGENT_ANTHROPIC_API_KEY_SECRET_ARN/i)
  })

  it('accepts local anthropic connector with direct key', () => {
    ;(state.config as any).envName = 'development'
    ;(state.config as any).agent.llmConnector = 'anthropic'
    ;(state.config as any).agent.anthropicApiKey = 'sk-ant-local'
    ;(state.config as any).agent.anthropicApiKeySecretArn = ''

    expect(() => validateConfigOrThrow({})).not.toThrow()
  })
})
