import type { Browser, BrowserContext, Page } from 'playwright'
import { chromium } from 'playwright'

import type { ProviderConfig, ProviderSnapshot } from '../schema'
import { collectGenericApi, collectWithApi, collectWithScrape } from './base'
import { replacePlaceholders } from '../utils'
import type { ProviderCollectorContext } from './base'
import { collectWiseApi } from './wise'
import { collectRevolutScrape } from './revolut'
import { extractTextValue, parseRateFromText } from './base'

interface ScrapeRuntime {
  browser: Browser
  context: BrowserContext
  headless: boolean
}

type BrowserFn = () => Promise<Page>
type ClosePageFn = (page: Page) => Promise<void>

type ProviderScrapeCollector = (context: ProviderCollectorContext, page: Page) => Promise<{
  effectiveRate: number | null
  fee: number | null
  totalReceived: number | null
  payoutMethod: string | null
  deliveryEstimate: string | null
  raw: unknown
}>

let scrapeRuntime: ScrapeRuntime | null = null

const getScrapeRuntime = async (headless: boolean): Promise<ScrapeRuntime> => {
  if (scrapeRuntime && scrapeRuntime.headless === headless) return scrapeRuntime

  if (scrapeRuntime) {
    await scrapeRuntime.context.close().catch(() => undefined)
    await scrapeRuntime.browser.close().catch(() => undefined)
  }

  const browser = await chromium.launch({
    headless,
    args: ['--no-sandbox'],
  })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  })

  scrapeRuntime = { browser, context, headless }
  return scrapeRuntime
}

const getScrapePage = async (headless: boolean): Promise<Page> => {
  const runtime = await getScrapeRuntime(headless)
  return runtime.context.newPage()
}

const closeScrapePage = async (page: Page): Promise<void> => {
  await page.close().catch(() => undefined)
}

export const closeProvidersRuntime = async (): Promise<void> => {
  if (!scrapeRuntime) return
  await scrapeRuntime.context.close().catch(() => undefined)
  await scrapeRuntime.browser.close().catch(() => undefined)
  scrapeRuntime = null
}

const collectFromScrapeWithSelectors = async (
  context: ProviderCollectorContext,
  page: Page,
): Promise<ReturnType<ProviderScrapeCollector>> => {
  const selectors = context.config.scrape.selectors

  const [rateText, feeText, totalText, payoutMethodText, fromAmount, fromCurrency, toCurrency] = await Promise.all([
    extractTextValue(page, selectors?.rateSelectors || []),
    extractTextValue(page, selectors?.feeSelectors || []),
    extractTextValue(page, selectors?.totalSelectors || []),
    extractTextValue(page, selectors?.payoutMethodSelectors || []),
    extractTextValue(page, selectors?.amountInput ? [selectors.amountInput] : []),
    extractTextValue(page, selectors?.fromCurrencyInput ? [selectors.fromCurrencyInput] : []),
    extractTextValue(page, selectors?.toCurrencyInput ? [selectors.toCurrencyInput] : []),
  ])

  return {
    effectiveRate: parseRateFromText(rateText),
    fee: parseRateFromText(feeText),
    totalReceived: parseRateFromText(totalText),
    payoutMethod: payoutMethodText || null,
    deliveryEstimate: null,
    raw: {
      rateText,
      feeText,
      totalText,
      payoutMethodText,
      amountInputText: fromAmount,
      fromCurrencyInputText: fromCurrency,
      toCurrencyInputText: toCurrency,
      url: page.url(),
    },
  }
}

const providerApiModules: Record<string, (context: ProviderCollectorContext) => Promise<ProviderSnapshot>> = {
  wise: collectWiseApi,
}

const providerScrapeModules: Record<string, ProviderScrapeCollector> = {
  revolut: collectRevolutScrape,
}

const fillInputIfPresent = async (
  page: Page,
  selector: string | undefined,
  value: string,
): Promise<void> => {
  if (!selector) return
  const input = await page.$(selector)
  if (!input) return

  await input.fill('').catch(() => undefined)
  await input.fill(value).catch(() => undefined)
}

const applyScrapeInputs = async (context: ProviderCollectorContext, page: Page): Promise<void> => {
  const selectors = context.config.scrape.selectors
  if (!selectors) return

  await fillInputIfPresent(page, selectors.amountInput, String(context.amount))
  await fillInputIfPresent(page, selectors.fromCurrencyInput, context.corridor.fromCurrency.toUpperCase())
  await fillInputIfPresent(page, selectors.toCurrencyInput, context.corridor.toCurrency.toUpperCase())
  await fillInputIfPresent(page, selectors.fromCountryInput, context.corridor.fromCountry.toUpperCase())
  await fillInputIfPresent(page, selectors.toCountryInput, context.corridor.toCountry.toUpperCase())

  if (selectors.triggerButton) {
    await page.click(selectors.triggerButton).catch(() => undefined)
  }
}

const parsePlaceholderUrl = async (context: ProviderCollectorContext): Promise<string> => {
  return replacePlaceholders(context.config.scrape.urlTemplate ?? '', {
    fromCountry: context.corridor.fromCountry,
    toCountry: context.corridor.toCountry,
    fromCurrency: context.corridor.fromCurrency,
    toCurrency: context.corridor.toCurrency,
    amount: context.amount,
  })
}

export const collectProviderSnapshot = async (
  config: ProviderConfig,
  corridor: { fromCountry: string; toCountry: string; fromCurrency: string; toCurrency: string },
  amount: number,
  timestamp: string,
  runId: string,
  headlessBrowser: boolean,
): Promise<ProviderSnapshot> => {
  const context: ProviderCollectorContext = {
    config,
    corridor,
    amount,
    timestamp,
    runId,
  }

  if (config.method === 'api') {
    const apiCollector = providerApiModules[config.slug]
    if (apiCollector) {
      return apiCollector(context)
    }

    if (config.api.enabled) {
      return collectGenericApi(context)
    }

    throw new Error(`No API config for ${config.slug}`)
  }

  const parser = providerScrapeModules[config.slug] ?? collectFromScrapeWithSelectors
  const createPage: BrowserFn = async () => {
    const page = await getScrapePage(headlessBrowser)
    const targetUrl = await parsePlaceholderUrl(context)
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.scrape.timeoutMs ?? config.timeoutMs ?? 20_000,
    })
    if (config.scrape.waitFor) {
      await page.waitForSelector(config.scrape.waitFor, { timeout: config.scrape.timeoutMs ?? 10_000 }).catch(() => undefined)
    }
    await applyScrapeInputs(context, page)
    await page.waitForLoadState('networkidle').catch(() => undefined)
    return page
  }

  const closePage: ClosePageFn = async (page) => {
    await closeScrapePage(page)
  }

  return collectWithScrape(context, parser, createPage, closePage)
}

// Keep backward-compatible alias for provider modules that expect direct api helper reuse.
export { collectGenericApi, collectWithApi }

export default collectProviderSnapshot
