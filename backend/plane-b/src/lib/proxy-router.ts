import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.proxy-router')

export type ProxyTier = 'RESIDENTIAL_PREMIUM' | 'DATACENTER_ROTATING' | 'NONE'

type CorridorPriorityRow = {
  proxy_tier: string | null
}

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
    const result = await query<CorridorPriorityRow>(
      `SELECT proxy_tier
         FROM silver.corridor_priority
        WHERE corridor_id = $1`,
      [corridorId],
      pool,
    )
    const proxyTier = result.rows[0]?.proxy_tier
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
