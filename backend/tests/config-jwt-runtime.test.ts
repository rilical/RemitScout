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

  it('keeps admin MFA forced on in staging even if the env flag is disabled', async () => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      DOTENV_DISABLE: '1',
      NODE_ENV: 'production',
      ENVIRONMENT: 'staging',
      ADMIN_MFA_REQUIRED: '0',
      PLANE_A_JWT_SECRET: '',
    }

    const { config } = await import('../shared/config')
    expect(config.planeA.adminMfaRequired).toBe(true)
  })

  it('keeps admin MFA forced on in production even if the env flag is disabled', async () => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      DOTENV_DISABLE: '1',
      NODE_ENV: 'production',
      ENVIRONMENT: 'production',
      ADMIN_MFA_REQUIRED: '0',
      PLANE_A_JWT_SECRET: '',
    }

    const { config } = await import('../shared/config')
    expect(config.planeA.adminMfaRequired).toBe(true)
  })

  it('still enforces the JWT secret when a runtime explicitly requires it', async () => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      DOTENV_DISABLE: '1',
      NODE_ENV: 'production',
      ENVIRONMENT: 'staging',
      PLANE_A_JWT_SECRET: 'placeholder', // pragma: allowlist secret
    }
    const { assertRuntimeConfig } = await import('../shared/config')

    expect(() => assertRuntimeConfig({ requireJwtSecret: true })).toThrow(
      'PLANE_A_JWT_SECRET (placeholder values are not allowed)',
    )
  })
})
