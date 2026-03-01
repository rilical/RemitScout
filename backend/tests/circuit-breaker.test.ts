import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * CircuitBreaker unit tests — validates the 3-state machine
 * (CLOSED -> OPEN -> HALF_OPEN) and all transitions.
 */

// Mock shared dependencies that the circuit breaker lazy-imports
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../shared/config', () => ({
  config: {
    envName: 'test',
    env: 'test',
  },
}))

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: vi.fn(),
}))

vi.mock('../shared/ops-events', () => ({
  emitOpsEvent: vi.fn(),
}))

import { CircuitBreaker } from '../shared/circuit-breaker'

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('starts in CLOSED state', () => {
      const cb = new CircuitBreaker({ name: 'test-cb' })
      expect(cb.canAttempt()).toBe(true)
      expect(cb.isOpen()).toBe(false)
    })

    it('allows attempts when no failures have occurred', () => {
      const cb = new CircuitBreaker({ name: 'test-cb' })
      // Multiple calls should all return true
      expect(cb.canAttempt()).toBe(true)
      expect(cb.canAttempt()).toBe(true)
      expect(cb.canAttempt()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // CLOSED -> OPEN transition
  // -------------------------------------------------------------------------

  describe('CLOSED -> OPEN after consecutive failures', () => {
    it('transitions to OPEN after default 5 consecutive failures', () => {
      const cb = new CircuitBreaker({ name: 'test-cb' })

      // 4 failures should keep it closed
      for (let i = 0; i < 4; i++) {
        cb.onFailure(new Error(`failure-${i}`))
      }
      expect(cb.canAttempt()).toBe(true)
      expect(cb.isOpen()).toBe(false)

      // 5th failure trips the circuit
      cb.onFailure(new Error('failure-4'))
      expect(cb.isOpen()).toBe(true)
      expect(cb.canAttempt()).toBe(false)
    })

    it('transitions to OPEN after custom threshold (openAfterFailures: 1)', () => {
      const cb = new CircuitBreaker({ name: 'instant-cb', openAfterFailures: 1 })

      cb.onFailure(new Error('single-failure'))
      expect(cb.isOpen()).toBe(true)
      expect(cb.canAttempt()).toBe(false)
    })

    it('transitions to OPEN after custom threshold (openAfterFailures: 3)', () => {
      const cb = new CircuitBreaker({ name: 'custom-cb', openAfterFailures: 3 })

      cb.onFailure(new Error('f1'))
      cb.onFailure(new Error('f2'))
      expect(cb.canAttempt()).toBe(true)

      cb.onFailure(new Error('f3'))
      expect(cb.isOpen()).toBe(true)
      expect(cb.canAttempt()).toBe(false)
    })

    it('enforces minimum openAfterFailures of 1', () => {
      // Passing 0 should be clamped to at least 1
      const cb = new CircuitBreaker({ name: 'min-cb', openAfterFailures: 0 })
      cb.onFailure(new Error('one'))
      expect(cb.isOpen()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Time window: OPEN -> HALF_OPEN
  // -------------------------------------------------------------------------

  describe('OPEN -> HALF_OPEN after openForMs elapses', () => {
    it('transitions to HALF_OPEN after default 60s', () => {
      const cb = new CircuitBreaker({ name: 'timed-cb' })

      // Trip the circuit
      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.isOpen()).toBe(true)
      expect(cb.canAttempt()).toBe(false)

      // Advance time by 59s — still OPEN
      vi.advanceTimersByTime(59_000)
      expect(cb.isOpen()).toBe(true)
      expect(cb.canAttempt()).toBe(false)

      // Advance past 60s — canAttempt triggers transition to HALF_OPEN
      vi.advanceTimersByTime(1_001)
      expect(cb.isOpen()).toBe(false)
      expect(cb.canAttempt()).toBe(true) // transitions to HALF_OPEN
    })

    it('transitions to HALF_OPEN after custom openForMs', () => {
      const cb = new CircuitBreaker({ name: 'custom-time-cb', openForMs: 10_000 })

      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.canAttempt()).toBe(false)

      vi.advanceTimersByTime(10_001)
      expect(cb.canAttempt()).toBe(true) // HALF_OPEN
    })

    it('enforces minimum openForMs of 1000ms', () => {
      // Passing 100 should be clamped to at least 1000
      const cb = new CircuitBreaker({ name: 'min-time-cb', openForMs: 100 })

      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.canAttempt()).toBe(false)

      // At 999ms it should still be open
      vi.advanceTimersByTime(999)
      expect(cb.canAttempt()).toBe(false)

      // At 1001ms it should transition to HALF_OPEN
      vi.advanceTimersByTime(2)
      expect(cb.canAttempt()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Recovery: HALF_OPEN -> CLOSED
  // -------------------------------------------------------------------------

  describe('HALF_OPEN -> CLOSED on success', () => {
    it('transitions back to CLOSED when onSuccess() called in HALF_OPEN', () => {
      const cb = new CircuitBreaker({ name: 'recovery-cb' })

      // Trip the circuit
      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))

      // Wait for HALF_OPEN
      vi.advanceTimersByTime(60_001)
      expect(cb.canAttempt()).toBe(true) // enters HALF_OPEN

      // Success in HALF_OPEN should close the circuit
      cb.onSuccess()

      expect(cb.isOpen()).toBe(false)
      expect(cb.canAttempt()).toBe(true)

      // Subsequent attempts should all succeed (CLOSED state)
      expect(cb.canAttempt()).toBe(true)
      expect(cb.canAttempt()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Re-open: HALF_OPEN -> OPEN
  // -------------------------------------------------------------------------

  describe('HALF_OPEN -> OPEN on failure', () => {
    it('re-opens circuit when onFailure() called in HALF_OPEN', () => {
      const cb = new CircuitBreaker({ name: 'reopen-cb', openAfterFailures: 1 })

      // Trip the circuit
      cb.onFailure(new Error('trip'))
      expect(cb.isOpen()).toBe(true)

      // Wait for HALF_OPEN
      vi.advanceTimersByTime(60_001)
      expect(cb.canAttempt()).toBe(true) // enters HALF_OPEN

      // Failure in HALF_OPEN should re-open (consecutive failures still >= threshold)
      cb.onFailure(new Error('reopen'))
      expect(cb.isOpen()).toBe(true)
      expect(cb.canAttempt()).toBe(false)
    })

    it('resets the OPEN timer on re-open', () => {
      const cb = new CircuitBreaker({ name: 'timer-reset-cb', openAfterFailures: 1 })

      // Trip the circuit
      cb.onFailure(new Error('trip'))

      // Wait for HALF_OPEN
      vi.advanceTimersByTime(60_001)
      cb.canAttempt() // triggers HALF_OPEN transition

      // Re-open
      cb.onFailure(new Error('reopen'))
      expect(cb.isOpen()).toBe(true)

      // Need to wait ANOTHER full openForMs window
      vi.advanceTimersByTime(59_999)
      expect(cb.canAttempt()).toBe(false) // still OPEN

      vi.advanceTimersByTime(2)
      expect(cb.canAttempt()).toBe(true) // HALF_OPEN again
    })
  })

  // -------------------------------------------------------------------------
  // canAttempt() behavior
  // -------------------------------------------------------------------------

  describe('canAttempt()', () => {
    it('returns true in CLOSED state', () => {
      const cb = new CircuitBreaker({ name: 'attempt-cb' })
      expect(cb.canAttempt()).toBe(true)
    })

    it('returns false in OPEN state within time window', () => {
      const cb = new CircuitBreaker({ name: 'attempt-cb' })
      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.canAttempt()).toBe(false)
    })

    it('returns true (once) in HALF_OPEN state — allows a probe', () => {
      const cb = new CircuitBreaker({ name: 'probe-cb' })

      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      vi.advanceTimersByTime(60_001)

      // First call transitions to HALF_OPEN and returns true
      expect(cb.canAttempt()).toBe(true)

      // Subsequent calls also return true because HALF_OPEN allows attempts
      // (the circuit breaker doesn't limit to one probe — HALF_OPEN stays until success/failure)
      expect(cb.canAttempt()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // isOpen()
  // -------------------------------------------------------------------------

  describe('isOpen()', () => {
    it('returns false when CLOSED', () => {
      const cb = new CircuitBreaker({ name: 'isopen-cb' })
      expect(cb.isOpen()).toBe(false)
    })

    it('returns true when OPEN and within time window', () => {
      const cb = new CircuitBreaker({ name: 'isopen-cb' })
      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.isOpen()).toBe(true)
    })

    it('returns false when OPEN but time window has elapsed', () => {
      const cb = new CircuitBreaker({ name: 'isopen-cb' })
      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      vi.advanceTimersByTime(60_001)
      expect(cb.isOpen()).toBe(false)
    })

    it('returns false after recovery to CLOSED', () => {
      const cb = new CircuitBreaker({ name: 'isopen-cb' })
      for (let i = 0; i < 5; i++) cb.onFailure(new Error(`f${i}`))
      vi.advanceTimersByTime(60_001)
      cb.canAttempt() // HALF_OPEN
      cb.onSuccess()  // CLOSED
      expect(cb.isOpen()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Failure counter reset
  // -------------------------------------------------------------------------

  describe('failure counter reset', () => {
    it('resets consecutiveFailures to 0 on success', () => {
      const cb = new CircuitBreaker({ name: 'reset-cb' })

      // Accumulate 4 failures (one short of threshold)
      for (let i = 0; i < 4; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.canAttempt()).toBe(true) // still CLOSED

      // Success resets the counter
      cb.onSuccess()

      // Now we need 5 more failures to trip again
      for (let i = 0; i < 4; i++) cb.onFailure(new Error(`f${i}`))
      expect(cb.canAttempt()).toBe(true) // still CLOSED

      cb.onFailure(new Error('f4'))
      expect(cb.isOpen()).toBe(true) // NOW it trips
    })

    it('intermittent successes prevent the circuit from opening', () => {
      const cb = new CircuitBreaker({ name: 'intermittent-cb' })

      // 4 failures then a success — should not trip
      for (let i = 0; i < 4; i++) cb.onFailure(new Error(`f${i}`))
      cb.onSuccess()

      // 4 more failures then a success — should still not trip
      for (let i = 0; i < 4; i++) cb.onFailure(new Error(`f${i}`))
      cb.onSuccess()

      expect(cb.canAttempt()).toBe(true)
      expect(cb.isOpen()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles zero failures — remains CLOSED', () => {
      const cb = new CircuitBreaker({ name: 'zero-cb' })
      expect(cb.canAttempt()).toBe(true)
      expect(cb.isOpen()).toBe(false)
    })

    it('handles success without any prior failures', () => {
      const cb = new CircuitBreaker({ name: 'noop-cb' })
      cb.onSuccess()
      expect(cb.canAttempt()).toBe(true)
      expect(cb.isOpen()).toBe(false)
    })

    it('handles non-Error objects in onFailure()', () => {
      const cb = new CircuitBreaker({ name: 'non-error-cb', openAfterFailures: 1 })
      cb.onFailure('string error')
      expect(cb.isOpen()).toBe(true)
    })

    it('handles null/undefined error in onFailure()', () => {
      const cb = new CircuitBreaker({ name: 'null-error-cb', openAfterFailures: 1 })
      cb.onFailure(null)
      expect(cb.isOpen()).toBe(true)
    })

    it('handles rapid failure-success-failure cycles', () => {
      const cb = new CircuitBreaker({ name: 'rapid-cb', openAfterFailures: 2 })

      cb.onFailure(new Error('f1'))
      cb.onSuccess()
      cb.onFailure(new Error('f2'))
      // Counter was reset by onSuccess, so only 1 consecutive failure
      expect(cb.isOpen()).toBe(false)

      cb.onFailure(new Error('f3'))
      // Now 2 consecutive failures
      expect(cb.isOpen()).toBe(true)
    })

    it('handles multiple complete open-close cycles', () => {
      const cb = new CircuitBreaker({ name: 'multi-cycle-cb', openAfterFailures: 2, openForMs: 5_000 })

      // Cycle 1: trip -> wait -> half-open -> recover
      cb.onFailure(new Error('f1'))
      cb.onFailure(new Error('f2'))
      expect(cb.isOpen()).toBe(true)

      vi.advanceTimersByTime(5_001)
      expect(cb.canAttempt()).toBe(true) // HALF_OPEN
      cb.onSuccess() // CLOSED

      // Cycle 2: trip again -> wait -> half-open -> recover
      cb.onFailure(new Error('f3'))
      cb.onFailure(new Error('f4'))
      expect(cb.isOpen()).toBe(true)

      vi.advanceTimersByTime(5_001)
      expect(cb.canAttempt()).toBe(true) // HALF_OPEN
      cb.onSuccess() // CLOSED

      expect(cb.isOpen()).toBe(false)
      expect(cb.canAttempt()).toBe(true)
    })
  })
})
