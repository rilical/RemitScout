import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createPool, query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { generateToken, hashToken } from '../utils/token-generator'
import { getRequestContext, logAuditEvent } from './audit-log'
import { deleteUserAccount } from './account-deletion'

const logger = createLogger('plane-a.account-deletion-requests')

const ACCOUNT_DELETION_GRACE_DAYS = Math.max(
  1,
  Number.parseInt(process.env.ACCOUNT_DELETION_GRACE_DAYS || '7', 10) || 7,
)
const ACCOUNT_DELETION_TOKEN_TTL_HOURS = Math.max(
  1,
  Number.parseInt(process.env.ACCOUNT_DELETION_TOKEN_TTL_HOURS || '168', 10) || 168,
)
const ACCOUNT_DELETION_EMAIL_ENABLED = (() => {
  const raw = process.env.ACCOUNT_DELETION_EMAIL_ENABLED
  if (raw == null) return true
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
})()

const ACCOUNT_DELETION_EMAIL_FROM = (process.env.ACCOUNT_DELETION_EMAIL_FROM || '').trim()
const ACCOUNT_DELETION_EMAIL_FROM_NAME = (process.env.ACCOUNT_DELETION_EMAIL_FROM_NAME || 'Remit-Scout Security').trim()

const resolveAccountDeletionBaseUrl = () => {
  const fromEnv = (process.env.ACCOUNT_DELETION_BASE_URL || '').trim()
  if (fromEnv) return fromEnv
  if (config.alerts.unsubscribe.baseUrl) return config.alerts.unsubscribe.baseUrl
  if (config.billing.stripe.frontendBaseUrl) return config.billing.stripe.frontendBaseUrl
  if (config.newsletter.baseUrl) return config.newsletter.baseUrl
  return ''
}

const joinUrl = (base: string, path: string) => {
  if (!base) return path
  const trimmedBase = base.replace(/\/+$/g, '')
  return `${trimmedBase}${path}`
}

const resolveEmailFrom = () => {
  if (ACCOUNT_DELETION_EMAIL_FROM) {
    return ACCOUNT_DELETION_EMAIL_FROM_NAME
      ? `${ACCOUNT_DELETION_EMAIL_FROM_NAME} <${ACCOUNT_DELETION_EMAIL_FROM}>`
      : ACCOUNT_DELETION_EMAIL_FROM
  }
  const alertsFrom = config.alerts.notifications.email.from || ''
  if (!alertsFrom) return ''
  return ACCOUNT_DELETION_EMAIL_FROM_NAME
    ? `${ACCOUNT_DELETION_EMAIL_FROM_NAME} <${alertsFrom}>`
    : alertsFrom
}

let planeAPool: Pool | null = null

const getPlaneAPool = () => {
  if (!planeAPool) {
    planeAPool = createPool(config.db.planeAUrl || config.db.url)
  }
  return planeAPool
}

const addDays = (value: Date, days: number) => {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const addHours = (value: Date, hours: number) => {
  const next = new Date(value)
  next.setUTCHours(next.getUTCHours() + hours)
  return next
}

const sendAccountDeletionEmail = async (params: {
  to: string
  cancelUrl: string
  scheduledFor: Date
}) => {
  if (!ACCOUNT_DELETION_EMAIL_ENABLED) return
  if (!config.alerts.notifications.email.enabled) return

  const from = resolveEmailFrom()
  if (!from) {
    logger.warn('account_deletion_email_missing_from', {
      to: params.to,
    })
    return
  }

  const sesRegion = config.aws.sesRegion
  if (!sesRegion) {
    logger.warn('account_deletion_email_missing_region')
    return
  }

  const scheduledLabel = params.scheduledFor.toISOString().replace('T', ' ').replace('Z', ' UTC')
  const subject = 'Account deletion scheduled'
  const textBody = [
    'We received a request to delete your Remit-Scout account.',
    '',
    `Your account is scheduled for deletion on ${scheduledLabel}.`,
    '',
    'If you did not request this or you changed your mind, cancel within the grace window:',
    params.cancelUrl,
    '',
    'If you take no action, your account will be permanently deleted after the grace period.',
  ].join('\n')

  const htmlBody = [
    '<p>We received a request to delete your Remit-Scout account.</p>',
    `<p>Your account is scheduled for deletion on <strong>${scheduledLabel}</strong>.</p>`,
    '<p>If you did not request this or you changed your mind, cancel within the grace window:</p>',
    `<p><a href="${params.cancelUrl}">Cancel account deletion</a></p>`,
    '<p>If you take no action, your account will be permanently deleted after the grace period.</p>',
  ].join('')

  const client = new SESClient({ region: sesRegion })
  await client.send(new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: [params.to],
    },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Text: { Data: textBody, Charset: 'UTF-8' },
        Html: { Data: htmlBody, Charset: 'UTF-8' },
      },
    },
  }))
}

export type AccountDeletionRequestResult = {
  requestId: string
  scheduledFor: string
  tokenExpiresAt: string
}

export const requestAccountDeletion = async (params: {
  userId: string
  requestedBy?: string
  requestContext?: ReturnType<typeof getRequestContext>
  metadata?: Record<string, unknown>
}) : Promise<AccountDeletionRequestResult> => {
  const pool = getPlaneAPool()
  const now = new Date()
  const scheduledFor = addDays(now, ACCOUNT_DELETION_GRACE_DAYS)
  const tokenExpiresAt = addHours(now, ACCOUNT_DELETION_TOKEN_TTL_HOURS)
  const token = generateToken(32)
  const tokenHash = hashToken(token)

  const existing = await query<{
    id: string
    scheduled_for: Date
    token_expires_at: Date
  }>(
    `SELECT id, scheduled_for, token_expires_at
     FROM public.system_account_deletion_request
     WHERE user_id = $1 AND status = 'pending'
     LIMIT 1`,
    [params.userId],
    pool,
  )

  let requestId = existing.rows[0]?.id

  if (requestId) {
    await query(
      `UPDATE public.system_account_deletion_request
       SET requested_at = NOW(),
           scheduled_for = $2,
           token_hash = $3,
           token_expires_at = $4,
           metadata = $5
       WHERE id = $1`,
      [
        requestId,
        scheduledFor,
        tokenHash,
        tokenExpiresAt,
        params.metadata ? JSON.stringify(params.metadata) : JSON.stringify({}),
      ],
      pool,
    )
  } else {
    const inserted = await query<{ id: string }>(
      `INSERT INTO public.system_account_deletion_request (
        user_id,
        status,
        requested_at,
        scheduled_for,
        token_hash,
        token_expires_at,
        requested_by,
        metadata
      ) VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        params.userId,
        now,
        scheduledFor,
        tokenHash,
        tokenExpiresAt,
        params.requestedBy ?? null,
        params.metadata ? JSON.stringify(params.metadata) : JSON.stringify({}),
      ],
      pool,
    )
    requestId = inserted.rows[0]?.id
  }

  if (!requestId) {
    throw new Error('Unable to create account deletion request')
  }

  const baseUrl = resolveAccountDeletionBaseUrl()
  const cancelUrl = joinUrl(baseUrl, `/api/v1/account/deletion/cancel?token=${encodeURIComponent(token)}`)

  const emailResult = await query<{ email: string | null }>(
    `SELECT email FROM silver.user_account WHERE user_id = $1`,
    [params.userId],
    pool,
  )
  const email = emailResult.rows[0]?.email || null
  if (email) {
    try {
      await sendAccountDeletionEmail({ to: email, cancelUrl, scheduledFor })
    } catch (error) {
      logger.error('account_deletion_email_failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: params.userId,
      })
    }
  }

  await logAuditEvent(pool, {
    actorId: params.requestedBy || params.userId,
    actorType: params.requestedBy ? 'admin' : 'user',
    action: 'account_deletion_requested',
    entityType: 'user_account',
    entityId: params.userId,
    category: 'security',
    metadata: {
      scheduledFor: scheduledFor.toISOString(),
      requestId,
      ...params.metadata,
    },
    ...params.requestContext,
  })

  return {
    requestId,
    scheduledFor: scheduledFor.toISOString(),
    tokenExpiresAt: tokenExpiresAt.toISOString(),
  }
}

export const cancelAccountDeletion = async (params: {
  userId: string
  requestContext?: ReturnType<typeof getRequestContext>
  reason?: string
}): Promise<boolean> => {
  const pool = getPlaneAPool()
  const result = await query(
    `UPDATE public.system_account_deletion_request
     SET status = 'cancelled',
         cancelled_at = NOW()
     WHERE user_id = $1 AND status = 'pending'`,
    [params.userId],
    pool,
  )

  if (result.rowCount > 0) {
    await logAuditEvent(pool, {
      actorId: params.userId,
      actorType: 'user',
      action: 'account_deletion_cancelled',
      entityType: 'user_account',
      entityId: params.userId,
      category: 'security',
      reason: params.reason,
      ...params.requestContext,
    })
    return true
  }

  return false
}

export const cancelAccountDeletionByToken = async (params: {
  token: string
  requestContext?: ReturnType<typeof getRequestContext>
}): Promise<{ cancelled: boolean; userId?: string }> => {
  const pool = getPlaneAPool()
  const tokenHash = hashToken(params.token)

  const result = await query<{ user_id: string }>(
    `UPDATE public.system_account_deletion_request
     SET status = 'cancelled',
         cancelled_at = NOW()
     WHERE token_hash = $1
       AND status = 'pending'
       AND token_expires_at >= NOW()
     RETURNING user_id`,
    [tokenHash],
    pool,
  )

  const userId = result.rows[0]?.user_id
  if (!userId) {
    return { cancelled: false }
  }

  await logAuditEvent(pool, {
    actorId: userId,
    actorType: 'user',
    action: 'account_deletion_cancelled',
    entityType: 'user_account',
    entityId: userId,
    category: 'security',
    reason: 'cancel_link',
    ...params.requestContext,
  })

  return { cancelled: true, userId }
}

export const processPendingAccountDeletions = async (params?: { limit?: number }): Promise<number> => {
  const pool = getPlaneAPool()
  const limit = Math.max(1, Math.min(params?.limit ?? 25, 100))
  const client = await pool.connect()
  let processed = 0

  try {
    await client.query('BEGIN')

    const { rows } = await client.query<{ id: string; user_id: string }>(
      `SELECT id, user_id
       FROM public.system_account_deletion_request
       WHERE status = 'pending'
         AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit],
    )

    for (const row of rows) {
      const deletionResult = await deleteUserAccount(pool, row.user_id, {
        actorRole: 'system',
        reason: 'Account deletion grace period elapsed',
      })
      if (!deletionResult?.deleted) {
        throw new Error(`Account deletion failed for user ${row.user_id}`)
      }
      await client.query(
        `UPDATE public.system_account_deletion_request
         SET status = 'completed',
             completed_at = NOW()
         WHERE id = $1`,
        [row.id],
      )
      processed += 1
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('account_deletion_process_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    client.release()
  }

  return processed
}
