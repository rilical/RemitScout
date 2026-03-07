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

export type RuntimeFlagKey =
  | 'pulse.public'
  | 'pulse.screener'
  | 'enterprise.public'
  | 'ads.public'

export type RuntimeFlagDefinition = {
  key: RuntimeFlagKey
  label: string
  description: string
  hardGateEnabled: boolean
  bootstrapEnabled: boolean
}

export type RuntimeFlagContext = {
  effectivePlanCode?: string | null
  pulseAccess?: 'none' | 'lite' | 'full' | null
  isAdmin?: boolean
  envName?: string | null
}

type NormalizedRuntimeFlagContext = {
  effectivePlanCode: string
  pulseAccess: 'none' | 'lite' | 'full'
  envName: string
}

export type RuntimeFlagSource =
  | 'hard_env_disabled'
  | 'entitlement_override'
  | 'db_flag'
  | 'bootstrap_default'

export type EffectiveRuntimeFlag = {
  key: RuntimeFlagKey
  label: string
  description: string
  enabled: boolean
  source: RuntimeFlagSource
  reason: string
  hard_gate_enabled: boolean
  bootstrap_enabled: boolean
  plan_code: string
  pulse_access: 'none' | 'lite' | 'full'
  matched_audience_rules: boolean
  db_flag: FeatureFlagRecord | null
}

const DEFAULT_RUNTIME_FLAG_KEYS: RuntimeFlagKey[] = [
  'pulse.public',
  'pulse.screener',
  'enterprise.public',
  'ads.public',
]

const parseJsonObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

const readRuntimeFlagDefinitions = (): RuntimeFlagDefinition[] => {
  const pulseHardGate = parseBooleanEnv(
    process.env.PUBLIC_PULSE_ENABLED ?? process.env.NUXT_PUBLIC_PULSE_ENABLED,
    false,
  )
  const pulseScreenerHardGate = parseBooleanEnv(
    process.env.PUBLIC_PULSE_SCREENER_ENABLED ?? process.env.NUXT_PUBLIC_PULSE_SCREENER_ENABLED,
    true,
  )
  const enterpriseHardGate = parseBooleanEnv(
    process.env.PUBLIC_ENTERPRISE_ENABLED ?? process.env.NUXT_PUBLIC_ENTERPRISE_ENABLED,
    false,
  )
  const adsHardGate = parseBooleanEnv(
    process.env.PUBLIC_ENABLE_ADS ?? process.env.PUBLIC_ADS_ENABLED,
    false,
  )

  return [
    {
      key: 'pulse.public',
      label: 'Pulse public rollout',
      description: 'Controls whether Pulse is visible to non-entitled users.',
      hardGateEnabled: pulseHardGate,
      bootstrapEnabled: pulseHardGate,
    },
    {
      key: 'pulse.screener',
      label: 'Pulse screener',
      description: 'Controls the screener-first Pulse experience.',
      hardGateEnabled: pulseScreenerHardGate,
      bootstrapEnabled: pulseScreenerHardGate,
    },
    {
      key: 'enterprise.public',
      label: 'Enterprise visibility',
      description: 'Controls public enterprise marketing and navigation visibility.',
      hardGateEnabled: enterpriseHardGate,
      bootstrapEnabled: enterpriseHardGate,
    },
    {
      key: 'ads.public',
      label: 'Ads serving',
      description: 'Controls whether monetized ads may render for free users.',
      hardGateEnabled: adsHardGate,
      bootstrapEnabled: adsHardGate,
    },
  ]
}

const getStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? '').trim().toLowerCase())
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

const getNestedObject = (value: Record<string, unknown>, key: string): Record<string, unknown> =>
  parseJsonObject(value[key])

const normalizeRuntimeFlagContext = (context: RuntimeFlagContext = {}): NormalizedRuntimeFlagContext => {
  const rawPlanCode = typeof context.effectivePlanCode === 'string'
    ? context.effectivePlanCode.trim().toLowerCase()
    : ''
  const rawEnvName = typeof context.envName === 'string'
    ? context.envName.trim().toLowerCase()
    : ''
  const defaultEnvName = typeof config.envName === 'string'
    ? config.envName.trim().toLowerCase()
    : ''

  return {
    effectivePlanCode: rawPlanCode || 'free',
    pulseAccess: context.pulseAccess === 'lite' || context.pulseAccess === 'full'
      ? context.pulseAccess
      : 'none',
    envName: rawEnvName || defaultEnvName || 'unknown',
  }
}

const matchesAudienceRules = (
  rules: Record<string, unknown>,
  context: NormalizedRuntimeFlagContext,
): boolean => {
  if (!Object.keys(rules).length) return true
  if (rules.global === false) return false

  const plans = getNestedObject(rules, 'plans')
  const allowPlans = getStringList(plans.allow)
  const denyPlans = getStringList(plans.deny)
  if (denyPlans.includes(context.effectivePlanCode)) return false
  if (allowPlans.length > 0 && !allowPlans.includes(context.effectivePlanCode)) return false

  const envs = getNestedObject(rules, 'envs')
  const allowEnvs = getStringList(envs.allow)
  const denyEnvs = getStringList(envs.deny)
  const normalizedEnv = context.envName.trim().toLowerCase()
  if (denyEnvs.includes(normalizedEnv)) return false
  if (allowEnvs.length > 0 && !allowEnvs.includes(normalizedEnv)) return false

  const pulseAccess = getNestedObject(rules, 'pulse_access')
  const allowPulseAccess = getStringList(pulseAccess.allow)
  const denyPulseAccess = getStringList(pulseAccess.deny)
  if (denyPulseAccess.includes(context.pulseAccess)) return false
  if (allowPulseAccess.length > 0 && !allowPulseAccess.includes(context.pulseAccess)) return false

  return true
}

const resolveEntitlementOverride = (
  definition: RuntimeFlagDefinition,
  context: NormalizedRuntimeFlagContext,
): { enabled: boolean, reason: string } | null => {
  if (definition.key === 'pulse.public' && context.pulseAccess !== 'none') {
    return {
      enabled: true,
      reason: `Enabled by paid entitlement (${context.pulseAccess}).`,
    }
  }

  if (definition.key === 'enterprise.public' && context.effectivePlanCode === 'enterprise') {
    return {
      enabled: true,
      reason: 'Enabled by enterprise entitlement.',
    }
  }

  return null
}

const toRuntimeFlag = (
  definition: RuntimeFlagDefinition,
  dbFlag: FeatureFlagRecord | null,
  context: NormalizedRuntimeFlagContext,
): EffectiveRuntimeFlag => {
  const audienceRules = dbFlag?.audience_rules ?? {}
  const audienceMatch = matchesAudienceRules(audienceRules, context)
  const entitlementOverride = resolveEntitlementOverride(definition, context)

  if (!definition.hardGateEnabled) {
    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      enabled: false,
      source: 'hard_env_disabled',
      reason: 'Hard environment gate is disabled.',
      hard_gate_enabled: definition.hardGateEnabled,
      bootstrap_enabled: definition.bootstrapEnabled,
      plan_code: context.effectivePlanCode,
      pulse_access: context.pulseAccess,
      matched_audience_rules: audienceMatch,
      db_flag: dbFlag,
    }
  }

  if (entitlementOverride) {
    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      enabled: entitlementOverride.enabled,
      source: 'entitlement_override',
      reason: entitlementOverride.reason,
      hard_gate_enabled: definition.hardGateEnabled,
      bootstrap_enabled: definition.bootstrapEnabled,
      plan_code: context.effectivePlanCode,
      pulse_access: context.pulseAccess,
      matched_audience_rules: audienceMatch,
      db_flag: dbFlag,
    }
  }

  if (dbFlag) {
    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      enabled: dbFlag.enabled && audienceMatch,
      source: 'db_flag',
      reason: dbFlag.enabled
        ? audienceMatch
          ? 'Enabled by database flag.'
          : 'Database flag is enabled, but this audience is excluded.'
        : 'Disabled by database flag.',
      hard_gate_enabled: definition.hardGateEnabled,
      bootstrap_enabled: definition.bootstrapEnabled,
      plan_code: context.effectivePlanCode,
      pulse_access: context.pulseAccess,
      matched_audience_rules: audienceMatch,
      db_flag: dbFlag,
    }
  }

  return {
    key: definition.key,
    label: definition.label,
    description: definition.description,
    enabled: definition.bootstrapEnabled,
    source: 'bootstrap_default',
    reason: 'No database override exists; using bootstrap default.',
    hard_gate_enabled: definition.hardGateEnabled,
    bootstrap_enabled: definition.bootstrapEnabled,
    plan_code: context.effectivePlanCode,
    pulse_access: context.pulseAccess,
    matched_audience_rules: audienceMatch,
    db_flag: null,
  }
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

export const getRuntimeFlagDefinitions = (): RuntimeFlagDefinition[] => readRuntimeFlagDefinitions()

export const getEffectiveRuntimeFlags = async (
  pool: Pool,
  context: RuntimeFlagContext = {},
): Promise<{
  generated_at: string
  flags: EffectiveRuntimeFlag[]
}> => {
  const flags = await listFeatureFlags(pool)
  const flagsByKey = new Map(flags.map((flag) => [flag.key, flag]))
  const resolvedContext = normalizeRuntimeFlagContext(context)

  const runtimeFlags = readRuntimeFlagDefinitions().map((definition) =>
    toRuntimeFlag(
      definition,
      flagsByKey.get(definition.key) ?? null,
      resolvedContext,
    ),
  )

  return {
    generated_at: new Date().toISOString(),
    flags: runtimeFlags,
  }
}

export const ensureRuntimeFlagSeed = async (pool: Pool): Promise<void> => {
  const existing = await listFeatureFlags(pool)
  const existingKeys = new Set(existing.map((flag) => flag.key))
  const definitions = readRuntimeFlagDefinitions()

  for (const definition of definitions) {
    if (existingKeys.has(definition.key)) continue

    await createFeatureFlag(pool, {
      key: definition.key,
      enabled: definition.bootstrapEnabled,
      metadata: {
        source: 'bootstrap_seed',
        label: definition.label,
        description: definition.description,
        managed_runtime_flag: true,
      },
      audienceRules: { global: true },
      updatedBy: null,
    })
  }
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
