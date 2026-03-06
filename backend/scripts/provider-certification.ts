import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { runProviderCertification } from './lib/provider-certification'

const logger = createLogger('script.provider-certification')
initTracing('provider-certification')

const parseList = (value: string | undefined): string[] | undefined => {
  const items = (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

const run = async () => {
  const result = await runProviderCertification({
    providerIds: parseList(process.env.PROVIDERS || process.env.DISCOVERY_PROVIDERS),
    triggeredBy: (process.env.TRIGGERED_BY as any) || 'manual',
    requestedBy: process.env.REQUESTED_BY || 'cli',
    reviewOnly: process.env.REVIEW_ONLY === '0' ? false : true,
    planeABaseUrl: process.env.PLANE_A_BASE_URL || process.env.API_BASE_URL,
    method: (process.env.METHOD as any) || 'bank',
    amount: Number(process.env.AMOUNT || '500'),
    windowHours: Number(process.env.WINDOW_HOURS || '6'),
    notes: process.env.NOTES,
  })

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

if (require.main === module) {
  run().catch((error) => {
    logger.error('provider_certification_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
