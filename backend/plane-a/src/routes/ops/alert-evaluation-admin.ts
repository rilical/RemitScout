import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { DEFAULT_LIMIT_MAX } from '../../../../shared/constants'
import { requireAdmin } from '../../plugins/auth-plugin'
import { getErrorMessage } from '../../types/errors'
import { evaluateAlert, evaluateAlertsForFrequency } from '../../services/alert-evaluator'
import { ValidationError } from '../../../../shared/errors'

const logger = createLogger('plane-a.ops.alert-evaluation')
const pool = getPool(config.db.planeAUrl)

const bodySchema = z.object({
  alertId: z.string().uuid().optional(),
  frequency: z.enum(['weekly', 'daily']).optional(),
  ignoreSchedule: z.boolean().default(true),
  limit: z.coerce.number().int().min(1).max(DEFAULT_LIMIT_MAX).default(50),
}).refine((value) => Boolean(value.alertId || value.frequency), {
  message: 'alertId_or_frequency_required',
})

export const alertEvaluationAdminRoutes = (app: FastifyInstance) => {
  app.post(
    '/ops/alerts/evaluate',
    { preHandler: requireAdmin() },
    async (request, reply) => {
      const environment = (process.env.ENVIRONMENT || '').toLowerCase()
      if (environment === 'prod') {
        reply.code(403)
        return { success: false, error: 'forbidden', message: 'Not available in prod.' }
      }
      if (config.runtime.readOnly) {
        reply.code(409)
        return { success: false, error: 'read_only', message: 'Runtime is read-only.' }
      }

      const parsed = bodySchema.safeParse(request.body ?? {})
      if (!parsed.success) {
                throw new ValidationError('Invalid request', { details: { success: false, error: 'bad_request', details: parsed.error.issues } })
      }

      try {
        if (parsed.data.alertId) {
          const triggered = await evaluateAlert(pool, parsed.data.alertId)
          return { success: true, mode: 'single', alertId: parsed.data.alertId, triggered }
        }

        const frequency = parsed.data.frequency ?? 'weekly'
        const result = await evaluateAlertsForFrequency(pool, frequency, undefined, {
          ignoreSchedule: parsed.data.ignoreSchedule,
          limit: parsed.data.limit,
        })
        return {
          success: true,
          mode: 'batch',
          frequency,
          ignoreSchedule: parsed.data.ignoreSchedule,
          limit: parsed.data.limit,
          total: result.total,
          triggered: result.triggered,
        }
      } catch (error) {
        logger.error('ops_alert_evaluation_failed', { error: getErrorMessage(error) })
        reply.code(500)
        return { success: false, error: 'internal_error' }
      }
    },
  )
}
