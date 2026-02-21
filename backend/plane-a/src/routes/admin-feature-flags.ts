import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ValidationError, NotFoundError } from '../../../shared/errors'
import { requireAdmin } from '../plugins/auth-plugin'
import {
  createFeatureFlag,
  getFeatureFlag,
  listFeatureFlagHistory,
  listFeatureFlags,
  updateFeatureFlag,
} from '../services/feature-flags'

const flagKeySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{1,79}$/)

const createFlagSchema = z.object({
  key: flagKeySchema,
  enabled: z.boolean().default(false),
  audience_rules: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const updateFlagSchema = z.object({
  enabled: z.boolean().optional(),
  audience_rules: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine((value) => value.enabled !== undefined || value.audience_rules !== undefined || value.metadata !== undefined, {
  message: 'at_least_one_field_required',
})

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const adminFeatureFlagsRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool

  app.get('/admin/feature-flags', { preHandler: requireAdmin() }, async () => {
    const flags = await listFeatureFlags(pool)
    return { flags }
  })

  app.post('/admin/feature-flags', { preHandler: requireAdmin() }, async (request, reply) => {
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

  app.patch('/admin/feature-flags/:key', { preHandler: requireAdmin() }, async (request) => {
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
