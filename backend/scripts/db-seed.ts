import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { runIngestion } from '../plane-b/src/ingest'

const run = async () => {
  const db = createPool(config.db.planeBUrl)
  try {
    await runIngestion({ pool: db })
    console.log('Seed complete.')
  } finally {
    await db.end()
  }
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
