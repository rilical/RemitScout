import { describe, expect, it } from 'vitest'
import { withCircuitBreaker, resetCircuitBreakers } from '../shared/repository-retry'
import { CircuitBreakerOpenError } from '../shared/errors'

describe('repository retry circuit breaker', () => {
  it('resets circuit breaker registry', async () => {
    const repository = 'reset-test-repo'
    resetCircuitBreakers()

    for (let i = 0; i < 5; i += 1) {
      await expect(
        withCircuitBreaker(repository, async () => {
          throw new Error('boom')
        }),
      ).rejects.toBeInstanceOf(Error)
    }

    await expect(
      withCircuitBreaker(repository, async () => 'ok'),
    ).rejects.toBeInstanceOf(CircuitBreakerOpenError)

    resetCircuitBreakers()

    await expect(
      withCircuitBreaker(repository, async () => 'ok'),
    ).resolves.toBe('ok')
  })

  it('opens circuit after threshold failures', async () => {
    resetCircuitBreakers()
    const repository = 'test-repo'

    for (let i = 0; i < 5; i += 1) {
      await expect(
        withCircuitBreaker(repository, async () => {
          throw new Error('boom')
        }),
      ).rejects.toBeInstanceOf(Error)
    }

    await expect(withCircuitBreaker(repository, async () => 'ok')).rejects.toBeInstanceOf(Error)
  })
})
