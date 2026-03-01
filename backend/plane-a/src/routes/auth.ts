import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'

const logger = createLogger('plane-a.auth')

const forgotPasswordSchema = z.object({
  email: z.string().email().max(320),
})

export const authRoutes = async (app: FastifyInstance) => {
  app.post('/auth/forgot-password', async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body)
    if (!parsed.success) {
      // Always return 200 to prevent email enumeration
      return reply.code(200).send({
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    const { email } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()
    const rateLimitKey = buildRateLimitKey('pwd-reset', normalizedEmail)

    const exceeded = await checkRateLimit({
      logger,
      key: rateLimitKey,
      limit: 5,
      ttlSeconds: 3600,
      component: 'forgot_password',
    })

    if (exceeded) {
      logger.warn('forgot_password_rate_limited', {
        email_hash: rateLimitKey.split(':')[1],
      })
      // Still return 200 to prevent enumeration
      return reply.code(200).send({
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    // Proxy to Supabase resetPasswordForEmail via REST API
    const supabaseUrl = config.auth.supabase.url
    const supabaseKey = config.auth.supabase.publishableKey

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/recover`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: normalizedEmail }),
        })
      } catch (error) {
        logger.warn('forgot_password_supabase_proxy_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    } else {
      logger.warn('forgot_password_supabase_not_configured')
    }

    return reply.code(200).send({
      message: 'If that email exists, a reset link has been sent.',
    })
  })
}
