import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { DEFAULT_LIMIT_MAX } from '../../../../shared/constants'
import { requireSuperAdmin } from '../../plugins/auth-plugin'
import { getErrorMessage } from '../../types/errors'
import { evaluateAlert, evaluateAlertsForFrequency } from '../../services/alert-evaluator'
import { ValidationError } from '../../../../shared/errors'
import { getRequestContext, logAuditEvent } from '../../services/audit-log'

const logger = createLogger('plane-a.ops.alert-evaluation')
const pool = getPool(config.db.planeAUrl)

const bodySchema = z.object({
  alertId: z.string().uuid().optional(),
  frequency: z.enum(['weekly', 'daily']).optional(),
  ignoreSchedule: z.boolean().default(true),
  limit: z.coerce.number().int().min(1).max(DEFAULT_LIMIT_MAX).default(50),
  mode: z.enum(['dry_run', 'execute']).default('dry_run'),
  confirm: z.string().trim().max(32).optional(),
}).refine((value) => Boolean(value.alertId || value.frequency), {
  message: 'alertId_or_frequency_required',
})

export const alertEvaluationAdminRoutes = (app: FastifyInstance) => {
  app.post(
    '/ops/alerts/evaluate',
    { preHandler: requireSuperAdmin() },
    async (request, reply) => {
      const parsed = bodySchema.safeParse(request.body ?? {})
      if (!parsed.success) {
                throw new ValidationError('Invalid request', { details: { success: false, error: 'bad_request', details: parsed.error.issues } })
      }

      const mode = parsed.data.mode
      const isExecute = mode === 'execute'
      const dryRun = !isExecute

      if (isExecute) {
        const confirm = (parsed.data.confirm || '').trim().toUpperCase()
        if (confirm !== 'RUN') {
          reply.code(400)
          return {
            success: false,
            error: 'confirmation_required',
            message: 'Confirmation required. Set confirm="RUN" to execute alert evaluation.',
          }
        }
        if (config.runtime.readOnly) {
          reply.code(409)
          return { success: false, error: 'read_only', message: 'Runtime is read-only.' }
        }
      }

      try {
        if (isExecute) {
          await logAuditEvent(pool, {
            actorId: request.user?.user_id ?? 'unknown',
            actorType: 'admin',
            actorRole: request.user?.role ?? undefined,
            action: 'ops.alerts.evaluate.requested',
            entityType: parsed.data.alertId ? 'alert_rule' : 'alerts',
            entityId: parsed.data.alertId ?? parsed.data.frequency ?? 'weekly',
            category: 'admin',
            severity: 'warning',
            metadata: {
              run_mode: mode,
              alertId: parsed.data.alertId ?? null,
              frequency: parsed.data.frequency ?? null,
              ignoreSchedule: parsed.data.ignoreSchedule,
              limit: parsed.data.limit,
            },
            ...getRequestContext(request),
          })
        }

        if (parsed.data.alertId) {
          const triggered = await evaluateAlert(pool, parsed.data.alertId, { dryRun })
          const response = {
            success: true,
            mode: 'single',
            run_mode: mode,
            dry_run: dryRun,
            alertId: parsed.data.alertId,
            triggered,
          }

          try {
            await logAuditEvent(pool, {
              actorId: request.user?.user_id ?? 'unknown',
              actorType: 'admin',
              actorRole: request.user?.role ?? undefined,
              action: 'ops.alerts.evaluate',
              entityType: 'alert_rule',
              entityId: parsed.data.alertId,
              category: 'admin',
              severity: dryRun ? 'info' : 'warning',
              metadata: {
                ...response,
                ignoreSchedule: parsed.data.ignoreSchedule,
                limit: parsed.data.limit,
              },
              ...getRequestContext(request),
            })
          } catch (auditError) {
            logger.warn('ops_alert_evaluation_audit_failed', {
              error: auditError instanceof Error ? auditError.message : String(auditError),
            })
          }

          return response
        }

        const frequency = parsed.data.frequency ?? 'weekly'
        const result = await evaluateAlertsForFrequency(pool, frequency, undefined, {
          ignoreSchedule: parsed.data.ignoreSchedule,
          limit: parsed.data.limit,
          dryRun,
        })
        const response = {
          success: true,
          mode: 'batch',
          run_mode: mode,
          dry_run: dryRun,
          frequency,
          ignoreSchedule: parsed.data.ignoreSchedule,
          limit: parsed.data.limit,
          total: result.total,
          triggered: result.triggered,
        }

        try {
          await logAuditEvent(pool, {
            actorId: request.user?.user_id ?? 'unknown',
            actorType: 'admin',
            actorRole: request.user?.role ?? undefined,
            action: 'ops.alerts.evaluate',
            entityType: 'alerts',
            entityId: frequency,
            category: 'admin',
            severity: dryRun ? 'info' : 'warning',
            metadata: response,
            ...getRequestContext(request),
          })
        } catch (auditError) {
          logger.warn('ops_alert_evaluation_audit_failed', {
            error: auditError instanceof Error ? auditError.message : String(auditError),
          })
        }

        return response
      } catch (error) {
        logger.error('ops_alert_evaluation_failed', { error: getErrorMessage(error) })
        reply.code(500)
        return { success: false, error: 'internal_error' }
      }
    },
  )
}
