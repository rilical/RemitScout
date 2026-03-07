import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resolveLlmConnector,
  validateResolvedLlmConfig,
} from '../scripts/aws/agent-llm-startup'
import {
  registerBuiltInHandlers,
  shouldRequireAgentQueues,
} from '../scripts/aws/agent-orchestrator-ecs'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('agent orchestrator ecs llm startup validation', () => {
  it('fails in staging when bedrock region is missing', () => {
    process.env.ENVIRONMENT = 'staging'
    process.env.AGENT_LLM_CONNECTOR = 'bedrock'
    process.env.AGENT_LLM_MODEL = 'anthropic.claude-sonnet-4-20250514-v1:0'
    process.env.AGENT_BEDROCK_REGION = ''
    process.env.AGENT_BEDROCK_MODEL_ID = 'anthropic.claude-sonnet-4-20250514-v1:0'
    process.env.AGENT_LLM_PROMPT_VERSION = 'v1'

    expect(() => validateResolvedLlmConfig()).toThrow(/AGENT_BEDROCK_REGION/)
  })

  it('fails in staging anthropic mode without secret arn', () => {
    process.env.ENVIRONMENT = 'staging'
    process.env.AGENT_LLM_CONNECTOR = 'anthropic'
    process.env.AGENT_LLM_MODEL = 'claude-sonnet-4-20250514'
    process.env.AGENT_ANTHROPIC_API_KEY = 'sk-ant-test'
    process.env.AGENT_ANTHROPIC_API_KEY_SECRET_ARN = ''
    process.env.AGENT_LLM_PROMPT_VERSION = 'v1'

    expect(() => validateResolvedLlmConfig()).toThrow(/AGENT_ANTHROPIC_API_KEY_SECRET_ARN/)
  })

  it('passes in development anthropic mode with direct key', () => {
    process.env.ENVIRONMENT = 'development'
    process.env.AGENT_LLM_CONNECTOR = 'anthropic'
    process.env.AGENT_LLM_MODEL = 'claude-sonnet-4-20250514'
    process.env.AGENT_ANTHROPIC_API_KEY = 'sk-ant-local'
    process.env.AGENT_LLM_PROMPT_VERSION = 'v1'

    expect(validateResolvedLlmConfig()).toMatchObject({
      connector: 'anthropic',
      prodLike: false,
      missing: [],
    })
  })

  it('defaults to anthropic in development when connector is unset', () => {
    process.env.ENVIRONMENT = 'development'
    expect(resolveLlmConnector()).toBe('anthropic')
  })

  it('defaults to bedrock in staging when connector is unset', () => {
    process.env.ENVIRONMENT = 'staging'
    expect(resolveLlmConnector()).toBe('bedrock')
  })
})

describe('agent orchestrator queue validation contract', () => {
  it('skips queue validation only when both agent queues are off', () => {
    expect(shouldRequireAgentQueues({
      agentFailure: { mode: 'off' },
      toolRequest: { mode: 'off' },
    })).toBe(false)
  })

  it('requires queue validation when the failure queue is enabled', () => {
    expect(shouldRequireAgentQueues({
      agentFailure: { mode: 'queue' },
      toolRequest: { mode: 'off' },
    })).toBe(true)
  })

  it('requires queue validation when the tool request queue is enabled', () => {
    expect(shouldRequireAgentQueues({
      agentFailure: { mode: 'off' },
      toolRequest: { mode: 'queue' },
    })).toBe(true)
  })

  it('registers the routed stress and repair handlers alongside existing handlers', () => {
    const registerHandler = vi.fn()
    registerBuiltInHandlers(
      { registerHandler },
      {
        parser: { handlerType: 'parser', execute: async () => ({ success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: 0 }) },
        contractTest: { handlerType: 'contract_test', execute: async () => ({ success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: 0 }) },
        stressResponse: { handlerType: 'stress_response', execute: async () => ({ success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: 0 }) },
        repairFallback: { handlerType: 'repair_fallback', execute: async () => ({ success: true, itemsProcessed: 0, itemsFailed: 0, durationMs: 0 }) },
      },
    )

    expect(registerHandler.mock.calls.map(([queueName]) => queueName)).toEqual([
      'agent-patch-propose',
      'agent-contract-test',
      'agent-stress-respond',
      'agent-repair',
    ])
  })
})
