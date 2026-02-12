import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { DEFAULT_LIMIT_MAX } from '../../../../shared/constants'
import { requireAdmin } from '../../plugins/auth-plugin'
import { getErrorMessage } from '../../types/errors'
import { ValidationError } from '../../../../shared/errors'

const logger = createLogger('plane-a.ops.observer')
const pool = getPool(config.db.planeAUrl)

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(DEFAULT_LIMIT_MAX).default(50),
  windowHours: z.coerce.number().int().min(1).max(168).default(24),
})

export const observerSummaryRoutes = (app: FastifyInstance) => {
  app.get('/ops/observer/summary', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const limit = parsed.data.limit
    const windowHours = parsed.data.windowHours

    try {
      const latestQuotes = await query<{
        provider_id: string
        corridor_id: string
        amount_bucket: number
        payin: string
        payout: string
        status: string
        collected_at: Date | null
        ingested_at: Date | null
        created_at: Date
      }>(
        `SELECT provider_id, corridor_id, amount_bucket, payin, payout, status, collected_at, ingested_at, created_at
           FROM silver.quote_record
          ORDER BY created_at DESC
          LIMIT $1`,
        [limit],
        pool,
      )

      const latestAlertEvents = await query<{
        id: string
        alert_id: string
        triggered_at: Date
        value: number | null
        notification_status: string | null
        message: string | null
      }>(
        `SELECT id, alert_id, triggered_at, value::double precision AS value, notification_status, message
           FROM silver.alert_event
          ORDER BY triggered_at DESC
          LIMIT $1`,
        [limit],
        pool,
      )

      const latestAlerts = await query<{
        id: string
        user_id: string
        metric: string
        comparator: string
        threshold: number
        currency: string | null
        frequency: string
        enabled: boolean
        updated_at: Date
        created_at: Date
      }>(
        `SELECT ar.id,
                wi.user_id,
                ar.metric,
                ar.comparator,
                ar.threshold::double precision AS threshold,
                ar.currency,
                ar.frequency,
                ar.enabled,
                ar.updated_at,
                ar.created_at
           FROM silver.alert_rule ar
           JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id
          ORDER BY ar.updated_at DESC
          LIMIT $1`,
        [limit],
        pool,
      )

      const watchlistRecent = await query<{
        id: string
        user_id: string
        target_type: string
        target_payload: unknown
        label: string | null
        updated_at: Date
        created_at: Date
      }>(
        `SELECT id, user_id, target_type, target_payload, label, updated_at, created_at
           FROM silver.watchlist_item
          ORDER BY updated_at DESC
          LIMIT $1`,
        [limit],
        pool,
      )

      const quoteRefreshQueue = await query<{ status: string; count: number }>(
        `SELECT status, COUNT(*)::int AS count
           FROM silver.quote_refresh_request
          WHERE COALESCE(last_requested_at, created_at) >= NOW() - make_interval(hours => $1)
          GROUP BY status
          ORDER BY status`,
        [windowHours],
        pool,
      )

      const fxRefreshQueue = await query<{ status: string; count: number }>(
        `SELECT status, COUNT(*)::int AS count
           FROM silver.fx_rate_refresh_request
          WHERE COALESCE(last_requested_at, created_at) >= NOW() - make_interval(hours => $1)
          GROUP BY status
          ORDER BY status`,
        [windowHours],
        pool,
      )

      const latestGoldDate = await query<{ latest_date: string | null }>(
        `SELECT MAX(date)::text AS latest_date
           FROM gold_export.cdp_daily
          WHERE amount_bucket = 500`,
        [],
        pool,
      )

      const notificationAttempts = await (async () => {
        try {
          return await query<{
            id: string
            alert_id: string | null
            user_id: string | null
            channel: string
            provider: string
            to_email_hash: string | null
            to_email: string | null
            subject: string | null
            status: string
            skip_reason: string | null
            error: string | null
            created_at: Date
          }>(
            `SELECT id, alert_id, user_id, channel, provider, to_email_hash, to_email, subject, status, skip_reason, error, created_at
               FROM silver.alert_notification_attempt
              ORDER BY created_at DESC
              LIMIT $1`,
            [limit],
            pool,
          )
        } catch (error: any) {
          const code = typeof error?.code === 'string' ? error.code : ''
          const message = typeof error?.message === 'string' ? error.message : ''
          const isMissingTable = code === '42P01' || message.includes('does not exist')
          if (!isMissingTable) {
            throw error
          }
          logger.warn('observer_summary_notification_attempts_table_missing', {
            error: getErrorMessage(error),
          })
          return { rows: [] as any[] }
        }
      })()

      return {
        success: true,
        timestamp: new Date().toISOString(),
        gold: {
          latest_date: latestGoldDate.rows[0]?.latest_date ?? null,
        },
        queues: {
          window_hours: windowHours,
          quote_refresh: quoteRefreshQueue.rows,
          fx_rate_refresh: fxRefreshQueue.rows,
        },
        latest: {
          quotes: latestQuotes.rows.map((row) => ({
            provider_id: row.provider_id,
            corridor_id: row.corridor_id,
            amount_bucket: row.amount_bucket,
            payin: row.payin,
            payout: row.payout,
            status: row.status,
            collected_at: row.collected_at?.toISOString() ?? null,
            ingested_at: row.ingested_at?.toISOString() ?? null,
            created_at: row.created_at.toISOString(),
          })),
          alerts: latestAlerts.rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            metric: row.metric,
            comparator: row.comparator,
            threshold: row.threshold,
            currency: row.currency,
            frequency: row.frequency,
            enabled: row.enabled,
            updated_at: row.updated_at.toISOString(),
            created_at: row.created_at.toISOString(),
          })),
          alert_events: latestAlertEvents.rows.map((row) => ({
            id: row.id,
            alert_id: row.alert_id,
            triggered_at: row.triggered_at.toISOString(),
            value: row.value,
            notification_status: row.notification_status,
            message: row.message,
          })),
          watchlist_items: watchlistRecent.rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            target_type: row.target_type,
            target_payload: row.target_payload,
            label: row.label,
            updated_at: row.updated_at.toISOString(),
            created_at: row.created_at.toISOString(),
          })),
          notification_attempts: notificationAttempts.rows.map((row) => ({
            id: row.id,
            alert_id: row.alert_id,
            user_id: row.user_id,
            channel: row.channel,
            provider: row.provider,
            to_email_hash: row.to_email_hash,
            to_email: row.to_email,
            subject: row.subject,
            status: row.status,
            skip_reason: row.skip_reason,
            error: row.error,
            created_at: row.created_at.toISOString(),
          })),
        },
      }
    } catch (error) {
      logger.error('observer_summary_failed', { error: getErrorMessage(error) })
      reply.code(500)
      return { success: false, error: 'internal_error' }
    }
  })
}
