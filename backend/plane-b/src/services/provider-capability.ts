import type { Pool } from 'pg'

import type { CollectorRequest, FetchResult } from '../collectors/types'
import { detectBlock } from '../collectors/block-detection'
import { ensureCorridor } from '../collectors/base'
import { ProviderCapabilityRepository } from '../repositories'
import type { ProxyTier } from '../lib/proxy-router'
import { fetchRemitlyQuote } from '../providers/remitly/fetch'
import { extractRemitlyMethodPairs } from '../providers/remitly/parse'
import { REMITLY_SUPPORTED_CORRIDORS } from '../providers/remitly/supported-corridors'
import { fetchWiseQuote } from '../providers/wise/fetch'
import { extractWiseMethodPairs } from '../providers/wise/parse'
import { WISE_SUPPORTED_CORRIDORS } from '../providers/wise/supported-corridors'
import { fetchXeQuote } from '../providers/xe/fetch'
import { extractXeMethodPairs } from '../providers/xe/parse'
import { fetchWorldRemitQuote } from '../providers/worldremit/fetch'
import { extractWorldRemitMethodPairs } from '../providers/worldremit/parse'
import { fetchWesternUnionQuote } from '../providers/westernunion/fetch'
import { extractWesternUnionMethodPairs } from '../providers/westernunion/parse'

type MethodPair = {
  payin_method?: string | null
  payout_method?: string | null
}

type CapabilityProbeEntry = {
  providerId: string
  fetch: (request: CollectorRequest, options?: { jitterMs?: number; proxyTier?: ProxyTier }) => Promise<FetchResult>
  extractPairs: (payload: any) => MethodPair[]
}

type MethodSets = {
  payinMethods: string[]
  payoutMethods: string[]
}

export type ProviderSupportDecision = {
  supported: boolean
  reason: string
  source: 'cache' | 'probe' | 'unknown'
}

const capabilityProbes: Record<string, CapabilityProbeEntry> = {
  remitly: {
    providerId: 'remitly',
    fetch: fetchRemitlyQuote,
    extractPairs: extractRemitlyMethodPairs,
  },
  wise: {
    providerId: 'wise',
    fetch: fetchWiseQuote,
    extractPairs: extractWiseMethodPairs,
  },
  xe: {
    providerId: 'xe',
    fetch: fetchXeQuote,
    extractPairs: extractXeMethodPairs,
  },
  worldremit: {
    providerId: 'worldremit',
    fetch: fetchWorldRemitQuote,
    extractPairs: extractWorldRemitMethodPairs,
  },
  westernunion: {
    providerId: 'westernunion',
    fetch: fetchWesternUnionQuote,
    extractPairs: extractWesternUnionMethodPairs,
  },
}

const remitlySupportedCorridors = new Set(REMITLY_SUPPORTED_CORRIDORS)
const wiseSupportedCorridors = new Set(WISE_SUPPORTED_CORRIDORS)

const catalogSupportedCorridors: Record<string, Set<string>> = {
  remitly: remitlySupportedCorridors,
  wise: wiseSupportedCorridors,
}

const normalizeMethod = (value?: string | null) => {
  if (!value || typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

const buildMethodSets = (pairs: MethodPair[]): MethodSets => {
  const payinMethods = new Set<string>()
  const payoutMethods = new Set<string>()

  for (const pair of pairs) {
    const payin = normalizeMethod(pair.payin_method)
    const payout = normalizeMethod(pair.payout_method)
    if (payin && payin !== 'other') payinMethods.add(payin)
    if (payout && payout !== 'other') payoutMethods.add(payout)
  }

  return {
    payinMethods: Array.from(payinMethods),
    payoutMethods: Array.from(payoutMethods),
  }
}

const methodAllowed = (methods: string[] | null, requested: string) => {
  if (!methods || methods.length === 0) return true
  const normalized = methods.map(normalizeMethod)
  return normalized.includes(normalizeMethod(requested))
}

const probeProviderCapability = async (
  pool: Pool,
  request: CollectorRequest,
): Promise<ProviderSupportDecision> => {
  const probe = capabilityProbes[request.provider_id]
  if (!probe) {
    return { supported: true, reason: 'probe_unavailable', source: 'unknown' }
  }

  let fetchResult: FetchResult
  try {
    fetchResult = await probe.fetch(request, { jitterMs: 0, proxyTier: 'NONE' })
  } catch {
    return { supported: false, reason: 'probe_error', source: 'probe' }
  }

  const blockResult = detectBlock(fetchResult.status, fetchResult.bodyText)
  if (blockResult.blocked) {
    return { supported: false, reason: blockResult.reason ?? 'probe_blocked', source: 'probe' }
  }

  if (fetchResult.status >= 500) {
    return { supported: false, reason: `probe_http_${fetchResult.status}`, source: 'probe' }
  }

  const repo = new ProviderCapabilityRepository(pool)
  if (fetchResult.status >= 400) {
    const isUnsupported = fetchResult.status === 400 || fetchResult.status === 404
    if (isUnsupported) {
      await ensureCorridor(pool, request.corridor_id)
      await repo.markCorridorUnsupported(
        request.provider_id,
        request.corridor_id,
        `probe_http_${fetchResult.status}`,
      )
    }
    return { supported: false, reason: `probe_http_${fetchResult.status}`, source: 'probe' }
  }

  const payload = fetchResult.payload && typeof fetchResult.payload === 'object'
    ? fetchResult.payload
    : {}
  const pairs = probe.extractPairs(payload as any)
  const { payinMethods, payoutMethods } = buildMethodSets(pairs)

  if (payinMethods.length === 0 && payoutMethods.length === 0) {
    await ensureCorridor(pool, request.corridor_id)
    await repo.markCorridorUnsupported(
      request.provider_id,
      request.corridor_id,
      'probe_empty_methods',
    )
    return { supported: false, reason: 'probe_empty_methods', source: 'probe' }
  }

  await ensureCorridor(pool, request.corridor_id)
  await repo.upsertCapability({
    providerId: request.provider_id,
    corridorId: request.corridor_id,
    payinMethods: payinMethods.length ? payinMethods : null,
    payoutMethods: payoutMethods.length ? payoutMethods : null,
    isSupported: true,
    source: 'probe',
  })

  if (!methodAllowed(payinMethods, request.payin_method) || !methodAllowed(payoutMethods, request.payout_method)) {
    return { supported: false, reason: 'probe_method_mismatch', source: 'probe' }
  }

  return { supported: true, reason: 'probe_supported', source: 'probe' }
}

export const resolveProviderSupport = async (
  pool: Pool,
  request: CollectorRequest,
  options: { allowProbe?: boolean } = {},
): Promise<ProviderSupportDecision> => {
  const allowProbe = options.allowProbe ?? true
  const catalogSet = catalogSupportedCorridors[request.provider_id]
  if (catalogSet && !catalogSet.has(request.corridor_id)) {
    await ensureCorridor(pool, request.corridor_id)
    const repo = new ProviderCapabilityRepository(pool)
    await repo.markCorridorUnsupported(
      request.provider_id,
      request.corridor_id,
      'catalog_unsupported',
    )
    return { supported: false, reason: 'catalog_unsupported', source: 'cache' }
  }

  const repo = new ProviderCapabilityRepository(pool)
  const existing = await repo.getCapability(request.provider_id, request.corridor_id)
  if (existing) {
    if (!existing.is_supported) {
      return { supported: false, reason: 'capability_unsupported', source: 'cache' }
    }
    if (!methodAllowed(existing.payin_methods, request.payin_method) || !methodAllowed(existing.payout_methods, request.payout_method)) {
      return { supported: false, reason: 'capability_method_mismatch', source: 'cache' }
    }
    return { supported: true, reason: 'capability_match', source: 'cache' }
  }

  if (!allowProbe) {
    return { supported: true, reason: 'capability_unknown', source: 'unknown' }
  }

  return await probeProviderCapability(pool, request)
}
