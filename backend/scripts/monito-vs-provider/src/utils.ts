import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'

import type { CanonicalProviderIdentity } from './schema'

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const safeTimestampForFs = (value = new Date()): string => {
  return value.toISOString().replace(/[:.]/g, '-')
}

export const toSortedUniqueAmounts = (values: Array<number | string>): number[] => {
  const parsed = values
    .map((value) => Number(value))
    .filter((value): value is number => Number.isFinite(value) && value > 0)

  return [...new Set(parsed.map((value) => Math.round(value * 1000) / 1000))].sort((a, b) => a - b)
}

export const parsePositiveNumberList = (value?: string): number[] => {
  if (!value) return []
  return toSortedUniqueAmounts(value.split(',').map((entry) => entry.trim()).filter(Boolean))
}

export const parseCorridorArg = (value: string): {
  fromCountry: string
  toCountry: string
  fromCurrency: string
  toCurrency: string
} => {
  const [fromCountry, toCountry, fromCurrency, toCurrency] = value
    .split('-')
    .map((entry) => entry.trim().toLowerCase())

  if (!fromCountry || !toCountry || !fromCurrency || !toCurrency) {
    throw new Error(`Invalid corridor format: ${value}. Expected fromCountry-toCountry-fromCurrency-toCurrency`)
  }

  return { fromCountry, toCountry, fromCurrency, toCurrency }
}

export const replacePlaceholders = <T extends Record<string, string | number>>(
  template: string,
  vars: T,
): string =>
  template.replace(/\{([^}]+)\}/g, (_match, key) => {
    const value = vars[key as keyof T]
    return value === undefined ? _match : String(value)
  })

export const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'bigint') return Number(value)

  const normalized = String(value)
    .replace(/,/g, '')
    .replace(/[^0-9.\-]/g, '')

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const parseBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value !== 'string') return null

  const normalized = value.toLowerCase().trim()
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  return null
}

export const ensureDirectory = async (directory: string): Promise<void> => {
  await fsp.mkdir(directory, { recursive: true })
}

export const detectRepoRoot = (startDir: string): string => {
  let current = path.resolve(startDir)

  for (let depth = 0; depth < 12; depth += 1) {
    const catalog = path.join(current, '.remit-scout/providers/catalog.json')
    const defs = path.join(current, 'backend/plane-b/src/providers/provider-definitions.ts')
    if (fs.existsSync(catalog) && fs.existsSync(defs)) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) {
      break
    }

    current = parent
  }

  return path.resolve(startDir, '..')
}

const readText = async (filePath: string): Promise<string> => {
  return await fsp.readFile(filePath, 'utf8')
}

export const loadCanonicalProviderCatalog = async (repoRoot: string): Promise<CanonicalProviderIdentity[]> => {
  const catalogPath = path.join(repoRoot, '.remit-scout/providers/catalog.json')
  const defsPath = path.join(repoRoot, 'backend/plane-b/src/providers/provider-definitions.ts')

  const source = await readText(catalogPath).catch(() => '{"providers":[]}')
  const catalogParsed = JSON.parse(source) as {
    providers: Array<{ provider_id?: string; providerId?: string; display_name?: string; displayName?: string; supports_b2b?: boolean; supports_b2c?: boolean }>
  }

  const catalog = new Map<string, CanonicalProviderIdentity>()
  for (const provider of catalogParsed.providers || []) {
    const slug = (provider.provider_id ?? provider.providerId ?? '').trim().toLowerCase()
    if (!slug) continue
    catalog.set(slug, {
      slug,
      label: provider.display_name ?? provider.displayName ?? slug,
      supportsB2b: provider.supports_b2b ?? false,
      supportsB2c: provider.supports_b2c ?? false,
    })
  }

  const defsSource = await readText(defsPath).catch(() => '')
  const providerPairPattern = /providerId:\s*['\"]([\w-]+)['\"]\s*,\s*\n\s*displayName:\s*['\"]([^'\"]+)['\"]/g
  const defsMap = new Map<string, string>()
  let match = providerPairPattern.exec(defsSource)

  while (match) {
    const slug = String(match[1] ?? '').toLowerCase().trim()
    const label = String(match[2] ?? '').trim()
    if (slug) {
      defsMap.set(slug, label || slug)
    }
    match = providerPairPattern.exec(defsSource)
  }

  const fromDefs = new Set<string>(defsMap.keys())
  const result: CanonicalProviderIdentity[] = []

  for (const slug of fromDefs) {
    const existing = catalog.get(slug)
    result.push(
      existing ?? {
        slug,
        label: defsMap.get(slug) ?? slug,
        supportsB2b: true,
        supportsB2c: true,
      },
    )
  }

  for (const [slug, identity] of catalog.entries()) {
    if (!fromDefs.has(slug)) {
      result.push(identity)
    }
  }

  return result
}

export const fileNameSafe = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')

export const buildCsvLine = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? '1' : '0'
  const asString = typeof value === 'string' ? value : String(value)
  if (asString.includes('"') || asString.includes(',') || asString.includes('\n')) {
    return `"${asString.replace(/"/g, '""')}"`
  }
  return asString
}

export const ensureCsvHeader = async (filePath: string, columns: string[]): Promise<void> => {
  try {
    await fsp.access(filePath)
    return
  } catch {
    const line = columns.map((entry) => buildCsvLine(entry)).join(',')
    await fsp.writeFile(filePath, `${line}\n`, 'utf8')
  }
}

export const appendCsvRows = async (
  filePath: string,
  rows: Array<Record<string, string | number | boolean | null>>,
  columns: readonly string[],
): Promise<void> => {
  if (!rows.length) return

  const lines = rows.map((row) => columns.map((column) => buildCsvLine(row[column] as string | number | boolean | null)).join(','))
  await fsp.appendFile(filePath, `${lines.join('\n')}\n`, 'utf8')
}

export const exists = (pathToCheck: string): boolean => {
  return fs.existsSync(pathToCheck)
}

export const withBackoff = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number
    baseDelayMs: number
    maxDelayMs?: number
    jitterMs?: number
    label?: string
  },
): Promise<T> => {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs = 30_000,
    jitterMs = 250,
    label = 'operation',
  } = options

  let attempt = 0
  let delay = baseDelayMs
  let lastError: unknown

  while (attempt <= maxRetries) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      attempt += 1
      if (attempt > maxRetries) break
      const jitter = Math.floor(Math.random() * jitterMs)
      const waitMs = Math.min(delay, maxDelayMs) + jitter
      delay = Math.max(delay * 2, 250)
      console.warn(`Retrying ${label} after ${waitMs}ms (attempt ${attempt} of ${maxRetries})`)
      await sleep(waitMs)
    }
  }

  if (lastError instanceof Error) throw lastError
  throw new Error(`Operation failed: ${String(lastError)}`)
}
