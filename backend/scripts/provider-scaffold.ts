import fs from 'node:fs'
import path from 'node:path'

type ProbeConfig = {
  aws_scheduled: boolean
  github_actions: boolean
  aws_cdk_id?: string
}

type ProviderCatalogEntry = {
  provider_id: string
  display_name: string
  supports_b2b: boolean
  supports_b2c: boolean
  health_corridors: string[]
  probe?: ProbeConfig
}

type ProviderCatalog = {
  version: number
  providers: ProviderCatalogEntry[]
}

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')
const writeUtf8 = (p: string, value: string) => fs.writeFileSync(p, value, 'utf8')

const findRepoRoot = (): string => {
  let dir = process.cwd()
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, '.remit-scout'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(process.cwd(), '..')
}

const parseArgs = (): Record<string, string> => {
  const out: Record<string, string> = {}
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '1'
    out[key] = value
    if (value !== '1' || (args[i + 1] && !args[i + 1].startsWith('--'))) i += 1
  }
  return out
}

const must = (args: Record<string, string>, key: string): string => {
  const value = String(args[key] || '').trim()
  if (!value) throw new Error(`Missing --${key}`)
  return value
}

const toBool01 = (raw: string): boolean => {
  const token = String(raw || '').trim().toLowerCase()
  return token === '1' || token === 'true' || token === 'yes' || token === 'y'
}

const normalizeProviderId = (raw: string): string => {
  const id = String(raw || '').trim().toLowerCase()
  if (!id || !/^[a-z0-9]+$/.test(id)) {
    throw new Error(`Invalid provider_id '${raw}'. Expected lowercase [a-z0-9]+`)
  }
  return id
}

const upperEnvPrefix = (providerId: string) => `PLANE_B_${providerId.toUpperCase()}`

const upsertProviderCatalog = (repoRoot: string, entry: ProviderCatalogEntry) => {
  const catalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')
  const parsed = JSON.parse(readUtf8(catalogPath)) as ProviderCatalog
  const providers = Array.isArray(parsed.providers) ? parsed.providers : []
  if (providers.some((p) => p.provider_id === entry.provider_id)) {
    throw new Error(`Provider already exists in catalog: ${entry.provider_id}`)
  }
  const next = [...providers, entry].sort((a, b) => a.provider_id.localeCompare(b.provider_id))
  const out: ProviderCatalog = { version: Number(parsed.version) || 1, providers: next }
  writeUtf8(catalogPath, JSON.stringify(out, null, 2) + '\n')
}

const patchProviderCatalogTs = (repoRoot: string, providerId: string) => {
  const filePath = path.join(repoRoot, 'backend', 'shared', 'provider-catalog.ts')
  const content = readUtf8(filePath)

  const unionStart = content.indexOf('export type ProviderId =')
  if (unionStart < 0) throw new Error(`provider-catalog.ts missing ProviderId union: ${filePath}`)
  const unionEnd = content.indexOf('\n\n', unionStart)
  if (unionEnd < 0) throw new Error(`provider-catalog.ts ProviderId union parse failed: ${filePath}`)

  const unionBlock = content.slice(unionStart, unionEnd)
  const unionIds = Array.from(unionBlock.matchAll(/\|\s*'([^']+)'/g)).map((m) => m[1])
  if (unionIds.includes(providerId)) throw new Error(`provider-catalog.ts already contains ProviderId '${providerId}'`)
  const nextUnion = [...unionIds, providerId].sort()
  const newUnionBlock =
    `export type ProviderId =\n` +
    nextUnion.map((id) => `  | '${id}'`).join('\n') +
    `\n`

  const afterUnion =
    content.slice(0, unionStart) +
    newUnionBlock +
    content.slice(unionEnd + 2)

  const setStart = afterUnion.indexOf('const PROVIDER_ID_SET = new Set<string>([')
  if (setStart < 0) throw new Error(`provider-catalog.ts missing PROVIDER_ID_SET: ${filePath}`)
  const setEnd = afterUnion.indexOf('])', setStart)
  if (setEnd < 0) throw new Error(`provider-catalog.ts PROVIDER_ID_SET parse failed: ${filePath}`)
  const setBlock = afterUnion.slice(setStart, setEnd)
  const setIds = Array.from(setBlock.matchAll(/'([a-z0-9]+)'/g)).map((m) => m[1])
  if (setIds.includes(providerId)) throw new Error(`provider-catalog.ts already contains provider id '${providerId}' in set`)
  const nextSet = [...setIds, providerId].sort()
  const newSetBlock =
    `const PROVIDER_ID_SET = new Set<string>([\n` +
    nextSet.map((id) => `  '${id}',`).join('\n') +
    `\n])`

  const nextContent =
    afterUnion.slice(0, setStart) +
    newSetBlock +
    afterUnion.slice(setEnd + 2)

  writeUtf8(filePath, nextContent)
}

const insertLineInObjectBlock = (block: string, key: string, line: string): string => {
  const lines = block.split('\n')
  const keyRe = /^\s*([a-z0-9]+):\s*resolveProvider(?:Http|Playwright)Limits\(/i
  const keys: string[] = []
  for (const l of lines) {
    const m = l.match(keyRe)
    if (m && m[1]) keys.push(m[1])
  }
  if (keys.includes(key)) return block

  // Insert after the last key that sorts before ours.
  let insertAfterIdx = -1
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(keyRe)
    if (!m) continue
    const existing = m[1]
    if (existing.localeCompare(key) < 0) insertAfterIdx = i
  }
  const idx = insertAfterIdx >= 0 ? insertAfterIdx + 1 : 0
  lines.splice(idx, 0, line)
  return lines.join('\n')
}

const patchConfigProviderLimits = (repoRoot: string, providerId: string) => {
  const filePath = path.join(repoRoot, 'backend', 'shared', 'config.ts')
  const content = readUtf8(filePath)

  const httpMatch = content.match(/providerLimits:\s*{\s*\n\s*http:\s*{\s*\n([\s\S]*?)\n\s*},\s*\n\s*playwright:\s*{\s*\n/s)
  if (!httpMatch) throw new Error(`config.ts providerLimits.http block not found: ${filePath}`)
  const httpBlock = httpMatch[1]

  const pwMatch = content.match(/playwright:\s*{\s*\n([\s\S]*?)\n\s*},\s*\n\s*},\s*\n\s*},\s*\n/s)
  if (!pwMatch) throw new Error(`config.ts providerLimits.playwright block not found: ${filePath}`)
  const pwBlock = pwMatch[1]

  const envPrefix = upperEnvPrefix(providerId)
  const httpLine = `        ${providerId}: resolveProviderHttpLimits('${envPrefix}', { rpm: 6, concurrency: 1, perCorridorRpm: 2 }),`
  const pwLine = `        ${providerId}: resolveProviderPlaywrightLimits('${envPrefix}'),`

  const newHttpBlock = insertLineInObjectBlock(httpBlock, providerId, httpLine)
  const newPwBlock = insertLineInObjectBlock(pwBlock, providerId, pwLine)

  let next = content.replace(httpBlock, newHttpBlock)
  next = next.replace(pwBlock, newPwBlock)
  writeUtf8(filePath, next)
}

const providerSkeletonFiles = (providerId: string) => {
  const upper = providerId.toUpperCase()
  const pascal = providerId.slice(0, 1).toUpperCase() + providerId.slice(1)

  const supportedCorridors = `export const ${upper}_B2B_CORRIDORS: string[] = []\n`

  const codeMap = [
    `export const countryCodeMap: Record<string, string> = {}`,
    ``,
    `export const currencyCodeMap: Record<string, string> = {}`,
    ``,
    `export const payinMethodMap: Record<string, string> = {}`,
    ``,
    `export const payoutMethodMap: Record<string, string> = {}`,
    ``,
  ].join('\n')

  const limits = [
    `import { config } from '../../../../shared/config'`,
    ``,
    `const http = config.planeB.providerLimits.http.${providerId}`,
    `const playwright = config.planeB.providerLimits.playwright.${providerId}`,
    ``,
    `export const httpLimits = {`,
    `  rpm: http.rpm,`,
    `  concurrency: http.concurrency,`,
    `  perLocale: true,`,
    `  perCorridorRpm: http.perCorridorRpm,`,
    `}`,
    ``,
    `/**`,
    ` * MVP: Playwright support is not yet implemented.`,
    ` * These limits are defined for future use and do not affect current functionality.`,
    ` */`,
    `export const playwrightLimits = {`,
    `  rpm: playwright.rpm,`,
    `  concurrency: playwright.concurrency,`,
    `  perLocale: true,`,
    `  perCorridorRpm: playwright.perCorridorRpm,`,
    `}`,
    ``,
  ].join('\n')

  const catalog = [
    `import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'`,
    `import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'`,
    `import { ${upper}_B2B_CORRIDORS } from './supported-corridors'`,
    ``,
    `export const corridors = ${upper}_B2B_CORRIDORS`,
    `export const corridorSource = 'manual'`,
    ``,
    `export const codeMaps = {`,
    `  countryCodeMap,`,
    `  currencyCodeMap,`,
    `  payinMethodMap,`,
    `  payoutMethodMap,`,
    `}`,
    ``,
    `export const amountBuckets = DEFAULT_AMOUNT_BUCKETS`,
    ``,
    `export const payinMethods: string[] = ['bank_transfer']`,
    `export const payoutMethods: string[] = ['bank_deposit']`,
    ``,
    `export const defaultPayinMethod = 'bank_transfer'`,
    `export const defaultPayoutMethod = 'bank_deposit'`,
    ``,
  ].join('\n')

  const fetchTs = [
    `import type { CollectorRequest, FetchResult } from '../../collectors/types'`,
    ``,
    `export const fetch${pascal}Quote = async (_request: CollectorRequest): Promise<FetchResult> => {`,
    `  return {`,
    `    status: 501,`,
    `    bodyText: 'unimplemented_provider',`,
    `    payload: null,`,
    `  }`,
    `}`,
    ``,
  ].join('\n')

  const parseTs = [
    `import type { CollectorRequest } from '../../collectors/types'`,
    ``,
    `export const parse${pascal}Payload = (_payload: unknown, _request: CollectorRequest) => {`,
    `  return null`,
    `}`,
    ``,
  ].join('\n')

  const collector = [
    `import { createLogger } from '../../../../shared/logger'`,
    `import { initTracing } from '../../../../shared/tracing'`,
    `import { initErrorTracking } from '../../../../shared/error-tracker'`,
    ``,
    `initTracing('${providerId}-collector')`,
    `initErrorTracking('${providerId}-collector')`,
    ``,
    `const logger = createLogger('plane-b.${providerId}.collector')`,
    ``,
    `export const run${pascal}Collector = async (_options: any = {}): Promise<boolean> => {`,
    `  logger.warn('provider_unimplemented', { provider_id: '${providerId}' })`,
    `  return false`,
    `}`,
    ``,
  ].join('\n')

  return {
    'supported-corridors.ts': supportedCorridors,
    'code-map.ts': codeMap,
    'limits.ts': limits,
    'catalog.ts': catalog,
    'fetch.ts': fetchTs,
    'parse.ts': parseTs,
    'collector.ts': collector,
  }
}

const patchProviderIndexRegistry = (repoRoot: string, providerId: string, displayName: string) => {
  const filePath = path.join(repoRoot, 'backend', 'plane-b', 'src', 'providers', 'index.ts')
  const content = readUtf8(filePath)

  if (content.includes(`'${providerId}'`)) {
    throw new Error(`providers/index.ts already references provider '${providerId}'`)
  }

  const upper = providerId.toUpperCase()
  const pascal = providerId.slice(0, 1).toUpperCase() + providerId.slice(1)

  const importInsertionPoint = content.indexOf('\n/**\n * Common run options passed through the provider registry to collectors.\n */')
  if (importInsertionPoint < 0) throw new Error(`providers/index.ts import insertion marker not found`)

  const importLines = [
    `import { run${pascal}Collector } from './${providerId}/collector'`,
    `import { ${upper}_B2B_CORRIDORS } from './${providerId}/supported-corridors'`,
    `import { httpLimits as ${providerId}Limits } from './${providerId}/limits'`,
    ``,
  ].join('\n')

  const withImports =
    content.slice(0, importInsertionPoint) +
    `\n` +
    importLines +
    content.slice(importInsertionPoint)

  const arrayMarker = 'export const providerRegistry: ProviderRegistryEntry[] = ['
  const start = withImports.indexOf(arrayMarker)
  if (start < 0) throw new Error(`providers/index.ts providerRegistry marker not found`)

  const arrayStart = withImports.indexOf('[', start)
  if (arrayStart < 0) throw new Error(`providers/index.ts providerRegistry array start not found`)

  let depth = 0
  let arrayEnd = -1
  for (let i = arrayStart; i < withImports.length; i += 1) {
    const ch = withImports[i]
    if (ch === '[') depth += 1
    if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        arrayEnd = i
        break
      }
    }
  }
  if (arrayEnd < 0) throw new Error(`providers/index.ts providerRegistry array end not found`)

  const entry = [
    `  {`,
    `    providerId: '${providerId}',`,
    `    displayName: '${displayName.replace(/'/g, "\\'")}',`,
    `    supportedCorridors: ${upper}_B2B_CORRIDORS,`,
    `    baseRates: {`,
    `      rpm: ${providerId}Limits.rpm,`,
    `      perCorridorRpm: ${providerId}Limits.perCorridorRpm,`,
    `    },`,
    `    run: (options) => run${pascal}Collector({`,
    `      pool: options.pool,`,
    `      collectorType: options.collectorType,`,
    `      corridors: options.corridors,`,
    `      amountBuckets: options.amountBuckets,`,
    `      payinMethod: options.payinMethod,`,
    `      payoutMethod: options.payoutMethod,`,
    `      locale: options.locale,`,
    `      delayMs: options.delayMs,`,
    `      jitterMs: options.jitterMs,`,
    `      rateLimitBackoffMs: options.rateLimitBackoffMs,`,
    `      rateLimitJitterMs: options.rateLimitJitterMs,`,
    `      rateLimitMaxRetries: options.rateLimitMaxRetries,`,
    `      corridorDelayMs: options.corridorDelayMs,`,
    `      corridorJitterMs: options.corridorJitterMs,`,
    `      freshnessSloMinutes: options.freshnessSloMinutes,`,
    `      freshnessSloEnabled: options.freshnessSloEnabled,`,
    `      rpmOverride: options.rpmOverride,`,
    `      perCorridorRpmOverride: options.perCorridorRpmOverride,`,
    `      closePool: false,`,
    `    } as any),`,
    `  },`,
    ``,
  ].join('\n')

  const withEntry = withImports.slice(0, arrayEnd) + `\n` + entry + withImports.slice(arrayEnd)
  writeUtf8(filePath, withEntry)
}

const updateProviderOnboardingDoc = (repoRoot: string) => {
  const docPath = path.join(repoRoot, 'agents', 'rag', 'provider-onboarding.md')
  if (!fs.existsSync(docPath)) return

  const catalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')
  const parsed = JSON.parse(readUtf8(catalogPath)) as ProviderCatalog
  const ids = (parsed.providers || []).map((p) => p.provider_id).filter(Boolean).sort()

  const content = readUtf8(docPath)
  const next = content
    .replace(/## Current provider registry\s*\(\d+\)\n/,
      `## Current provider registry (${ids.length})\n`)
    .replace(/\n([a-z0-9, _-]+)\n\n## Onboarding phases\n/,
      `\n${ids.join(', ')}\n\n## Onboarding phases\n`)

  writeUtf8(docPath, next)
}

export const runProviderScaffold = async () => {
  const args = parseArgs()
  const providerId = normalizeProviderId(must(args, 'provider-id'))
  const displayName = must(args, 'display-name')
  const supportsB2b = toBool01(must(args, 'supports-b2b'))
  const supportsB2c = toBool01(must(args, 'supports-b2c'))
  const probeAwsScheduled = toBool01(String(args['probe-aws-scheduled'] || '0'))
  const probeGithubActions = toBool01(String(args['probe-github-actions'] || '0'))
  const awsCdkId = String(args['aws-cdk-id'] || '').trim() || undefined
  const healthCorridors = (String(args['health-corridors'] || '')).split(',').map((c) => c.trim()).filter(Boolean)

  if (probeAwsScheduled && !awsCdkId) {
    throw new Error(`--aws-cdk-id is required when --probe-aws-scheduled=1`)
  }

  const repoRoot = findRepoRoot()

  upsertProviderCatalog(repoRoot, {
    provider_id: providerId,
    display_name: displayName,
    supports_b2b: supportsB2b,
    supports_b2c: supportsB2c,
    health_corridors: healthCorridors,
    ...(probeAwsScheduled || probeGithubActions
      ? {
          probe: {
            aws_scheduled: probeAwsScheduled,
            github_actions: probeGithubActions,
            ...(probeAwsScheduled ? { aws_cdk_id: awsCdkId } : {}),
          },
        }
      : {}),
  })

  patchProviderCatalogTs(repoRoot, providerId)
  patchConfigProviderLimits(repoRoot, providerId)

  const providerDir = path.join(repoRoot, 'backend', 'plane-b', 'src', 'providers', providerId)
  if (fs.existsSync(providerDir)) {
    throw new Error(`Provider directory already exists: ${providerDir}`)
  }
  fs.mkdirSync(providerDir, { recursive: true })
  const files = providerSkeletonFiles(providerId)
  for (const [name, content] of Object.entries(files)) {
    writeUtf8(path.join(providerDir, name), content)
  }

  patchProviderIndexRegistry(repoRoot, providerId, displayName)
  updateProviderOnboardingDoc(repoRoot)

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    ok: true,
    provider_id: providerId,
    display_name: displayName,
    repo_root: repoRoot,
    next_steps: [
      `Implement collector/fetch/parse under backend/plane-b/src/providers/${providerId}/`,
      `Add corridors and health corridors in .remit-scout/providers/catalog.json`,
      `Run CI: validate-agent-surfaces and TypeScript build`,
    ],
  }, null, 2))
}

if (require.main === module) {
  runProviderScaffold().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
    process.exit(1)
  })
}
