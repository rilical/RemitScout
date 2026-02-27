import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

const resetEnv = (): void => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key]
  }
  Object.assign(process.env, ORIGINAL_ENV)
}

describe('aws params module', () => {
  beforeEach(() => {
    resetEnv()
    vi.resetModules()
  })

  afterEach(() => {
    resetEnv()
    vi.restoreAllMocks()
  })

  it('exports parameter resolution helpers', async () => {
    const mod = await import('../shared/aws-params')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })

  it('builds database URL when secret JSON uses numeric port', async () => {
    const sendSecret = vi.fn().mockResolvedValue({
      SecretString: JSON.stringify({
        username: 'migrator',
        password: 'super-secret',
        host: 'db.internal',
        port: 5432,
        dbname: 'remit_scout',
      }),
    })

    vi.doMock('@aws-sdk/client-secrets-manager', () => ({
      SecretsManagerClient: class {
        send = sendSecret
      },
      GetSecretValueCommand: class {
        constructor(_input: unknown) {}
      },
    }))

    vi.doMock('@aws-sdk/client-ssm', () => ({
      SSMClient: class {
        send = vi.fn()
      },
      GetParameterCommand: class {
        constructor(_input: unknown) {}
      },
    }))

    process.env.PLANE_B_DB_MIGRATOR_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:test'
    delete process.env.DATABASE_URL_PLANE_B_MIGRATOR

    const { resolveDatabaseUrl } = await import('../shared/aws-params')
    await resolveDatabaseUrl({
      envVar: 'DATABASE_URL_PLANE_B_MIGRATOR',
      secretArnEnv: 'PLANE_B_DB_MIGRATOR_SECRET_ARN',
      hostEnv: 'PLANE_B_DB_MIGRATOR_HOST',
      portEnv: 'PLANE_B_DB_MIGRATOR_PORT',
      nameEnv: 'PLANE_B_DB_MIGRATOR_NAME',
      usernameEnv: 'PLANE_B_DB_MIGRATOR_USERNAME',
      passwordEnv: 'PLANE_B_DB_MIGRATOR_PASSWORD',
      requireJson: true,
      required: false,
      jsonKeys: ['url', 'DATABASE_URL_PLANE_B_MIGRATOR', 'database_url'],
    })

    expect(process.env.DATABASE_URL_PLANE_B_MIGRATOR).toBe(
      'postgresql://migrator:super-secret@db.internal:5432/remit_scout',
    )
  })
})
