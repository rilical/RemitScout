import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (): Record<string, string> => ({
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  service: 'remit-scout',
})

const logger = createLogger('plane-b.agents.knowledge-plane')

/**
 * Knowledge chunk — a unit of indexed knowledge for agent context.
 */
export type KnowledgeChunk = {
  chunkId: string
  sourceType: 'code' | 'documentation' | 'observation' | 'failure' | 'repair'
  sourcePath: string
  content: string
  metadata: Record<string, unknown>
  createdAt: string
  /** Relevance score from the search query (0.0-1.0, higher is more relevant) */
  relevanceScore?: number
}

/**
 * Retrieval quality report — summary of how well the knowledge retrieval performed.
 */
export type RetrievalQualityReport = {
  /** Total chunks returned */
  totalChunks: number
  /** Number of chunks with high relevance (>= 0.7) */
  highRelevanceCount: number
  /** Number of chunks with medium relevance (>= 0.3) */
  mediumRelevanceCount: number
  /** Number of chunks with low relevance (< 0.3) */
  lowRelevanceCount: number
  /** Average relevance score */
  averageRelevance: number
  /** Whether the retrieval quality is sufficient for agent decision-making */
  sufficient: boolean
  /** Source type distribution */
  sourceTypeDistribution: Record<string, number>
}

/**
 * Knowledge Plane — provides contextual knowledge to agents.
 *
 * The Knowledge Plane indexes relevant project knowledge so agents can make
 * informed decisions during self-healing. Knowledge sources include:
 * - Parser source code (per provider, parse.ts)
 * - Fetch source code (per provider, fetch.ts)
 * - Provider documentation and API contracts
 * - Historical failure patterns and successful repairs
 * - DOM signatures and response format snapshots
 *
 * Retrieval quality scoring:
 * - Each returned chunk includes a relevanceScore (0.0-1.0) from ts_rank
 * - Chunks are filtered by a minimum relevance threshold
 * - A RetrievalQualityReport summarizes whether results are actionable
 *
 * Currently implements DB-backed full-text search with ts_rank scoring.
 * Future: pgvector embeddings for semantic retrieval.
 */
export class KnowledgePlane {
  private readonly pool: Pool

  /** Minimum ts_rank score to include a chunk in results */
  private readonly minRelevanceThreshold = 0.01

  /** Relevance score boundaries for quality classification */
  private readonly highRelevanceThreshold = 0.7
  private readonly mediumRelevanceThreshold = 0.3

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Search knowledge chunks by text query with relevance scoring.
   *
   * Returns chunks ordered by relevance score (highest first).
   * Each chunk includes a normalized relevanceScore in [0.0, 1.0].
   */
  async search(query: string, options: {
    sourceType?: string
    moduleId?: string
    providerId?: string
    limit?: number
    minRelevance?: number
  } = {}): Promise<KnowledgeChunk[]> {
    const limit = options.limit ?? 10
    const minRelevance = options.minRelevance ?? this.minRelevanceThreshold
    const conditions: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    // Full-text search on content
    conditions.push(`to_tsvector('english', content) @@ plainto_tsquery('english', $${paramIndex})`)
    values.push(query)
    paramIndex++

    if (options.sourceType) {
      conditions.push(`source_type = $${paramIndex}`)
      values.push(options.sourceType)
      paramIndex++
    }

    if (options.moduleId) {
      conditions.push(`metadata->>'moduleId' = $${paramIndex}`)
      values.push(options.moduleId)
      paramIndex++
    }

    if (options.providerId) {
      conditions.push(`metadata->>'providerId' = $${paramIndex}`)
      values.push(options.providerId)
      paramIndex++
    }

    values.push(limit)

    // Add minimum relevance threshold as an additional WHERE condition
    conditions.push(`ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) >= ${minRelevance}`)

    const { rows } = await this.pool.query<{
      chunk_id: string
      source_type: string
      source_path: string
      content: string
      metadata: Record<string, unknown>
      created_at: string
      rank_score: number
    }>(
      `SELECT chunk_id, source_type, source_path, content, metadata, created_at,
              ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) AS rank_score
       FROM silver.knowledge_chunk
       WHERE ${conditions.join(' AND ')}
       ORDER BY rank_score DESC
       LIMIT $${paramIndex}`,
      values,
    )

    // Normalize rank scores to [0.0, 1.0]
    const maxScore = rows.length > 0 ? Math.max(...rows.map((r) => r.rank_score), 0.001) : 1
    return rows.map((r) => ({
      chunkId: r.chunk_id,
      sourceType: r.source_type as KnowledgeChunk['sourceType'],
      sourcePath: r.source_path,
      content: r.content,
      metadata: r.metadata,
      createdAt: r.created_at,
      relevanceScore: Math.min(1.0, r.rank_score / maxScore),
    }))
  }

  /**
   * Search with retrieval quality assessment.
   *
   * Returns both the chunks and a quality report indicating whether
   * the retrieved context is sufficient for agent decision-making.
   */
  async searchWithQuality(query: string, options: {
    sourceType?: string
    moduleId?: string
    providerId?: string
    limit?: number
    minRelevance?: number
  } = {}): Promise<{ chunks: KnowledgeChunk[]; quality: RetrievalQualityReport }> {
    const chunks = await this.search(query, options)
    const quality = this.assessRetrievalQuality(chunks)

    // Emit retrieval metrics
    recordCloudWatchMetric({
      name: 'knowledge_retrieval_total',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions(),
    })
    if (!quality.sufficient) {
      recordCloudWatchMetric({
        name: 'knowledge_retrieval_insufficient',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions(),
      })
    }

    logger.debug('knowledge_search_quality', {
      query: query.slice(0, 100),
      totalChunks: quality.totalChunks,
      averageRelevance: quality.averageRelevance.toFixed(3),
      sufficient: quality.sufficient,
    })

    return { chunks, quality }
  }

  /**
   * Assess the quality of a retrieval result set.
   */
  assessRetrievalQuality(chunks: KnowledgeChunk[]): RetrievalQualityReport {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        highRelevanceCount: 0,
        mediumRelevanceCount: 0,
        lowRelevanceCount: 0,
        averageRelevance: 0,
        sufficient: false,
        sourceTypeDistribution: {},
      }
    }

    let highCount = 0
    let mediumCount = 0
    let lowCount = 0
    let totalRelevance = 0
    const sourceTypeDist: Record<string, number> = {}

    for (const chunk of chunks) {
      const score = chunk.relevanceScore ?? 0
      totalRelevance += score

      if (score >= this.highRelevanceThreshold) highCount++
      else if (score >= this.mediumRelevanceThreshold) mediumCount++
      else lowCount++

      sourceTypeDist[chunk.sourceType] = (sourceTypeDist[chunk.sourceType] ?? 0) + 1
    }

    const averageRelevance = totalRelevance / chunks.length

    // Retrieval is sufficient if we have at least one high-relevance chunk,
    // or at least two medium-relevance chunks, or the average is above 0.4
    const sufficient = highCount >= 1 || mediumCount >= 2 || averageRelevance >= 0.4

    return {
      totalChunks: chunks.length,
      highRelevanceCount: highCount,
      mediumRelevanceCount: mediumCount,
      lowRelevanceCount: lowCount,
      averageRelevance,
      sufficient,
      sourceTypeDistribution: sourceTypeDist,
    }
  }

  /**
   * Index a knowledge chunk.
   *
   * Upserts by source_path to avoid duplicate entries for the same file.
   */
  async index(chunk: Omit<KnowledgeChunk, 'chunkId' | 'createdAt' | 'relevanceScore'>): Promise<string> {
    // Try upsert first (requires unique index on source_path).
    // Falls back to plain insert if the constraint doesn't exist.
    try {
      const { rows } = await this.pool.query<{ chunk_id: string }>(
        `INSERT INTO silver.knowledge_chunk
         (source_type, source_path, content, metadata)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_path) DO UPDATE
           SET content = EXCLUDED.content,
               metadata = EXCLUDED.metadata,
               updated_at = NOW()
         RETURNING chunk_id`,
        [chunk.sourceType, chunk.sourcePath, chunk.content, JSON.stringify(chunk.metadata)],
      )

      logger.debug('knowledge_indexed', { chunkId: rows[0].chunk_id, sourceType: chunk.sourceType, sourcePath: chunk.sourcePath })
      return rows[0].chunk_id
    } catch (err) {
      // If ON CONFLICT fails (no unique constraint), fall back to plain insert
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('there is no unique or exclusion constraint')) {
        const { rows } = await this.pool.query<{ chunk_id: string }>(
          `INSERT INTO silver.knowledge_chunk
           (source_type, source_path, content, metadata)
           VALUES ($1, $2, $3, $4)
           RETURNING chunk_id`,
          [chunk.sourceType, chunk.sourcePath, chunk.content, JSON.stringify(chunk.metadata)],
        )
        logger.debug('knowledge_indexed_fallback', { chunkId: rows[0].chunk_id, sourceType: chunk.sourceType })
        return rows[0].chunk_id
      }
      throw err
    }
  }

  /**
   * Index provider parser source code for a module.
   */
  async indexParserSource(moduleId: string, providerId: string, parserSource: string): Promise<void> {
    await this.index({
      sourceType: 'code',
      sourcePath: `backend/plane-b/src/providers/${providerId}/parse.ts`,
      content: parserSource,
      metadata: { moduleId, providerId, fileType: 'parser' },
    })
  }

  /**
   * Index provider fetch source code for a module.
   *
   * The fetch.ts file contains the HTTP/Playwright/API fetch logic
   * and is essential context for diagnosing fetch-layer failures.
   */
  async indexFetchSource(moduleId: string, providerId: string, fetchSource: string): Promise<void> {
    await this.index({
      sourceType: 'code',
      sourcePath: `backend/plane-b/src/providers/${providerId}/fetch.ts`,
      content: fetchSource,
      metadata: { moduleId, providerId, fileType: 'fetch' },
    })
  }

  /**
   * Index all source files for a provider module.
   *
   * Indexes parse.ts, fetch.ts, and any additional source files
   * relevant to the agent self-healing context.
   */
  async indexProviderSources(moduleId: string, providerId: string, sources: {
    parserSource?: string
    fetchSource?: string
    configSource?: string
  }): Promise<void> {
    const promises: Promise<void>[] = []

    if (sources.parserSource) {
      promises.push(this.indexParserSource(moduleId, providerId, sources.parserSource))
    }
    if (sources.fetchSource) {
      promises.push(this.indexFetchSource(moduleId, providerId, sources.fetchSource))
    }
    if (sources.configSource) {
      promises.push(
        this.index({
          sourceType: 'code',
          sourcePath: `backend/plane-b/src/providers/${providerId}/config.ts`,
          content: sources.configSource,
          metadata: { moduleId, providerId, fileType: 'config' },
        }).then(() => undefined),
      )
    }

    await Promise.all(promises)
    logger.info('provider_sources_indexed', { moduleId, providerId, fileCount: promises.length })
  }

  /**
   * Index a failure bundle as knowledge for future repairs.
   */
  async indexFailureBundle(bundle: {
    bundleId: string
    moduleId: string
    providerId: string
    category: string
    errorMessage: string
    errorType: string
  }): Promise<void> {
    await this.index({
      sourceType: 'failure',
      sourcePath: `failure-bundle/${bundle.bundleId}`,
      content: `Failure in ${bundle.moduleId}: ${bundle.category} — ${bundle.errorType}: ${bundle.errorMessage}`,
      metadata: {
        bundleId: bundle.bundleId,
        moduleId: bundle.moduleId,
        providerId: bundle.providerId,
        category: bundle.category,
      },
    })
  }

  /**
   * Index a successful repair for future reference.
   */
  async indexRepair(repair: {
    bundleId: string
    moduleId: string
    providerId: string
    description: string
    prUrl: string | null
  }): Promise<void> {
    await this.index({
      sourceType: 'repair',
      sourcePath: repair.prUrl ?? `repair/${repair.bundleId}`,
      content: `Successful repair for ${repair.moduleId}: ${repair.description}`,
      metadata: {
        bundleId: repair.bundleId,
        moduleId: repair.moduleId,
        providerId: repair.providerId,
        prUrl: repair.prUrl,
      },
    })
  }

  /**
   * Get retrieval quality statistics for a provider.
   *
   * Returns a summary of indexed knowledge available for a provider,
   * which helps agents assess whether they have enough context for repair.
   */
  async getProviderKnowledgeSummary(providerId: string): Promise<{
    totalChunks: number
    bySourceType: Record<string, number>
    hasParserSource: boolean
    hasFetchSource: boolean
    repairCount: number
    failureCount: number
  }> {
    const { rows } = await this.pool.query<{
      source_type: string
      count: string
    }>(
      `SELECT source_type, COUNT(*) as count
       FROM silver.knowledge_chunk
       WHERE metadata->>'providerId' = $1
       GROUP BY source_type`,
      [providerId],
    )

    const bySourceType: Record<string, number> = {}
    let totalChunks = 0
    for (const r of rows) {
      bySourceType[r.source_type] = parseInt(r.count, 10)
      totalChunks += parseInt(r.count, 10)
    }

    // Check for specific files
    const { rows: fileChecks } = await this.pool.query<{ source_path: string }>(
      `SELECT source_path FROM silver.knowledge_chunk
       WHERE metadata->>'providerId' = $1
         AND source_type = 'code'
         AND (source_path LIKE '%/parse.ts' OR source_path LIKE '%/fetch.ts')`,
      [providerId],
    )
    const paths = fileChecks.map((r) => r.source_path)

    return {
      totalChunks,
      bySourceType,
      hasParserSource: paths.some((p) => p.endsWith('/parse.ts')),
      hasFetchSource: paths.some((p) => p.endsWith('/fetch.ts')),
      repairCount: bySourceType['repair'] ?? 0,
      failureCount: bySourceType['failure'] ?? 0,
    }
  }
}
