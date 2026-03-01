import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the shared modules that have AWS/external dependencies.
vi.mock('../shared/config', () => ({
  config: {
    envName: 'test',
    env: 'test',
    observability: { cloudwatch: { enabled: false, highCardinalityEnabled: false } },
    agent: {
      llmConnector: 'anthropic',
      llmModel: 'claude-sonnet-4-20250514',
      llmMaxTokens: 2048,
      llmTemperature: 0.2,
      anthropicApiKey: 'test-key',
      bedrockRegion: '',
      bedrockModelId: '',
      llmPromptVersion: '1',
    },
  },
}))
vi.mock('../shared/cloudwatch-metrics', () => ({ recordCloudWatchMetric: vi.fn() }))
vi.mock('../shared/ops-events', () => ({ emitOpsEvent: vi.fn() }))
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Import after mocks are in place.
import { CircuitBreaker } from '../shared/circuit-breaker'
import { LLM_CIRCUIT_OPEN_SENTINEL, isLlmCircuitOpenSentinel, llmCircuitBreaker } from '../plane-b/src/agents/llm-circuit-breaker'
import { LLMClient } from '../plane-b/src/agents/llm-client'
import type { LLMConnector, LLMCompletionRequest, LLMCompletionResponse } from '../plane-b/src/agents/llm-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSuccessResponse = (content = 'ok'): LLMCompletionResponse => ({
  content,
  model: 'test-model',
  usage: { inputTokens: 10, outputTokens: 5 },
  durationMs: 42,
})

const makeConnector = (overrides: Partial<LLMConnector> = {}): LLMConnector => ({
  connector: 'anthropic',
  model: 'test-model',
  isAvailable: () => true,
  sendMessage: vi.fn().mockResolvedValue(makeSuccessResponse()),
  ...overrides,
})

// ---------------------------------------------------------------------------
// Unit tests — LLM_CIRCUIT_OPEN_SENTINEL & helpers
// ---------------------------------------------------------------------------

describe('LLM_CIRCUIT_OPEN_SENTINEL', () => {
  it('has the expected content string', () => {
    expect(LLM_CIRCUIT_OPEN_SENTINEL.content).toBe('[LLM circuit open]')
  })

  it('reports zero token usage', () => {
    expect(LLM_CIRCUIT_OPEN_SENTINEL.usage.inputTokens).toBe(0)
    expect(LLM_CIRCUIT_OPEN_SENTINEL.usage.outputTokens).toBe(0)
  })

  it('isLlmCircuitOpenSentinel returns true for the sentinel', () => {
    expect(isLlmCircuitOpenSentinel(LLM_CIRCUIT_OPEN_SENTINEL)).toBe(true)
  })

  it('isLlmCircuitOpenSentinel returns false for a real response', () => {
    expect(isLlmCircuitOpenSentinel(makeSuccessResponse('some content'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Unit tests — CircuitBreaker state transitions (isolated instance)
// ---------------------------------------------------------------------------

describe('CircuitBreaker state transitions', () => {
  let cb: CircuitBreaker

  beforeEach(() => {
    vi.useFakeTimers()
    cb = new CircuitBreaker({ name: 'test-llm', openAfterFailures: 5, openForMs: 120_000 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in CLOSED state and allows attempts', () => {
    expect(cb.canAttempt()).toBe(true)
    expect(cb.isOpen()).toBe(false)
  })

  it('remains closed after fewer than threshold failures', () => {
    for (let i = 0; i < 4; i++) cb.onFailure(new Error('fail'))
    expect(cb.canAttempt()).toBe(true)
    expect(cb.isOpen()).toBe(false)
  })

  it('opens after exactly N consecutive failures', () => {
    for (let i = 0; i < 5; i++) cb.onFailure(new Error('fail'))
    expect(cb.isOpen()).toBe(true)
    expect(cb.canAttempt()).toBe(false)
  })

  it('transitions to HALF_OPEN after the cooldown elapses', () => {
    for (let i = 0; i < 5; i++) cb.onFailure(new Error('fail'))
    expect(cb.canAttempt()).toBe(false)

    // Advance past the 120 s cooldown window.
    vi.advanceTimersByTime(121_000)

    // canAttempt() triggers the OPEN→HALF_OPEN transition.
    expect(cb.canAttempt()).toBe(true)
    expect(cb.isOpen()).toBe(false)
  })

  it('closes on success when in HALF_OPEN state', () => {
    for (let i = 0; i < 5; i++) cb.onFailure(new Error('fail'))
    vi.advanceTimersByTime(121_000)

    // Enter HALF_OPEN.
    expect(cb.canAttempt()).toBe(true)

    // Report success — circuit should close.
    cb.onSuccess()
    expect(cb.isOpen()).toBe(false)
    expect(cb.canAttempt()).toBe(true)
  })

  it('re-opens on failure in HALF_OPEN state', () => {
    for (let i = 0; i < 5; i++) cb.onFailure(new Error('fail'))
    vi.advanceTimersByTime(121_000)
    expect(cb.canAttempt()).toBe(true)

    // Single failure in HALF_OPEN should re-open immediately (threshold already met).
    cb.onFailure(new Error('fail again'))
    expect(cb.isOpen()).toBe(true)
    expect(cb.canAttempt()).toBe(false)
  })

  it('resets consecutive failures counter on success', () => {
    for (let i = 0; i < 4; i++) cb.onFailure(new Error('fail'))
    cb.onSuccess()
    // Four more failures should not open (counter was reset).
    for (let i = 0; i < 4; i++) cb.onFailure(new Error('fail'))
    expect(cb.isOpen()).toBe(false)
    expect(cb.canAttempt()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Integration tests — LLMClient honours the circuit breaker
// ---------------------------------------------------------------------------

describe('LLMClient circuit breaker integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset the singleton circuit breaker between tests by driving it back to CLOSED.
    // We do this by calling onSuccess() which resets failures and closes the circuit.
    llmCircuitBreaker.onSuccess()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('forwards calls to the connector when circuit is CLOSED', async () => {
    const connector = makeConnector()
    const client = new LLMClient(connector)

    const result = await client.complete({
      systemPrompt: 'sys',
      userPrompt: 'user',
    })

    expect(connector.sendMessage).toHaveBeenCalledOnce()
    expect(result.content).toBe('ok')
    expect(isLlmCircuitOpenSentinel(result)).toBe(false)
  })

  it('returns sentinel immediately when circuit is OPEN (no connector call)', async () => {
    // Force the circuit open by reporting 5 failures.
    for (let i = 0; i < 5; i++) llmCircuitBreaker.onFailure(new Error('forced'))

    const connector = makeConnector()
    const client = new LLMClient(connector)

    const result = await client.complete({
      systemPrompt: 'sys',
      userPrompt: 'user',
    })

    expect(connector.sendMessage).not.toHaveBeenCalled()
    expect(isLlmCircuitOpenSentinel(result)).toBe(true)
  })

  it('opens the circuit after 5 connector errors', async () => {
    const connector = makeConnector({
      sendMessage: vi.fn().mockRejectedValue(new Error('API down')),
    })
    const client = new LLMClient(connector)

    // Trigger 5 failures to open the circuit.
    for (let i = 0; i < 5; i++) {
      await expect(client.complete({ systemPrompt: 'sys', userPrompt: 'user' })).rejects.toThrow('API down')
    }

    // Sixth call should be short-circuited — no new connector invocation.
    const result = await client.complete({ systemPrompt: 'sys', userPrompt: 'user' })
    expect(isLlmCircuitOpenSentinel(result)).toBe(true)
    // connector.sendMessage was called exactly 5 times (the failures), not 6.
    expect(connector.sendMessage).toHaveBeenCalledTimes(5)
  })

  it('calls onSuccess and closes circuit after a successful response', async () => {
    // Force circuit open.
    for (let i = 0; i < 5; i++) llmCircuitBreaker.onFailure(new Error('forced'))
    expect(llmCircuitBreaker.isOpen()).toBe(true)

    // Advance past the cooldown so it transitions to HALF_OPEN.
    vi.advanceTimersByTime(121_000)

    const connector = makeConnector()
    const client = new LLMClient(connector)

    // In HALF_OPEN, canAttempt() returns true — connector should be called.
    const result = await client.complete({ systemPrompt: 'sys', userPrompt: 'user' })
    expect(result.content).toBe('ok')
    expect(isLlmCircuitOpenSentinel(result)).toBe(false)

    // Circuit should now be fully CLOSED again.
    expect(llmCircuitBreaker.isOpen()).toBe(false)
    expect(llmCircuitBreaker.canAttempt()).toBe(true)
  })

  it('sentinel response preserves the requested model name', async () => {
    for (let i = 0; i < 5; i++) llmCircuitBreaker.onFailure(new Error('forced'))

    const connector = makeConnector()
    const client = new LLMClient(connector)

    const result = await client.complete({
      model: 'claude-opus-4',
      systemPrompt: 'sys',
      userPrompt: 'user',
    })

    expect(result.model).toBe('claude-opus-4')
    expect(result.content).toBe('[LLM circuit open]')
  })
})
