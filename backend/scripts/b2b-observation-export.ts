/**
 * Exports observation sweep results for supported/unsupported corridors.
 */

import { writeFile } from 'node:fs/promises'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { B2bSweepRepository } from '../plane-b/src/repositories'

const logger = createLogger('script.b2b-observation-export')

const observationPriorityTier = 'observation_monthly'

type ExportRow = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin_method: string
  payout_method: string
  task_status: string
  is_supported: boolean | null
  payin_methods: string[] | null
  payout_methods: string[] | null
  last_verified_at: Date | null
  source: string | null
}

const runExport = async (): Promise<number> => {
  const pool = createPool(config.db.planeBUrl)
  try {
    const sweepRepo = new B2bSweepRepository(pool)
    let runId = process.env.B2B_OBSERVATION_RUN_ID || ''

    if (!runId) {
      const latest = await sweepRepo.getLatestRunByTier(observationPriorityTier)
      if (!latest) {
        logger.warn('b2b_observation_export_missing', { reason: 'no_run_found' })
        return 1
      }
      runId = latest.runId
    }

    const result = await query<ExportRow>(
      `SELECT t.provider_id,
              t.corridor_id,
              t.amount_bucket,
              t.payin_method,
              t.payout_method,
              t.status AS task_status,
              pcc.is_supported,
              pcc.payin_methods,
              pcc.payout_methods,
              pcc.last_verified_at,
              pcc.source
         FROM silver.b2b_sweep_task t
         LEFT JOIN silver.provider_corridor_capability pcc
           ON pcc.provider_id = t.provider_id
          AND pcc.corridor_id = t.corridor_id
        WHERE t.run_id = $1
        ORDER BY t.provider_id, t.corridor_id`,
      [runId],
      pool,
    )

    const mode = (process.env.B2B_OBSERVATION_EXPORT_MODE || 'all').toLowerCase()
    let rows = result.rows
    if (mode === 'supported') {
      rows = rows.filter(row => row.is_supported === true)
    } else if (mode === 'unsupported') {
      rows = rows.filter(row => row.is_supported === false)
    }

    const payload = {
      runId,
      mode,
      generatedAt: new Date().toISOString(),
      total: rows.length,
      supported: rows.filter(row => row.is_supported === true).length,
      unsupported: rows.filter(row => row.is_supported === false).length,
      rows,
    }

    const outputPath = process.env.B2B_OBSERVATION_EXPORT_PATH
    const serialized = JSON.stringify(payload, null, 2)
    if (outputPath) {
      await writeFile(outputPath, serialized, 'utf8')
      logger.info('b2b_observation_export_written', { path: outputPath, rows: rows.length })
    } else {
      process.stdout.write(`${serialized}\n`)
    }

    return 0
  } catch (error) {
    logger.error('b2b_observation_export_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return 1
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runExport()
    .then(code => process.exit(code))
    .catch((error) => {
      logger.error('b2b_observation_export_fatal', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}

export { runExport }
