import type { FastifyInstance } from 'fastify'
import { NotFoundError, ValidationError } from '../../../../shared/errors'
import { normalizeProviderId } from '../../../../shared/provider-utils'
import { getProviderMetadata } from '../../services/provider-metadata'

export const providersDetailRoutes = async (app: FastifyInstance) => {
  app.get('/providers/:providerId', async (request) => {
    const providerId = normalizeProviderId((request.params as { providerId?: string }).providerId ?? '')
    if (!providerId) {
      throw new ValidationError('Invalid provider id', {
        details: [{ message: 'provider_id_required' }],
      })
    }

    const metadata = getProviderMetadata(providerId)
    if (!metadata) {
      throw new NotFoundError('Provider not found')
    }

    return {
      success: true,
      provider: {
        id: metadata.id,
        slug: metadata.slug,
        name: metadata.name,
        type: metadata.type,
        url: metadata.url,
        logo: metadata.logo,
        affiliateUrl: metadata.affiliateUrl ?? null,
        isAffiliate: metadata.isAffiliate,
      },
    }
  })
}
