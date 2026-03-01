import { CircuitBreaker } from '../../../shared/circuit-breaker'
import type { LLMCompletionResponse } from './llm-client'

/**
 * LLM-specific circuit breaker sentinel response.
 *
 * Returned in place of a real LLM response when the circuit is open,
 * allowing the caller to detect the short-circuit and handle gracefully.
 */
export const LLM_CIRCUIT_OPEN_SENTINEL: LLMCompletionResponse = {
  content: '[LLM circuit open]',
  model: 'circuit-open',
  usage: { inputTokens: 0, outputTokens: 0 },
  durationMs: 0,
}

/**
 * Whether a completion response is the circuit-open sentinel.
 */
export const isLlmCircuitOpenSentinel = (response: LLMCompletionResponse): boolean =>
  response.content === LLM_CIRCUIT_OPEN_SENTINEL.content

/**
 * Singleton LLM circuit breaker.
 *
 * Defaults:
 *   - Opens after 5 consecutive failures
 *   - Stays open for 120 seconds (cooldown window)
 *   - Transitions to HALF_OPEN after the cooldown elapses
 *
 * All callers in the agent layer share this single instance so that
 * a sustained LLM outage is visible system-wide rather than silently
 * retried per-call.
 */
export const llmCircuitBreaker = new CircuitBreaker({
  name: 'llm_agent',
  openAfterFailures: 5,
  openForMs: 120_000,
})
