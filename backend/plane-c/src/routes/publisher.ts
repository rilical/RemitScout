import type { FastifyInstance } from 'fastify'
import { evaluatePublisherGates } from '../services/publisher-gates'

export const publisherRoutes = async (app: FastifyInstance) => {
  app.post('/internal/publisher/validate', async (request) => {
    const body = (request.body ?? {}) as Record<string, unknown>
    const result = evaluatePublisherGates({
      contributor_count: typeof body.contributor_count === 'number' ? body.contributor_count : undefined,
      top_provider_share: typeof body.top_provider_share === 'number' ? body.top_provider_share : undefined,
      top_two_share: typeof body.top_two_share === 'number' ? body.top_two_share : undefined,
    })

    return {
      success: result.allowed,
      allowed: result.allowed,
      reasons: result.reasons,
    }
  })
}
