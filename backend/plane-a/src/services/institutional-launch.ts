import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.institutional-launch')

export type InstitutionalDataMaturityReason =
  | 'ready'
  | 'no_sellable_history'
  | 'accumulating_history'

export type InstitutionalDataMaturity = {
  ready: boolean
  requiredDays: number
  availableDays: number
  reason: InstitutionalDataMaturityReason
  updatedAt: string | null
}

export type InstitutionalLaunchGate = InstitutionalDataMaturity & {
  enforced: boolean
  blocked: boolean
  message: string
}

type InstitutionalDataWindowRow = {
  min_date: string | Date | null
  max_date: string | Date | null
  updated_at: string | Date | null
  row_count: number
}

const PROD_ENV_NAMES = new Set(['prod', 'production'])

const toDate = (value: string | Date | null): Date | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toIsoString = (value: string | Date | null): string | null => {
  const parsed = toDate(value)
  return parsed ? parsed.toISOString() : null
}

const calculateAvailableDays = (minDate: Date | null, maxDate: Date | null): number => {
  if (!minDate || !maxDate) return 0
  const diffMs = maxDate.getTime() - minDate.getTime()
  if (diffMs < 0) return 0
  return Math.max(1, Math.floor(diffMs / 86_400_000) + 1)
}

export const isInstitutionalLaunchGateEnforced = (envName = config.envName): boolean => {
  return PROD_ENV_NAMES.has((envName || '').trim().toLowerCase())
}

export const describeInstitutionalLaunchGate = (
  maturity: InstitutionalDataMaturity,
  enforced: boolean,
): string => {
  if (maturity.ready) {
    return `Institutional launch gate is open with ${maturity.availableDays} days of sellable Gold history.`
  }

  if (maturity.reason === 'no_sellable_history') {
    return enforced
      ? `Institutional launch is blocked until ${maturity.requiredDays} days of sellable Gold history are available.`
      : `Prod launch remains blocked until ${maturity.requiredDays} days of sellable Gold history are available.`
  }

  return enforced
    ? `Institutional launch is blocked until ${maturity.requiredDays} days of sellable Gold history are available (${maturity.availableDays} currently available).`
    : `Prod launch remains blocked until ${maturity.requiredDays} days of sellable Gold history are available (${maturity.availableDays} currently available).`
}

export const toInstitutionalLaunchGate = (
  maturity: InstitutionalDataMaturity,
  envName = config.envName,
): InstitutionalLaunchGate => {
  const enforced = isInstitutionalLaunchGateEnforced(envName)
  const blocked = enforced && !maturity.ready

  return {
    ...maturity,
    enforced,
    blocked,
    message: describeInstitutionalLaunchGate(maturity, enforced),
  }
}

export const getInstitutionalDataMaturity = async (
  pool: Pool,
): Promise<InstitutionalDataMaturity> => {
  const requiredDays = Math.max(1, config.compliance.institutional_data_maturity.required_days || 180)

  try {
    // Institutional launch maturity is anchored to the Gold export contract that
    // backs sellable indices/history products today.
    const result = await query<InstitutionalDataWindowRow>(
      `
      SELECT
        MIN(date) AS min_date,
        MAX(date) AS max_date,
        MAX(created_at) AS updated_at,
        COUNT(*)::int AS row_count
      FROM gold_export.cdp_daily
      `,
      [],
      pool,
    )

    const row = result.rows[0]
    const minDate = toDate(row?.min_date ?? null)
    const maxDate = toDate(row?.max_date ?? null)
    const availableDays = row && row.row_count > 0 ? calculateAvailableDays(minDate, maxDate) : 0
    const ready = availableDays >= requiredDays
    const reason: InstitutionalDataMaturityReason =
      ready
        ? 'ready'
        : availableDays > 0
          ? 'accumulating_history'
          : 'no_sellable_history'

    return {
      ready,
      requiredDays,
      availableDays,
      reason,
      updatedAt: toIsoString(row?.updated_at ?? null),
    }
  } catch (error) {
    logger.error('institutional_data_maturity_lookup_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export const getInstitutionalLaunchGate = async (
  pool: Pool,
  envName = config.envName,
): Promise<InstitutionalLaunchGate> => {
  const maturity = await getInstitutionalDataMaturity(pool)
  return toInstitutionalLaunchGate(maturity, envName)
}
