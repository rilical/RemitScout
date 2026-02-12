import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { config } from '../../../../shared/config'
import { getPool, query } from '../../../../shared/db'
import { requireAdmin } from '../../plugins/auth-plugin'
import { ValidationError } from '../../../../shared/errors'

const planeAPool = getPool(config.db.planeAUrl)

const querySchema = z.object({
  staleDays: z.coerce.number().int().min(1).max(3650).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
})

export const apiKeysAdminRoutes = (app: FastifyInstance) => {
  app.get('/ops/api-keys/stale', { preHandler: requireAdmin() }, async (request, _reply) => {
    const parsed = querySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'validation_error', details: parsed.error.flatten() } })
    }

    const staleDays = parsed.data.staleDays ?? 90
    const limit = parsed.data.limit ?? 200

    const result = await query<{
      key_id: string
      user_id: string
      email: string | null
      key_prefix: string
      name: string | null
      created_at: Date
      last_used_at: Date | null
    }>(
      `
      SELECT
        k.key_id,
        k.user_id,
        u.email,
        k.key_prefix,
        k.name,
        k.created_at,
        k.last_used_at
      FROM silver.api_key k
      JOIN silver.user_account u ON u.user_id = k.user_id
      WHERE k.revoked_at IS NULL
        AND (
          (k.last_used_at IS NOT NULL AND k.last_used_at < NOW() - ($1::int * INTERVAL '1 day'))
          OR (k.last_used_at IS NULL AND k.created_at < NOW() - ($1::int * INTERVAL '1 day'))
        )
      ORDER BY COALESCE(k.last_used_at, k.created_at) ASC
      LIMIT $2
      `,
      [staleDays, limit],
      planeAPool,
    )

    return {
      success: true,
      staleDays,
      limit,
      count: result.rows.length,
      keys: result.rows.map((row) => ({
        key_id: row.key_id,
        user_id: row.user_id,
        email: row.email,
        key_prefix: row.key_prefix,
        name: row.name,
        created_at: row.created_at.toISOString(),
        last_used_at: row.last_used_at ? row.last_used_at.toISOString() : null,
      })),
    }
  })
}
