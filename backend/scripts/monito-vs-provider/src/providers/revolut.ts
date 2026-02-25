import type { Page } from 'playwright'

import type { ProviderCollectorContext, ProviderCollectorResult } from './base'
import { extractTextValue, parseRateFromText } from './base'

const parseCurrencyValue = (text: string | null): number | null => {
  if (!text) return null
  return parseRateFromText(text)
}

const pickBestText = async (page: Page, selectors: string[] | undefined, fallbackSelectors: string[]): Promise<string> => {
  if (selectors?.length) {
    const value = await extractTextValue(page, selectors)
    if (value) return value
  }

  return extractTextValue(page, fallbackSelectors)
}

export const collectRevolutScrape = async (
  context: ProviderCollectorContext,
  page: Page,
): Promise<ProviderCollectorResult> => {
  const selectors = context.config.scrape.selectors
  const rateText = await pickBestText(
    page,
    selectors?.rateSelectors,
    ['[data-testid="exchange-rate"]', '.rate', '[data-role="rate"]'],
  )
  const feeText = await pickBestText(
    page,
    selectors?.feeSelectors,
    ['[data-testid="fee"]', '.fee', '[data-role="fee"]'],
  )
  const totalText = await pickBestText(
    page,
    selectors?.totalSelectors,
    ['[data-testid="total"]', '.total', '[data-role="total"]'],
  )
  const payoutMethodText = await pickBestText(
    page,
    selectors?.payoutMethodSelectors,
    ['[data-testid="payout-method"]', '.method'],
  )

  return {
    effectiveRate: parseCurrencyValue(rateText),
    fee: parseCurrencyValue(feeText),
    totalReceived: parseCurrencyValue(totalText),
    payoutMethod: payoutMethodText || null,
    deliveryEstimate: null,
    raw: {
      rateText,
      feeText,
      totalText,
      payoutMethodText,
      url: page.url(),
    },
  }
}
