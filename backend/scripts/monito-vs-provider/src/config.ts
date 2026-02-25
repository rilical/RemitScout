import type { CollectorMethod, OrchestratorRunConfig, ProviderConfig } from './schema'

export const DEFAULT_CONFIG: OrchestratorRunConfig = {
  monitoBaseUrl: 'https://www.monito.com/en/compare/transfer',
  corridor: {
    fromCountry: 'ch',
    toCountry: 'sg',
    fromCurrency: 'chf',
    toCurrency: 'sgd',
  },
  amounts: [100, 123, 250, 499, 500, 501, 750, 1000, 1003],
  intervalSeconds: 60,
  runDurationMinutes: 30,
  providers: [],
  maxConcurrency: 6,
  monitoTimeoutMs: 45000,
  providerRetryCount: 3,
  headlessBrowser: true,
  outputDir: 'backend/scripts/monito-vs-provider/data',
  dataMatchWindowSeconds: 90,
  topNProviders: null,
}

const buildProviderConfig = (
  slug: string,
  label: string,
  method: CollectorMethod,
  options: {
    enabled?: boolean
    api?: Partial<ProviderConfig['api']>
    scrape?: Partial<ProviderConfig['scrape']>
    maxRetries?: number
    timeoutMs?: number
    source?: 'catalog' | 'discovery'
  } = {},
): ProviderConfig => ({
  slug,
  label,
  enabled: options.enabled ?? false,
  method,
  api: {
    enabled: options.api?.enabled ?? true,
    endpoint: options.api?.endpoint ?? null,
    headers: options.api?.headers ?? {},
    queryParams: options.api?.queryParams ?? {},
    method: options.api?.method ?? 'GET',
    timeoutMs: options.api?.timeoutMs,
    bodyTemplate: options.api?.bodyTemplate ?? null,
  },
  scrape: {
    enabled: options.scrape?.enabled ?? false,
    urlTemplate: options.scrape?.urlTemplate ?? null,
    waitFor: options.scrape?.waitFor,
    selectors: options.scrape?.selectors,
    timeoutMs: options.scrape?.timeoutMs,
  },
  maxRetries: options.maxRetries,
  timeoutMs: options.timeoutMs,
  source: options.source,
})

export const createProviderConfig = (
  slug: string,
  label: string,
  options: {
    enabled?: boolean
    method?: CollectorMethod
    api?: Partial<ProviderConfig['api']>
    scrape?: Partial<ProviderConfig['scrape']>
    maxRetries?: number
    timeoutMs?: number
    source?: 'catalog' | 'discovery'
  } = {},
): ProviderConfig =>
  buildProviderConfig(
    slug,
    label,
    options.method ?? 'api',
    {
      enabled: options.enabled,
      api: options.api,
      scrape: options.scrape,
      maxRetries: options.maxRetries,
      timeoutMs: options.timeoutMs,
      source: options.source,
    },
  )

export const PRECONFIGURED_PROVIDERS: ProviderConfig[] = [
  createProviderConfig('wise', 'Wise', {
    method: 'api',
    source: 'catalog',
    api: {
      enabled: true,
      endpoint: 'https://wise.com/gateway/v3/quotes',
      method: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        referer: 'https://wise.com/',
        origin: 'https://wise.com',
      },
      bodyTemplate: JSON.stringify({
        sourceCurrency: '{fromCurrency}',
        targetCurrency: '{toCurrency}',
        sourceAmount: '{amount}',
        profile: 'personal',
        targetAmount: null,
        rateType: 'FIXED',
        sourceCountry: '{fromCountry}',
        targetCountry: '{toCountry}',
      }),
    },
  }),
  createProviderConfig('revolut', 'Revolut', {
    method: 'scrape',
    source: 'discovery',
    scrape: {
      enabled: true,
      urlTemplate: 'https://www.revolut.com/en-SE/money-transfer/compare?amount={amount}&currency={fromCurrency}_{toCurrency}',
      waitFor: '[data-testid="price"]',
      selectors: {
        amountInput: '[data-testid="amount-input"]',
        fromCurrencyInput: '[data-testid="from-currency"]',
        toCurrencyInput: '[data-testid="to-currency"]',
        rateSelectors: ['[data-testid="rate"]', '[data-testid="exchange-rate"]'],
        feeSelectors: ['[data-testid="fee"]'],
        totalSelectors: ['[data-testid="total-to-receive"], [data-testid="receive-amount"]'],
        payoutMethodSelectors: ['[data-testid="payout-method"]'],
      },
    },
  }),
]
