import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { CollectorRequest } from '../../plane-b/src/collectors/types'
import * as remitlyFetch from '../../plane-b/src/providers/remitly/fetch'
import * as remitlyParse from '../../plane-b/src/providers/remitly/parse'
import * as wiseFetch from '../../plane-b/src/providers/wise/fetch'
import * as wiseParse from '../../plane-b/src/providers/wise/parse'
import * as xeFetch from '../../plane-b/src/providers/xe/fetch'
import * as xeParse from '../../plane-b/src/providers/xe/parse'
import * as riaFetch from '../../plane-b/src/providers/ria/fetch'
import * as riaParse from '../../plane-b/src/providers/ria/parse'
import * as worldremitFetch from '../../plane-b/src/providers/worldremit/fetch'
import * as worldremitParse from '../../plane-b/src/providers/worldremit/parse'
import * as westernunionFetch from '../../plane-b/src/providers/westernunion/fetch'
import * as westernunionParse from '../../plane-b/src/providers/westernunion/parse'
import * as quoteNormalizer from '../../plane-b/src/normalize/quote-normalizer'

type BackendResponse = {
  ok: boolean
  status: number
  json?: unknown
  text?: string
}

type ProviderSnapshot = {
  status: number | null
  error: string | null
  request: CollectorRequest
  method_pairs?: Array<{ payin_method?: string | null; payout_method?: string | null }>
  parsed?: unknown
  normalized?: unknown
  mismatches?: string[]
  raw_payload_file?: string
  raw_body_file?: string
}

const getExport = <T>(mod: Record<string, unknown>, name: string): T | undefined => {
  const direct = mod[name] as T | undefined
  if (direct) return direct
  const fromDefault = (mod.default as Record<string, unknown> | undefined)?.[name] as T | undefined
  if (fromDefault) return fromDefault
  const fromCommon = (mod['module.exports'] as Record<string, unknown> | undefined)?.[name] as T | undefined
  if (fromCommon) return fromCommon
  return undefined
}

const apiBase = process.env.API_BASE || 'http://localhost:4000/api/v1'
const from = (process.env.FROM || 'US').toUpperCase()
const to = (process.env.TO || 'MX').toUpperCase()
const fromCurrency = (process.env.FROM_CURRENCY || 'USD').toUpperCase()
const toCurrency = (process.env.TO_CURRENCY || 'MXN').toUpperCase()
const amount = Number(process.env.AMOUNT || 100)
const method = (process.env.METHOD || 'bank').toLowerCase()

const methodMap: Record<string, { payin: string; payout: string }> = {
  bank: { payin: 'bank_transfer', payout: 'bank_deposit' },
  cash: { payin: 'bank_transfer', payout: 'cash_pickup' },
  wallet: { payin: 'bank_transfer', payout: 'mobile_wallet' },
  airtime: { payin: 'bank_transfer', payout: 'airtime' },
}

const methodChoice = methodMap[method]
if (!methodChoice) {
  throw new Error(`Unsupported METHOD "${method}". Use bank, cash, wallet, or airtime.`)
}

const corridorId = `${from}-${to}-${fromCurrency}-${toCurrency}`
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputDir = join(process.cwd(), 'backend', 'tmp', 'provider-snapshots', timestamp)
mkdirSync(outputDir, { recursive: true })

const fetchBackendJson = async (path: string, query: Record<string, string>): Promise<BackendResponse> => {
  const baseUrl = new URL(apiBase)
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path
  const basePath = baseUrl.pathname.replace(/\/$/, '')
  baseUrl.pathname = `${basePath}/${trimmedPath}`
  const url = baseUrl
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url.toString(), { headers: { accept: 'application/json' } })
  const text = await response.text()
  try {
    return { ok: response.ok, status: response.status, json: JSON.parse(text) }
  } catch {
    return { ok: response.ok, status: response.status, text }
  }
}

const writeJson = (filename: string, payload: unknown) => {
  const filePath = join(outputDir, filename)
  writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
  return filePath
}

const writeText = (filename: string, payload: string) => {
  const filePath = join(outputDir, filename)
  writeFileSync(filePath, payload, 'utf8')
  return filePath
}

const snapshotProviders: Record<string, ProviderSnapshot> = {}

const buildSummary = () => ({
  collected_at: new Date().toISOString(),
  corridor_id: corridorId,
  amount,
  method,
  payin: methodChoice.payin,
  payout: methodChoice.payout,
  api_base: apiBase,
})

const captureProvider = async (providerId: string, options: {
  fetchFn?: (request: CollectorRequest) => Promise<{ status: number; bodyText: unknown; payload: unknown }>
  parseFn?: (payload: unknown, request: CollectorRequest) => unknown
  extractPairsFn?: (payload: unknown) => Array<{ payin_method?: string | null; payout_method?: string | null }>
}) => {
  const request: CollectorRequest = {
    provider_id: providerId,
    corridor_id: corridorId,
    amount_bucket: amount,
    send_amount: amount,
    payin_method: methodChoice.payin,
    payout_method: methodChoice.payout,
    locale: 'en-US',
  }

  const snapshot: ProviderSnapshot = {
    status: null,
    error: null,
    request,
  }

  if (!options.fetchFn) {
    snapshot.error = 'fetch_unavailable'
    snapshotProviders[providerId] = snapshot
    return
  }

  try {
    const result = await options.fetchFn(request)
    snapshot.status = result.status

    const payloadFile = writeJson(`${providerId}-payload.json`, result.payload ?? null)
    snapshot.raw_payload_file = payloadFile

    if (typeof result.bodyText === 'string') {
      const bodyFile = writeText(`${providerId}-body.txt`, result.bodyText)
      snapshot.raw_body_file = bodyFile
    }

    if (options.extractPairsFn) {
      try {
        snapshot.method_pairs = options.extractPairsFn(result.payload)
      } catch {
        snapshot.method_pairs = []
      }
    }

    if (!options.parseFn) {
      snapshotProviders[providerId] = snapshot
      return
    }

    const parsed = options.parseFn(result.payload, request)
    snapshot.parsed = parsed ?? null

    if (parsed && typeof parsed === 'object' && 'payin_method' in parsed && 'payout_method' in parsed) {
      const parsedAny = parsed as { payin_method?: string; payout_method?: string }
      const mismatches: string[] = []
      if (parsedAny.payin_method && parsedAny.payin_method !== request.payin_method) {
        mismatches.push(`payin_method_requested_${request.payin_method}_parsed_${parsedAny.payin_method}`)
      }
      if (parsedAny.payout_method && parsedAny.payout_method !== request.payout_method) {
        mismatches.push(`payout_method_requested_${request.payout_method}_parsed_${parsedAny.payout_method}`)
      }
      snapshot.mismatches = mismatches.length ? mismatches : undefined
    }

    if (parsed && typeof parsed === 'object') {
      const normalizeQuote = getExport<typeof quoteNormalizer.normalizeQuote>(
        quoteNormalizer as Record<string, unknown>,
        'normalizeQuote',
      )
      if (normalizeQuote) {
        const parsedAny = parsed as Record<string, unknown>
        const normalized = normalizeQuote({
          provider_id: providerId,
          corridor_id: corridorId,
          send_amount: Number(parsedAny.send_amount),
          fee_amount: Number(parsedAny.fee_amount),
          fee_currency: (parsedAny.fee_currency as string | null | undefined) ?? null,
          total_debit_amount: Number(parsedAny.total_debit_amount),
          receive_amount: Number(parsedAny.receive_amount),
          payin_method: String(parsedAny.payin_method ?? ''),
          payout_method: String(parsedAny.payout_method ?? ''),
          promotional_fee_amount: parsedAny.promotional_fee_amount as number | null | undefined,
          delivery_time_min_minutes: parsedAny.delivery_time_min_minutes as number | null | undefined,
          delivery_time_max_minutes: parsedAny.delivery_time_max_minutes as number | null | undefined,
          promotional_rate: parsedAny.promotional_rate as number | null | undefined,
          base_rate: parsedAny.base_rate as number | null | undefined,
          promotional_cap_amount: parsedAny.promotional_cap_amount as number | null | undefined,
          collected_at: String(parsedAny.collected_at ?? new Date().toISOString()),
          ingestion_run_id: 'debug-snapshot',
          bronze_object_key: `debug/${providerId}/${timestamp}`,
          parser_version: String(parsedAny.parser_version ?? ''),
          parse_flags: (parsedAny.parse_flags as string[] | undefined) ?? [],
        })
        snapshot.normalized = {
          implied_fx_rate: normalized.implied_fx_rate,
          fee_amount: normalized.fee_amount,
          receive_amount: normalized.receive_amount,
          payin: normalized.payin,
          payout: normalized.payout,
          method_profile: normalized.method_profile,
          quality_flags: normalized.quality_flags,
        }
      }
    }
  } catch (error) {
    snapshot.error = error instanceof Error ? error.message : String(error)
  }

  snapshotProviders[providerId] = snapshot
}

const run = async () => {
  const backendProviders = await fetchBackendJson('/providers', {
    from,
    to,
    amount: String(amount),
    method,
    fromCurrency,
    toCurrency,
  })
  const backendQuotes = await fetchBackendJson('/quotes/current', {
    corridor_id: corridorId,
    amount: String(amount),
    payin: methodChoice.payin,
    payout: methodChoice.payout,
  })

  const providersResponseFile = writeJson('backend-providers.json', backendProviders)
  const quotesResponseFile = writeJson('backend-quotes.json', backendQuotes)

  await captureProvider('remitly', {
    fetchFn: getExport(remitlyFetch as Record<string, unknown>, 'fetchRemitlyQuote'),
    parseFn: getExport(remitlyParse as Record<string, unknown>, 'parseRemitlyPayload'),
    extractPairsFn: getExport(remitlyParse as Record<string, unknown>, 'extractRemitlyMethodPairs'),
  })
  await captureProvider('wise', {
    fetchFn: getExport(wiseFetch as Record<string, unknown>, 'fetchWiseQuote'),
    parseFn: getExport(wiseParse as Record<string, unknown>, 'parseWisePayload'),
    extractPairsFn: getExport(wiseParse as Record<string, unknown>, 'extractWiseMethodPairs'),
  })
  await captureProvider('xe', {
    fetchFn: getExport(xeFetch as Record<string, unknown>, 'fetchXeQuote'),
    parseFn: getExport(xeParse as Record<string, unknown>, 'parseXePayload'),
    extractPairsFn: getExport(xeParse as Record<string, unknown>, 'extractXeMethodPairs'),
  })
  await captureProvider('ria', {
    fetchFn: getExport(riaFetch as Record<string, unknown>, 'fetchRiaQuote'),
    parseFn: getExport(riaParse as Record<string, unknown>, 'parseRiaPayload'),
    extractPairsFn: getExport(riaParse as Record<string, unknown>, 'extractRiaMethodPairs'),
  })
  await captureProvider('worldremit', {
    fetchFn: getExport(worldremitFetch as Record<string, unknown>, 'fetchWorldRemitQuote'),
    parseFn: getExport(worldremitParse as Record<string, unknown>, 'parseWorldRemitPayload'),
    extractPairsFn: getExport(worldremitParse as Record<string, unknown>, 'extractWorldRemitMethodPairs'),
  })
  await captureProvider('westernunion', {
    fetchFn: getExport(westernunionFetch as Record<string, unknown>, 'fetchWesternUnionQuote'),
    parseFn: getExport(westernunionParse as Record<string, unknown>, 'parseWesternUnionPayload'),
    extractPairsFn: getExport(westernunionParse as Record<string, unknown>, 'extractWesternUnionMethodPairs'),
  })

  const summary = {
    ...buildSummary(),
    backend_providers_file: providersResponseFile,
    backend_quotes_file: quotesResponseFile,
    providers: snapshotProviders,
  }

  writeJson('summary.json', summary)
  console.log(`Snapshot saved to ${outputDir}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
