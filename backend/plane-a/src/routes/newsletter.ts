import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createHash } from 'crypto'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { AppError, RateLimitError, ValidationError, AuthenticationError } from '../../../shared/errors'
import { DEFAULT_FALLBACK_TTL_SECONDS } from '../../../shared/constants'
import { generateToken, hashToken } from '../utils/token-generator'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { sendConfirmationEmail, sendWelcomeEmail } from '../services/newsletter-email'

const logger = createLogger('plane-a.newsletter')

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().max(120).optional(),
})

const statusSchema = z.object({
  email: z.string().email(),
})

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const hashEmail = (email: string): string => {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex')
}

const isEmailSuppressed = async (
  email: string,
  planeAPool: FastifyInstance['container']['pool'],
): Promise<boolean> => {
  const emailHash = hashEmail(email)
  const result = await planeAPool.query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = $1 LIMIT 1`,
    [emailHash],
  )
  return (result.rowCount ?? 0) > 0
}

const renderHtml = (title: string, message: string) => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="font-family:system-ui,-apple-system,sans-serif;padding:40px;line-height:1.5;">
    <h1>${title}</h1>
    <p>${message}</p>
  </body>
</html>`
}

const sendHtml = (reply: { type: (arg0: string) => void; send: (arg0: string) => void }, html: string) => {
  reply.type('text/html')
  reply.send(html)
}

const buildRedirect = (path: string, status: string) => {
  const base = config.newsletter.baseUrl || config.billing.stripe.frontendBaseUrl || ''
  const normalized = base ? base.replace(/\/$/, '') : ''
  return `${normalized}${path}?status=${encodeURIComponent(status)}`
}

export const newsletterRoutes = async (app: FastifyInstance) => {
  const planeAPool = app.container.pool
  const newsletterRepository = app.container.repositories.newsletter

  app.post('/newsletter/subscribe', async (request, _reply) => {
    const parsed = subscribeSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }

    const email = normalizeEmail(parsed.data.email)
    const source = parsed.data.source ?? 'NewsletterSignup'

    try {
      const rateKey = buildRateLimitKey('newsletter:rate', email)
      if (await checkRateLimit({ logger, key: rateKey, limit: 3, ttlSeconds: DEFAULT_FALLBACK_TTL_SECONDS, component: 'newsletter' })) {
        throw new RateLimitError('Please wait before requesting another confirmation email.')
      }

      if (await isEmailSuppressed(email, planeAPool)) {
        throw new ValidationError('This email address cannot receive newsletters.')
      }

      const verifyToken = generateToken()
      const unsubscribeToken = generateToken()
      const verifyTokenHash = hashToken(verifyToken)
      const unsubscribeTokenHash = hashToken(unsubscribeToken)
      const expiresAt = new Date(
        Date.now() + config.newsletter.tokenExpiryHours * 60 * 60 * 1000,
      )

      // Atomic upsert: INSERT ... ON CONFLICT handles both new and
      // existing-pending/unsubscribed rows, eliminating the TOCTOU race
      // between findByEmail and createPending/updatePendingTokens.
      const row = await newsletterRepository.createPending({
        email,
        verify_token_hash: verifyTokenHash,
        unsubscribe_token_hash: unsubscribeTokenHash,
        source,
        verify_token_expires_at: expiresAt,
      })

      // If the subscriber is already active, the ON CONFLICT preserves
      // that status — skip sending another confirmation email.
      if (row.status === 'active') {
        return { success: true, status: 'active' }
      }

      await sendConfirmationEmail(email, verifyToken, unsubscribeToken)

      return { success: true, status: 'pending' }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      const message = error instanceof Error ? error.message : String(error)
      if (message === 'email_suppressed') {
        throw new ValidationError('This email address cannot receive newsletters.')
      }
      logger.error('newsletter_subscribe_failed', {
        email,
        error: message,
      })
      throw new AppError('Newsletter subscribe failed', {
        statusCode: 500,
        code: 'internal_error',
        cause: error,
      })
    }
  })

  app.get('/newsletter/confirm', async (request, reply) => {
    const query = request.query as { token?: string }
    const token = typeof query.token === 'string' ? query.token : ''
    if (!token) {
            throw new ValidationError('Invalid request', { details: sendHtml(reply, renderHtml('Invalid token', 'Missing confirmation token.')) })
    }

    try {
      const hash = hashToken(token)
      const record = await newsletterRepository.findByVerifyTokenHash(hash)
      if (!record) {
        return reply.redirect(buildRedirect('/newsletter/confirm', 'invalid'))
      }

      if (record.status === 'active') {
        return reply.redirect(buildRedirect('/newsletter/confirm', 'already_confirmed'))
      }

      if (record.verify_token_expires_at && record.verify_token_expires_at < new Date()) {
        return reply.redirect(buildRedirect('/newsletter/confirm', 'expired'))
      }

      await newsletterRepository.activate(record.id)

      try {
        await logAuditEvent(planeAPool, {
          actorId: `newsletter:${hashEmail(record.email)}`,
          actorType: 'user',
          action: 'newsletter.subscribe',
          entityType: 'newsletter_subscriber',
          entityId: record.id,
          beforeSnapshot: {
            status: record.status,
            source: record.source,
          },
          afterSnapshot: {
            status: 'active',
            source: record.source,
          },
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          email: record.email,
          error: getErrorMessage(error),
        })
      }

      if (config.newsletter.welcomeEnabled) {
        try {
          await sendWelcomeEmail(record.email)
        } catch (error) {
          logger.warn('newsletter_welcome_failed', {
            email: record.email,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return reply.redirect(buildRedirect('/newsletter/confirm', 'success'))
    } catch (error) {
      logger.error('newsletter_confirm_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return sendHtml(reply, renderHtml('Confirmation failed', 'Please try again later.'))
    }
  })

  app.get('/newsletter/unsubscribe', async (request, reply) => {
    const query = request.query as { token?: string }
    const token = typeof query.token === 'string' ? query.token : ''
    if (!token) {
            throw new ValidationError('Invalid request', { details: sendHtml(reply, renderHtml('Invalid token', 'Missing unsubscribe token.')) })
    }

    try {
      const hash = hashToken(token)
      const record = await newsletterRepository.findByUnsubscribeTokenHash(hash)
      if (!record) {
        return reply.redirect(buildRedirect('/newsletter/unsubscribe', 'invalid'))
      }

      if (record.status === 'unsubscribed') {
        return reply.redirect(buildRedirect('/newsletter/unsubscribe', 'already_unsubscribed'))
      }

      await newsletterRepository.unsubscribe(record.id)

      try {
        await logAuditEvent(planeAPool, {
          actorId: `newsletter:${hashEmail(record.email)}`,
          actorType: 'user',
          action: 'newsletter.unsubscribe',
          entityType: 'newsletter_subscriber',
          entityId: record.id,
          beforeSnapshot: {
            status: record.status,
            source: record.source,
          },
          afterSnapshot: {
            status: 'unsubscribed',
            source: record.source,
          },
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          email: record.email,
          error: getErrorMessage(error),
        })
      }

      return reply.redirect(buildRedirect('/newsletter/unsubscribe', 'success'))
    } catch (error) {
      logger.error('newsletter_unsubscribe_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return sendHtml(reply, renderHtml('Unsubscribe failed', 'Please try again later.'))
    }
  })

  app.get('/newsletter/status', async (request, _reply) => {
    // H8: Require authentication to prevent email enumeration.
    // Without auth, an attacker could probe arbitrary emails to discover subscribers.
    if (!request.user?.user_id) {
      throw new AuthenticationError('Authentication required to check newsletter status')
    }

    const parsed = statusSchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { details: parsed.error.issues })
    }

    const email = normalizeEmail(parsed.data.email)

    // Rate-limit status checks to further mitigate enumeration attempts
    const rateKey = buildRateLimitKey('newsletter:status', request.user.user_id)
    if (await checkRateLimit({ logger, key: rateKey, limit: 10, ttlSeconds: 60, component: 'newsletter-status' })) {
      throw new RateLimitError('Too many status checks. Please wait before trying again.')
    }

    try {
      const record = await newsletterRepository.findByEmail(email)
      return { status: record?.status ?? 'none' }
    } catch (error) {
      logger.error('newsletter_status_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError('Newsletter status failed', {
        statusCode: 500,
        code: 'internal_error',
        cause: error,
      })
    }
  })
}
