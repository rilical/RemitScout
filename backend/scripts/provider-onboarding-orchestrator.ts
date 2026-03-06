import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'

import { createLogger } from '../shared/logger'
import { recordProviderOnboardingMetric } from '../shared/cloudwatch-metrics'
import {
  getAvailableCurrenciesForCountry,
  isValidCountryCode,
  isValidCurrencyCode,
} from '../shared/countries-currencies'

const logger = createLogger('script.provider-onboarding-orchestrator')

const REMIT_SCORE_WEIGHTS = {
  deliveredValue: 40,
  reliabilitySuccess: 20,
  frictionSpeed: 15,
  supportRefunds: 15,
  trustSafety: 10,
} as const

const DEFAULT_CORRIDOR_LIMIT = 10
const DEFAULT_SCORE_THRESHOLD = 7
const DEFAULT_TIMEOUT_MS = 90_000

const AUTH_HEADER_KEYS = [
  'authorization',
  'x-api-key',
  'apikey',
  'x-auth-token',
  'proxy-authorization',
]

type RuntimeEnv = 'dev' | 'staging' | 'prod'
type ProviderType = 'B2B' | 'B2C' | 'BOTH'

type CurlRequest = {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: unknown
  assertions?: unknown
}

type RawProviderContract = {
  provider_slug?: string
  provider_name?: string
  provider_type?: string
  curl_requests?: CurlRequest[]
  supported_countries?: string[]
  supported_currencies?: string[]
  corridors?: string[]
  operator_notes?: string
}

type ProviderContract = {
  provider_slug: string
  provider_name: string
  provider_type: ProviderType
  curl_requests: CurlRequest[]
  supported_countries: string[]
  supported_currencies: string[]
  corridors: string[]
  operator_notes?: string
}

type OrchestratorInput = {
  providers: ProviderContract[]
  execution_env: RuntimeEnv
  ci_ref: string
  operator_notes?: string
  dry_run: boolean
  staging_only: boolean
  auto_merge: boolean
  continue_on_error: boolean
  corridor_limit: number
  score_threshold: number
  command_timeout_ms: number
  smoke_base_url?: string
}

type StepOutput = {
  step: string
  ok: boolean
  timed_out: boolean
  exit_code: number
  duration_ms: number
  command: string
  log_path: string
}

type EvidenceJson = {
  success?: boolean
  findings?: Array<{ reason_code?: string; severity?: string; message?: string }>
  recommended_next_skill_ids?: string[]
}

type ProviderArtifact = {
  run_id: string
  stage: 'provider_onboarding'
  ci_ref: string
  provider_slug: string
  status: 'pass' | 'blocked' | 'warn'
  artifact_paths: string[]
  evidence_paths: string[]
  reason_codes: string[]
  remit_score: {
    total: number
    threshold: number
    breakdown: {
      delivered_value: { weight: number; score: number; note: string }
      reliability_success: { weight: number; score: number; note: string }
      friction_speed: { weight: number; score: number; note: string }
      support_refunds: { weight: number; score: number; note: string }
      trust_safety: { weight: number; score: number; note: string }
    }
  }
  review_card: {
    status: 'ready_for_staging' | 'blocked'
    next_action: string
    blockers: string[]
    warnings: string[]
  }
  next_skill_ids: string[]
}

type OrchestratorOutput = {
  run_id: string
  stage: 'provider_onboarding'
  ci_ref: string
  execution_env: RuntimeEnv
  started_at: string
  finished_at: string
  status: 'pass' | 'partial' | 'fail'
  artifact_paths: string[]
  evidence_paths: string[]
  reason_codes: string[]
  remit_score: {
    total: number
    threshold: number
    breakdown: {
      delivered_value: { weight: number; score: number }
      reliability_success: { weight: number; score: number }
      friction_speed: { weight: number; score: number }
      support_refunds: { weight: number; score: number }
      trust_safety: { weight: number; score: number }
    }
  }
  review_card: {
    status: 'ready_for_staging' | 'blocked'
    next_action: string
    blockers: string[]
    warnings: string[]
  }
  next_skill_ids: string[]
  providers: ProviderArtifact[]
  operator_notes?: string
}

type CommandResult = {
  ok: boolean
  timedOut: boolean
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

const nowIso = () => new Date().toISOString()

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

const shortRef = (value: string): string => {
  const raw = String(value || '').trim()
  if (!raw) return 'unknown'
  return raw.length > 10 ? raw.slice(0, 10) : raw
}

const safeToken = (value: string): string => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'run'
}

const parseArgs = (): Record<string, string> => {
  const args = process.argv.slice(2)
  const out: Record<string, string> = {}
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = args[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i += 1
    } else {
      out[key] = 'true'
    }
  }
  return out
}

const toBool = (value: string | undefined, fallback = false): boolean => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return fallback
}

const toRuntimeEnv = (value: string | undefined): RuntimeEnv => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'dev' || normalized === 'development') return 'dev'
  if (normalized === 'prod' || normalized === 'production') return 'prod'
  return 'staging'
}

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

const toFloat = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(String(value || ''))
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

const unique = (values: string[]): string[] => {
  const set = new Set<string>()
  values.forEach((value) => {
    const normalized = String(value || '').trim()
    if (normalized) set.add(normalized)
  })
  return Array.from(set)
}

const parseProviderType = (value: string | undefined): ProviderType => {
  const normalized = String(value || 'BOTH').trim().toUpperCase()
  if (normalized === 'B2B') return 'B2B'
  if (normalized === 'B2C') return 'B2C'
  return 'BOTH'
}

const providerTypeFlags = (providerType: ProviderType): { b2b: boolean; b2c: boolean } => ({
  b2b: providerType === 'B2B' || providerType === 'BOTH',
  b2c: providerType === 'B2C' || providerType === 'BOTH',
})

const parseProvidersSource = (value: string | undefined): unknown => {
  if (!value) return null
  if (fs.existsSync(value) && fs.statSync(value).isFile()) {
    return JSON.parse(fs.readFileSync(value, 'utf8'))
  }
  return JSON.parse(value)
}

const normalizeProvider = (raw: RawProviderContract): ProviderContract => {
  const provider_slug = String(raw.provider_slug || '').trim().toLowerCase()
  const provider_name = String(raw.provider_name || provider_slug).trim()
  const provider_type = parseProviderType(raw.provider_type)
  const curl_requests = Array.isArray(raw.curl_requests) ? raw.curl_requests : []
  const supported_countries = unique(
    (Array.isArray(raw.supported_countries) ? raw.supported_countries : [])
      .map((entry) => String(entry || '').trim().toUpperCase()),
  )
  const supported_currencies = unique(
    (Array.isArray(raw.supported_currencies) ? raw.supported_currencies : [])
      .map((entry) => String(entry || '').trim().toUpperCase()),
  )
  const corridors = unique(
    (Array.isArray(raw.corridors) ? raw.corridors : [])
      .map((entry) => String(entry || '').trim().toUpperCase()),
  )

  return {
    provider_slug,
    provider_name,
    provider_type,
    curl_requests,
    supported_countries,
    supported_currencies,
    corridors,
    operator_notes: String(raw.operator_notes || '').trim() || undefined,
  }
}

const buildInput = (): OrchestratorInput => {
  const args = parseArgs()
  const providersPayload = parseProvidersSource(args.input || args.providers || process.env.PROVIDER_ONBOARDING_INPUT)

  if (!providersPayload) {
    throw new Error('Missing providers payload. Use --input <path|json> or PROVIDER_ONBOARDING_INPUT.')
  }

  const payloadObj = providersPayload as { providers?: RawProviderContract[]; execution_env?: string; ci_ref?: string; operator_notes?: string }
  const rawProviders = Array.isArray(payloadObj.providers)
    ? payloadObj.providers
    : Array.isArray(providersPayload)
      ? providersPayload as RawProviderContract[]
      : []

  if (rawProviders.length === 0) {
    throw new Error('No providers found in onboarding payload.')
  }

  const ciRef = String(
    args.ci_ref
    || payloadObj.ci_ref
    || process.env.GITHUB_SHA
    || process.env.GITHUB_RUN_ID
    || randomUUID().replace(/-/g, ''),
  ).trim()

  return {
    providers: rawProviders.map(normalizeProvider),
    execution_env: toRuntimeEnv(args.execution_env || payloadObj.execution_env || process.env.EXECUTION_ENV),
    ci_ref: ciRef,
    operator_notes: String(args.operator_notes || payloadObj.operator_notes || '').trim() || undefined,
    dry_run: toBool(args.dry_run, false),
    staging_only: toBool(args.staging_only, false),
    auto_merge: toBool(args.auto_merge, false),
    continue_on_error: toBool(args.continue_on_error, true),
    corridor_limit: clamp(toInt(args.corridor_limit, DEFAULT_CORRIDOR_LIMIT), 1, 50),
    score_threshold: clamp(toFloat(args.score_threshold, DEFAULT_SCORE_THRESHOLD), 0, 10),
    command_timeout_ms: clamp(toInt(args.command_timeout_ms, DEFAULT_TIMEOUT_MS), 5_000, 600_000),
    smoke_base_url: String(args.smoke_base_url || process.env.SMOKE_BASE_URL || process.env.API_BASE_URL || '').trim() || undefined,
  }
}

const validateProviderInput = (provider: ProviderContract): string[] => {
  const errors: string[] = []

  if (!provider.provider_slug || !/^[a-z0-9]+$/.test(provider.provider_slug)) {
    errors.push('provider_slug must be lowercase alphanumeric')
  }

  if (!provider.provider_name) {
    errors.push('provider_name is required')
  }

  if (!provider.supported_countries.length) {
    errors.push('supported_countries must not be empty')
  }

  if (!provider.supported_currencies.length) {
    errors.push('supported_currencies must not be empty')
  }

  provider.supported_countries.forEach((country) => {
    if (!isValidCountryCode(country)) {
      errors.push(`unsupported country code: ${country}`)
    }
  })

  provider.supported_currencies.forEach((currency) => {
    if (!isValidCurrencyCode(currency)) {
      errors.push(`unsupported currency code: ${currency}`)
    }
  })

  if (!provider.curl_requests.length) {
    errors.push('curl_requests must include at least one request template')
  }

  provider.curl_requests.forEach((request, index) => {
    const method = String(request.method || '').trim().toUpperCase()
    const url = String(request.url || '').trim()
    if (!method || !url) {
      errors.push(`curl_requests[${index}] must include method and url`)
    }

    const headers = request.headers || {}
    const headerKeys = Object.keys(headers).map((entry) => entry.toLowerCase())
    const hasAuthHeader = AUTH_HEADER_KEYS.some((entry) => headerKeys.includes(entry))

    if (!hasAuthHeader) {
      errors.push(`curl_requests[${index}] missing auth header (${AUTH_HEADER_KEYS.join(', ')})`)
    }
  })

  provider.corridors.forEach((corridor, index) => {
    const parts = corridor.split('-')
    if (parts.length !== 4) {
      errors.push(`corridors[${index}] must match SEND-RECV-SENDCUR-RECVCUR`)
      return
    }
    const [sendCountry, recvCountry, sendCurrency, recvCurrency] = parts
    if (!isValidCountryCode(sendCountry) || !isValidCountryCode(recvCountry)) {
      errors.push(`corridors[${index}] has unsupported country code`)
    }
    if (!isValidCurrencyCode(sendCurrency) || !isValidCurrencyCode(recvCurrency)) {
      errors.push(`corridors[${index}] has unsupported currency code`)
    }
  })

  return unique(errors)
}

const pickCurrencyForCountry = (countryCode: string, supportedCurrencies: string[]): string => {
  const supported = supportedCurrencies.map((entry) => entry.toUpperCase())
  const available = getAvailableCurrenciesForCountry(countryCode.toUpperCase())
  const intersection = supported.filter((entry) => available.includes(entry))
  if (intersection.length > 0) return intersection[0]
  if (supported.length > 0) return supported[0]
  if (available.length > 0) return available[0]
  return 'USD'
}

const deriveSyntheticCorridors = (provider: ProviderContract, limit: number): string[] => {
  if (provider.corridors.length > 0) {
    return provider.corridors.slice(0, limit)
  }

  const countries = provider.supported_countries
  const supportedCurrencies = provider.supported_currencies
  const corridors: string[] = []

  for (const sendCountry of countries) {
    if (corridors.length >= limit) break
    for (const recvCountry of countries) {
      if (corridors.length >= limit) break
      if (sendCountry === recvCountry) continue
      const sendCurrency = pickCurrencyForCountry(sendCountry, supportedCurrencies)
      const recvCurrency = pickCurrencyForCountry(recvCountry, supportedCurrencies)
      corridors.push(`${sendCountry}-${recvCountry}-${sendCurrency}-${recvCurrency}`)
    }
  }

  if (corridors.length === 0 && countries.length > 0) {
    const country = countries[0]
    const currency = pickCurrencyForCountry(country, supportedCurrencies)
    corridors.push(`${country}-${country}-${currency}-${currency}`)
  }

  return unique(corridors).slice(0, limit)
}

const runCommand = (command: string, args: string[], env: NodeJS.ProcessEnv, timeoutMs: number): CommandResult => {
  const start = Date.now()
  try {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      maxBuffer: 20 * 1024 * 1024,
    })

    const durationMs = Date.now() - start
    return {
      ok: result.status === 0,
      timedOut: result.signal === 'SIGTERM' || result.signal === 'SIGKILL',
      exitCode: typeof result.status === 'number' ? result.status : 1,
      stdout: String(result.stdout || ''),
      stderr: String(result.stderr || ''),
      durationMs,
    }
  } catch (error: unknown) {
    const durationMs = Date.now() - start
    return {
      ok: false,
      timedOut: false,
      exitCode: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      durationMs,
    }
  }
}

const writeText = (filePath: string, value: string): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, value, 'utf8')
}

const writeJson = (filePath: string, value: unknown): void => {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

const readJsonSafe = (filePath: string): unknown => {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

const extractEvidenceReasonCodes = (evidence: unknown): string[] => {
  const payload = evidence as EvidenceJson
  if (!payload || typeof payload !== 'object') return []
  const reasonCodes = new Set<string>()

  const findings = Array.isArray(payload.findings) ? payload.findings : []
  findings.forEach((finding) => {
    const reason = String(finding.reason_code || '').trim()
    if (reason) reasonCodes.add(reason)
  })

  return Array.from(reasonCodes)
}

const extractNextSkillIds = (evidence: unknown): string[] => {
  const payload = evidence as EvidenceJson
  if (!payload || typeof payload !== 'object') return []
  return unique((Array.isArray(payload.recommended_next_skill_ids) ? payload.recommended_next_skill_ids : []).map((entry) => String(entry || '').trim()))
}

const buildStepOutput = (step: string, command: string, logPath: string, result: CommandResult): StepOutput => ({
  step,
  ok: result.ok,
  timed_out: result.timedOut,
  exit_code: result.exitCode,
  duration_ms: result.durationMs,
  command,
  log_path: logPath,
})

const saveCommandLog = (logPath: string, command: string, result: CommandResult): void => {
  writeJson(logPath, {
    command,
    ok: result.ok,
    timed_out: result.timedOut,
    exit_code: result.exitCode,
    duration_ms: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr,
    emitted_at: nowIso(),
  })
}

const calculateRemitScore = (params: {
  provider: ProviderContract
  scaffoldOk: boolean
  probeOk: boolean
  probeTimedOut: boolean
  healthEvidenceOk: boolean
  smokeOk: boolean | null
  syntheticCorridorsCount: number
  dryRun: boolean
}): ProviderArtifact['remit_score'] => {
  const assertionsCoverage = clamp(
    params.provider.curl_requests.filter((entry) => Array.isArray(entry.assertions) && entry.assertions.length > 0).length
      / Math.max(params.provider.curl_requests.length, 1),
    0,
    1,
  )

  const deliveredValue = params.dryRun
    ? 6
    : (params.scaffoldOk ? 7.5 : 3.5) + (params.syntheticCorridorsCount > 0 ? 0.7 : 0) + (params.smokeOk === true ? 0.8 : 0)

  const reliabilitySuccess = params.dryRun
    ? 6
    : (params.probeOk ? 7 : 3) + (params.healthEvidenceOk ? 1.5 : 0)

  const frictionSpeed = params.dryRun
    ? 6
    : (params.probeOk ? 6.8 : 3.2) + (params.smokeOk === true ? 0.8 : (params.smokeOk === false ? -0.7 : 0))

  const supportRefunds = params.dryRun
    ? 6
    : 4.8 + (assertionsCoverage * 3.5) + (params.probeTimedOut ? -2 : 0)

  const trustSafety = params.dryRun
    ? 6
    : 5 + (params.healthEvidenceOk ? 1.5 : 0) + (params.smokeOk === false ? -1.5 : 0)

  const bounded = {
    deliveredValue: clamp(deliveredValue, 0, 10),
    reliabilitySuccess: clamp(reliabilitySuccess, 0, 10),
    frictionSpeed: clamp(frictionSpeed, 0, 10),
    supportRefunds: clamp(supportRefunds, 0, 10),
    trustSafety: clamp(trustSafety, 0, 10),
  }

  const total = (
    (bounded.deliveredValue * REMIT_SCORE_WEIGHTS.deliveredValue)
    + (bounded.reliabilitySuccess * REMIT_SCORE_WEIGHTS.reliabilitySuccess)
    + (bounded.frictionSpeed * REMIT_SCORE_WEIGHTS.frictionSpeed)
    + (bounded.supportRefunds * REMIT_SCORE_WEIGHTS.supportRefunds)
    + (bounded.trustSafety * REMIT_SCORE_WEIGHTS.trustSafety)
  ) / 100

  return {
    total: Number(total.toFixed(3)),
    threshold: DEFAULT_SCORE_THRESHOLD,
    breakdown: {
      delivered_value: {
        weight: REMIT_SCORE_WEIGHTS.deliveredValue,
        score: Number(bounded.deliveredValue.toFixed(3)),
        note: 'Weighted from scaffold success, corridor coverage, and smoke output.',
      },
      reliability_success: {
        weight: REMIT_SCORE_WEIGHTS.reliabilitySuccess,
        score: Number(bounded.reliabilitySuccess.toFixed(3)),
        note: 'Weighted from provider probe and health evidence outcomes.',
      },
      friction_speed: {
        weight: REMIT_SCORE_WEIGHTS.frictionSpeed,
        score: Number(bounded.frictionSpeed.toFixed(3)),
        note: 'Weighted from probe responsiveness and B2C smoke behavior.',
      },
      support_refunds: {
        weight: REMIT_SCORE_WEIGHTS.supportRefunds,
        score: Number(bounded.supportRefunds.toFixed(3)),
        note: 'Weighted from curl assertions completeness and timeout penalties.',
      },
      trust_safety: {
        weight: REMIT_SCORE_WEIGHTS.trustSafety,
        score: Number(bounded.trustSafety.toFixed(3)),
        note: 'Weighted from health evidence and safety-path smoke checks.',
      },
    },
  }
}

const emitProviderMetrics = (provider: ProviderArtifact, env: RuntimeEnv): void => {
  recordProviderOnboardingMetric({
    metric: 'provider_status',
    value: provider.status === 'pass' ? 1 : 0,
    provider_id: provider.provider_slug,
    env,
    status: provider.status,
  })

  recordProviderOnboardingMetric({
    metric: 'remit_score',
    value: provider.remit_score.total,
    provider_id: provider.provider_slug,
    env,
  })
}

const aggregateRemitScore = (providers: ProviderArtifact[]): OrchestratorOutput['remit_score'] => {
  if (providers.length === 0) {
    return {
      total: 0,
      threshold: DEFAULT_SCORE_THRESHOLD,
      breakdown: {
        delivered_value: { weight: REMIT_SCORE_WEIGHTS.deliveredValue, score: 0 },
        reliability_success: { weight: REMIT_SCORE_WEIGHTS.reliabilitySuccess, score: 0 },
        friction_speed: { weight: REMIT_SCORE_WEIGHTS.frictionSpeed, score: 0 },
        support_refunds: { weight: REMIT_SCORE_WEIGHTS.supportRefunds, score: 0 },
        trust_safety: { weight: REMIT_SCORE_WEIGHTS.trustSafety, score: 0 },
      },
    }
  }

  const summary = providers.reduce((acc, provider) => {
    acc.total += provider.remit_score.total
    acc.delivered += provider.remit_score.breakdown.delivered_value.score
    acc.reliability += provider.remit_score.breakdown.reliability_success.score
    acc.friction += provider.remit_score.breakdown.friction_speed.score
    acc.support += provider.remit_score.breakdown.support_refunds.score
    acc.trust += provider.remit_score.breakdown.trust_safety.score
    return acc
  }, {
    total: 0,
    delivered: 0,
    reliability: 0,
    friction: 0,
    support: 0,
    trust: 0,
  })

  const n = providers.length

  return {
    total: Number((summary.total / n).toFixed(3)),
    threshold: DEFAULT_SCORE_THRESHOLD,
    breakdown: {
      delivered_value: { weight: REMIT_SCORE_WEIGHTS.deliveredValue, score: Number((summary.delivered / n).toFixed(3)) },
      reliability_success: { weight: REMIT_SCORE_WEIGHTS.reliabilitySuccess, score: Number((summary.reliability / n).toFixed(3)) },
      friction_speed: { weight: REMIT_SCORE_WEIGHTS.frictionSpeed, score: Number((summary.friction / n).toFixed(3)) },
      support_refunds: { weight: REMIT_SCORE_WEIGHTS.supportRefunds, score: Number((summary.support / n).toFixed(3)) },
      trust_safety: { weight: REMIT_SCORE_WEIGHTS.trustSafety, score: Number((summary.trust / n).toFixed(3)) },
    },
  }
}

const run = (): OrchestratorOutput => {
  const startedAt = nowIso()
  const input = buildInput()

  if (input.staging_only && input.execution_env !== 'staging') {
    throw new Error('staging_only=true requires execution_env=staging')
  }

  const runId = `${safeToken(shortRef(input.ci_ref))}-${randomUUID().slice(0, 8)}`
  const artifactsRoot = path.resolve(process.cwd(), 'artifacts', 'provider-onboarding', runId)
  fs.mkdirSync(artifactsRoot, { recursive: true })

  const providers: ProviderArtifact[] = []
  const allArtifactPaths = new Set<string>()
  const allEvidencePaths = new Set<string>()
  const globalReasonCodes = new Set<string>()

  const globalCorridors = new Set<string>()
  let stopAfterFailure = false

  input.providers.forEach((provider) => {
    const providerDir = path.join(artifactsRoot, provider.provider_slug)
    fs.mkdirSync(providerDir, { recursive: true })

    if (stopAfterFailure) {
      const skippedArtifact: ProviderArtifact = {
        run_id: runId,
        stage: 'provider_onboarding',
        ci_ref: shortRef(input.ci_ref),
        provider_slug: provider.provider_slug,
        status: 'warn',
        artifact_paths: [],
        evidence_paths: [],
        reason_codes: ['provider_onboarding.review_blocked'],
        remit_score: {
          total: 0,
          threshold: input.score_threshold,
          breakdown: {
            delivered_value: { weight: REMIT_SCORE_WEIGHTS.deliveredValue, score: 0, note: 'skipped due to continue_on_error=false' },
            reliability_success: { weight: REMIT_SCORE_WEIGHTS.reliabilitySuccess, score: 0, note: 'skipped due to continue_on_error=false' },
            friction_speed: { weight: REMIT_SCORE_WEIGHTS.frictionSpeed, score: 0, note: 'skipped due to continue_on_error=false' },
            support_refunds: { weight: REMIT_SCORE_WEIGHTS.supportRefunds, score: 0, note: 'skipped due to continue_on_error=false' },
            trust_safety: { weight: REMIT_SCORE_WEIGHTS.trustSafety, score: 0, note: 'skipped due to continue_on_error=false' },
          },
        },
        review_card: {
          status: 'blocked',
          next_action: 'rerun with continue_on_error=true or resolve previous blocker',
          blockers: ['previous provider failure halted processing'],
          warnings: [],
        },
        next_skill_ids: ['provider.onboarding.local', 'manual.human_triage'],
      }

      const skippedPath = path.join(providerDir, 'provider-output.json')
      writeJson(skippedPath, skippedArtifact)
      skippedArtifact.artifact_paths.push(skippedPath)
      skippedArtifact.artifact_paths.forEach((artifact) => allArtifactPaths.add(artifact))
      skippedArtifact.reason_codes.forEach((code) => globalReasonCodes.add(code))
      providers.push(skippedArtifact)
      emitProviderMetrics(skippedArtifact, input.execution_env)
      return
    }

    const providerArtifactPaths: string[] = []
    const providerEvidencePaths: string[] = []
    const reasonCodes = new Set<string>()
    const blockers: string[] = []
    const warnings: string[] = []
    const nextSkillIds = new Set<string>()
    const steps: StepOutput[] = []

    const validationIssues = validateProviderInput(provider)
    if (validationIssues.length > 0) {
      reasonCodes.add('provider_onboarding.input_invalid')
      blockers.push(...validationIssues)
    }

    const syntheticCorridors = deriveSyntheticCorridors(provider, input.corridor_limit)
    syntheticCorridors.forEach((corridor) => globalCorridors.add(corridor))

    const syntheticPath = path.join(providerDir, 'synthetic-corridors.json')
    writeJson(syntheticPath, {
      provider_slug: provider.provider_slug,
      provider_name: provider.provider_name,
      corridors: syntheticCorridors,
      derived: provider.corridors.length === 0,
      generated_at: nowIso(),
    })
    providerArtifactPaths.push(syntheticPath)

    let scaffoldOk = false
    let probeOk = false
    let probeTimedOut = false
    let healthEvidenceOk = false
    let smokeOk: boolean | null = null

    if (!input.dry_run && validationIssues.length === 0) {
      const flags = providerTypeFlags(provider.provider_type)

      const scaffoldCommand = [
        'pnpm',
        '-C',
        'backend',
        'provider:scaffold',
        '--provider-id', provider.provider_slug,
        '--display-name', provider.provider_name,
        '--supports-b2b', flags.b2b ? '1' : '0',
        '--supports-b2c', flags.b2c ? '1' : '0',
        '--probe-github-actions', '1',
        '--health-corridors', syntheticCorridors.join(','),
      ]

      const scaffold = runCommand(scaffoldCommand[0], scaffoldCommand.slice(1), process.env, input.command_timeout_ms)
      const scaffoldLog = path.join(providerDir, 'provider-scaffold.log.json')
      saveCommandLog(scaffoldLog, scaffoldCommand.join(' '), scaffold)
      steps.push(buildStepOutput('provider.scaffold', scaffoldCommand.join(' '), scaffoldLog, scaffold))
      providerArtifactPaths.push(scaffoldLog)
      recordProviderOnboardingMetric({
        metric: 'step_duration_seconds',
        value: scaffold.durationMs / 1000,
        env: input.execution_env,
        provider_id: provider.provider_slug,
        step: 'provider_scaffold',
        status: scaffold.ok ? 'pass' : 'fail',
      })
      scaffoldOk = scaffold.ok

      if (!scaffold.ok) {
        reasonCodes.add('provider_onboarding.scaffold_fail')
        blockers.push('scaffold step failed')
        nextSkillIds.add('provider.scaffold.local')
      }

      const probeCommand = ['pnpm', '-C', 'backend', 'probe:provider']
      const probe = runCommand(probeCommand[0], probeCommand.slice(1), {
        ...process.env,
        PROVIDER_ID: provider.provider_slug,
        PROBE_TIMEOUT_MS: String(input.command_timeout_ms),
        PROBE_RETRIES: '1',
        PROBE_OUTPUT_FORMAT: 'json',
      }, input.command_timeout_ms)

      const probeLog = path.join(providerDir, 'provider-probe.log.json')
      saveCommandLog(probeLog, probeCommand.join(' '), probe)
      steps.push(buildStepOutput('probe.provider', probeCommand.join(' '), probeLog, probe))
      providerEvidencePaths.push(probeLog)
      recordProviderOnboardingMetric({
        metric: 'step_duration_seconds',
        value: probe.durationMs / 1000,
        env: input.execution_env,
        provider_id: provider.provider_slug,
        step: 'provider_probe',
        status: probe.ok ? 'pass' : 'fail',
      })

      probeOk = probe.ok
      probeTimedOut = probe.timedOut
      if (!probe.ok) {
        reasonCodes.add('provider_onboarding.probe_timeout')
        blockers.push(probe.timedOut ? 'probe timed out' : 'probe failed')
        nextSkillIds.add('probe.provider.github_actions')
      }

      const healthOutput = path.join(providerDir, 'provider-health-evidence.json')
      const healthCommand = ['pnpm', '-C', 'backend', 'evidence:provider-health']
      const health = runCommand(healthCommand[0], healthCommand.slice(1), {
        ...process.env,
        ENVIRONMENT: input.execution_env,
        CASE_ID: runId,
        DISPATCH_ID: `${runId}-${provider.provider_slug}`,
        PROVIDER_ID: provider.provider_slug,
        WINDOW_HOURS: '6',
        EVIDENCE_OUTPUT_FILE: healthOutput,
      }, input.command_timeout_ms)

      const healthLog = path.join(providerDir, 'provider-health-evidence.log.json')
      saveCommandLog(healthLog, healthCommand.join(' '), health)
      steps.push(buildStepOutput('evidence.provider_health', healthCommand.join(' '), healthLog, health))
      providerEvidencePaths.push(healthOutput)
      providerArtifactPaths.push(healthLog)
      recordProviderOnboardingMetric({
        metric: 'step_duration_seconds',
        value: health.durationMs / 1000,
        env: input.execution_env,
        provider_id: provider.provider_slug,
        step: 'provider_health_evidence',
        status: health.ok ? 'pass' : 'fail',
      })
      healthEvidenceOk = health.ok

      const healthEvidence = readJsonSafe(healthOutput)
      extractEvidenceReasonCodes(healthEvidence).forEach((code) => reasonCodes.add(code))
      extractNextSkillIds(healthEvidence).forEach((skillId) => nextSkillIds.add(skillId))

      if (!health.ok) {
        reasonCodes.add('provider_onboarding.scaffold_fail')
        warnings.push('provider-health evidence failed')
        nextSkillIds.add('evidence.provider_health.github_actions')
      }

      if (flags.b2c) {
        if (!input.smoke_base_url) {
          smokeOk = false
          reasonCodes.add('provider_onboarding.smoke_fail')
          blockers.push('B2C smoke requires --smoke_base_url or API_BASE_URL')
        } else {
          const smokeCommand = ['pnpm', '-C', 'backend', 'ci:api-smoke']
          const smoke = runCommand(smokeCommand[0], smokeCommand.slice(1), {
            ...process.env,
            API_BASE_URL: input.smoke_base_url,
            SMOKE_ALLOW_PROTECTED_METRICS: '1',
            SMOKE_ALLOW_PROTECTED_HEALTH: '1',
          }, input.command_timeout_ms)

          const smokeLog = path.join(providerDir, 'api-smoke.log.json')
          saveCommandLog(smokeLog, smokeCommand.join(' '), smoke)
          steps.push(buildStepOutput('ci.api_smoke', smokeCommand.join(' '), smokeLog, smoke))
          providerEvidencePaths.push(smokeLog)
          recordProviderOnboardingMetric({
            metric: 'step_duration_seconds',
            value: smoke.durationMs / 1000,
            env: input.execution_env,
            provider_id: provider.provider_slug,
            step: 'provider_b2c_smoke',
            status: smoke.ok ? 'pass' : 'fail',
          })

          smokeOk = smoke.ok
          if (!smoke.ok) {
            reasonCodes.add('provider_onboarding.smoke_fail')
            blockers.push('B2C smoke failed')
            nextSkillIds.add('probe.provider.github_actions')
          }
        }
      }
    }

    if (input.dry_run) {
      warnings.push('dry_run enabled: scaffold/probe/evidence/smoke execution skipped')
    }

    const remitScore = calculateRemitScore({
      provider,
      scaffoldOk,
      probeOk,
      probeTimedOut,
      healthEvidenceOk,
      smokeOk,
      syntheticCorridorsCount: syntheticCorridors.length,
      dryRun: input.dry_run,
    })

    remitScore.threshold = input.score_threshold

    if (remitScore.total < input.score_threshold) {
      reasonCodes.add('provider_onboarding.score_below_threshold')
      blockers.push(`score ${remitScore.total.toFixed(2)} < threshold ${input.score_threshold.toFixed(2)}`)
      nextSkillIds.add('manual.human_triage')
    }

    const blocked = blockers.length > 0

    if (blocked) {
      reasonCodes.add('provider_onboarding.review_blocked')
    }

    const review = blocked
      ? {
          status: 'blocked' as const,
          next_action: 'resolve blockers then rerun provider onboarding loop',
          blockers: unique(blockers),
          warnings: unique(warnings),
        }
      : {
          status: 'ready_for_staging' as const,
          next_action: input.auto_merge
            ? 'auto_merge enabled; proceed to gated promotion flow after validation artifacts are acknowledged'
            : 'proceed to staging review and promotion checklist',
          blockers: [],
          warnings: unique(warnings),
        }

    const providerArtifact: ProviderArtifact = {
      run_id: runId,
      stage: 'provider_onboarding',
      ci_ref: shortRef(input.ci_ref),
      provider_slug: provider.provider_slug,
      status: blocked ? 'blocked' : (warnings.length > 0 ? 'warn' : 'pass'),
      artifact_paths: unique(providerArtifactPaths),
      evidence_paths: unique(providerEvidencePaths),
      reason_codes: unique(Array.from(reasonCodes)),
      remit_score: remitScore,
      review_card: review,
      next_skill_ids: unique([
        ...Array.from(nextSkillIds),
        ...(blocked ? ['manual.human_triage'] : []),
      ]),
    }

    const providerOutputPath = path.join(providerDir, 'provider-output.json')
    writeJson(providerOutputPath, {
      ...providerArtifact,
      steps,
      synthetic_corridors: syntheticCorridors,
    })

    providerArtifact.artifact_paths.push(providerOutputPath)

    providerArtifact.artifact_paths.forEach((artifact) => allArtifactPaths.add(artifact))
    providerArtifact.evidence_paths.forEach((evidence) => allEvidencePaths.add(evidence))
    providerArtifact.reason_codes.forEach((code) => globalReasonCodes.add(code))

    providers.push(providerArtifact)
    emitProviderMetrics(providerArtifact, input.execution_env)

    if (providerArtifact.status === 'blocked' && !input.continue_on_error) {
      stopAfterFailure = true
    }
  })

  if (!input.dry_run && providers.length > 0) {
    const providersCsv = providers.map((entry) => entry.provider_slug).join(',')
    const corridorsCsv = Array.from(globalCorridors).join(',')

    if (providersCsv && corridorsCsv) {
      const canarySeedCommand = ['pnpm', '-C', 'backend', 'capability:seed-canary']
      const canarySeed = runCommand(canarySeedCommand[0], canarySeedCommand.slice(1), {
        ...process.env,
        CAPABILITY_SEED_PROVIDERS: providersCsv,
        CAPABILITY_SEED_CORRIDORS: corridorsCsv,
        CAPABILITY_SEED_SOURCE: 'provider_onboarding_loop',
        CAPABILITY_SEED_SKIP_RECENT_HOURS: '1',
      }, input.command_timeout_ms)

      const canarySeedLog = path.join(artifactsRoot, 'global', 'capability-seed.log.json')
      saveCommandLog(canarySeedLog, canarySeedCommand.join(' '), canarySeed)
      allArtifactPaths.add(canarySeedLog)

      if (!canarySeed.ok) {
        globalReasonCodes.add('provider_onboarding.scaffold_fail')
      }

      const capabilityProbeCommand = ['pnpm', '-C', 'backend', 'capability:probe']
      const capabilityProbe = runCommand(capabilityProbeCommand[0], capabilityProbeCommand.slice(1), {
        ...process.env,
        CAPABILITY_PROBE_LIMIT: '12',
        CAPABILITY_PROBE_AMOUNT_BUCKET: '500',
        CAPABILITY_PROBE_PAYIN_METHOD: 'bank_transfer',
        CAPABILITY_PROBE_PAYOUT_METHOD: 'bank_deposit',
        CAPABILITY_PROBE_TIERS: 'tier_1,tier_2',
      }, input.command_timeout_ms)

      const capabilityProbeLog = path.join(artifactsRoot, 'global', 'capability-probe.log.json')
      saveCommandLog(capabilityProbeLog, capabilityProbeCommand.join(' '), capabilityProbe)
      allArtifactPaths.add(capabilityProbeLog)

      if (!capabilityProbe.ok) {
        globalReasonCodes.add('provider_onboarding.probe_timeout')
      }

      const capabilityEvidenceOutput = path.join(artifactsRoot, 'global', 'provider-capability-evidence.json')
      const capabilityEvidenceCommand = ['pnpm', '-C', 'backend', 'evidence:provider-capability-probe']
      const capabilityEvidence = runCommand(capabilityEvidenceCommand[0], capabilityEvidenceCommand.slice(1), {
        ...process.env,
        ENVIRONMENT: input.execution_env,
        CASE_ID: runId,
        DISPATCH_ID: `${runId}-capability`,
        CAPABILITY_PROBE_TIERS: 'tier_1,tier_2',
        CAPABILITY_PROBE_LIMIT: '12',
        CAPABILITY_PROBE_AMOUNT_BUCKET: '500',
        CAPABILITY_PROBE_PAYIN_METHOD: 'bank_transfer',
        CAPABILITY_PROBE_PAYOUT_METHOD: 'bank_deposit',
        EVIDENCE_OUTPUT_FILE: capabilityEvidenceOutput,
      }, input.command_timeout_ms)

      const capabilityEvidenceLog = path.join(artifactsRoot, 'global', 'provider-capability-evidence.log.json')
      saveCommandLog(capabilityEvidenceLog, capabilityEvidenceCommand.join(' '), capabilityEvidence)
      allArtifactPaths.add(capabilityEvidenceLog)
      allEvidencePaths.add(capabilityEvidenceOutput)

      const capabilityEvidenceJson = readJsonSafe(capabilityEvidenceOutput)
      extractEvidenceReasonCodes(capabilityEvidenceJson).forEach((code) => globalReasonCodes.add(code))
    }
  }

  const aggregateScore = aggregateRemitScore(providers)
  aggregateScore.threshold = input.score_threshold

  const status: OrchestratorOutput['status'] = providers.every((provider) => provider.status === 'pass')
    ? 'pass'
    : providers.some((provider) => provider.status === 'blocked')
      ? 'fail'
      : 'partial'

  const blockers: string[] = []
  const warnings: string[] = []
  const nextSkillIds = new Set<string>(['provider.onboarding.local'])

  providers.forEach((provider) => {
    provider.review_card.blockers.forEach((blocker) => blockers.push(`${provider.provider_slug}: ${blocker}`))
    provider.review_card.warnings.forEach((warning) => warnings.push(`${provider.provider_slug}: ${warning}`))
    provider.next_skill_ids.forEach((skillId) => nextSkillIds.add(skillId))
  })

  if (status !== 'pass') {
    nextSkillIds.add('manual.human_triage')
  }

  const output: OrchestratorOutput = {
    run_id: runId,
    stage: 'provider_onboarding',
    ci_ref: shortRef(input.ci_ref),
    execution_env: input.execution_env,
    started_at: startedAt,
    finished_at: nowIso(),
    status,
    artifact_paths: unique(Array.from(allArtifactPaths)),
    evidence_paths: unique(Array.from(allEvidencePaths)),
    reason_codes: unique(Array.from(globalReasonCodes)),
    remit_score: aggregateScore,
    review_card: {
      status: blockers.length === 0 ? 'ready_for_staging' : 'blocked',
      next_action: blockers.length === 0
        ? 'review complete; proceed with staging checklist and promotion gates'
        : 'resolve blockers and rerun provider-onboarding-orchestrator',
      blockers: unique(blockers),
      warnings: unique(warnings),
    },
    next_skill_ids: unique(Array.from(nextSkillIds)),
    providers,
    operator_notes: input.operator_notes,
  }

  const outputPath = path.join(artifactsRoot, 'provider-onboarding-run.json')
  writeJson(outputPath, output)

  recordProviderOnboardingMetric({
    metric: 'run_count',
    value: 1,
    env: input.execution_env,
    status: output.status,
  })

  recordProviderOnboardingMetric({
    metric: 'provider_count',
    value: providers.length,
    env: input.execution_env,
    status: output.status,
  })

  logger.info('provider_onboarding_orchestrator_finished', {
    run_id: output.run_id,
    providers: providers.length,
    status: output.status,
    output_path: outputPath,
  })

  return output
}

const main = () => {
  const output = run()
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)

  if (output.status === 'fail') {
    process.exitCode = 1
  }
}

main()
