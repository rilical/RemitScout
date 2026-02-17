import Fastify from 'fastify'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ValidationError } from '../shared/errors'
import { setupErrorHandler } from '../plane-a/src/plugins/error-handler'

vi.mock('../shared/error-tracker', () => ({
  captureExceptionWithContext: vi.fn(async () => {}),
}))

describe('Plane A error handler -> Sentry capture', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('captures 400 ValidationError to Sentry without leaking query values', async () => {
    const { captureExceptionWithContext } = await import('../shared/error-tracker')
    const app = Fastify({ logger: false })
    setupErrorHandler(app)

    app.get('/boom', async () => {
      throw new ValidationError('Invalid request data')
    })

    await app.inject({
      method: 'GET',
      url: '/boom?email=test@example.com&token=secret',
    })

    expect(captureExceptionWithContext).toHaveBeenCalledTimes(1)
    const args = (captureExceptionWithContext as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const context = args[1] as Record<string, unknown>
    expect(context.status_code).toBe(400)
    expect(context.path).toBe('/boom')
    expect(context.query_keys).toEqual(expect.arrayContaining(['email', 'token']))
  })
})

