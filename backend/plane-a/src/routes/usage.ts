import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { requireEntitlement } from '../plugins/auth-plugin'
import { apiKeyAccessConfig } from './api-key-access'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
})

type TotalsRow = {
  requests: number
  errors4xx: number
  errors5xx: number
  avg_response_time_ms: number | null
}

type ByEndpointRow = {
  endpoint: string
  requests: number
  avg_response_time_ms: number | null
}

type ByDayRow = {
  day: Date
  requests: number
  errors4xx: number
  errors5xx: number
}

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10)

export const usageRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool } = app.container

  app.get(
    '/usage',
    {
      preHandler: requireEntitlement('api_access'),
      config: apiKeyAccessConfig({ audience: 'institutional', requiredScope: 'indices:read' }),
    },
    async (request, reply) => {
      if (!request.institutionalClient) {
        reply.code(403)
        return { error: 'forbidden', code: 'institutional_only' }
      }

      const parsed = querySchema.safeParse(request.query)
      if (!parsed.success) {
        reply.code(400)
        return { error: 'bad_request', details: parsed.error.issues }
      }

      const windowDays = parsed.data.days ?? 7
      const to = new Date()
      const from = new Date(to)
      from.setUTCDate(from.getUTCDate() - windowDays)

      const clientId = request.institutionalClient.id

      const totalsResult = await query<TotalsRow>(
      `
      SELECT
        COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status_code BETWEEN 400 AND 499)::int AS errors4xx,
        COUNT(*) FILTER (WHERE status_code BETWEEN 500 AND 599)::int AS errors5xx,
        ROUND(AVG(response_time_ms))::int AS avg_response_time_ms
      FROM public.api_usage_log
      WHERE client_id = $1
        AND timestamp >= $2
        AND timestamp < $3
      `,
      [clientId, from, to],
      planeAPool,
    )
      const totals = totalsResult.rows[0] ?? {
        requests: 0,
        errors4xx: 0,
        errors5xx: 0,
        avg_response_time_ms: null,
      }

      const byEndpointResult = await query<ByEndpointRow>(
      `
      SELECT
        endpoint,
        COUNT(*)::int AS requests,
        ROUND(AVG(response_time_ms))::int AS avg_response_time_ms
      FROM public.api_usage_log
      WHERE client_id = $1
        AND timestamp >= $2
        AND timestamp < $3
      GROUP BY endpoint
      ORDER BY requests DESC, endpoint ASC
      LIMIT 200
      `,
      [clientId, from, to],
      planeAPool,
    )

      const byDayResult = await query<ByDayRow>(
      `
      SELECT
        DATE_TRUNC('day', timestamp) AS day,
        COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status_code BETWEEN 400 AND 499)::int AS errors4xx,
        COUNT(*) FILTER (WHERE status_code BETWEEN 500 AND 599)::int AS errors5xx
      FROM public.api_usage_log
      WHERE client_id = $1
        AND timestamp >= $2
        AND timestamp < $3
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 90
      `,
      [clientId, from, to],
      planeAPool,
    )

      return {
        clientId,
        windowDays,
        from: from.toISOString(),
        to: to.toISOString(),
        totals: {
          requests: totals.requests ?? 0,
          errors4xx: totals.errors4xx ?? 0,
          errors5xx: totals.errors5xx ?? 0,
          avgResponseTimeMs:
            (totals.requests ?? 0) > 0 ? (totals.avg_response_time_ms ?? null) : null,
        },
        byEndpoint: byEndpointResult.rows.map((row) => ({
          endpoint: row.endpoint,
          requests: row.requests ?? 0,
          avgResponseTimeMs: row.avg_response_time_ms ?? null,
        })),
        byDay: byDayResult.rows.map((row) => ({
          day: toDateOnly(row.day),
          requests: row.requests ?? 0,
          errors4xx: row.errors4xx ?? 0,
          errors5xx: row.errors5xx ?? 0,
        })),
      }
    },
  )
}
