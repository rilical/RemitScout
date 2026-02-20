import { timingSafeEqual } from 'crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { evaluatePublisherGates } from '../services/publisher-gates'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { PublisherRepository } from '../data'

const logger = createLogger('plane-c.publisher')
const pool = getPool(config.db.planeCUrl)
const publisherRepository = new PublisherRepository(pool)

const loadContributorCount = async (corridorId: string) => {
  return publisherRepository.getContributorCount(corridorId)
}

const resolveHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value.find((entry) => typeof entry === 'string' && entry.trim())?.trim()
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return undefined
}

const resolveBearerToken = (authorizationHeader: string | undefined): string | undefined => {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(/\s+/, 2)
  if (!scheme || !token) return undefined
  if (scheme.toLowerCase() !== 'bearer') return undefined
  return token.trim() || undefined
}

const resolveInternalToken = (request: FastifyRequest): string | undefined => {
  const explicitHeader = resolveHeaderValue(
    request.headers['x-plane-c-internal-token']
      ?? request.headers['x-plane-internal-token']
      ?? request.headers['x-internal-token'],
  )
  if (explicitHeader) return explicitHeader
  return resolveBearerToken(resolveHeaderValue(request.headers.authorization))
}

const matchesToken = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

const hasIamAuthorizerContext = (request: FastifyRequest): boolean => {
  const authorizer = (request as FastifyRequest & {
    awsLambda?: {
      event?: {
        requestContext?: {
          authorizer?: Record<string, unknown>
        }
      }
    }
  }).awsLambda?.event?.requestContext?.authorizer
  return Boolean(authorizer && typeof authorizer === 'object' && 'iam' in authorizer)
}

export const publisherRoutes = async (app: FastifyInstance) => {
  app.post('/internal/publisher/validate', {
    preHandler: async (request, reply) => {
      // Prefer IAM auth when API Gateway is configured for internal service access.
      if (hasIamAuthorizerContext(request)) {
        return
      }

      const expectedToken = config.planeC.internalApiToken.trim()
      if (!expectedToken) {
        if (config.planeC.requireInternalAuth) {
          logger.error('publisher_internal_auth_not_configured', {
            path: '/internal/publisher/validate',
            env: config.env,
            environment: config.envName || '',
          })
          reply.code(503)
          return reply.send({
            error: 'internal_auth_unavailable',
            message: 'Internal route authentication is not configured.',
          })
        }
        return
      }

      const providedToken = resolveInternalToken(request)
      if (!providedToken || !matchesToken(providedToken, expectedToken)) {
        logger.warn('publisher_internal_auth_failed', {
          path: '/internal/publisher/validate',
          ip: request.ip,
        })
        reply.code(401)
        return reply.send({ error: 'unauthorized' })
      }
    },
  }, async (request) => {
    const body = (request.body ?? {}) as Record<string, unknown>
    const corridorId = typeof body.corridor_id === 'string' ? body.corridor_id : undefined
    let contributorCount = typeof body.contributor_count === 'number'
      ? body.contributor_count
      : undefined
    if (corridorId) {
      contributorCount = await loadContributorCount(corridorId)
    }
    const result = evaluatePublisherGates({
      corridor_id: corridorId,
      contributor_count: contributorCount,
      top_provider_share: typeof body.top_provider_share === 'number' ? body.top_provider_share : undefined,
      top_two_share: typeof body.top_two_share === 'number' ? body.top_two_share : undefined,
    })
    if (corridorId && result.reasons.includes('insufficient_contributors')) {
      logger.info('b2b_publish_gate_skipped', {
        corridor_id: corridorId,
        contributor_count: contributorCount ?? null,
        min_provider_count: result.minContributors,
      })
    }

    return {
      success: result.allowed,
      allowed: result.allowed,
      reasons: result.reasons,
      contributor_count: contributorCount,
    }
  })
}
