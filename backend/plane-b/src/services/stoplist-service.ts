import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { CircuitBreakerRepository } from '../repositories/implementations/circuit-breaker-repository'
import { RightsMatrixRepository } from '../repositories/implementations/rights-matrix-repository'
import { OpsAlertRepository } from '../repositories/implementations/ops-alert-repository'

const logger = createLogger('plane-b.stoplist-service')

export type BlockType = '403' | 'captcha' | 'rate_limit'

export const getBlockTypeFromReason = (
  reason: string | null,
  httpStatus?: number | null,
): BlockType => {
  if (httpStatus === 403 || reason === 'http_403') {
    return '403'
  }
  if (httpStatus === 429 || reason === 'http_429' || reason === 'keyword_too_many_requests' || reason === 'keyword_rate_limit') {
    return 'rate_limit'
  }
  if (reason && (reason.includes('captcha') || reason.includes('challenge'))) {
    return 'captcha'
  }
  return '403'
}

export class StoplistService {
  constructor(private readonly pool: Pool) {}

  async updateStoplistStatus(
    providerId: string,
    status: 'active' | 'paused',
  ): Promise<void> {
    const rightsRepo = new RightsMatrixRepository(this.pool)

    if (status === 'paused') {
      await rightsRepo.pauseProvider(providerId, `auto_paused:stop_on_block`)
    } else {
      await rightsRepo.setProviderActive(providerId)
    }

    const opsRepo = new OpsAlertRepository(this.pool)
    await opsRepo.insertAlert({
      providerId,
      corridorId: null,
      amountBucket: null,
      httpStatus: null,
      blockReason: `stoplist_status_${status}`,
      bronzeObjectKey: null,
      requestId: `stoplist_${Date.now()}`,
      payload: { action: 'update_stoplist_status', status },
    })

    logger.info('stoplist_status_updated', {
      provider_id: providerId,
      status,
    })
  }

  async openCircuitBreaker(
    providerId: string,
    corridorId: string,
    reason: string,
  ): Promise<void> {
    const circuitRepo = new CircuitBreakerRepository(this.pool)
    const cooldownMs = config.planeB.blockCooldownMs || 86400000
    const cooldownUntil = new Date(Date.now() + cooldownMs).toISOString()

    await circuitRepo.openCircuit(providerId, corridorId, reason, cooldownUntil)

    logger.info('circuit_breaker_opened', {
      provider_id: providerId,
      corridor_id: corridorId,
      reason,
      cooldown_ms: cooldownMs,
    })
  }

  async handleBlockDetection(
    providerId: string,
    corridorId: string,
    blockType: BlockType,
  ): Promise<void> {
    try {
      const reason = `auto_blocked:${blockType}`

      await this.updateStoplistStatus(providerId, 'paused')
      await this.openCircuitBreaker(providerId, corridorId, reason)

      const opsRepo = new OpsAlertRepository(this.pool)
      await opsRepo.insertAlert({
        providerId,
        corridorId,
        amountBucket: null,
        httpStatus: blockType === '403' ? 403 : blockType === 'rate_limit' ? 429 : null,
        blockReason: reason,
        bronzeObjectKey: null,
        requestId: `block_detection_${Date.now()}`,
        payload: {
          action: 'auto_stop_on_block',
          block_type: blockType,
        },
      })

      logger.info('block_detection_handled', {
        provider_id: providerId,
        corridor_id: corridorId,
        block_type: blockType,
        reason,
      })
    } catch (error) {
      logger.error('block_detection_handle_failed', {
        provider_id: providerId,
        corridor_id: corridorId,
        block_type: blockType,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  async shouldAutoResume(providerId: string): Promise<boolean> {
    const rightsRepo = new RightsMatrixRepository(this.pool)
    const circuitRepo = new CircuitBreakerRepository(this.pool)

    const statusRow = await rightsRepo.getProviderStatus(providerId)
    if (!statusRow || statusRow.stoplist_status !== 'paused') {
      return false
    }

    const notes = statusRow.notes ?? ''
    if (!notes.startsWith('auto_paused:')) {
      return false
    }

    const openCircuits = await circuitRepo.loadOpenCircuits(providerId)
    if (openCircuits.length === 0) {
      return true
    }

    const now = Date.now()
    const cooldownMs = config.planeB.blockCooldownMs || 86400000

    for (const circuit of openCircuits) {
      if (circuit.cooldown_until) {
        const cooldownUntil = new Date(circuit.cooldown_until).getTime()
        if (cooldownUntil > now) {
          return false
        }
      } else {
        return false
      }
    }

    return true
  }

  async autoResumeProvider(providerId: string): Promise<void> {
    try {
      const rightsRepo = new RightsMatrixRepository(this.pool)
      const circuitRepo = new CircuitBreakerRepository(this.pool)

      await rightsRepo.setProviderActive(providerId)
      await circuitRepo.closeExpiredOpenCircuits(providerId)

      const opsRepo = new OpsAlertRepository(this.pool)
      await opsRepo.insertAlert({
        providerId,
        corridorId: null,
        amountBucket: null,
        httpStatus: null,
        blockReason: 'auto_resume',
        bronzeObjectKey: null,
        requestId: `auto_resume_${Date.now()}`,
        payload: { action: 'auto_resume_provider' },
      })

      logger.info('provider_auto_resumed', {
        provider_id: providerId,
      })
    } catch (error) {
      logger.error('provider_auto_resume_failed', {
        provider_id: providerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }
}

