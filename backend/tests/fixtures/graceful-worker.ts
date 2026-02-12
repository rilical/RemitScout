import { createShutdownHandler } from '../../shared/shutdown'
import {
  registerDatabasePool,
  registerRedisClient,
} from '../../shared/connection-manager'

// Minimal in-process fakes; the parent test asserts on stdout ordering.
class FakePool {
  ended = false
  async end(): Promise<void> {
    this.ended = true
    console.log('fixture:db_end')
  }
}

class FakeRedis {
  quitCalled = false
  async quit(): Promise<void> {
    this.quitCalled = true
    console.log('fixture:redis_quit')
  }
  disconnect(): void {
    console.log('fixture:redis_disconnect')
  }
}

const main = async () => {
  const pool = new FakePool()
  const redis = new FakeRedis()

  registerDatabasePool(pool as unknown as import('pg').Pool, 'fixture')
  registerRedisClient(redis as unknown as ReturnType<typeof import('redis').createClient>, 'fixture')

  createShutdownHandler({
    name: 'fixture-graceful-worker',
    exitOnSignal: true,
    timeoutMs: 5000,
    onShutdown: async () => {
      console.log('fixture:on_shutdown')
    },
  })

  console.log('fixture:ready')

  // Keep process alive until SIGTERM
  setInterval(() => {}, 1000)
}

void main()
