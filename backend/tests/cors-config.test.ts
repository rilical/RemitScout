import { afterEach, describe, expect, it, vi } from 'vitest'

describe('plane-a CORS configuration', () => {
  const originalCorsOrigins = process.env.PLANE_A_CORS_ORIGINS

  afterEach(() => {
    if (originalCorsOrigins === undefined) {
      delete process.env.PLANE_A_CORS_ORIGINS
    }
    else {
      process.env.PLANE_A_CORS_ORIGINS = originalCorsOrigins
    }
    vi.resetModules()
  })

  it('fails startup when PLANE_A_CORS_ORIGINS is empty', async () => {
    process.env.PLANE_A_CORS_ORIGINS = ''
    vi.resetModules()

    const { buildApp } = await import('../plane-a/src/app')
    await expect(buildApp()).rejects.toThrow(
      'PLANE_A_CORS_ORIGINS must be configured with at least one explicit origin.',
    )
  })
})
