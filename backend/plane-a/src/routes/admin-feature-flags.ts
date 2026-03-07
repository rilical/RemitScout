import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ValidationError, NotFoundError } from '../../../shared/errors'
import { requireAdmin, requireSuperAdmin } from '../plugins/auth-plugin'
import {
  createFeatureFlag,
  getEffectiveRuntimeFlags,
  getFeatureFlag,
  getRuntimeFlagDefinitions,
  listFeatureFlagHistory,
  listFeatureFlags,
  updateFeatureFlag,
} from '../services/feature-flags'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { resolveEffectiveEntitlements } from '../services/effective-entitlements'

const flagKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{1,79}$/)

const createFlagSchema = z.object({
  key: flagKeySchema,
  enabled: z.boolean().default(false),
  audience_rules: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const updateFlagSchema = z.object({
  enabled: z.boolean().optional(),
  audience_rules: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine((value) => value.enabled !== undefined || value.audience_rules !== undefined || value.metadata !== undefined, {
  message: 'at_least_one_field_required',
})

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const adminFeatureFlagsRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool

  const resolveRuntimeFlagContext = async (request: {
    user?: {
      user_id?: string
      email?: string | null
      role?: string | null
      is_admin?: boolean
    }
  }) => {
    if (!request.user?.user_id) {
      return {
        effectivePlanCode: 'free',
        pulseAccess: 'none' as const,
        isAdmin: false,
      }
    }

    await ensureUserPlan(pool, request.user.user_id)
    const plan = await getUserPlan(pool, request.user.user_id)
    const effective = await resolveEffectiveEntitlements({
      pool,
      userId: request.user.user_id,
      email: request.user.email ?? null,
      supabaseRole: request.user.role ?? null,
      plan,
    })

    return {
      effectivePlanCode: effective.effectivePlanCode,
      pulseAccess: effective.entitlements.pulse_access,
      isAdmin: Boolean(request.user.is_admin),
    }
  }

  const toPublicRuntimeSnapshot = (runtime: Awaited<ReturnType<typeof getEffectiveRuntimeFlags>>) => ({
    generated_at: runtime.generated_at,
    flags: runtime.flags.map(({ key, enabled }) => ({ key, enabled })),
    definitions: getRuntimeFlagDefinitions(),
  })

  app.get('/feature-flags/effective', async (request) => {
    const runtime = await getEffectiveRuntimeFlags(pool, {
      ...(await resolveRuntimeFlagContext(request)),
    })

    return toPublicRuntimeSnapshot(runtime)
  })

  app.get('/admin/feature-flags', { preHandler: requireAdmin() }, async (request) => {
    const flags = await listFeatureFlags(pool)
    const runtime = await getEffectiveRuntimeFlags(pool, {
      ...(await resolveRuntimeFlagContext(request)),
    })
    return {
      flags,
      runtime,
      definitions: getRuntimeFlagDefinitions(),
    }
  })

  app.post('/admin/feature-flags', { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const parsed = createFlagSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const existing = await getFeatureFlag(pool, parsed.data.key)
    if (existing) {
      throw new ValidationError('Feature flag already exists', {
        details: [{ message: 'feature_flag_exists', key: parsed.data.key }],
      })
    }

    const flag = await createFeatureFlag(pool, {
      key: parsed.data.key,
      enabled: parsed.data.enabled,
      audienceRules: parsed.data.audience_rules,
      metadata: parsed.data.metadata,
      updatedBy: request.user?.user_id ?? null,
    })

    reply.code(201)
    return { flag }
  })

  app.patch('/admin/feature-flags/:key', { preHandler: requireSuperAdmin() }, async (request) => {
    const key = flagKeySchema.parse((request.params as { key?: string }).key || '')
    const parsed = updateFlagSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const updated = await updateFeatureFlag(pool, {
      key,
      enabled: parsed.data.enabled,
      audienceRules: parsed.data.audience_rules,
      metadata: parsed.data.metadata,
      updatedBy: request.user?.user_id ?? null,
    })

    if (!updated) {
      throw new NotFoundError('Feature flag not found', {
        details: [{ message: 'feature_flag_not_found', key }],
      })
    }

    return { flag: updated }
  })

  app.get('/admin/feature-flags/:key/history', { preHandler: requireAdmin() }, async (request) => {
    const key = flagKeySchema.parse((request.params as { key?: string }).key || '')
    const queryParsed = historyQuerySchema.safeParse(request.query ?? {})
    if (!queryParsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: queryParsed.error.issues },
      })
    }

    const flag = await getFeatureFlag(pool, key)
    if (!flag) {
      throw new NotFoundError('Feature flag not found', {
        details: [{ message: 'feature_flag_not_found', key }],
      })
    }

    const history = await listFeatureFlagHistory(pool, key, queryParsed.data.limit)
    return {
      flag,
      history,
    }
  })
}
