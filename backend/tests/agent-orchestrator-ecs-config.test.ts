import { afterEach, describe, expect, it } from 'vitest'
import { validateResolvedLlmConfig } from '../scripts/aws/agent-orchestrator-ecs'

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

    expect(() => validateResolvedLlmConfig()).not.toThrow()
  })
})
