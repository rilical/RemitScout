import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'
import { getErrorMessage } from '../types/errors'

const logger = createLogger('plane-a.feature-flags')
const FEATURE_FLAGS_CACHE_KEY = 'plane-a:feature-flags:v1'

export type FeatureFlagRecord = {
  key: string
  enabled: boolean
  audience_rules: Record<string, unknown>
  metadata: Record<string, unknown>
  updated_by: string | null
  updated_at: string
  created_at: string
}

export type FeatureFlagAuditRecord = {
  id: number
  flag_key: string
  action: 'created' | 'updated' | 'deleted'
  previous_enabled: boolean | null
  next_enabled: boolean | null
  previous_audience_rules: Record<string, unknown> | null
  next_audience_rules: Record<string, unknown> | null
  previous_metadata: Record<string, unknown> | null
  next_metadata: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
}

const parseJsonObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

const invalidateFlagsCache = async () => {
  try {
    const redis = await getRedisClient()
    if (!redis) return
    await redis.del(FEATURE_FLAGS_CACHE_KEY)
  }
  catch (error) {
    logger.warn('feature_flags_cache_invalidate_failed', {
      error: getErrorMessage(error),
    })
  }
}

const getCachedFeatureFlags = async () => {
  try {
    const redis = await getRedisClient()
    if (!redis) return null
    const payload = await redis.get(FEATURE_FLAGS_CACHE_KEY)
    if (!payload) return null
    const parsed = JSON.parse(payload)
    if (!Array.isArray(parsed)) return null
    return parsed as FeatureFlagRecord[]
  }
  catch (error) {
    logger.warn('feature_flags_cache_get_failed', {
      error: getErrorMessage(error),
    })
    return null
  }
}

const setCachedFeatureFlags = async (flags: FeatureFlagRecord[]) => {
  try {
    const redis = await getRedisClient()
    if (!redis) return
    await redis.set(FEATURE_FLAGS_CACHE_KEY, JSON.stringify(flags), {
      EX: Math.max(1, Number(config.planeA.featureFlagsCacheTtlSeconds) || 60),
    })
  }
  catch (error) {
    logger.warn('feature_flags_cache_set_failed', {
      error: getErrorMessage(error),
    })
  }
}

const toFeatureFlag = (row: Record<string, unknown>): FeatureFlagRecord => ({
  key: String(row.key || ''),
  enabled: Boolean(row.enabled),
  audience_rules: parseJsonObject(row.audience_rules),
  metadata: parseJsonObject(row.metadata),
  updated_by: row.updated_by ? String(row.updated_by) : null,
  updated_at: row.updated_at ? new Date(String(row.updated_at)).toISOString() : new Date(0).toISOString(),
  created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date(0).toISOString(),
})

export const listFeatureFlags = async (pool: Pool): Promise<FeatureFlagRecord[]> => {
  const cached = await getCachedFeatureFlags()
  if (cached) return cached

  const result = await query<Record<string, unknown>>(
    `SELECT key, enabled, audience_rules, metadata, updated_by, updated_at, created_at
       FROM public.system_feature_flag
      ORDER BY key ASC`,
    [],
    pool,
  )

  const flags = result.rows.map(toFeatureFlag)
  await setCachedFeatureFlags(flags)
  return flags
}

export const createFeatureFlag = async (
  pool: Pool,
  input: {
    key: string
    enabled: boolean
    audienceRules?: Record<string, unknown>
    metadata?: Record<string, unknown>
    updatedBy?: string | null
  },
): Promise<FeatureFlagRecord> => {
  const insertResult = await query<Record<string, unknown>>(
    `INSERT INTO public.system_feature_flag (
      key,
      enabled,
      audience_rules,
      metadata,
      updated_by,
      updated_at,
      created_at
    ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::uuid, NOW(), NOW())
    RETURNING key, enabled, audience_rules, metadata, updated_by, updated_at, created_at`,
    [
      input.key,
      input.enabled,
      JSON.stringify(input.audienceRules ?? {}),
      JSON.stringify(input.metadata ?? {}),
      input.updatedBy ?? null,
    ],
    pool,
  )

  const created = toFeatureFlag(insertResult.rows[0] || {})

  await query(
    `INSERT INTO public.system_feature_flag_audit (
      flag_key,
      action,
      previous_enabled,
      next_enabled,
      previous_audience_rules,
      next_audience_rules,
      previous_metadata,
      next_metadata,
      changed_by,
      changed_at
    ) VALUES ($1, 'created', NULL, $2, NULL, $3::jsonb, NULL, $4::jsonb, $5::uuid, NOW())`,
    [
      created.key,
      created.enabled,
      JSON.stringify(created.audience_rules),
      JSON.stringify(created.metadata),
      input.updatedBy ?? null,
    ],
    pool,
  )

  await invalidateFlagsCache()
  return created
}

export const getFeatureFlag = async (pool: Pool, key: string): Promise<FeatureFlagRecord | null> => {
  const result = await query<Record<string, unknown>>(
    `SELECT key, enabled, audience_rules, metadata, updated_by, updated_at, created_at
       FROM public.system_feature_flag
      WHERE key = $1`,
    [key],
    pool,
  )

  if (!result.rows[0]) return null
  return toFeatureFlag(result.rows[0])
}

export const updateFeatureFlag = async (
  pool: Pool,
  input: {
    key: string
    enabled?: boolean
    audienceRules?: Record<string, unknown>
    metadata?: Record<string, unknown>
    updatedBy?: string | null
  },
): Promise<FeatureFlagRecord | null> => {
  const current = await getFeatureFlag(pool, input.key)
  if (!current) return null

  const nextEnabled = input.enabled ?? current.enabled
  const nextAudienceRules = input.audienceRules ?? current.audience_rules
  const nextMetadata = input.metadata ?? current.metadata

  const updatedResult = await query<Record<string, unknown>>(
    `UPDATE public.system_feature_flag
        SET enabled = $2,
            audience_rules = $3::jsonb,
            metadata = $4::jsonb,
            updated_by = $5::uuid,
            updated_at = NOW()
      WHERE key = $1
      RETURNING key, enabled, audience_rules, metadata, updated_by, updated_at, created_at`,
    [
      input.key,
      nextEnabled,
      JSON.stringify(nextAudienceRules),
      JSON.stringify(nextMetadata),
      input.updatedBy ?? null,
    ],
    pool,
  )

  const updated = toFeatureFlag(updatedResult.rows[0] || {})

  await query(
    `INSERT INTO public.system_feature_flag_audit (
      flag_key,
      action,
      previous_enabled,
      next_enabled,
      previous_audience_rules,
      next_audience_rules,
      previous_metadata,
      next_metadata,
      changed_by,
      changed_at
    ) VALUES ($1, 'updated', $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::uuid, NOW())`,
    [
      updated.key,
      current.enabled,
      updated.enabled,
      JSON.stringify(current.audience_rules),
      JSON.stringify(updated.audience_rules),
      JSON.stringify(current.metadata),
      JSON.stringify(updated.metadata),
      input.updatedBy ?? null,
    ],
    pool,
  )

  await invalidateFlagsCache()
  return updated
}

export const listFeatureFlagHistory = async (
  pool: Pool,
  key: string,
  limit: number,
): Promise<FeatureFlagAuditRecord[]> => {
  const result = await query<Record<string, unknown>>(
    `SELECT id,
            flag_key,
            action,
            previous_enabled,
            next_enabled,
            previous_audience_rules,
            next_audience_rules,
            previous_metadata,
            next_metadata,
            changed_by,
            changed_at
       FROM public.system_feature_flag_audit
      WHERE flag_key = $1
      ORDER BY changed_at DESC
      LIMIT $2`,
    [key, limit],
    pool,
  )

  return result.rows.map((row) => ({
    id: Number(row.id || 0),
    flag_key: String(row.flag_key || key),
    action: (row.action as FeatureFlagAuditRecord['action']) || 'updated',
    previous_enabled: typeof row.previous_enabled === 'boolean' ? row.previous_enabled : null,
    next_enabled: typeof row.next_enabled === 'boolean' ? row.next_enabled : null,
    previous_audience_rules:
      row.previous_audience_rules && typeof row.previous_audience_rules === 'object'
        ? (row.previous_audience_rules as Record<string, unknown>)
        : null,
    next_audience_rules:
      row.next_audience_rules && typeof row.next_audience_rules === 'object'
        ? (row.next_audience_rules as Record<string, unknown>)
        : null,
    previous_metadata:
      row.previous_metadata && typeof row.previous_metadata === 'object'
        ? (row.previous_metadata as Record<string, unknown>)
        : null,
    next_metadata:
      row.next_metadata && typeof row.next_metadata === 'object'
        ? (row.next_metadata as Record<string, unknown>)
        : null,
    changed_by: row.changed_by ? String(row.changed_by) : null,
    changed_at: row.changed_at ? new Date(String(row.changed_at)).toISOString() : new Date(0).toISOString(),
  }))
}
