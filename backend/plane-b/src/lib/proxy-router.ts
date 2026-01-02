import type { Pool } from 'pg'

import { createLogger } from '../../../shared/logger'
import { CorridorPriorityRepository } from '../repositories'

const logger = createLogger('plane-b.proxy-router')

export type ProxyTier = 'RESIDENTIAL_PREMIUM' | 'DATACENTER_ROTATING' | 'NONE'

const isProxyTier = (value: string | null | undefined): value is ProxyTier =>
  value === 'RESIDENTIAL_PREMIUM' || value === 'DATACENTER_ROTATING' || value === 'NONE'

export const getProxyForTier = (tier: ProxyTier): string | null => {
  switch (tier) {
    case 'RESIDENTIAL_PREMIUM':
      return process.env.PROXY_RESIDENTIAL_URL || null
    case 'DATACENTER_ROTATING':
      return process.env.PROXY_DATACENTER_URL || null
    case 'NONE':
      return null
    default:
      logger.warn('unknown_proxy_tier', { tier })
      return null
  }
}

export const getProxyTierForCorridor = async (
  pool: Pool,
  corridorId: string,
): Promise<ProxyTier> => {
  try {
    const repo = new CorridorPriorityRepository(pool)
    const row = await repo.getProxyTier(corridorId)
    const proxyTier = row?.proxy_tier
    if (isProxyTier(proxyTier)) {
      return proxyTier
    }
    if (proxyTier) {
      logger.warn('unknown_proxy_tier', { corridor_id: corridorId, proxy_tier: proxyTier })
    }
  } catch (error) {
    logger.warn('proxy_tier_lookup_failed', { corridor_id: corridorId, error })
  }

  return 'NONE'
}
