import type { FastifyInstance } from 'fastify'
import { parseCorridorId } from '../../../../shared/corridor'
import { ValidationError } from '../../../../shared/errors'
import { normalizeProviderId } from '../../../../shared/provider-utils'

export const providersCorridorRoutes = async (app: FastifyInstance) => {
  app.get('/providers/corridor/:corridorId', async (request) => {
    const corridorId = String((request.params as { corridorId?: string }).corridorId ?? '').toUpperCase()
    if (!parseCorridorId(corridorId)) {
      throw new ValidationError('Invalid corridor id', {
        details: [{ message: 'invalid_corridor_id' }],
      })
    }

    const rows = await app.container.repositories.corridorCapability.listByCorridor(corridorId)
    const byProvider = new Map<
      string,
      {
        providerId: string
        supported: boolean
        payinMethods: string[]
        payoutMethods: string[]
      }
    >()

    for (const row of rows) {
      const providerId = normalizeProviderId(row.provider_id)
      if (!providerId) continue
      const existing = byProvider.get(providerId) ?? {
        providerId,
        supported: false,
        payinMethods: [],
        payoutMethods: [],
      }
      existing.supported = existing.supported || row.is_supported === true
      existing.payinMethods = Array.from(
        new Set([...existing.payinMethods, ...(Array.isArray(row.payin_methods) ? row.payin_methods : [])]),
      )
      existing.payoutMethods = Array.from(
        new Set([...existing.payoutMethods, ...(Array.isArray(row.payout_methods) ? row.payout_methods : [])]),
      )
      byProvider.set(providerId, existing)
    }

    return {
      success: true,
      corridorId,
      providers: Array.from(byProvider.values()).sort((left, right) =>
        left.providerId.localeCompare(right.providerId),
      ),
    }
  })
}
