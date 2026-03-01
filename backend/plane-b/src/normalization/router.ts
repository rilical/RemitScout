/**
 * Factor extraction router - dispatches to the appropriate extractor
 * based on the provider's data format and collector type.
 */

import { createLogger } from '../../../shared/logger'
import type { ExtractionContext, ExtractionResult, FactorExtractor } from './types'

const logger = createLogger('plane-b.normalization.router')

export class FactorExtractionRouter {
  private extractors: FactorExtractor[] = []

  register(extractor: FactorExtractor): void {
    if (this.extractors.some(e => e.id === extractor.id)) {
      logger.warn('extractor_already_registered', { extractorId: extractor.id })
      return
    }
    this.extractors.push(extractor)
    logger.debug('extractor_registered', { extractorId: extractor.id, name: extractor.name })
  }

  async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const start = Date.now()
    const candidates = this.extractors.filter(e => e.canExtract(context))

    if (candidates.length === 0) {
      logger.warn('no_extractor_matched', {
        providerId: context.providerId,
        collectorType: context.collectorType,
      })
      return {
        factors: [],
        warnings: ['No extractor matched the provided context'],
        extractorId: 'none',
        durationMs: Date.now() - start,
      }
    }

    // Use the first matching extractor (highest priority)
    const extractor = candidates[0]
    try {
      const result = await extractor.extract(context)
      logger.debug('extraction_complete', {
        extractorId: extractor.id,
        factorCount: result.factors.length,
        durationMs: result.durationMs,
      })
      return result
    } catch (error) {
      const durationMs = Date.now() - start
      logger.error('extraction_failed', {
        extractorId: extractor.id,
        providerId: context.providerId,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      })
      return {
        factors: [],
        warnings: [`Extraction failed: ${error instanceof Error ? error.message : String(error)}`],
        extractorId: extractor.id,
        durationMs,
      }
    }
  }

  getRegisteredExtractors(): readonly FactorExtractor[] {
    return this.extractors
  }
}
