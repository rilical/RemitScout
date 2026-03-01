import { describe, expect, it } from 'vitest'
import { buildLlmClient } from '../plane-b/src/agents/llm-client'

describe('llm client connector factory', () => {
  it('builds anthropic connector with direct key', () => {
    const client = buildLlmClient({
      connector: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 512,
      temperature: 0.1,
      anthropicApiKey: 'test-key',
    })

    expect(client.connector).toBe('anthropic')
    expect(client.isAvailable()).toBe(true)
  })

  it('keeps anthropic connector unavailable without key', () => {
    const client = buildLlmClient({
      connector: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 512,
      temperature: 0.1,
    })

    expect(client.connector).toBe('anthropic')
    expect(client.isAvailable()).toBe(false)
  })

  it('rejects bedrock connector without region/model', () => {
    expect(() => buildLlmClient({
      connector: 'bedrock',
      model: '',
      maxTokens: 512,
      temperature: 0.1,
      bedrockRegion: '',
      bedrockModelId: '',
    })).toThrow(/bedrock connector requires/i)
  })

  it('builds bedrock connector when region and model are provided', () => {
    const client = buildLlmClient({
      connector: 'bedrock',
      model: 'anthropic.claude-sonnet-4-20250514-v1:0',
      maxTokens: 512,
      temperature: 0.1,
      bedrockRegion: 'us-east-1',
      bedrockModelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
    })

    expect(client.connector).toBe('bedrock')
    expect(client.isAvailable()).toBe(true)
  })
})
