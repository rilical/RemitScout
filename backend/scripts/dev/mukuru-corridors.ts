/**
 * Dev-only utility to generate Mukuru supported corridors.
 *
 * It discovers source countries from the mobile pricecheck page,
 * fetches recipient countries per brand, then expands to product-based
 * destination currencies using the get_products endpoint.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = 'https://mobile.mukuru.com'
const PRICECHECK_PATH = `${BASE_URL}/mobi/pricecheck`

type RecipientResponse = {
  status?: string
  data?: Record<string, { currency_market_iso?: string }>
}

type Product = {
  id: number
  title: string
  iso: string
}

type ProductsResponse = {
  status?: string
  data?: Product[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const defaultHeaders = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15',
}

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: defaultHeaders })
  return response.text()
}

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const response = await fetch(url, { headers: defaultHeaders })
  const text = await response.text()
  if (!response.ok) {
    console.warn(`Non-200 response for ${url}: ${response.status}`)
    return null
  }
  try {
    return JSON.parse(text) as T
  } catch {
    console.warn(`Non-JSON response for ${url}`)
    return null
  }
}

const parseFromCountries = (html: string): string[] => {
  const matches = Array.from(html.matchAll(/<option value=\"([A-Z]{2})\"/g))
  const codes = matches.map(match => match[1]).filter(Boolean)
  return Array.from(new Set(codes))
}

const parseInputValue = (html: string, name: string): string | null => {
  const regex = new RegExp(`name=\"${name}\" value=\"([^\"]+)\"`)
  return html.match(regex)?.[1] ?? null
}

const parseBrandId = (html: string): string | null => {
  const match = html.match(/brand_id=(\d+)/)
  return match?.[1] ?? null
}

const normalizeSourceCode = (code: string): string => {
  if (code === 'AA') return 'US'
  return code
}

const main = async () => {
  const seedHtml = await fetchText(`${PRICECHECK_PATH}?country_shortcode=ZA&destination_country_shortcode=ZW&iframe=1`)
  const sourceCountries = parseFromCountries(seedHtml)

  const corridors = new Set<string>()
  const sourceCurrencyMap: Record<string, string> = {}

  for (const source of sourceCountries) {
    const pageUrl = `${PRICECHECK_PATH}?country_shortcode=${source}&destination_country_shortcode=ZW&iframe=1`
    const html = await fetchText(pageUrl)
    const brandId = parseBrandId(html)
    const sourceCurrency = parseInputValue(html, 'from_currency_iso') ?? 'USD'
    const normalizedSource = normalizeSourceCode(source)
    sourceCurrencyMap[normalizedSource] = sourceCurrency

    if (!brandId) {
      continue
    }

    const recipientsUrl = `${BASE_URL}/pricechecker/get_recipient_countries?brand_id=${brandId}&sales_channel=mobi`
    const recipients = await fetchJson<RecipientResponse>(recipientsUrl)
    const recipientCodes = recipients?.data ? Object.keys(recipients.data) : []

    for (const dest of recipientCodes) {
      const productsUrl = `${BASE_URL}/pricechecker/get_products?from_country=${source}&to_country=${dest}`
      const productsResponse = await fetchJson<ProductsResponse>(productsUrl)
      const products = Array.isArray(productsResponse?.data) ? productsResponse.data : []
      for (const product of products) {
        const destCurrency = product.iso?.toUpperCase()
        if (!destCurrency) continue
        corridors.add(`${normalizedSource}-${dest}-${sourceCurrency}-${destCurrency}`)
      }
      await sleep(120)
    }
  }

  const sorted = Array.from(corridors).sort()
  const output = [
    'export const MUKURU_SUPPORTED_CORRIDORS = ' + JSON.stringify(sorted, null, 2) + ' as const',
    'export const MUKURU_B2B_CORRIDORS: string[] = [...MUKURU_SUPPORTED_CORRIDORS]',
    '',
  ].join('\n')

  const outputPath = path.join(
    process.cwd(),
    'plane-b',
    'src',
    'providers',
    'mukuru',
    'supported-corridors.ts',
  )
  await writeFile(outputPath, output)
  console.log(`Wrote ${sorted.length} corridors to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
