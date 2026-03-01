import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('@aws-sdk/client-s3', () => {
  class PutObjectCommand {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  }

  class HeadBucketCommand {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  }

  class S3Client {
    send = sendMock
  }

  return {
    S3Client,
    PutObjectCommand,
    HeadBucketCommand,
  }
})

vi.mock('../shared/config', () => ({
  config: {
    storage: {
      bronze: {
        bucket: 'remit-scout-bronze-test',
        prefix: 'bronze',
      },
    },
    logging: { level: 'info' },
    aws: { region: 'us-east-1' },
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

const importModule = async () => {
  vi.resetModules()
  return import('../shared/bronze-storage')
}

describe('bronze storage', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('writes gzip payloads to S3 and returns location metadata', async () => {
    sendMock.mockResolvedValueOnce({}) // HeadBucket
    sendMock.mockResolvedValueOnce({}) // PutObject

    const { writeBronzePayloadToS3 } = await importModule()
    const result = await writeBronzePayloadToS3({
      providerId: 'wise',
      corridorId: 'US-MX-USD-MXN',
      payload: { amount: 500, quote: 19.2 },
    })

    expect(result).not.toBeNull()
    expect(result?.bucket).toBe('remit-scout-bronze-test')
    expect(result?.uri).toContain('s3://remit-scout-bronze-test/bronze/wise/US-MX-USD-MXN/')
    expect(result?.sizeBytes ?? 0).toBeGreaterThan(0)
    expect(sendMock).toHaveBeenCalledTimes(2)
  })

  it('returns null when upload fails after bucket validation', async () => {
    sendMock.mockResolvedValueOnce({}) // HeadBucket
    sendMock.mockRejectedValue(new Error('put failed')) // PutObject + retries

    const { writeBronzePayloadToS3 } = await importModule()
    const result = await writeBronzePayloadToS3({
      providerId: 'remitly',
      corridorId: 'US-PH-USD-PHP',
      payload: { amount: 100, quote: 56.7 },
    })

    expect(result).toBeNull()
  })
})
