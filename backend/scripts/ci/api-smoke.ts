import { buildApp } from '../../plane-a/src/app'

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '')

const assertStatusOk = (statusCode: number, name: string) => {
  if (statusCode >= 400) {
    throw new Error(`${name} failed with status ${statusCode}`)
  }
}

const runRemote = async (baseUrlRaw: string) => {
  const baseUrl = normalizeBaseUrl(baseUrlRaw)
  const endpoints = ['/healthz', '/readyz', '/metrics']
  for (const path of endpoints) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { 'user-agent': 'remit-scout-ci-smoke/1.0' },
    })
    assertStatusOk(res.status, path)
  }
  console.log('✅ Remote API smoke checks passed')
}

const run = async () => {
  const remoteBase = process.env.API_BASE_URL || ''
  if (remoteBase) {
    await runRemote(remoteBase)
    return
  }

  const app = await buildApp()

  try {
    await app.ready()
    const health = await app.inject({ method: 'GET', url: '/healthz' })
    assertStatusOk(health.statusCode, 'healthz')

    const ready = await app.inject({ method: 'GET', url: '/readyz' })
    assertStatusOk(ready.statusCode, 'readyz')

    const metrics = await app.inject({ method: 'GET', url: '/metrics' })
    assertStatusOk(metrics.statusCode, 'metrics')

    console.log('✅ API smoke checks passed')
  } finally {
    await app.close()
  }
}

run().catch((error) => {
  console.error('API smoke checks failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
