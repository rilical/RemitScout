import { buildApp } from '../../plane-a/src/app'

const assertOk = (statusCode: number, name: string) => {
  if (statusCode >= 400) {
    throw new Error(`${name} failed with status ${statusCode}`)
  }
}

const run = async () => {
  const app = await buildApp()

  try {
    await app.ready()
    const health = await app.inject({ method: 'GET', url: '/healthz' })
    assertOk(health.statusCode, 'healthz')

    const ready = await app.inject({ method: 'GET', url: '/readyz' })
    assertOk(ready.statusCode, 'readyz')

    const metrics = await app.inject({ method: 'GET', url: '/metrics' })
    assertOk(metrics.statusCode, 'metrics')

    console.log('✅ API smoke checks passed')
  } finally {
    await app.close()
  }
}

run().catch((error) => {
  console.error('API smoke checks failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
