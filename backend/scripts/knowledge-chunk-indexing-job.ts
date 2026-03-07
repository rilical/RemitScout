import { createLogger } from '../shared/logger'
import { initErrorTracking } from '../shared/error-tracker'
import { seedKnowledgePlane } from './seed-knowledge-plane'

const logger = createLogger('scripts.knowledge-chunk-indexing-job')

async function main(): Promise<void> {
  await initErrorTracking('knowledge-chunk-indexing-job')

  const startedAt = Date.now()
  const result = await seedKnowledgePlane()

  logger.info('knowledge_chunk_indexing_complete', {
    ...result,
    durationMs: Date.now() - startedAt,
  })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('knowledge_chunk_indexing_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    process.exit(1)
  })
