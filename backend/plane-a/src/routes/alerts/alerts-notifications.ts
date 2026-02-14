import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { recordRequest } from '../../../../shared/api-metrics'
import { config } from '../../../../shared/config'
import { getRequestContext, logAuditEvent } from '../../services/audit-log'
import { verifyAlertUnsubscribeToken } from '../../services/alert-unsubscribe'
import { getErrorMessage } from '../../types/errors'
import { logger } from './shared'

const unsubscribePage = (title: string, body: string, manageUrl?: string) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <h2>${title}</h2>
    <p>${body}</p>
    ${manageUrl ? `<p><a href="${manageUrl}">Manage notification preferences</a></p>` : ''}
  </body>
</html>
`.trim()

const sendUnsubscribePage = (
  reply: FastifyReply,
  statusCode: number,
  title: string,
  body: string,
  manageUrl?: string,
) => {
  reply.code(statusCode)
  return reply.type('text/html').send(unsubscribePage(title, body, manageUrl))
}

const sendUnsubscribeJsonError = (
  reply: FastifyReply,
  statusCode: number,
  message: string,
  details?: Record<string, string>,
) => {
  reply.code(statusCode)
  return reply.type('application/json').send({
    error: 'unsubscribe_error',
    message,
    ...(details ? { details } : {}),
    statusCode,
  })
}

type UnsubscribeRequest = {
  headers: { accept?: string }
  query: { format?: string }
}

const wantsJsonResponse = (request: UnsubscribeRequest) => {
  const acceptHeader = request.headers.accept?.toLowerCase() ?? ''
  const queryFormat = request.query.format?.toLowerCase()
  return queryFormat === 'json' || acceptHeader.includes('application/json')
}

const wantsHtmlResponse = (request: UnsubscribeRequest) => {
  const acceptHeader = request.headers.accept?.toLowerCase() ?? ''
  const queryFormat = request.query.format?.toLowerCase()

  if (queryFormat === 'html') return true
  if (queryFormat === 'json') return false
  // Prefer HTML for real browsers (they virtually always send `text/html`, often alongside `*/*`).
  // Still allow API clients to force JSON via `format=json` or `Accept: application/json`.
  return acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')
}

const sendUnsubscribeError = (
  reply: FastifyReply,
  request: FastifyRequest,
  statusCode: number,
  message: string,
  details?: Record<string, string>,
) => {
  if (
    wantsHtmlResponse({
      headers: request.headers as { accept?: string },
      query: request.query as { format?: string },
    })
  ) {
    const baseUrl = config.alerts.unsubscribe.baseUrl
      ? config.alerts.unsubscribe.baseUrl.replace(/\/$/, '')
      : ''
    return sendUnsubscribePage(
      reply,
      statusCode,
      'Unsubscribe failed',
      message,
      `${baseUrl}/dashboard?tab=account&section=notifications`,
    )
  }
  return sendUnsubscribeJsonError(
    reply,
    statusCode,
    message,
    { ...details, reason: details?.reason ?? 'unknown' },
  )
}

export const registerAlertsNotificationRoutes = async (app: FastifyInstance) => {
  const { pool } = app.container

  app.get('/alerts/unsubscribe', async (request, reply) => {
    const startTime = Date.now()
    const token = typeof (request.query as { token?: string }).token === 'string'
      ? (request.query as { token?: string }).token
      : ''

    if (!token) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
      return sendUnsubscribeError(
        reply,
        request,
        400,
        'Missing unsubscribe token.',
        { reason: 'token_missing' },
      )
    }

    let payload: { userId: string } | null = null
    try {
      payload = verifyAlertUnsubscribeToken(token)
    } catch (error) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
      return sendUnsubscribeError(
        reply,
        request,
        400,
        'Invalid or expired token.',
        {
          reason: 'token_invalid',
          error: getErrorMessage(error),
        },
      )
    }

    if (!payload) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
      return sendUnsubscribeError(
        reply,
        request,
        400,
        'Invalid or expired token.',
        { reason: 'token_invalid' },
      )
    }

    const { userId } = payload
    try {
      const result = await pool.query(
        `UPDATE silver.notification_pref
         SET unsubscribed = TRUE, updated_at = NOW()
         WHERE owner_type = 'user' AND user_id = $1`,
        [userId],
      )

      if (result.rowCount === 0) {
        await pool.query(
          `INSERT INTO silver.notification_pref (
             owner_type,
             user_id,
             channel,
             timezone,
             daily_send_hour,
             digest_enabled,
             marketing_opt_in,
             unsubscribed,
             created_at,
             updated_at
           ) VALUES (
             'user',
             $1,
             'email',
             'UTC',
             9,
             FALSE,
             FALSE,
             TRUE,
             NOW(),
             NOW()
           )`,
          [userId],
        )
      }

      try {
        await logAuditEvent(pool, {
          actorId: userId,
          actorType: 'user',
          action: 'alert.unsubscribe',
          entityType: 'notification_pref',
          entityId: userId,
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: userId,
          error: getErrorMessage(error),
        })
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 200, durationSeconds)
      const baseUrl = config.alerts.unsubscribe.baseUrl
        ? config.alerts.unsubscribe.baseUrl.replace(/\/$/, '')
        : ''
      if (wantsJsonResponse({ headers: request.headers as { accept?: string }, query: request.query as { format?: string } })) {
        return reply.code(200).type('application/json').send({
          status: 'ok',
          message: 'Email alerts are now disabled.',
          action: 'unsubscribed',
          statusCode: 200,
        })
      }

      return sendUnsubscribePage(
        reply,
        200,
        'You\'re unsubscribed',
        'Email alerts are now disabled.',
        `${baseUrl}/dashboard?tab=account&section=notifications`,
      )
    } catch (error) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 500, durationSeconds)
      logger.error('alert_unsubscribe_failed', {
        user_id: userId,
        error: error instanceof Error ? error.message : String(error),
      })
      return sendUnsubscribeError(
        reply,
        request,
        500,
        'Unable to process unsubscribe request.',
        { reason: 'database_update_failed' },
      )
    }
  })
}
