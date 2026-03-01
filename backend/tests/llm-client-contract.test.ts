import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bedrockSendMock = vi.fn(async () => ({
  body: Buffer.from(JSON.stringify({
    content: [{ type: 'text', text: '{"result":"ok"}' }],
    model: 'anthropic.claude-sonnet-4-20250514-v1:0',
    usage: { input_tokens: 11, output_tokens: 7 },
  })),
}))

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  class InvokeModelCommand {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  }

  class BedrockRuntimeClient {
    send = bedrockSendMock
    constructor(_: unknown) {}
  }

  return {
    BedrockRuntimeClient,
    InvokeModelCommand,
  }
})

import { buildLlmClient } from '../plane-b/src/agents/llm-client'

describe('llm client contract stubs', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    bedrockSendMock.mockClear()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('executes anthropic connector contract with fetch stub', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"patch":"ok"}' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 6 },
      }),
    })) as unknown as typeof fetch

    const client = buildLlmClient({
      connector: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 512,
      temperature: 0.1,
      anthropicApiKey: 'test-key',
    })

    const response = await client.sendMessage({
      systemPrompt: 'system',
      userPrompt: 'user',
    })

    expect(response.model).toBe('claude-sonnet-4-20250514')
    expect(response.content).toContain('"patch":"ok"')
    expect(response.usage.inputTokens).toBe(10)
    expect(response.usage.outputTokens).toBe(6)
  })

  it('executes bedrock connector contract with sdk stub', async () => {
    const client = buildLlmClient({
      connector: 'bedrock',
      model: 'anthropic.claude-sonnet-4-20250514-v1:0',
      maxTokens: 512,
      temperature: 0.1,
      bedrockRegion: 'us-east-1',
      bedrockModelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
    })

    const response = await client.sendMessage({
      systemPrompt: 'system',
      userPrompt: 'user',
    })

    expect(bedrockSendMock).toHaveBeenCalledTimes(1)
    expect(response.model).toBe('anthropic.claude-sonnet-4-20250514-v1:0')
    expect(response.content).toContain('"result":"ok"')
    expect(response.usage.inputTokens).toBe(11)
    expect(response.usage.outputTokens).toBe(7)
  })
})
