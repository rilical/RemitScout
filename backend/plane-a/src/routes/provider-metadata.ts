import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { createLogger } from '../../../shared/logger'
import {
  getAllProviderMetadata,
  getProviderMetadata,
  getProviderMetadataBySlug,
} from '../services/provider-metadata'

const logger = createLogger('plane-a.provider-metadata')

const providerIdSchema = z.object({
  id: z.string().min(1),
})

type ProviderMetadataResponse = {
  id: string
  slug: string
  name: string
  displayName: string
  type: string
  url: string
  affiliateUrl: string | null
  isAffiliate: boolean
  logo: { sm: string; ico: string }
  remitScore: number
  scoreBreakdown?: {
    deliveredValue: number
    reliability: number
    frictionSpeed: number
    supportRefunds: number
    trustSafety: number
  }
}

const serializeProvider = (provider: ReturnType<typeof getProviderMetadata>): ProviderMetadataResponse => {
  if (!provider) {
    throw new Error('provider_metadata_missing')
  }

  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.displayName || provider.name,
    displayName: provider.displayName,
    type: provider.type,
    url: provider.url,
    affiliateUrl: provider.affiliateUrl ?? null,
    isAffiliate: provider.isAffiliate,
    logo: provider.logo,
    remitScore: provider.remitScore,
    scoreBreakdown: provider.scoreBreakdown,
  }
}

export const providerMetadataRoutes = async (app: FastifyInstance) => {
  app.get('/providers/metadata', async () => {
    const providers = getAllProviderMetadata().map((provider) => serializeProvider(provider))
    return { data: providers }
  })

  app.get('/providers/metadata/:id', async (request, reply) => {
    const parsed = providerIdSchema.safeParse(request.params)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const id = parsed.data.id.toLowerCase()
    const provider =
      getProviderMetadata(id) || getProviderMetadataBySlug(id)

    if (!provider) {
      reply.code(404)
      return { error: 'not_found' }
    }

    try {
      return { data: serializeProvider(provider) }
    } catch (error) {
      logger.error('provider_metadata_serialize_failed', {
        error: error instanceof Error ? error.message : String(error),
        provider_id: id,
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
