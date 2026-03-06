import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('shared config JWT runtime gating', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.DOTENV_DISABLE = '1'
    process.env.NODE_ENV = 'production'
    process.env.ENVIRONMENT = 'staging'
    process.env.PLANE_A_JWT_SECRET = ''
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  it('keeps config import-safe for non-Plane-A staging jobs', async () => {
    await expect(import('../shared/config')).resolves.toHaveProperty('config')
  })

  it('still enforces the JWT secret when a runtime explicitly requires it', async () => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      DOTENV_DISABLE: '1',
      NODE_ENV: 'production',
      ENVIRONMENT: 'staging',
      PLANE_A_JWT_SECRET: 'placeholder',
    }
    const { assertRuntimeConfig } = await import('../shared/config')

    expect(() => assertRuntimeConfig({ requireJwtSecret: true })).toThrow(
      'PLANE_A_JWT_SECRET (placeholder values are not allowed)',
    )
  })
})
