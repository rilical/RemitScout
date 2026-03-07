/**
 * seed-knowledge-plane.ts — Indexes all provider source code into the knowledge plane.
 *
 * Reads parse.ts and fetch.ts for each provider directory under
 * backend/plane-b/src/providers/ and calls knowledgePlane.indexProviderSources().
 *
 * Usage:
 *   pnpm tsx backend/scripts/seed-knowledge-plane.ts
 */

import { readFileSync, existsSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { KnowledgePlane } from '../plane-b/src/agents/knowledge-plane'

const logger = createLogger('script.seed-knowledge-plane')

const PROVIDERS_DIR = join(__dirname, '../plane-b/src/providers')

const readSourceVariant = (
  providerDir: string,
  basename: 'parse' | 'fetch',
): string | undefined => {
  const tsPath = join(providerDir, `${basename}.ts`)
  if (existsSync(tsPath)) {
    return readFileSync(tsPath, 'utf-8')
  }

  const jsPath = join(providerDir, `${basename}.js`)
  if (existsSync(jsPath)) {
    return readFileSync(jsPath, 'utf-8')
  }

  return undefined
}

export interface SeedKnowledgePlaneResult {
  indexed: number
  skipped: number
  total: number
}

export async function seedKnowledgePlane(): Promise<SeedKnowledgePlaneResult> {
  const pool = createPool(config.db.planeBUrl)
  const knowledgePlane = new KnowledgePlane(pool)

  const providerDirs = readdirSync(PROVIDERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  logger.info('seed_starting', { providerCount: providerDirs.length })

  let indexed = 0
  let skipped = 0

  for (const providerId of providerDirs) {
    const providerDir = join(PROVIDERS_DIR, providerId)
    const parserSource = readSourceVariant(providerDir, 'parse')
    const fetchSource = readSourceVariant(providerDir, 'fetch')

    if (!parserSource && !fetchSource) {
      logger.debug('seed_skip_no_sources', { providerId })
      skipped++
      continue
    }

    // Use providerId as both moduleId and providerId — the module_registry
    // may use a compound ID, but for knowledge seeding the providerId is enough.
    const moduleId = `${providerId}:collector`

    try {
      await knowledgePlane.indexProviderSources(moduleId, providerId, {
        parserSource,
        fetchSource,
      })
      indexed++
    } catch (err) {
      logger.error('seed_index_failed', {
        providerId,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  logger.info('seed_complete', {
    indexed,
    skipped,
    total: providerDirs.length,
  })

  await pool.end()
  return {
    indexed,
    skipped,
    total: providerDirs.length,
  }
}

if (require.main === module) {
  seedKnowledgePlane()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('seed_fatal', {
        error: err instanceof Error ? err.message : String(err),
      })
      process.exit(1)
    })
}
