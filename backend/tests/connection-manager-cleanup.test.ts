import { describe, expect, it, vi } from 'vitest'
import {
  cleanupAllConnections,
  listConnections,
  registerCloudWatchClient,
  registerSQSClient,
} from '../shared/connection-manager'

describe('connection-manager cleanup', () => {
  it('destroys AWS SDK clients on cleanup', async () => {
    const sqsDestroy = vi.fn()
    const cloudWatchDestroy = vi.fn()

    registerSQSClient({ destroy: sqsDestroy } as any, 'test')
    registerCloudWatchClient({ destroy: cloudWatchDestroy } as any, 'test')

    await cleanupAllConnections()

    expect(sqsDestroy).toHaveBeenCalledTimes(1)
    expect(cloudWatchDestroy).toHaveBeenCalledTimes(1)
    expect(listConnections()).toEqual([])
  })
})

