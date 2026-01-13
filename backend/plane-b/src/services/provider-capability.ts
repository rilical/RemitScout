import type { Pool } from 'pg'

import type { CollectorRequest, FetchResult } from '../collectors/types'
import { detectBlock } from '../collectors/block-detection'
import { ensureCorridor } from '../collectors/base'
import { parseCorridorId } from '../../../shared/corridor'
import { isWiseDestinationCurrency, isWiseSourceCurrency } from '../../../shared/provider-currencies'
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
import { fetchTransferGoQuote } from '../providers/transfergo/fetch'
import { extractTransferGoMethodPairs } from '../providers/transfergo/parse'
import { TRANSFERGO_SUPPORTED_CORRIDORS } from '../providers/transfergo/supported-corridors'
import { fetchPaysendQuote } from '../providers/paysend/fetch'
import { extractPaysendMethodPairs } from '../providers/paysend/parse'
import { PAYSEND_SUPPORTED_CORRIDORS } from '../providers/paysend/supported-corridors'
import { fetchPangeaQuote } from '../providers/pangea/fetch'
import { extractPangeaMethodPairs } from '../providers/pangea/parse'
import { PANGEA_SUPPORTED_CORRIDORS } from '../providers/pangea/supported-corridors'
import { fetchOrbitRemitQuote } from '../providers/orbitremit/fetch'
import { extractOrbitRemitMethodPairs } from '../providers/orbitremit/parse'
import { ORBITREMIT_SUPPORTED_CORRIDORS } from '../providers/orbitremit/supported-corridors'
import { fetchBossMoneyQuote } from '../providers/bossmoney/fetch'
import { extractBossMoneyMethodPairs } from '../providers/bossmoney/parse'
import { BOSSMONEY_SUPPORTED_CORRIDORS } from '../providers/bossmoney/supported-corridors'
import { fetchKoronaPayQuote } from '../providers/koronapay/fetch'
import { extractKoronaPayMethodPairs } from '../providers/koronapay/parse'
import { KORONAPAY_SUPPORTED_CORRIDORS } from '../providers/koronapay/supported-corridors'
import { fetchRemitbeeQuote } from '../providers/remitbee/fetch'
import { extractRemitbeeMethodPairs } from '../providers/remitbee/parse'
import { REMITBEE_SUPPORTED_CORRIDORS } from '../providers/remitbee/supported-corridors'
import { fetchSingxQuote } from '../providers/singx/fetch'
import { extractSingxMethodPairs } from '../providers/singx/parse'
import { SINGX_SUPPORTED_CORRIDORS } from '../providers/singx/supported-corridors'
import { fetchPlacidQuote } from '../providers/placid/fetch'
import { extractPlacidMethodPairs } from '../providers/placid/parse'
import { PLACID_SUPPORTED_CORRIDORS } from '../providers/placid/supported-corridors'
import { fetchRiaQuote } from '../providers/ria/fetch'
import { extractRiaMethodPairs } from '../providers/ria/parse'
import { RIA_SUPPORTED_CORRIDORS } from '../providers/ria/supported-corridors'
import { fetchDahabshiilQuote } from '../providers/dahabshiil/fetch'
import { extractDahabshiilMethodPairs } from '../providers/dahabshiil/parse'
import { DAHABSHIIL_SUPPORTED_CORRIDORS } from '../providers/dahabshiil/supported-corridors'
import { fetchSendwaveQuote } from '../providers/sendwave/fetch'
import { extractSendwaveMethodPairs } from '../providers/sendwave/parse'
import { SENDWAVE_SUPPORTED_CORRIDORS } from '../providers/sendwave/supported-corridors'
import { fetchMukuruQuote } from '../providers/mukuru/fetch'
import { extractMukuruMethodPairs } from '../providers/mukuru/parse'
import { MUKURU_SUPPORTED_CORRIDORS } from '../providers/mukuru/supported-corridors'
import { fetchWorldRemitQuote } from '../providers/worldremit/fetch'
import { extractWorldRemitMethodPairs } from '../providers/worldremit/parse'
import { fetchWesternUnionQuote } from '../providers/westernunion/fetch'
import { extractWesternUnionMethodPairs } from '../providers/westernunion/parse'
import { fetchXoomQuote } from '../providers/xoom/fetch'
import { extractXoomMethodPairs } from '../providers/xoom/parse'
import { XOOM_SUPPORTED_CORRIDORS } from '../providers/xoom/supported-corridors'
import { fetchInstaremQuote } from '../providers/instarem/fetch'
import { extractInstaremMethodPairs } from '../providers/instarem/parse'
import { INSTAREM_SUPPORTED_CORRIDORS } from '../providers/instarem/supported-corridors'
import { fetchWireBarleyQuote } from '../providers/wirebarley/fetch'
import { extractWireBarleyMethodPairs } from '../providers/wirebarley/parse'
import { WIREBARLEY_SUPPORTED_CORRIDORS } from '../providers/wirebarley/supported-corridors'
import { fetchIntermexQuote } from '../providers/intermex/fetch'
import { extractIntermexMethodPairs } from '../providers/intermex/parse'
import { INTERMEX_SUPPORTED_CORRIDORS } from '../providers/intermex/supported-corridors'

type MethodPair = {
  payin_method?: string | null
  payout_method?: string | null
}

type CapabilityProbeEntry = {
  providerId: string
  fetch: (request: CollectorRequest, options?: { jitterMs?: number; proxyTier?: ProxyTier }) => Promise<FetchResult>
  extractPairs: (payload: any, request?: CollectorRequest) => MethodPair[]
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
  transfergo: {
    providerId: 'transfergo',
    fetch: fetchTransferGoQuote,
    extractPairs: extractTransferGoMethodPairs,
  },
  paysend: {
    providerId: 'paysend',
    fetch: fetchPaysendQuote,
    extractPairs: extractPaysendMethodPairs,
  },
  pangea: {
    providerId: 'pangea',
    fetch: fetchPangeaQuote,
    extractPairs: extractPangeaMethodPairs,
  },
  orbitremit: {
    providerId: 'orbitremit',
    fetch: fetchOrbitRemitQuote,
    extractPairs: extractOrbitRemitMethodPairs,
  },
  bossmoney: {
    providerId: 'bossmoney',
    fetch: fetchBossMoneyQuote,
    extractPairs: extractBossMoneyMethodPairs,
  },
  koronapay: {
    providerId: 'koronapay',
    fetch: fetchKoronaPayQuote,
    extractPairs: extractKoronaPayMethodPairs,
  },
  remitbee: {
    providerId: 'remitbee',
    fetch: fetchRemitbeeQuote,
    extractPairs: extractRemitbeeMethodPairs,
  },
  singx: {
    providerId: 'singx',
    fetch: fetchSingxQuote,
    extractPairs: extractSingxMethodPairs,
  },
  placid: {
    providerId: 'placid',
    fetch: fetchPlacidQuote,
    extractPairs: extractPlacidMethodPairs,
  },
  ria: {
    providerId: 'ria',
    fetch: fetchRiaQuote,
    extractPairs: extractRiaMethodPairs,
  },
  dahabshiil: {
    providerId: 'dahabshiil',
    fetch: fetchDahabshiilQuote,
    extractPairs: extractDahabshiilMethodPairs,
  },
  sendwave: {
    providerId: 'sendwave',
    fetch: fetchSendwaveQuote,
    extractPairs: extractSendwaveMethodPairs,
  },
  mukuru: {
    providerId: 'mukuru',
    fetch: fetchMukuruQuote,
    extractPairs: extractMukuruMethodPairs,
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
  xoom: {
    providerId: 'xoom',
    fetch: fetchXoomQuote,
    extractPairs: extractXoomMethodPairs,
  },
  instarem: {
    providerId: 'instarem',
    fetch: fetchInstaremQuote,
    extractPairs: extractInstaremMethodPairs,
  },
  wirebarley: {
    providerId: 'wirebarley',
    fetch: fetchWireBarleyQuote,
    extractPairs: extractWireBarleyMethodPairs,
  },
  intermex: {
    providerId: 'intermex',
    fetch: fetchIntermexQuote,
    extractPairs: extractIntermexMethodPairs,
  },
}

const remitlySupportedCorridors = new Set(REMITLY_SUPPORTED_CORRIDORS)
const wiseSupportedCorridors = new Set(WISE_SUPPORTED_CORRIDORS)
const transferGoSupportedCorridors = new Set(TRANSFERGO_SUPPORTED_CORRIDORS)
const paysendSupportedCorridors = new Set(PAYSEND_SUPPORTED_CORRIDORS)
const pangeaSupportedCorridors = new Set(PANGEA_SUPPORTED_CORRIDORS)
const orbitremitSupportedCorridors = new Set(ORBITREMIT_SUPPORTED_CORRIDORS)
const bossmoneySupportedCorridors = new Set(BOSSMONEY_SUPPORTED_CORRIDORS)
const koronapaySupportedCorridors = new Set(KORONAPAY_SUPPORTED_CORRIDORS)
const remitbeeSupportedCorridors = new Set(REMITBEE_SUPPORTED_CORRIDORS)
const singxSupportedCorridors = new Set(SINGX_SUPPORTED_CORRIDORS)
const placidSupportedCorridors = new Set(PLACID_SUPPORTED_CORRIDORS)
const riaSupportedCorridors = new Set(RIA_SUPPORTED_CORRIDORS)
const dahabshiilSupportedCorridors = new Set(DAHABSHIIL_SUPPORTED_CORRIDORS)
const sendwaveSupportedCorridors = new Set(SENDWAVE_SUPPORTED_CORRIDORS)
const mukuruSupportedCorridors = new Set(MUKURU_SUPPORTED_CORRIDORS)
const xoomSupportedCorridors = new Set(XOOM_SUPPORTED_CORRIDORS)
const instaremSupportedCorridors = new Set(INSTAREM_SUPPORTED_CORRIDORS)
const wirebarleySupportedCorridors = new Set(WIREBARLEY_SUPPORTED_CORRIDORS)
const intermexSupportedCorridors = new Set(INTERMEX_SUPPORTED_CORRIDORS)

const catalogSupportedCorridors: Record<string, Set<string>> = {
  remitly: remitlySupportedCorridors,
  wise: wiseSupportedCorridors,
  transfergo: transferGoSupportedCorridors,
  paysend: paysendSupportedCorridors,
  pangea: pangeaSupportedCorridors,
  orbitremit: orbitremitSupportedCorridors,
  bossmoney: bossmoneySupportedCorridors,
  koronapay: koronapaySupportedCorridors,
  remitbee: remitbeeSupportedCorridors,
  singx: singxSupportedCorridors,
  placid: placidSupportedCorridors,
  ria: riaSupportedCorridors,
  dahabshiil: dahabshiilSupportedCorridors,
  sendwave: sendwaveSupportedCorridors,
  mukuru: mukuruSupportedCorridors,
  xoom: xoomSupportedCorridors,
  instarem: instaremSupportedCorridors,
  wirebarley: wirebarleySupportedCorridors,
  intermex: intermexSupportedCorridors,
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

const isWiseCurrencyCorridor = (corridorId: string): boolean => {
  const parts = parseCorridorId(corridorId)
  if (!parts) return false
  return isWiseSourceCurrency(parts.sourceCurrency.toUpperCase())
    && isWiseDestinationCurrency(parts.destCurrency.toUpperCase())
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
  const pairs = probe.extractPairs(payload as any, request)
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
  if (request.provider_id === 'wise') {
    if (!isWiseCurrencyCorridor(request.corridor_id)) {
      await ensureCorridor(pool, request.corridor_id)
      const repo = new ProviderCapabilityRepository(pool)
      await repo.markCorridorUnsupported(
        request.provider_id,
        request.corridor_id,
        'wise_currency_unsupported',
      )
      return { supported: false, reason: 'catalog_unsupported', source: 'cache' }
    }
  } else if (catalogSet && !catalogSet.has(request.corridor_id)) {
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
