import type { Pool } from 'pg'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { hashApiKey } from './api-keys'

const logger = createLogger('plane-a.institutional-clients')

export type InstitutionalClientTier = 'trial' | 'standard' | 'premium'
export type InstitutionalClientStatus = 'active' | 'suspended' | 'revoked'

export type InstitutionalClientContext = {
  id: string
  name: string
  tier: InstitutionalClientTier
  corridors_allowed: string[] | null
  rate_limit_rpm: number
  rate_limit_daily: number
  status: InstitutionalClientStatus
  contract_start: string | null // YYYY-MM-DD
  contract_end: string | null // YYYY-MM-DD
}

type InstitutionalClientRow = {
  id: string
  name: string
  tier: InstitutionalClientTier
  corridors_allowed: string[] | null
  rate_limit_rpm: number
  rate_limit_daily: number
  status: InstitutionalClientStatus
  contract_start: string | null
  contract_end: string | null
}

export const getInstitutionalClientScopes = (tier: InstitutionalClientTier): string[] => {
  if (tier === 'premium') {
    return ['indices:read', 'corridors:read', 'exports:read']
  }
  if (tier === 'standard') {
    return ['indices:read', 'corridors:read']
  }
  return ['indices:read']
}

export const validateInstitutionalClientApiKey = async (
  pool: Pool,
  token: string,
): Promise<InstitutionalClientContext | null> => {
  const keyHash = hashApiKey(token)

  try {
    const result = await query<InstitutionalClientRow>(
      `
      SELECT
        id,
        name,
        tier,
        corridors_allowed,
        rate_limit_rpm,
        rate_limit_daily,
        status,
        contract_start::text AS contract_start,
        contract_end::text AS contract_end
      FROM public.institutional_client
      WHERE api_key_hash = $1
      LIMIT 1
      `,
      [keyHash],
      pool,
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      tier: row.tier,
      corridors_allowed: row.corridors_allowed,
      rate_limit_rpm: Number(row.rate_limit_rpm) || 0,
      rate_limit_daily: Number(row.rate_limit_daily) || 0,
      status: row.status,
      contract_start: row.contract_start,
      contract_end: row.contract_end,
    }
  } catch (error) {
    logger.warn('institutional_client_lookup_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export const isInstitutionalClientActive = (client: InstitutionalClientContext): boolean => {
  if (client.status !== 'active') return false

  // Compare by date string in UTC (YYYY-MM-DD) to avoid timezone surprises.
  const today = new Date().toISOString().slice(0, 10)
  if (client.contract_start && client.contract_start > today) return false
  if (client.contract_end && client.contract_end < today) return false
  return true
}

