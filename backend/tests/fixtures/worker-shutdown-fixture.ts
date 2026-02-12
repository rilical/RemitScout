import { createShutdownHandler } from '../../shared/shutdown'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let pollCount = 0
let pollCountAtShutdown = 0
let inFlightProcessed = false
let cleanupRan = false
let inFlight: Promise<void> | null = null

const shutdown = createShutdownHandler({
  name: 'worker-shutdown-fixture',
  timeoutMs: 10_000,
  exitOnSignal: false,
  onShutdownRequested: async () => {
    pollCountAtShutdown = pollCount
    console.log('fixture:shutdown_requested')
  },
  onShutdown: async () => {
    cleanupRan = true
    console.log(
      `fixture:summary:${JSON.stringify({
        pollCount,
        pollCountAtShutdown,
        pollAfterShutdown: Math.max(0, pollCount - pollCountAtShutdown),
        inFlightProcessed,
        cleanupRan,
      })}`,
    )
  },
})

const run = async () => {
  console.log('fixture:ready')
  while (!shutdown.isShuttingDown()) {
    pollCount += 1
    console.log(`fixture:poll:${pollCount}`)

    // Simulate one in-flight unit of work.
    if (pollCount === 1) {
      inFlight = (async () => {
        await sleep(300)
        inFlightProcessed = true
        console.log('fixture:inflight_done')
      })()
    }

    await sleep(50)
  }

  if (inFlight) {
    await inFlight
  }
  await shutdown.shutdown('shutdown_requested')
}

void run()
