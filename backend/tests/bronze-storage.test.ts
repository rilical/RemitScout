import { describe, expect, it, vi } from 'vitest'

vi.mock('../shared/config', () => ({
  config: {
    logging: { level: 'info' },
    aws: { region: 'us-east-1' },
    storage: { bronze: { bucket: '', prefix: 'bronze' } },
    runtime: {
      lambdaFunctionName: '',
      lambdaFunctionVersion: '',
      awsRequestId: '',
    },
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

describe('bronze storage module', () => {
  it('exports bronze storage helpers', async () => {
    const mod = await import('../shared/bronze-storage')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
