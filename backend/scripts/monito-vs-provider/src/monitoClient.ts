import fs from 'node:fs/promises'
import path from 'node:path'

import type { Browser, BrowserContext, Page } from 'playwright'
import { chromium } from 'playwright'

import {
  parseBoolean,
  parseNumber,
  safeTimestampForFs,
  withBackoff,
} from './utils'
import type { CorridorConfig, MonitoProviderQuote, MonitoSnapshot, SnapshotCsvRow } from './schema'

interface MonitoClientConfig {
  monitoBaseUrl: string
  timeoutMs: number
  headless: boolean
}

interface MonitoClientOptions {
  config: MonitoClientConfig
}

type JsonValue = string | number | boolean | null | Record<string, unknown> | JsonValue[]

const MAX_CAPTURE_MS = 30_000

const toObj = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)

const flatten = (value: JsonValue | undefined, out: JsonValue[] = [], depth = 10): JsonValue[] => {
  if (depth < 0 || value === null || value === undefined) return out
  out.push(value)

  if (Array.isArray(value)) {
    for (const item of value) flatten(item, out, depth - 1)
    return out
  }

  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) flatten(child as JsonValue, out, depth - 1)
  }

  return out
}

const getString = (value: unknown, ...keys: string[]): string => {
  if (!toObj(value)) return ''
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key]
    if (candidate === null || candidate === undefined) continue
    const text = String(candidate).trim()
    if (text) return text
  }
  return ''
}

const hasKeys = (value: Record<string, unknown>, keys: string[]): boolean => keys.some((key) => Object.prototype.hasOwnProperty.call(value, key))

const findComparisonNode = (payload: unknown): Record<string, unknown> | null => {
  const flat = flatten(payload)

  for (const item of flat) {
    if (!toObj(item)) continue

    if (hasKeys(item, ['providerQuotes', 'comparisonId'])) return item

    const dataNode = item.data
    if (!toObj(dataNode)) continue

    if (hasKeys(dataNode, ['providerQuotes', 'comparisonId'])) return dataNode

    const compareTransfers = (dataNode as Record<string, unknown>).compareTransfers
    if (toObj(compareTransfers) && hasKeys(compareTransfers as Record<string, unknown>, ['providerQuotes', 'comparisonId'])) {
      return compareTransfers as Record<string, unknown>
    }
  }

  return null
}

const extractScalar = (payload: unknown, keys: string[]): number | null => {
  const flat = flatten(payload)
  for (const item of flat) {
    if (!toObj(item)) continue
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) continue
      const parsed = parseNumber((item as Record<string, unknown>)[key])
      if (parsed !== null) return parsed
    }
  }
  return null
}

const extractScalarAtPath = (payload: unknown, path: string[]): number | null => {
  let cursor: unknown = payload
  for (const key of path) {
    if (!toObj(cursor)) return null
    cursor = cursor[key]
  }
  return parseNumber(cursor)
}

const normalizeDeliveryEstimate = (raw: unknown): string | null => {
  if (!toObj(raw)) return null
  const node = raw as Record<string, unknown>
  const min = getString(node, 'min', 'minHours', 'minMinutes', 'minDays', 'min_working_days')
  const max = getString(node, 'max', 'maxHours', 'maxMinutes', 'maxDays', 'max_working_days')
  if (!min && !max) return null
  if (min && max) return `${min}-${max}`
  return min || max
}

const normalizeOneProviderQuote = (raw: unknown, index: number): MonitoProviderQuote | null => {
  if (!toObj(raw)) return null
  const node = raw as Record<string, unknown>

  const psp = node.psp && toObj(node.psp) ? (node.psp as Record<string, unknown>) : null
  const quotes = node.quotes && toObj(node.quotes) ? (node.quotes as Record<string, unknown>) : null

  const slug = getString(
    psp,
    'slug',
    'provider_slug',
    'providerId',
    'provider_id',
  ) || getString(
    node,
    'pspSlug',
    'provider_slug',
    'providerSlug',
  )

  if (!slug) return null

  const rate = parseNumber(
    getString(quotes as unknown, 'rate', 'exchangeRate', 'midMarketRate', 'mid_market_rate')
      || getString(node, 'rate', 'exchangeRate', 'midMarketRate', 'mid_market_rate')
      || getString(node.midMarket, 'rate', 'midMarketRate', 'mid_market_rate'),
  )

  const quoteFeeNode = quotes && toObj((quotes as Record<string, unknown>).fee) ? (quotes as Record<string, unknown>).fee : undefined
  const fee = parseNumber(
    getString(
      quoteFeeNode as unknown,
      'total',
      'amount',
      'fee',
      'payin',
      'payout',
    )
      || getString(quotes as unknown, 'fees', 'rateFee')
      || getString(node, 'fee', 'fees')
      || getString((quoteFeeNode && toObj(quoteFeeNode) && (quoteFeeNode as Record<string, unknown>).total) ? (quoteFeeNode as Record<string, unknown>).total : null, 'amount', 'value'),
  )

  const totalReceived = parseNumber(
    getString(quotes as unknown, 'receivedAmount', 'receiveAmount', 'payoutAmount', 'totalReceived', 'targetAmount')
      || getString(node, 'receivedAmount', 'receiveAmount', 'payoutAmount', 'totalReceived', 'targetAmount')
      || getString((quotes && toObj(quotes) && (quotes as Record<string, unknown>).total) ? (quotes as Record<string, unknown>).total : null, 'amount', 'value'),
  )

  const rawTransferTime = node.transferTime
  const payoutMethod = getString(quotes as unknown, 'payoutMethod', 'method') || getString(node, 'payoutMethod', 'method')
  const rank = parseNumber(
    getString(node, 'rank', 'position', 'index', 'order'),
  )

  const isPromo = Array.isArray(node.promos) ? node.promos.length > 0 : Boolean(parseBoolean(getString(node, 'isPromo', 'is_promo')))
  const isBest = Boolean(parseBoolean(getString(node, 'isBest', 'is_best', 'best', 'isTop', 'top')) || (rank === 1))

  return {
    pspSlug: slug.toLowerCase(),
    pspName: getString(psp, 'name', 'displayName', 'providerName') || slug,
    rate,
    fee,
    totalReceived,
    payoutMethod: payoutMethod || null,
    deliveryEstimate: normalizeDeliveryEstimate((node as Record<string, unknown>).transferTime),
    isPromo,
    rank: rank ?? index + 1,
    isBest,
    flags: node,
  }
}

const normalizeProviderQuotes = (comparison: Record<string, unknown>): MonitoProviderQuote[] => {
  const direct = comparison.providerQuotes
  const seen = new Set<string>()
  const out: MonitoProviderQuote[] = []

  if (Array.isArray(direct)) {
    direct.forEach((entry, index) => {
      const normalized = normalizeOneProviderQuote(entry, index)
      if (!normalized || seen.has(normalized.pspSlug)) return
      seen.add(normalized.pspSlug)
      out.push({ ...normalized, rank: normalized.rank ?? index + 1 })
    })
    return out
  }

  const nodes = flatten(comparison)
  for (const item of nodes) {
    if (!toObj(item)) continue
    const normalized = normalizeOneProviderQuote(item, out.length)
    if (!normalized || seen.has(normalized.pspSlug)) continue
    seen.add(normalized.pspSlug)
    out.push({ ...normalized, rank: normalized.rank ?? out.length })
  }

  return out
}

export interface MonitoClientInit {
  config: MonitoClientConfig
}

export class MonitoClient {
  private readonly options: MonitoClientInit
  private browser: Browser | null = null
  private browserContext: BrowserContext | null = null

  constructor(options: MonitoClientInit) {
    this.options = options
  }

  private async init(): Promise<void> {
    if (this.browser && this.browserContext) return

    this.browser = await chromium.launch({
      headless: this.options.config.headless,
      args: ['--no-sandbox'],
    })

    this.browserContext = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    })
  }

  public async close(): Promise<void> {
    if (!this.browserContext && !this.browser) return
    if (this.browserContext) {
      await this.browserContext.close().catch(() => undefined)
      this.browserContext = null
    }
    if (this.browser) {
      await this.browser.close().catch(() => undefined)
      this.browser = null
    }
  }

  private async newPage(): Promise<Page> {
    await this.init()
    if (!this.browserContext) throw new Error('Monito browser context not initialized')
    return this.browserContext.newPage()
  }

  private buildMonitoUrl(corridor: CorridorConfig, amount: number): string {
    return `${this.options.config.monitoBaseUrl}/${corridor.fromCountry}/${corridor.toCountry}/${corridor.fromCurrency}/${corridor.toCurrency}/${amount}`
  }

  private parseSnapshot(payload: unknown, corridor: CorridorConfig, amount: number, timestamp: string): MonitoSnapshot {
    const comparison = findComparisonNode(payload)
    if (!comparison) {
      throw new Error('Unable to find compareTransfers payload in Monito response')
    }

    const comparisonId =
      getString(comparison, 'comparisonId', 'comparison_id', 'id')
      || (toObj(comparison.data) ? getString(comparison.data, 'comparisonId', 'comparison_id', 'id') : '')
      || null

    const midMarketRate =
      extractScalar(comparison, ['midMarketRate', 'mid_market_rate'])
      ?? extractScalarAtPath(comparison, ['midMarket', 'rate'])
      ?? extractScalarAtPath(comparison, ['data', 'midMarket', 'rate'])
      ?? extractScalarAtPath(comparison, ['midMarket', 'midRate'])
    const amountUSD =
      extractScalar(comparison, ['amountUSD', 'amountUsd', 'amount_usd'])
      ?? extractScalarAtPath(comparison, ['corridor', 'amountUSD'])
      ?? extractScalarAtPath(comparison, ['data', 'corridor', 'amountUSD'])
    const providerQuotes = normalizeProviderQuotes(comparison)

    if (providerQuotes.length === 0) {
      throw new Error('Monito payload parsed but no provider quotes found')
    }

    return {
      timestamp,
      corridor,
      amount,
      comparisonId,
      midMarketRate,
      amountUSD,
      providerQuotes,
      rawGraphql: payload,
    }
  }

  public async captureSnapshot(corridor: CorridorConfig, amount: number, timestamp: string, runId: string, rawArchiveDir?: string): Promise<MonitoSnapshot> {
    const page = await this.newPage()
    const timeoutMs = Math.min(this.options.config.timeoutMs, MAX_CAPTURE_MS)
    const targetUrl = this.buildMonitoUrl(corridor, amount)
    const captures: unknown[] = []

    const onResponse = async (response: import('playwright').Response) => {
      try {
        const request = response.request()
        const method = request.method().toUpperCase()
        if (method !== 'POST') return

        const url = request.url().toLowerCase()
        if (!url.includes('/api/v2') && !url.includes('/api')) return

        const postData = request.postData() ?? ''
        const hasGraphql = postData.toLowerCase().includes('comparetransfers') || postData.toLowerCase().includes('query')
        if (!hasGraphql) return

        const contentType = (response.headers()['content-type'] ?? '').toLowerCase()
        if (!contentType.includes('json') && !contentType.includes('javascript')) return

        const raw = await response.text()
        const parsed = JSON.parse(raw)

        if (!findComparisonNode(parsed)) return
        captures.push(parsed)
      } catch {
        // ignore malformed responses
      }
    }

    try {
      page.on('response', onResponse)
      await page.goto(targetUrl, { timeout: timeoutMs, waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => undefined)

      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        if (captures.length > 0) break
        await sleep(250)
      }

      if (captures.length === 0) {
        throw new Error('No Monito comparison payload captured')
      }

      const bestPayload =
        captures.find((payload) => {
          const node = findComparisonNode(payload)
          const quotes = node && toObj(node) ? node.providerQuotes : undefined
          return Array.isArray(quotes) && quotes.length > 0
        }) ?? captures[0]

      const snapshot = this.parseSnapshot(bestPayload, corridor, amount, timestamp)

      if (rawArchiveDir) {
        await ensureDirectory(rawArchiveDir)
        const archiveFile = path.join(
          rawArchiveDir,
          `monito-${runId}-${corridor.fromCurrency}-${corridor.toCurrency}-${amount}-${safeTimestampForFs(new Date(timestamp))}.json`,
        )
        await fs.writeFile(archiveFile, JSON.stringify(snapshot.rawGraphql, null, 2), 'utf8')
        snapshot.rawGraphqlArchivePath = archiveFile
      }

      return snapshot
    } finally {
      page.off('response', onResponse)
      await page.close().catch(() => undefined)
    }
  }

  public async captureSnapshotWithRetry(
    corridor: CorridorConfig,
    amount: number,
    runId: string,
    rawArchiveDir?: string,
    maxRetries = 3,
    baseDelayMs = 500,
  ): Promise<MonitoSnapshot> {
    const timestamp = new Date().toISOString()
    return withBackoff(
      () => this.captureSnapshot(corridor, amount, timestamp, runId, rawArchiveDir),
      {
        maxRetries,
        baseDelayMs,
        label: `Monito ${corridor.fromCurrency}-${corridor.toCurrency}-${amount}`,
      },
    )
  }
}

const ensureDirectory = async (directory: string): Promise<void> => {
  await fs.mkdir(directory, { recursive: true })
}

export const mapMonitoSnapshotToRows = (
  snapshot: MonitoSnapshot,
  runId: string,
  rawGraphqlJsonPath: string | null,
  monitoStatus = 'ok',
  monitoError: string | null = null,
): SnapshotCsvRow[] => {
  const baseRow: Omit<SnapshotCsvRow, 'provider_slug' | 'provider_name' | 'monito_rate' | 'monito_fee' | 'monito_total_received' | 'monito_rank' | 'monito_is_best'> = {
    run_id: runId,
    timestamp: snapshot.timestamp,
    from_country: snapshot.corridor.fromCountry,
    to_country: snapshot.corridor.toCountry,
    from_currency: snapshot.corridor.fromCurrency,
    to_currency: snapshot.corridor.toCurrency,
    amount: snapshot.amount,
    comparison_id: snapshot.comparisonId,
    mid_market_rate: snapshot.midMarketRate,
    amount_usd: snapshot.amountUSD,
    monito_method: 'monito',
    monito_status: monitoStatus,
    monito_error: monitoError,
    raw_graphql_json_path: rawGraphqlJsonPath,
  }

  if (!snapshot.providerQuotes.length) {
    return [
      {
        ...baseRow,
        provider_slug: 'none',
        provider_name: 'none',
        monito_rate: null,
        monito_fee: null,
        monito_total_received: null,
        monito_rank: null,
        monito_is_best: false,
      },
    ]
  }

  return snapshot.providerQuotes.map((provider, index) => ({
    ...baseRow,
    provider_slug: provider.pspSlug,
    provider_name: provider.pspName,
    monito_rate: provider.rate,
    monito_fee: provider.fee,
    monito_total_received: provider.totalReceived,
    monito_rank: provider.rank ?? index + 1,
    monito_is_best: provider.isBest,
  }))
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
