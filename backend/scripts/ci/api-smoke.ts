import { buildApp } from '../../plane-a/src/app'
import { disconnectRedis } from '../../shared/redis'

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '')

const allowProtectedMetrics =
  process.env.SMOKE_ALLOW_PROTECTED_METRICS === '1'
  || process.env.SMOKE_ALLOW_PROTECTED_METRICS === 'true'

const allowProtectedHealth =
  process.env.SMOKE_ALLOW_PROTECTED_HEALTH === '1'
  || process.env.SMOKE_ALLOW_PROTECTED_HEALTH === 'true'

const isMetricsPath = (name: string) => name === '/metrics' || name === 'metrics'
const isHealthPath = (name: string) =>
  name === '/healthz' || name === 'healthz' || name === '/readyz' || name === 'readyz'

const assertStatusOk = (statusCode: number, name: string) => {
  if (allowProtectedMetrics && isMetricsPath(name) && (statusCode === 401 || statusCode === 403)) {
    return
  }
  if (allowProtectedHealth && isHealthPath(name) && (statusCode === 401 || statusCode === 403)) {
    return
  }
  if (statusCode >= 400) {
    throw new Error(`${name} failed with status ${statusCode}`)
  }
}

const runRemote = async (baseUrlRaw: string) => {
  const baseUrl = normalizeBaseUrl(baseUrlRaw)
  const endpoints = ['/healthz', '/readyz', '/metrics']
  for (const path of endpoints) {
    let status = 0
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: { 'user-agent': 'remit-scout-ci-smoke/1.0' },
      })
      status = res.status
      if (status < 500 || attempt === 5) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
    assertStatusOk(status, path)
  }
  console.log('✅ Remote API smoke checks passed')
}

const run = async () => {
  const remoteBase = process.env.SMOKE_BASE_URL || process.env.API_BASE_URL || ''
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
    await disconnectRedis().catch(() => {})
  }
}

run().catch((error) => {
  console.error('API smoke checks failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
