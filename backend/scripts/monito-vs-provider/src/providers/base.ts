import type { Page } from 'playwright'

import type { CollectorMethod, CorridorConfig, ProviderConfig, ProviderSnapshot } from '../schema'
import { parseBoolean, parseNumber, replacePlaceholders, sleep, withBackoff } from '../utils'

export type ProviderCollectorResult = {
  effectiveRate: number | null
  fee: number | null
  totalReceived: number | null
  payoutMethod: string | null
  deliveryEstimate: string | null
  raw: unknown
}

export interface ProviderCollectorContext {
  config: ProviderConfig
  corridor: CorridorConfig
  amount: number
  timestamp: string
  runId: string
}

const flattenForParser = (value: unknown, out: Array<Record<string, unknown>> = [], maxDepth = 8): Array<Record<string, unknown>> => {
  if (maxDepth < 0 || value === null || value === undefined) return out
  if (Array.isArray(value)) {
    for (const item of value) {
      flattenForParser(item, out, maxDepth - 1)
    }
    return out
  }

  if (typeof value !== 'object') return out
  out.push(value as Record<string, unknown>)

  for (const child of Object.values(value as Record<string, unknown>)) {
    flattenForParser(child, out, maxDepth - 1)
  }

  return out
}

const pickBestApiValue = (payload: unknown): ProviderCollectorResult => {
  const nodes = flattenForParser(payload)

  const directMatch = nodes.find((node) => {
    const hasNumeric =
      parseNumber(node.rate) !== null || parseNumber(node.totalReceived) !== null || parseNumber(node.fee) !== null
    return hasNumeric && (node.totalReceived !== undefined || node.fee !== undefined || node.rate !== undefined)
  })

  const source = directMatch ?? nodes.find((node) => parseNumber(node.value) !== null) ?? {}

  const rate = parseNumber(
    source.rate
    || source.exchangeRate
    || source.fxRate
    || source.midMarketRate
    || source.mid_rate,
  )

  const fee = parseNumber(
    source.fee
    || source.totalFee
    || source.feeAmount
    || source.commission
    || source.fee?.total
    || source.fees,
  )

  const totalReceived = parseNumber(
    source.totalReceived
    || source.receivedAmount
    || source.receiveAmount
    || source.payoutAmount
    || source.targetAmount
    || source.amount,
  )

  const payoutMethod =
    typeof source.payoutMethod === 'string' ? source.payoutMethod : typeof source.method === 'string' ? source.method : null

  const deliveryEstimate =
    typeof source.deliveryEstimate === 'string'
      ? source.deliveryEstimate
      : source.transferTime && typeof source.transferTime === 'object'
        ? (() => {
          const transfer = source.transferTime as Record<string, unknown>
          const min = transfer.min ? String(transfer.min) : ''
          const max = transfer.max ? String(transfer.max) : ''
          return min || max ? [min, max].filter(Boolean).join('-') : null
        })()
        : null

  return {
    effectiveRate: rate,
    fee,
    totalReceived,
    payoutMethod,
    deliveryEstimate,
    raw: payload,
  }
}

const isLikelyResult = (result: ProviderCollectorResult): boolean => {
  return (
    result.effectiveRate !== null
    || result.totalReceived !== null
    || result.fee !== null
  )
}

export const collectWithApi = async (
  context: ProviderCollectorContext,
  parseResponse: (payload: unknown, context: ProviderCollectorContext) => ProviderCollectorResult,
): Promise<ProviderSnapshot> => {
  const { config, corridor, amount, timestamp, runId } = context
  const cfg = config.api

  if (!cfg.enabled) {
    throw new Error(`API disabled for ${config.slug}`)
  }
  if (!cfg.endpoint) {
    throw new Error(`API endpoint missing for ${config.slug}`)
  }

  const vars = {
    fromCountry: corridor.fromCountry,
    toCountry: corridor.toCountry,
    fromCurrency: corridor.fromCurrency,
    toCurrency: corridor.toCurrency,
    amount,
    runId,
  }

  const endpoint = replacePlaceholders(cfg.endpoint, vars)
  const url = new URL(endpoint)

  if (cfg.method === 'GET') {
    for (const [key, value] of Object.entries(cfg.queryParams)) {
      url.searchParams.set(key, replacePlaceholders(String(value), vars))
    }
  }

  const body = cfg.bodyTemplate
    ? replacePlaceholders(cfg.bodyTemplate, vars)
    : undefined

  const timeoutMs = cfg.timeoutMs ?? config.timeoutMs ?? 30_000
  const headers: Record<string, string> = {}

  for (const [key, value] of Object.entries(cfg.headers)) {
    headers[key] = replacePlaceholders(String(value), vars)
  }

  const response = await withBackoff(
    async () => {
      const req = await fetch(url.toString(), {
        method: cfg.method ?? 'GET',
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!req.ok) {
        throw new Error(`HTTP ${req.status} ${req.statusText}`)
      }

      const text = await req.text()
      const payload = text ? JSON.parse(text) : null
      const parsed = parseResponse(payload, context)
      if (!isLikelyResult(parsed)) {
        throw new Error('No usable quote fields in API payload')
      }

      return { payload, parsed }
    },
    {
      maxRetries: config.maxRetries ?? 2,
      baseDelayMs: 500,
      label: `${config.slug}-api`,
    },
  )

  const parsed = response.parsed

  return {
    timestamp,
    providerSlug: config.slug,
    providerLabel: config.label,
    amount,
    fromCurrency: corridor.fromCurrency,
    toCurrency: corridor.toCurrency,
    corridorFromCountry: corridor.fromCountry,
    corridorToCountry: corridor.toCountry,
    effectiveRate: parsed.effectiveRate,
    fee: parsed.fee,
    totalReceived: parsed.totalReceived,
    payoutMethod: parsed.payoutMethod,
    deliveryEstimate: parsed.deliveryEstimate,
    raw: parsed.raw,
    method: 'api',
  }
}

export const collectWithScrape = async (
  context: ProviderCollectorContext,
  collectFn: (ctx: ProviderCollectorContext, page: Page) => Promise<ProviderCollectorResult>,
  createPage: () => Promise<Page>,
  closePage: (page: Page) => Promise<void>,
): Promise<ProviderSnapshot> => {
  const { config, corridor, amount, timestamp } = context

  if (!config.scrape.enabled) {
    throw new Error(`Scrape disabled for ${config.slug}`)
  }

  if (!config.scrape.urlTemplate) {
    throw new Error(`Scrape URL template missing for ${config.slug}`)
  }

  const page = await createPage()
  try {
    const vars = {
      fromCountry: corridor.fromCountry,
      toCountry: corridor.toCountry,
      fromCurrency: corridor.fromCurrency,
      toCurrency: corridor.toCurrency,
      amount,
    }
    const targetUrl = replacePlaceholders(config.scrape.urlTemplate, vars)

    await withBackoff(
      async () => {
        await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: config.scrape.timeoutMs ?? config.timeoutMs ?? 20_000,
        })

        if (config.scrape.waitFor) {
          await page.waitForSelector(config.scrape.waitFor, { timeout: config.scrape.timeoutMs ?? 10_000 })
        }
      },
      { maxRetries: 1, baseDelayMs: 250, label: `${config.slug}-navigation` },
    )

    const parsed = await collectFn(context, page)
    if (parsed.effectiveRate === null && parsed.totalReceived === null && parsed.fee === null) {
      throw new Error('Parsed scrape payload was empty')
    }

    return {
      timestamp,
      providerSlug: config.slug,
      providerLabel: config.label,
      amount,
      fromCurrency: corridor.fromCurrency,
      toCurrency: corridor.toCurrency,
      corridorFromCountry: corridor.fromCountry,
      corridorToCountry: corridor.toCountry,
      effectiveRate: parsed.effectiveRate,
      fee: parsed.fee,
      totalReceived: parsed.totalReceived,
      payoutMethod: parsed.payoutMethod,
      deliveryEstimate: parsed.deliveryEstimate,
      raw: parsed.raw,
      method: 'scrape',
    }
  } finally {
    await closePage(page)
  }
}

export const collectGenericApi = async (context: ProviderCollectorContext): Promise<ProviderSnapshot> => {
  return collectWithApi(context, pickBestApiValue)
}

export const extractTextValue = async (page: Page, selectors: string[], fallback = ''): Promise<string> => {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector)
      if (!element) continue
      const text = (await element.innerText())?.trim()
      if (text) return text
    } catch {
      continue
    }
  }
  return fallback
}

export const normalizeAmountString = (value: string): string => value.replace(/[^0-9.\-]/g, '').trim()

export const parseRateFromText = (value: string): number | null => {
  const parsed = parseNumber(normalizeAmountString(value))
  return parsed
}

export const detectMethodFromText = (text: string | null): string | null => {
  if (!text) return null
  const parsed = parseBoolean(text)
  return parsed !== null ? (parsed ? 'api' : 'scrape') : null
}
