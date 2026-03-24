import '../../shared/load-env'

import { loadAwsOpsServiceHealth } from '../../plane-a/src/services/aws-ops-health'

const DEFAULT_REQUIRED_SERVICE_IDS = [
  'plane-b-ingest',
  'b2c-refresh',
  'fx-rate-refresh',
  'ingest-fanout-tier-1',
  'ingest-fanout-tier-2',
  'gold-live',
  'notifications',
  'ops-alerts',
  'alert-evaluation',
  'export-worker',
  'agent-orchestrator',
  'stress-responder',
]

const readPositiveIntEnv = (key: string, fallback: number): number => {
  const raw = String(process.env[key] || '').trim()
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const readRequiredServiceIds = (): string[] => {
  const raw = String(process.env.WAIT_SERVICE_IDS || '').trim()
  if (!raw) return DEFAULT_REQUIRED_SERVICE_IDS
  return raw
    .split(',')
    .map(token => token.trim())
    .filter(Boolean)
}

const main = async () => {
  const timeoutSeconds = readPositiveIntEnv('WAIT_TIMEOUT_SECONDS', 900)
  const intervalSeconds = readPositiveIntEnv('WAIT_INTERVAL_SECONDS', 15)
  const requiredServiceIds = readRequiredServiceIds()
  const deadline = Date.now() + (timeoutSeconds * 1000)

  while (true) {
    const health = await loadAwsOpsServiceHealth()
    const pauseState = health.services.find(service => service.service_id === 'ops-pause-state') ?? null
    const unhealthy = health.services
      .filter(service => requiredServiceIds.includes(service.service_id) && service.status !== 'healthy')
      .map(service => ({
        serviceId: service.service_id,
        status: service.status,
        message: service.message,
      }))

    console.log(JSON.stringify({
      pauseState,
      unhealthy,
      updatedAt: health.updatedAt,
    }, null, 2))

    if (pauseState?.status === 'healthy' && unhealthy.length === 0) {
      console.log('Staging operational services are healthy.')
      return
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out waiting for staging operational services to become healthy: ${JSON.stringify({ pauseState, unhealthy })}`,
      )
    }

    await sleep(intervalSeconds * 1000)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
