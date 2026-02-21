import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHeadlineFallbackController } from '~/domains/pulse/application'

describe('createHeadlineFallbackController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires timeout callback after the configured delay', () => {
    const onTimeout = vi.fn()
    const controller = createHeadlineFallbackController(onTimeout, 10_000)

    controller.start()

    vi.advanceTimersByTime(9_999)
    expect(onTimeout).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('clears an active timeout before it fires', () => {
    const onTimeout = vi.fn()
    const controller = createHeadlineFallbackController(onTimeout, 10_000)

    controller.start()
    controller.clear()

    vi.advanceTimersByTime(10_000)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
