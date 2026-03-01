import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import { classifyIssueOpsDomain, type IssueOpsDomain } from '../lib/issueops-domain'
import {
  buildHumanInLoopEscalationContract,
  buildReasonCodeRules,
  judgeIssueOpsDecision,
  type JudgeReasonCodeRule,
} from '../lib/issueops-judge'

type CaseEnv = 'dev' | 'staging' | 'prod'
type Severity = 'sev0' | 'sev1' | 'sev2' | 'sev3'
type Domain = IssueOpsDomain
type PlaneHint = 'plane_a' | 'plane_b' | 'plane_c'

type SignalCaseHints = {
  suspected_components?: {
    planes?: PlaneHint[]
    services?: string[]
    providers?: string[]
    queues?: string[]
  }
}

type Signal = {
  signal_id?: string
  observed_at?: string
  env: CaseEnv
  severity: Severity
  signal_sources?: string[]
  domain: Domain
  symptoms: string
  provider_id?: string
  corridor_id?: string
  queue_kind?: string
  target_url?: string
  planes?: PlaneHint[]
  services?: string[]
  queues?: string[]
  risk_tier?: number
  case_hints?: SignalCaseHints
}

type IssueOpsTriageMode = 'live' | 'dry_run'

type CaseAction = 'dispatch_evidence' | 'acknowledge' | 'suppress'

type CaseActionEvent = {
  kind: 'case_action'
  action_id: string
  requested_at: string
  case_id: string
  action: CaseAction
  params?: {
    evidence_only?: boolean
    suppress_minutes?: number
  }
  requested_by?: {
    source?: string
    slack_user_id?: string
    slack_channel_id?: string
    slack_message_ts?: string
  }
}

type SkillExecutor = 'github_actions' | 'aws_scheduled' | 'local_codex' | 'manual'

type SkillDef = {
  skill_id: string
  purpose: string
  executor: SkillExecutor
  command?: string
  workflow?: string
  job?: string
  required_inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  risk_tier: number
}

type SkillCatalog = {
  version: number
  skills: SkillDef[]
}

type SelectedSkill = {
  skill_id: string
  params?: Record<string, unknown>
  stop_on_failure?: boolean
}

type BrainInput = {
  case_state: {
    prd?: unknown
    plan?: unknown
    last_run?: unknown
  }
  signals: Signal[]
  skills_catalog: SkillCatalog
}

type BrainDecision = {
  selected_skills: SelectedSkill[]
  priority?: number
  why?: string
  human_attention_required?: boolean
}

type BrainState = {
  version: number
  seen: Record<string, { processed_at: string; case_id: string }>
}

type CaseLifecycleStatus = 'open' | 'blocked' | 'closed'

type CaseIndexEntry = {
  case_id: string
  env: CaseEnv
  status: CaseLifecycleStatus
  updated_at: string
}

type CaseIndex = {
  version: number
  cases: CaseIndexEntry[]
}

const severityRank: Record<Severity, number> = {
  sev0: 0,
  sev1: 1,
  sev2: 2,
  sev3: 3,
}

const severityToPriority: Record<Severity, number> = {
  sev3: 0,
  sev2: 1,
  sev1: 2,
  sev0: 3,
}

const severityRequiresManualTriage = (severity: Severity): boolean => {
  return severityRank[severity] >= severityRank.sev2
}

const riskLevelFromTier = (riskTier: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (riskTier <= 0) return 'low'
  if (riskTier === 1) return 'medium'
  if (riskTier === 2) return 'high'
  return 'critical'
}

type DispatchIngestionState = {
  version: number
  dispatches: Record<string, { run_id: number; artifact_id?: number; ingested_at: string }>
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const remitScoutDir = path.join(repoRoot, '.remit-scout')
const casesDir = path.join(remitScoutDir, 'cases')
const caseIndexPath = path.join(casesDir, 'index.json')
const skillsCatalogPath = path.join(remitScoutDir, 'skills', 'catalog.yaml')
const reasonCodeCatalogPath = path.join(remitScoutDir, 'reason-codes', 'catalog.yaml')
const inboxDir = path.join(repoRoot, 'ops', 'brain', 'inbox')
const outboxDir = path.join(repoRoot, 'ops', 'brain', 'outbox')
const statePath = path.join(repoRoot, 'ops', 'brain', 'state', 'brain-state.json')
const dispatchIngestionPath = path.join(repoRoot, 'ops', 'brain', 'state', 'dispatch-ingestion.json')
const providerCatalogPath = path.join(remitScoutDir, 'providers', 'catalog.json')

const frontdeskStateDir = path.join(repoRoot, 'ops', 'frontdesk', 'state')
const slackMapPath = path.join(frontdeskStateDir, 'case-slack-map.json')
const suppressionsPath = path.join(frontdeskStateDir, 'suppressions.json')

const triageDryRunBoundedEvidenceNote =
  'Dry-run triage mode simulates dispatches without external workflow execution; use outbox payload pointers as bounded evidence.'
const triageDryRunRollbackEvidenceNote =
  'Replay in live mode by rerunning the same case/skills after setting BRAIN_TRIAGE_MODE=live and preserving dispatch request payloads.'

const nowIso = () => new Date().toISOString()

const toSortableTimestampToken = (value: unknown): string => {
  const raw = String(value ?? '').trim()
  const parsed = raw ? new Date(raw) : new Date()
  const resolved = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return resolved.toISOString().replace(/[^\d]/g, '').slice(0, 17)
}

const sanitizeFilenameToken = (value: unknown, fallback: string): string => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

const toRouteOrderToken = (value: unknown): string => {
  const numeric = Number(value)
  const normalized = Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0
  return String(normalized).padStart(4, '0')
}

const toRequestedAtSortKey = (value: unknown): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return '9999-12-31T23:59:59.999Z'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return '9999-12-31T23:59:59.999Z'
  return parsed.toISOString()
}

const resolveIssueOpsTriageMode = (value: unknown): IssueOpsTriageMode => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (
    normalized === 'dry_run'
    || normalized === 'dry-run'
    || normalized === 'dryrun'
    || normalized === 'simulation'
    || normalized === 'simulate'
  ) {
    return 'dry_run'
  }
  return 'live'
}

const getIssueOpsTriageMode = (): IssueOpsTriageMode => {
  return resolveIssueOpsTriageMode(process.env.BRAIN_TRIAGE_MODE)
}

const isIssueOpsTriageDryRun = (): boolean => {
  return getIssueOpsTriageMode() === 'dry_run'
}

const queueHintTokens = [
  'ingest_fanout_tier2',
  'ingest_fanout',
  'quote_refresh',
  'fx_rate_refresh',
  'ops_alerts',
  'gold_live',
  'notifications',
  'exports',
]

let providerHintTokensCache: string[] | null = null
let reasonCodeRulesCache: Map<string, JudgeReasonCodeRule> | null = null

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex')

const buildDispatchOutboxFilename = (args: {
  caseId: string
  skillId: string
  requestedAt: string
  routeOrder: number
  dispatchId?: string
}): string => {
  const caseToken = sanitizeFilenameToken(args.caseId, 'case')
  const skillToken = sanitizeFilenameToken(args.skillId, 'skill')
  const routeOrderToken = toRouteOrderToken(args.routeOrder)
  const timestampToken = toSortableTimestampToken(args.requestedAt)
  const fallbackDispatchToken = sha256(
    `${args.caseId}|${args.skillId}|${args.requestedAt}|${routeOrderToken}`,
  ).slice(0, 12)
  const dispatchToken = sanitizeFilenameToken(args.dispatchId, fallbackDispatchToken)
  return `dispatch-${timestampToken}-${routeOrderToken}-${caseToken}-${skillToken}-${dispatchToken}.json`
}

const buildRunOutputFilename = (args: { dispatchId: string; finishedAt: string }): string => {
  const dispatchToken = sanitizeFilenameToken(args.dispatchId, 'dispatch')
  const timestampToken = toSortableTimestampToken(args.finishedAt)
  return `run-${timestampToken}-${dispatchToken}.json`
}

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const toHintText = (...values: unknown[]): string => {
  return values
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value.map((entry) => String(entry ?? '').trim())
      }
      return String(value ?? '').trim()
    })
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const coerceStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
}

const coercePlaneHints = (value: unknown): PlaneHint[] => {
  return coerceStringList(value)
    .filter((entry): entry is PlaneHint =>
      entry === 'plane_a' || entry === 'plane_b' || entry === 'plane_c')
}

const parseSignalCaseHints = (value: unknown): SignalCaseHints | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const components = raw.suspected_components
  if (!components || typeof components !== 'object' || Array.isArray(components)) return undefined

  const parsed = components as Record<string, unknown>
  const planes = coercePlaneHints(parsed.planes)
  const services = coerceStringList(parsed.services)
  const providers = coerceStringList(parsed.providers)
  const queues = coerceStringList(parsed.queues)

  if (planes.length === 0 && services.length === 0 && providers.length === 0 && queues.length === 0) {
    return undefined
  }

  return {
    suspected_components: {
      ...(planes.length > 0 ? { planes } : {}),
      ...(services.length > 0 ? { services } : {}),
      ...(providers.length > 0 ? { providers } : {}),
      ...(queues.length > 0 ? { queues } : {}),
    },
  }
}

const getProviderHintTokens = (): string[] => {
  if (providerHintTokensCache) return providerHintTokensCache
  if (!fs.existsSync(providerCatalogPath)) {
    providerHintTokensCache = []
    return providerHintTokensCache
  }

  try {
    const parsed = JSON.parse(readUtf8(providerCatalogPath)) as any
    const providers = Array.isArray(parsed?.providers) ? parsed.providers : []
    const providerIds = providers
      .map((entry: any) => String(entry?.provider_id || '').trim().toLowerCase())
      .filter(Boolean)
    providerHintTokensCache = Array.from(new Set<string>(providerIds))
      .sort((left, right) => right.length - left.length)
  } catch {
    providerHintTokensCache = []
  }

  return providerHintTokensCache ?? []
}

const matchHintTokens = (haystack: string, tokens: string[]): string[] => {
  if (!haystack) return []

  const matches: string[] = []
  for (const token of tokens) {
    const normalized = String(token || '').trim().toLowerCase()
    if (!normalized) continue
    const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalized)}(?:[^a-z0-9]|$)`)
    if (pattern.test(haystack) && !matches.includes(normalized)) {
      matches.push(normalized)
    }
  }

  return matches
}

const resolveCaseHintComponents = (signal: Signal) => {
  const explicitHints = signal.case_hints?.suspected_components
  const hintText = toHintText(signal.signal_id, signal.signal_sources, signal.symptoms)
  const hintedProviders = matchHintTokens(hintText, getProviderHintTokens())
  const hintedQueues = matchHintTokens(hintText, queueHintTokens)
  const hintedPlanes: PlaneHint[] = []

  if (
    signal.domain === 'provider_health'
    || signal.domain === 'queue'
    || Boolean(signal.provider_id)
    || Boolean(signal.queue_kind)
    || hintedProviders.length > 0
    || hintedQueues.length > 0
  ) {
    hintedPlanes.push('plane_b')
  }
  if (signal.domain === 'api_latency' || Boolean(signal.target_url)) {
    hintedPlanes.push('plane_a')
  }

  return {
    planes: mergeUniqueStrings(explicitHints?.planes, hintedPlanes).filter((plane): plane is PlaneHint =>
      plane === 'plane_a' || plane === 'plane_b' || plane === 'plane_c'),
    services: mergeUniqueStrings(explicitHints?.services),
    providers: mergeUniqueStrings(explicitHints?.providers, hintedProviders),
    queues: mergeUniqueStrings(explicitHints?.queues, hintedQueues),
  }
}

const safeCaseId = (prefix: string) => {
  const base = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `case-${Date.now()}`
}

const toSlugToken = (value: string, fallback = 'signal') => {
  const base = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

const normalizeSignalText = (value: unknown, maxLength = 160): string => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (!normalized) return ''
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized
}

const signalIdentityFingerprint = (signal: Signal): string => {
  const payload = {
    env: signal.env,
    domain: signal.domain,
    provider_id: normalizeSignalText(signal.provider_id, 80),
    corridor_id: normalizeSignalText(signal.corridor_id, 80),
    queue_kind: normalizeSignalText(signal.queue_kind, 80),
    target_url: normalizeSignalText(signal.target_url, 160),
    symptoms: normalizeSignalText(signal.symptoms, 200),
    signal_sources: (signal.signal_sources ?? [])
      .map((entry) => normalizeSignalText(entry, 80))
      .filter(Boolean)
      .sort(),
  }
  return sha256(JSON.stringify(payload))
}

const deterministicCaseIdFromSignal = (signal: Signal): string => {
  const subject = [signal.provider_id, signal.queue_kind, signal.corridor_id, signal.domain]
    .map((entry) => toSlugToken(String(entry || '')))
    .find((entry) => entry && entry !== 'other')
    || 'signal'
  const fingerprint = signalIdentityFingerprint(signal).slice(0, 10)
  return safeCaseId(`case-${signal.env}-${signal.domain}-${subject}-${fingerprint}`)
}

const parseCaseEnv = (value: unknown): CaseEnv => {
  if (value === 'prod' || value === 'staging' || value === 'dev') return value
  return 'dev'
}

const parseCaseLifecycleStatus = (value: unknown): CaseLifecycleStatus => {
  if (value === 'open' || value === 'blocked' || value === 'closed') return value
  return 'open'
}

const loadCaseIndex = (): CaseIndex => {
  if (!fs.existsSync(caseIndexPath)) return { version: 1, cases: [] }
  const parsed = safeJson(readUtf8(caseIndexPath)) as any
  const casesRaw: Record<string, unknown>[] = Array.isArray(parsed?.cases)
    ? parsed.cases as Record<string, unknown>[]
    : []
  const cases = casesRaw
    .map((entry: Record<string, unknown>): CaseIndexEntry | null => {
      const caseId = String(entry?.case_id || '').trim()
      const updatedAt = String(entry?.updated_at || '').trim() || nowIso()
      if (!caseId) return null
      return {
        case_id: caseId,
        env: parseCaseEnv(entry?.env),
        status: parseCaseLifecycleStatus(entry?.status),
        updated_at: updatedAt,
      }
    })
    .filter((entry: CaseIndexEntry | null): entry is CaseIndexEntry => Boolean(entry))

  return {
    version: Number(parsed?.version) || 1,
    cases,
  }
}

const saveCaseIndex = (value: CaseIndex) => {
  fs.mkdirSync(path.dirname(caseIndexPath), { recursive: true })
  writeUtf8(caseIndexPath, JSON.stringify(value, null, 2) + '\n')
}

const upsertCaseLifecycle = (caseId: string, env: CaseEnv, status: CaseLifecycleStatus) => {
  const nextUpdatedAt = nowIso()
  const index = loadCaseIndex()
  const existing = index.cases.find((entry) => entry.case_id === caseId)
  if (existing) {
    existing.env = env
    existing.status = status
    existing.updated_at = nextUpdatedAt
  } else {
    index.cases.push({
      case_id: caseId,
      env,
      status,
      updated_at: nextUpdatedAt,
    })
  }
  index.cases.sort((left, right) => left.case_id.localeCompare(right.case_id))
  saveCaseIndex(index)
}

const lifecycleStatusFromRecommendation = (recommendation: string): CaseLifecycleStatus => {
  if (recommendation === 'close_case') return 'closed'
  if (recommendation === 'escalate') return 'blocked'
  return 'open'
}

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')
const writeUtf8 = (p: string, value: string) => fs.writeFileSync(p, value, 'utf8')

const loadReasonCodeRules = (): Map<string, JudgeReasonCodeRule> => {
  if (reasonCodeRulesCache) return reasonCodeRulesCache
  if (!fs.existsSync(reasonCodeCatalogPath)) {
    reasonCodeRulesCache = new Map()
    return reasonCodeRulesCache
  }

  try {
    const parsed = parseYaml(readUtf8(reasonCodeCatalogPath))
    reasonCodeRulesCache = buildReasonCodeRules(parsed)
  } catch {
    reasonCodeRulesCache = new Map()
  }

  return reasonCodeRulesCache
}

const defaultIssueopsSpecRefs = [
  'SPECS/schema.prd.json',
  'SPECS/schema.plan.json',
  'docs/architecture/issueops.md',
  'docs/architecture/triangulation-roadmap.md',
  'SPECS/agents-bundle/agents/rag/issueops-operator.md',
  'SPECS/agents-bundle/agents/rag/agent-orchestration.md',
  'SPECS/agent-match.md',
  'SPECS/agents.md',
  'SPECS/remit-scout.agents.md',
]

const defaultPlanSnapshotSpecRefs = [
  'SPECS/schema.plan.json',
  'docs/architecture/issueops.md',
]

const toBoundedNote = (value: string, maxLength: number): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength)
}

const toBoundedInteger = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const rounded = Math.floor(parsed)
  if (rounded < min) return min
  if (rounded > max) return max
  return rounded
}

const toTimestampMs = (value: unknown): number | null => {
  const token = String(value || '').trim()
  if (!token) return null
  const parsed = Date.parse(token)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

const appendBounded = (target: string[], value: string, maxItems = 10) => {
  if (target.length >= maxItems) return
  target.push(value)
}

const emitCaseIndexRetentionObservability = () => {
  const measuredAt = nowIso()
  const nowMs = Date.parse(measuredAt)
  const msPerDay = 24 * 60 * 60 * 1000

  const closedCaseRetentionDays = toBoundedInteger(
    process.env.BRAIN_CASE_INDEX_RETENTION_DAYS,
    90,
    1,
    3650,
  )
  const runFileRetentionDays = toBoundedInteger(
    process.env.BRAIN_CASE_RUN_RETENTION_DAYS,
    90,
    1,
    3650,
  )

  const index = loadCaseIndex()
  const indexedCaseIds = new Set(
    index.cases
      .map((entry) => String(entry.case_id || '').trim())
      .filter(Boolean),
  )

  let openCount = 0
  let blockedCount = 0
  let closedCount = 0
  let closedCasesOverRetention = 0
  const closedCasesOverRetentionRefs: string[] = []
  let oldestIndexedAgeDays = 0
  const indexedMissingCaseDirs: string[] = []

  for (const entry of index.cases) {
    if (entry.status === 'open') openCount += 1
    else if (entry.status === 'blocked') blockedCount += 1
    else if (entry.status === 'closed') closedCount += 1

    const caseId = String(entry.case_id || '').trim()
    if (!caseId) continue
    const caseDir = path.join(casesDir, caseId)
    if (!fs.existsSync(caseDir) || !fs.statSync(caseDir).isDirectory()) {
      appendBounded(indexedMissingCaseDirs, caseId)
    }

    const updatedAtMs = toTimestampMs(entry.updated_at)
    if (updatedAtMs === null || nowMs < updatedAtMs) continue

    const ageDays = Math.floor((nowMs - updatedAtMs) / msPerDay)
    if (ageDays > oldestIndexedAgeDays) {
      oldestIndexedAgeDays = ageDays
    }
    if (entry.status === 'closed' && ageDays > closedCaseRetentionDays) {
      closedCasesOverRetention += 1
      appendBounded(closedCasesOverRetentionRefs, `${caseId}@${ageDays}d`)
    }
  }

  const caseDirNames = fs.existsSync(casesDir)
    ? fs.readdirSync(casesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right))
    : []

  const unindexedCaseDirs: string[] = []
  let runFilesTotal = 0
  let runFilesOverRetention = 0
  const staleRunRefs: string[] = []

  for (const caseDirName of caseDirNames) {
    if (!indexedCaseIds.has(caseDirName)) {
      appendBounded(unindexedCaseDirs, caseDirName)
    }

    const runsDir = path.join(casesDir, caseDirName, 'runs')
    if (!fs.existsSync(runsDir) || !fs.statSync(runsDir).isDirectory()) continue

    const runFiles = fs.readdirSync(runsDir)
      .filter((fileName) => fileName.endsWith('.json'))
      .sort((left, right) => left.localeCompare(right))

    for (const runFile of runFiles) {
      const runPath = path.join(runsDir, runFile)
      let stats: fs.Stats
      try {
        stats = fs.statSync(runPath)
      } catch {
        continue
      }

      runFilesTotal += 1
      if (nowMs < stats.mtimeMs) continue

      const ageDays = Math.floor((nowMs - stats.mtimeMs) / msPerDay)
      if (ageDays > runFileRetentionDays) {
        runFilesOverRetention += 1
        appendBounded(staleRunRefs, `${caseDirName}/runs/${runFile}@${ageDays}d`)
      }
    }
  }

  const policyViolations =
    indexedMissingCaseDirs.length
    + unindexedCaseDirs.length
    + closedCasesOverRetention
    + runFilesOverRetention

  console.log(JSON.stringify({
    event: 'issueops_case_index_retention@v1',
    measured_at: measuredAt,
    status: policyViolations > 0 ? 'drift' : 'ok',
    case_index: {
      version: index.version,
      total_cases: index.cases.length,
      status_counts: {
        open: openCount,
        blocked: blockedCount,
        closed: closedCount,
      },
      indexed_missing_case_dirs: {
        count: indexedMissingCaseDirs.length,
        refs: indexedMissingCaseDirs,
      },
      unindexed_case_dirs: {
        count: unindexedCaseDirs.length,
        refs: unindexedCaseDirs,
      },
      oldest_indexed_case_age_days: oldestIndexedAgeDays,
    },
    retention_policy: {
      closed_case_retention_days: closedCaseRetentionDays,
      run_file_retention_days: runFileRetentionDays,
    },
    retention_measurement: {
      total_run_files: runFilesTotal,
      closed_cases_over_retention: {
        count: closedCasesOverRetention,
        refs: closedCasesOverRetentionRefs,
      },
      run_files_over_retention: {
        count: runFilesOverRetention,
        refs: staleRunRefs,
      },
    },
    bounded_evidence_note: 'Measurements use bounded counts and max-10 refs from case index + run file metadata only.',
    rollback_evidence_note: 'No files were deleted; use listed refs to replay, verify, or manually roll back retention actions.',
  }))
}

const buildTriageTimeboxContext = (caseId: string, decisionAt: string) => {
  const maxIterateCount = toBoundedInteger(
    process.env.BRAIN_TRIAGE_TIMEBOX_MAX_ITERATE_LOOPS,
    3,
    1,
    1000,
  )
  const maxElapsedMinutes = toBoundedInteger(
    process.env.BRAIN_TRIAGE_TIMEBOX_MAX_MINUTES,
    90,
    5,
    24 * 60,
  )

  const runsDir = path.join(casesDir, caseId, 'runs')
  if (!fs.existsSync(runsDir)) {
    return {
      previousIterateCount: 0,
      maxIterateCount,
      maxElapsedMinutes,
      decisionAt,
    }
  }

  const runFiles = fs.readdirSync(runsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right))

  let previousIterateCount = 0
  let streakStartedAt: string | undefined
  for (let idx = runFiles.length - 1; idx >= 0; idx -= 1) {
    const runPath = path.join(runsDir, runFiles[idx])
    const run = safeJson(readUtf8(runPath)) as Record<string, unknown> | null
    if (!run) continue

    const recommendation = String(
      run.next_recommendation
      || ((run.decision_record && typeof run.decision_record === 'object')
        ? (run.decision_record as Record<string, unknown>).decision
        : ''),
    ).trim()
    if (recommendation !== 'iterate') break

    previousIterateCount += 1
    const finishedAt = String(run.finished_at || '').trim()
    if (finishedAt) streakStartedAt = finishedAt
  }

  return {
    previousIterateCount,
    maxIterateCount,
    maxElapsedMinutes,
    streakStartedAt,
    decisionAt,
  }
}

const buildTraceability = () => {
  return {
    version: 'v1',
    task_lifecycle_version: 'v1',
    runtime_stage_gates: {
      'cluster.issueops.contract@v1': [
        'gate.intake_ready@v1',
        'gate.spec_refs_resolved@v1',
      ],
      'cluster.issueops.execution@v1': [
        'gate.incident_task_conversion_stable@v1',
        'gate.bounded_evidence_captured@v1',
        'gate.rollback_evidence_captured@v1',
      ],
    },
    parallelizable_tag: 'parallel.serial_only@v1',
    spec_refs: defaultIssueopsSpecRefs,
    bounded_evidence: true,
    rollback_evidence: true,
  }
}

const buildAcceptanceProof = (sourceNote: string, acceptanceNote: string) => {
  return {
    source_note: toBoundedNote(sourceNote, 300),
    acceptance_note: toBoundedNote(acceptanceNote, 500),
    bounded_evidence_note: 'Use bounded evidence summaries and artifact pointers only.',
    rollback_evidence_note: 'Document rollback path and proof reference before promote/close decisions.',
  }
}

const buildInitialPlanSnapshots = () => {
  return [
    {
      snapshot_id: 'snapshot.plan_created@v1',
      captured_at: nowIso(),
      trigger: 'plan_created',
      summary: 'Initial plan snapshot captured for historical audit replay.',
      spec_refs: defaultPlanSnapshotSpecRefs,
      bounded_evidence_note: 'Store bounded evidence pointers only; never paste unbounded logs.',
      rollback_evidence_note: 'Capture rollback evidence pointers before execution handoff.',
    },
  ]
}

const appendPlanSnapshot = (existing: unknown, trigger: string, summary: string) => {
  const snapshots = Array.isArray(existing) ? existing : []
  const capturedAt = nowIso()
  const snapshot = {
    snapshot_id: `snapshot.${trigger}@v1.${capturedAt.replace(/[^\d]/g, '').slice(0, 14)}`,
    captured_at: capturedAt,
    trigger,
    summary,
    spec_refs: defaultPlanSnapshotSpecRefs,
    bounded_evidence_note: 'Store bounded evidence pointers only; never paste unbounded logs.',
    rollback_evidence_note: 'Capture rollback evidence pointers before execution handoff.',
  }
  return [...snapshots, snapshot].slice(-25)
}

const mergeUniqueStrings = (...lists: unknown[]): string[] => {
  const merged: string[] = []
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      const value = String(item || '').trim()
      if (!value) continue
      if (!merged.includes(value)) merged.push(value)
    }
  }
  return merged
}

const mergeSeverity = (left: unknown, right: Severity): Severity => {
  const normalizedLeft = (left === 'sev0' || left === 'sev1' || left === 'sev2' || left === 'sev3')
    ? left
    : 'sev0'
  return severityRank[normalizedLeft] >= severityRank[right] ? normalizedLeft : right
}

const safeJson = (raw: string): any => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const failureBundleArchivePlaceholder = '[redacted:failure_bundle_archive]'

const redactFailureBundleArchiveRefs = (raw: string): { text: string; redacted: boolean } => {
  const input = String(raw || '')
  const normalized = input.toLowerCase()
  const mentionsFailureBundle = normalized.includes('failure bundle')
    || normalized.includes('failure_bundle')
    || normalized.includes('failure-bundle')

  let redacted = false
  const shouldRedactToken = (token: string): boolean => {
    const normalizedToken = token.toLowerCase()
    const tokenLooksArchive = normalizedToken.includes('archive')
      || normalizedToken.includes('.zip')
      || normalizedToken.includes('.tar.gz')
      || normalizedToken.includes('.tgz')
    const tokenMentionsBundle = normalizedToken.includes('bundle')
      || normalizedToken.includes('failure_bundle')
      || normalizedToken.includes('failure-bundle')
    return tokenLooksArchive && (tokenMentionsBundle || mentionsFailureBundle)
  }

  const redactTokenMatch = (value: string): string => {
    if (!shouldRedactToken(value)) return value
    redacted = true
    return failureBundleArchivePlaceholder
  }

  const redactedLinks = input.replace(/\bhttps?:\/\/[^\s<>()"'`]+/gi, (value) => redactTokenMatch(value))
  const redactedS3 = redactedLinks.replace(/\bs3:\/\/[^\s<>()"'`]+/gi, (value) => redactTokenMatch(value))
  const redactedPaths = redactedS3.replace(/(?:\/[\w./:@-]*\.(?:zip|tar\.gz|tgz)|[A-Za-z]:\\[\w.\\:@-]*\.(?:zip|tar\.gz|tgz))/gi, (value) => redactTokenMatch(value))

  return { text: redactedPaths, redacted }
}

const toSlackSafeFindingMessage = (raw: unknown): { text: string; redacted: boolean } => {
  const compact = String(raw || '').replace(/\s+/g, ' ').trim()
  const redacted = redactFailureBundleArchiveRefs(compact)
  return {
    text: redacted.text.slice(0, 500),
    redacted: redacted.redacted,
  }
}

const loadSkillCatalog = (): SkillCatalog => {
  const raw = parseYaml(readUtf8(skillsCatalogPath)) as any
  const version = Number(raw?.version)
  const skills = Array.isArray(raw?.skills) ? raw.skills : []
  if (!Number.isInteger(version) || version < 1 || skills.length === 0) {
    throw new Error(`Invalid skill catalog: ${skillsCatalogPath}`)
  }
  return { version, skills }
}

const loadState = (): BrainState => {
  if (!fs.existsSync(statePath)) return { version: 1, seen: {} }
  const parsed = JSON.parse(readUtf8(statePath)) as any
  return {
    version: Number(parsed?.version) || 1,
    seen: (parsed?.seen && typeof parsed.seen === 'object') ? parsed.seen : {},
  }
}

const saveState = (state: BrainState) => {
  fs.mkdirSync(path.dirname(statePath), { recursive: true })
  writeUtf8(statePath, JSON.stringify(state, null, 2) + '\n')
}

const loadDispatchIngestionState = (): DispatchIngestionState => {
  if (!fs.existsSync(dispatchIngestionPath)) return { version: 1, dispatches: {} }
  const parsed = safeJson(readUtf8(dispatchIngestionPath)) as any
  return {
    version: Number(parsed?.version) || 1,
    dispatches: (parsed?.dispatches && typeof parsed.dispatches === 'object') ? parsed.dispatches : {},
  }
}

const saveDispatchIngestionState = (state: DispatchIngestionState) => {
  fs.mkdirSync(path.dirname(dispatchIngestionPath), { recursive: true })
  writeUtf8(dispatchIngestionPath, JSON.stringify(state, null, 2) + '\n')
}

const dispatchGithubWorkflow = async (
  workflowPath: string,
  inputs: Record<string, unknown>,
): Promise<{ dispatched: boolean; simulated: boolean; status: number; message?: string }> => {
  if (isIssueOpsTriageDryRun()) {
    return {
      dispatched: true,
      simulated: true,
      status: 0,
      message: 'BRAIN_TRIAGE_MODE=dry_run (simulation: no external workflow dispatch)',
    }
  }

  const enabled = String(process.env.BRAIN_DISPATCH_GITHUB_ACTIONS || '').trim() === '1'
  const repo = String(process.env.GITHUB_REPOSITORY || '').trim() // "owner/name"
  const token = String(process.env.GITHUB_TOKEN || '').trim()
  const ref = String(process.env.GITHUB_REF || 'main')
    .trim()
    .replace(/^refs\/heads\//, '') || 'main'

  if (!enabled) return { dispatched: false, simulated: false, status: 0, message: 'BRAIN_DISPATCH_GITHUB_ACTIONS!=1' }
  if (!repo || !token) return { dispatched: false, simulated: false, status: 0, message: 'Missing GITHUB_REPOSITORY or GITHUB_TOKEN' }

  const workflowFile = path.basename(workflowPath)
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`

  const stringInputs: Record<string, string> = {}
  for (const [k, v] of Object.entries(inputs || {})) {
    if (v === undefined || v === null) continue
    stringInputs[k] = typeof v === 'string' ? v : JSON.stringify(v)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/vnd.github+json',
      'authorization': `Bearer ${token}`,
      'user-agent': 'remit-scout-brain',
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ref, inputs: stringInputs }),
  })

  if (res.status === 204) return { dispatched: true, simulated: false, status: res.status }
  const text = await res.text().catch(() => '')
  return { dispatched: false, simulated: false, status: res.status, message: text.slice(0, 1000) }
}

const createGithubIssue = async (args: {
  caseId: string
  signal: Signal
  decision: BrainDecision
}): Promise<{ ok: boolean; url?: string; number?: number; error?: string }> => {
  const enabled = String(process.env.BRAIN_CREATE_GITHUB_ISSUE || '').trim() === '1'
  const repo = String(process.env.GITHUB_REPOSITORY || '').trim() // "owner/name"
  const token = String(process.env.GITHUB_TOKEN || '').trim()

  if (!enabled) return { ok: false, error: 'BRAIN_CREATE_GITHUB_ISSUE!=1' }
  if (!repo || !token) return { ok: false, error: 'Missing GITHUB_REPOSITORY or GITHUB_TOKEN' }

  const titleParts = [
    '[IssueOps]',
    args.caseId,
    args.signal.env,
    args.signal.domain,
    args.signal.provider_id ? `provider=${args.signal.provider_id}` : null,
  ].filter(Boolean)

  const title = titleParts.join(' ')
  const body = [
    `## Case`,
    ``,
    `- Case ID: \`${args.caseId}\``,
    `- PRD: \`.remit-scout/cases/${args.caseId}/prd.yaml\``,
    `- Plan: \`.remit-scout/cases/${args.caseId}/plan.yaml\``,
    ``,
    `## Signal`,
    ``,
    `- Env: \`${args.signal.env}\``,
    `- Severity: \`${args.signal.severity}\``,
    `- Domain: \`${args.signal.domain}\``,
    `- Symptoms: ${args.signal.symptoms}`,
    ``,
    `## Brain decision`,
    ``,
    `\`\`\`json`,
    JSON.stringify(args.decision, null, 2),
    `\`\`\``,
    ``,
    `## Next steps`,
    ``,
    `- Run/verify the skills in \`.remit-scout/cases/${args.caseId}/plan.yaml\`.`,
    `- Attach evidence outputs to \`.remit-scout/cases/${args.caseId}/runs/\` (or link to artifacts).`,
  ].join('\n')

  const url = `https://api.github.com/repos/${repo}/issues`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/vnd.github+json',
      'authorization': `Bearer ${token}`,
      'user-agent': 'remit-scout-brain',
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    return { ok: false, error: `GitHub issue create failed: ${res.status} ${JSON.stringify(json)}`.slice(0, 2000) }
  }

  return { ok: true, url: String(json?.html_url || ''), number: Number(json?.number) }
}

const updateCasePrdLinks = (caseId: string, patch: { github_issue?: string; github_pr?: string }) => {
  const prdPath = path.join(casesDir, caseId, 'prd.yaml')
  if (!fs.existsSync(prdPath)) return
  const prd = parseYaml(readUtf8(prdPath)) as any
  prd.links = prd.links || {}
  if (patch.github_issue !== undefined) prd.links.github_issue = patch.github_issue
  if (patch.github_pr !== undefined) prd.links.github_pr = patch.github_pr
  writeUtf8(prdPath, stringifyYaml(prd))
}

const updateCasePrd = (caseId: string, patch: { human_owner?: string; owner_assignment?: Record<string, unknown> }) => {
  const prdPath = path.join(casesDir, caseId, 'prd.yaml')
  if (!fs.existsSync(prdPath)) return
  const prd = parseYaml(readUtf8(prdPath)) as any
  if (patch.human_owner !== undefined) prd.human_owner = patch.human_owner
  if (patch.owner_assignment !== undefined) prd.owner_assignment = patch.owner_assignment
  writeUtf8(prdPath, stringifyYaml(prd))
}

const listSignalFiles = (): string[] => {
  if (!fs.existsSync(inboxDir)) return []
  return fs
    .readdirSync(inboxDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(inboxDir, f))
    .sort((left, right) => left.localeCompare(right))
}

const parseSignalFile = (p: string): Signal[] => {
  const raw = JSON.parse(readUtf8(p)) as any
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.signals)) return raw.signals
  return [raw]
}

const isCaseActionEvent = (raw: any): raw is CaseActionEvent => {
  if (!raw || typeof raw !== 'object') return false
  if (raw.kind !== 'case_action') return false
  if (typeof raw.case_id !== 'string' || raw.case_id.trim() === '') return false
  if (typeof raw.action !== 'string' || raw.action.trim() === '') return false
  return true
}

const isValidSignal = (signal: any): signal is Signal => {
  const envOk = signal?.env === 'dev' || signal?.env === 'staging' || signal?.env === 'prod'
  const sevOk = signal?.severity === 'sev0' || signal?.severity === 'sev1' || signal?.severity === 'sev2' || signal?.severity === 'sev3'
  const symptomsOk = typeof signal?.symptoms === 'string' && signal.symptoms.trim().length > 0
  return Boolean(envOk && sevOk && symptomsOk)
}

type SlackCaseMap = {
  version: number
  cases: Record<string, { channel_id: string; message_ts: string; thread_ts: string; posted_at: string }>
}

type SlackSuppressions = {
  version: number
  cases: Record<string, { until: string; reason?: string; requested_by?: unknown }>
}

const loadSlackCaseMap = (): SlackCaseMap => {
  if (!fs.existsSync(slackMapPath)) return { version: 1, cases: {} }
  const parsed = safeJson(readUtf8(slackMapPath))
  return {
    version: Number(parsed?.version) || 1,
    cases: (parsed?.cases && typeof parsed.cases === 'object') ? parsed.cases : {},
  }
}

const saveSlackCaseMap = (map: SlackCaseMap) => {
  fs.mkdirSync(path.dirname(slackMapPath), { recursive: true })
  writeUtf8(slackMapPath, JSON.stringify(map, null, 2) + '\n')
}

const loadSuppressions = (): SlackSuppressions => {
  if (!fs.existsSync(suppressionsPath)) return { version: 1, cases: {} }
  const parsed = safeJson(readUtf8(suppressionsPath))
  return {
    version: Number(parsed?.version) || 1,
    cases: (parsed?.cases && typeof parsed.cases === 'object') ? parsed.cases : {},
  }
}

const saveSuppressions = (s: SlackSuppressions) => {
  fs.mkdirSync(path.dirname(suppressionsPath), { recursive: true })
  writeUtf8(suppressionsPath, JSON.stringify(s, null, 2) + '\n')
}

const isCaseSuppressed = (caseId: string): boolean => {
  const s = loadSuppressions()
  const entry = s.cases[caseId]
  if (!entry?.until) return false
  const untilMs = Date.parse(String(entry.until))
  if (!Number.isFinite(untilMs)) return false
  if (Date.now() < untilMs) return true
  // Expired; clean it up opportunistically.
  delete s.cases[caseId]
  saveSuppressions(s)
  return false
}

const slackApi = async (method: string, payload: Record<string, unknown>) => {
  const token = String(process.env.SLACK_BOT_TOKEN || '').trim()
  if (!token) return { ok: false, error: 'Missing SLACK_BOT_TOKEN' }

  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json().catch(() => null)
  return json || { ok: false, error: `slack_api_invalid_json:${method}` }
}

const postSlackThreadReply = async (caseId: string, text: string) => {
  const map = loadSlackCaseMap()
  const entry = map.cases[caseId]
  if (!entry?.channel_id || !entry?.thread_ts) return
  await slackApi('chat.postMessage', {
    channel: entry.channel_id,
    text,
    thread_ts: entry.thread_ts,
  })
}

const maybePostSlackCaseCard = async (args: {
  caseId: string
  signal: Signal
  decision: BrainDecision
  githubIssueUrl?: string
}) => {
  const enabled = String(process.env.BRAIN_SLACK_POST_CASE_CARDS || '').trim() === '1'
  const channel = String(process.env.SLACK_CASES_CHANNEL_ID || '').trim()
  if (!enabled || !channel) return

  if (isCaseSuppressed(args.caseId)) return

  const map = loadSlackCaseMap()
  if (map.cases[args.caseId]) return

  const value = JSON.stringify({ case_id: args.caseId, env: args.signal.env })
  const title = `[IssueOps] ${args.caseId} ${args.signal.env} ${args.signal.severity} ${args.signal.domain}`
  const lines: string[] = []
  lines.push(`*Symptoms:* ${args.signal.symptoms}`)
  if (args.signal.provider_id) lines.push(`*Provider:* \`${args.signal.provider_id}\``)
  if (args.signal.corridor_id) lines.push(`*Corridor:* \`${args.signal.corridor_id}\``)
  if (args.signal.queue_kind) lines.push(`*Queue:* \`${args.signal.queue_kind}\``)
  if (args.signal.target_url) lines.push(`*Target URL:* ${args.signal.target_url}`)

  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: title.slice(0, 150) } },
    { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n').slice(0, 2900) } },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `PRD: \`.remit-scout/cases/${args.caseId}/prd.yaml\`` },
        { type: 'mrkdwn', text: `Plan: \`.remit-scout/cases/${args.caseId}/plan.yaml\`` },
      ],
    },
    {
      type: 'actions',
      elements: [
        { type: 'button', action_id: 'case_acknowledge', text: { type: 'plain_text', text: 'Acknowledge' }, value },
        { type: 'button', action_id: 'case_dispatch_evidence', text: { type: 'plain_text', text: 'Run Evidence' }, value },
        { type: 'button', action_id: 'case_suppress_1h', text: { type: 'plain_text', text: 'Suppress 1h' }, value },
        ...(args.githubIssueUrl ? [{
          type: 'button',
          text: { type: 'plain_text', text: 'Open GitHub Issue' },
          url: args.githubIssueUrl,
        }] : []),
      ],
    },
  ]

  const posted = await slackApi('chat.postMessage', {
    channel,
    text: title,
    blocks,
  })

  const ts = String(posted?.ts || '').trim()
  if (posted?.ok && ts) {
    map.cases[args.caseId] = {
      channel_id: channel,
      message_ts: ts,
      thread_ts: ts,
      posted_at: nowIso(),
    }
    saveSlackCaseMap(map)
  }
}

type DomainEvidenceMatrixRule = {
  skill_id: string
  params: (signal: Signal) => Record<string, unknown>
  when?: (signal: Signal) => boolean
  missing_note?: string
  missing_note_when?: (signal: Signal) => boolean
}

const toTrimmed = (value: unknown): string => String(value || '').trim()

const extractUrlOrigin = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    return new URL(trimmed).origin
  } catch {
    return ''
  }
}

const looksLikeNoQuotesSignal = (signal: Signal): boolean => {
  const hintText = toHintText(signal.signal_id, signal.signal_sources, signal.symptoms)
  return hintText.includes('no_quotes') || hintText.includes('no quotes') || hintText.includes('no-quote')
}

const resolveNoQuotesPlaneABaseUrl = (signal: Signal): string => {
  const explicit = [
    process.env.ISSUEOPS_NO_QUOTES_PLANE_A_BASE_URL,
    process.env.PLANE_A_BASE_URL,
    process.env.API_BASE_URL,
  ]
    .map((candidate) => toTrimmed(candidate))
    .find(Boolean)
  if (explicit) return explicit

  return extractUrlOrigin(toTrimmed(signal.target_url))
}

const domainEvidenceMatrix: Partial<Record<Domain, DomainEvidenceMatrixRule[]>> = {
  provider_health: [
    {
      skill_id: 'evidence.provider_health.github_actions',
      when: (signal) => Boolean(toTrimmed(signal.provider_id)),
      missing_note: 'provider_id required for provider health evidence.',
      params: (signal) => ({ env: signal.env, provider_id: toTrimmed(signal.provider_id), window_hours: 6 }),
    },
  ],
  queue: [
    {
      skill_id: 'evidence.queue_backlog.github_actions',
      when: (signal) => Boolean(toTrimmed(signal.queue_kind)),
      missing_note: 'queue_kind required for queue backlog evidence.',
      params: (signal) => ({ env: signal.env, queue_kind: toTrimmed(signal.queue_kind) }),
    },
  ],
  api_latency: [
    {
      skill_id: 'evidence.http_latency.github_actions',
      when: (signal) => Boolean(toTrimmed(signal.target_url)),
      missing_note: 'target_url required for HTTP latency evidence.',
      params: (signal) => ({ env: signal.env, target_url: toTrimmed(signal.target_url), requests: 20, timeout_ms: 5000 }),
    },
  ],
  freshness: [
    {
      skill_id: 'evidence.freshness_slo.github_actions',
      params: (signal) => ({ env: signal.env, window_hours: 24 }),
    },
  ],
  indices: [
    {
      skill_id: 'evidence.indices_readiness.github_actions',
      params: (signal) => ({ env: signal.env, amount_bucket: 500, method_profile: 'standard_bank' }),
    },
  ],
  pulse: [
    {
      skill_id: 'evidence.pulse_cache_health.github_actions',
      params: (signal) => ({ env: signal.env }),
    },
  ],
  exports: [
    {
      skill_id: 'evidence.exports_health.github_actions',
      params: (signal) => ({ env: signal.env, window_hours: 24 }),
    },
  ],
  infra_drift: [
    {
      skill_id: 'evidence.db_health.github_actions',
      params: (signal) => ({ env: signal.env }),
    },
  ],
  security: [
    {
      skill_id: 'evidence.security_dast.github_actions',
      when: (signal) => Boolean(toTrimmed(signal.target_url)),
      missing_note: 'target_url required for security DAST evidence.',
      params: (signal) => ({
        env: signal.env,
        target_url: toTrimmed(signal.target_url),
        run_authenticated: 'true',
        run_full_scan: 'false',
      }),
    },
  ],
  other: [
    {
      skill_id: 'evidence.no_quotes_audit.github_actions',
      when: (signal) => looksLikeNoQuotesSignal(signal) && Boolean(resolveNoQuotesPlaneABaseUrl(signal)),
      missing_note: 'plane_a_base_url required for no-quotes audit evidence when no-quotes symptoms are present.',
      missing_note_when: (signal) => looksLikeNoQuotesSignal(signal),
      params: (signal) => ({
        env: signal.env,
        plane_a_base_url: resolveNoQuotesPlaneABaseUrl(signal),
        send_currencies: 'USD,AED,GBP,EUR',
        method: 'bank',
        amount: 100,
        refresh: 0,
        max_corridors: 200,
        providers: '',
      }),
    },
  ],
}

const deterministicDecider = (input: BrainInput): BrainDecision => {
  const signals = input.signals
  const primary = signals[0]
  if (!primary) return { selected_skills: [], priority: 5, why: 'No signals provided', human_attention_required: true }

  const selected: SelectedSkill[] = []
  const matrixMissingNotes: string[] = []

  const matrixRules = domainEvidenceMatrix[primary.domain] ?? []
  for (const rule of matrixRules) {
    if (rule.when && !rule.when(primary)) {
      const shouldAttachMissingNote = rule.missing_note_when ? rule.missing_note_when(primary) : true
      if (rule.missing_note && shouldAttachMissingNote) matrixMissingNotes.push(rule.missing_note)
      continue
    }
    selected.push({
      skill_id: rule.skill_id,
      params: rule.params(primary),
      stop_on_failure: false,
    })
  }

  // Corridor forensics (read-only)
  if (primary.corridor_id) {
    selected.push({
      skill_id: 'forensics.corridor_provider.local',
      params: { corridor_id: primary.corridor_id, amount: 100, method: 'bank' },
      stop_on_failure: false,
    })
  }

  // Dev/staging observation helper
  if (primary.env !== 'prod') {
    selected.push({
      skill_id: 'observe.dev.local',
      params: { session_file: 'ops/observation-session.json' },
      stop_on_failure: false,
    })
  }

  const requiresManualTriage = severityRequiresManualTriage(primary.severity) || matrixMissingNotes.length > 0
  if (requiresManualTriage) {
    selected.push({
      skill_id: 'manual.human_triage',
      params: {},
      stop_on_failure: false,
    })
  }

  // Ensure every Plan is schema-valid (Plan requires at least one skill).
  if (selected.length === 0) {
    selected.push({
      skill_id: 'manual.human_triage',
      params: {},
      stop_on_failure: false,
    })
  }

  return {
    selected_skills: selected,
    priority: severityToPriority[primary.severity],
    why: [
      'Deterministic routing based on domain evidence matrix, safe evidence skills, and severity-gated triage.',
      matrixMissingNotes.length > 0 ? `Missing domain evidence inputs: ${matrixMissingNotes.join(' ')}` : '',
    ].filter(Boolean).join(' '),
    human_attention_required: requiresManualTriage,
  }
}

const openClawDecider = (input: BrainInput): BrainDecision | null => {
  const cmd = String(process.env.OPENCLAW_CMD || '').trim()
  if (!cmd) return null

  const res = spawnSync(cmd, {
    shell: true,
    input: JSON.stringify(input),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 15000,
  })

  if (res.status !== 0) {
     
    console.error('openclaw_decider_failed', { status: res.status, stderr: (res.stderr || '').slice(0, 4000) })
    return null
  }

  try {
    return JSON.parse(String(res.stdout || '')) as BrainDecision
  } catch {
     
    console.error('openclaw_decider_invalid_json', { stdout: String(res.stdout || '').slice(0, 4000) })
    return null
  }
}

const enforceDecision = (decision: BrainDecision, input: BrainInput): BrainDecision => {
  const catalogById = new Map(input.skills_catalog.skills.map((s) => [s.skill_id, s] as const))
  const primary = input.signals[0]
  const env = primary?.env || 'dev'
  const maxRisk = Math.max(0, Math.min(3, Number(primary?.risk_tier ?? 1)))

  const unknownSkillIds: string[] = []
  const policyFilteredSkillIds: string[] = []
  const filtered: SelectedSkill[] = []
  for (const s of decision.selected_skills || []) {
    const selectedSkillId = String(s?.skill_id || '').trim()
    if (!selectedSkillId) continue

    const def = catalogById.get(selectedSkillId)
    if (!def) {
      if (!unknownSkillIds.includes(selectedSkillId)) unknownSkillIds.push(selectedSkillId)
      continue
    }

    // Hard safety: prod defaults to non-local executors only.
    if (env === 'prod' && def.executor === 'local_codex') {
      if (!policyFilteredSkillIds.includes(selectedSkillId)) policyFilteredSkillIds.push(selectedSkillId)
      continue
    }

    // Risk tier gating.
    if (def.risk_tier > maxRisk) {
      if (!policyFilteredSkillIds.includes(selectedSkillId)) policyFilteredSkillIds.push(selectedSkillId)
      continue
    }

    filtered.push(s)
  }

  const catalogEscalationRequired = unknownSkillIds.length > 0
  if (catalogEscalationRequired &&
    catalogById.has('manual.human_triage') &&
    !filtered.some((selectedSkill) => selectedSkill.skill_id === 'manual.human_triage')) {
    filtered.push({ skill_id: 'manual.human_triage', params: {}, stop_on_failure: false })
  }

  const whyParts = [String(decision.why || '').trim()]
  if (catalogEscalationRequired) {
    const unknownList = unknownSkillIds.slice(0, 5).map((id) => `\`${id}\``).join(', ')
    const suffix = unknownSkillIds.length > 5 ? ` (+${unknownSkillIds.length - 5} more)` : ''
    whyParts.push(
      `Escalated to manual triage: decider selected skills not found in .remit-scout/skills/catalog.yaml (${unknownList}${suffix}).`,
    )
  }
  if (policyFilteredSkillIds.length > 0) {
    const filteredList = policyFilteredSkillIds.slice(0, 5).map((id) => `\`${id}\``).join(', ')
    const suffix = policyFilteredSkillIds.length > 5 ? ` (+${policyFilteredSkillIds.length - 5} more)` : ''
    whyParts.push(`Policy-filtered skills were removed (${filteredList}${suffix}).`)
  }

  return {
    ...decision,
    selected_skills: filtered,
    human_attention_required: Boolean(decision.human_attention_required || catalogEscalationRequired),
    why: whyParts.filter(Boolean).join(' '),
  }
}

const writeCaseArtifacts = (signal: Signal, decision: BrainDecision) => {
  const dedupe = signal.signal_id ? sha256(signal.signal_id) : sha256(JSON.stringify(signal))
  const short = dedupe.slice(0, 8)
  const caseId = deterministicCaseIdFromSignal(signal)

  const caseDir = path.join(casesDir, caseId)
  const runsDir = path.join(caseDir, 'runs')
  fs.mkdirSync(runsDir, { recursive: true })
  const prdPath = path.join(caseDir, 'prd.yaml')
  const planPath = path.join(caseDir, 'plan.yaml')

  const existingPrd = fs.existsSync(prdPath)
    ? parseYaml(readUtf8(prdPath)) as Record<string, unknown>
    : null
  const existingPlan = fs.existsSync(planPath)
    ? parseYaml(readUtf8(planPath)) as Record<string, unknown>
    : null
  const hadExistingArtifacts = Boolean(existingPrd && existingPlan)

  const normalizedRiskTier = Math.max(0, Math.min(3, Number(signal.risk_tier ?? 1)))
  const existingRiskTier = Math.max(0, Math.min(3, Number(existingPrd?.risk_tier ?? normalizedRiskTier)))
  const mergedRiskTier = Math.max(normalizedRiskTier, existingRiskTier)
  const sourceSignalId = String(signal.signal_id || '').trim() || `signal_hash:${short}`
  const sourceList = (signal.signal_sources ?? [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  const mergedSignalSources = mergeUniqueStrings(existingPrd?.signal_sources, sourceList)
  const sourceLabel = sourceList.length ? sourceList.join(',') : 'unknown'
  const caseHintComponents = resolveCaseHintComponents(signal)
  const caseHintSummaryParts = [
    caseHintComponents.providers.length ? `providers=${caseHintComponents.providers.join('|')}` : '',
    caseHintComponents.queues.length ? `queues=${caseHintComponents.queues.join('|')}` : '',
    caseHintComponents.planes.length ? `planes=${caseHintComponents.planes.join('|')}` : '',
  ].filter(Boolean)
  const caseHintLabel = caseHintSummaryParts.length ? caseHintSummaryParts.join(',') : 'none'
  const sourceNote = `Source: ${sourceSignalId}; signal_sources=${sourceLabel}; case_hints=${caseHintLabel}; workflow=incident_to_task@v1`
  const prdAcceptanceNote =
    'Incident-to-task conversion is accepted when PRD preserves schema-compliant risk/owner metadata and sharded evidence notes.'
  const planAcceptanceNote =
    'Incident-to-task conversion is accepted when the Plan captures executable skills with bounded and rollback evidence requirements.'

  const existingOwnerAssignment = (existingPrd?.owner_assignment && typeof existingPrd.owner_assignment === 'object')
    ? existingPrd.owner_assignment as Record<string, unknown>
    : null
  const existingPrdTraceability = (existingPrd?.traceability && typeof existingPrd.traceability === 'object')
    ? existingPrd.traceability
    : null
  const existingPrdAcceptanceProof = (existingPrd?.acceptance_proof && typeof existingPrd.acceptance_proof === 'object')
    ? existingPrd.acceptance_proof as Record<string, unknown>
    : null
  const existingLinks = (existingPrd?.links && typeof existingPrd.links === 'object')
    ? existingPrd.links as Record<string, unknown>
    : null

  const mergedQueues = mergeUniqueStrings(
    existingPrd?.suspected_components && typeof existingPrd.suspected_components === 'object'
      ? (existingPrd.suspected_components as Record<string, unknown>).queues
      : [],
    signal.queues,
    signal.queue_kind ? [String(signal.queue_kind).trim()] : [],
    caseHintComponents.queues,
  )

  const mergedPlanes = mergeUniqueStrings(
    existingPrd?.suspected_components && typeof existingPrd.suspected_components === 'object'
      ? (existingPrd.suspected_components as Record<string, unknown>).planes
      : [],
    signal.planes,
    caseHintComponents.planes,
  ).filter((plane): plane is PlaneHint =>
    plane === 'plane_a' || plane === 'plane_b' || plane === 'plane_c')

  const mergedServices = mergeUniqueStrings(
    existingPrd?.suspected_components && typeof existingPrd.suspected_components === 'object'
      ? (existingPrd.suspected_components as Record<string, unknown>).services
      : [],
    signal.services,
    caseHintComponents.services,
  )

  const mergedProviders = mergeUniqueStrings(
    existingPrd?.suspected_components && typeof existingPrd.suspected_components === 'object'
      ? (existingPrd.suspected_components as Record<string, unknown>).providers
      : [],
    signal.provider_id ? [signal.provider_id] : [],
    caseHintComponents.providers,
  )

  const prdAcceptance = existingPrdAcceptanceProof
    ? {
      source_note: toBoundedNote(sourceNote, 300),
      acceptance_note: toBoundedNote(String(existingPrdAcceptanceProof.acceptance_note || prdAcceptanceNote), 500) || prdAcceptanceNote,
      bounded_evidence_note: toBoundedNote(
        String(existingPrdAcceptanceProof.bounded_evidence_note || 'Use bounded evidence summaries and artifact pointers only.'),
        500,
      ) || 'Use bounded evidence summaries and artifact pointers only.',
      rollback_evidence_note: toBoundedNote(
        String(existingPrdAcceptanceProof.rollback_evidence_note || 'Document rollback path and proof reference before promote/close decisions.'),
        500,
      ) || 'Document rollback path and proof reference before promote/close decisions.',
    }
    : buildAcceptanceProof(sourceNote, prdAcceptanceNote)

  const prd = {
    case_id: caseId,
    created_at: String(existingPrd?.created_at || '').trim() || nowIso(),
    env: signal.env,
    severity: mergeSeverity(existingPrd?.severity, signal.severity),
    signal_sources: mergedSignalSources.length ? mergedSignalSources : ['unknown'],
    domain: signal.domain,
    symptoms: signal.symptoms,
    suspected_components: {
      planes: mergedPlanes,
      services: mergedServices,
      providers: mergedProviders,
      queues: mergedQueues,
    },
    risk_tier: mergedRiskTier,
    risk_level: riskLevelFromTier(mergedRiskTier),
    owner_assignment: existingOwnerAssignment ?? {
      status: 'unassigned',
      ownership_tag: 'owner.unassigned@v1',
    },
    traceability: existingPrdTraceability ?? buildTraceability(),
    acceptance_proof: prdAcceptance,
    human_owner: String(existingPrd?.human_owner || ''),
    links: {
      github_issue: String(existingLinks?.github_issue || ''),
      github_pr: String(existingLinks?.github_pr || ''),
      cloudwatch_alarms: mergeUniqueStrings(existingLinks?.cloudwatch_alarms),
      dashboards: mergeUniqueStrings(existingLinks?.dashboards),
    },
  }

  const guardProd = signal.env === 'prod'
  const resolvedSkills = decision.selected_skills
    .map((selectedSkill) => {
      const skillDef = inputCatalogById.get(selectedSkill.skill_id)
      if (!skillDef) return null

      const expectedArtifacts =
        skillDef.executor === 'github_actions'
          ? [`github:workflow:${skillDef.workflow}`]
          : skillDef.executor === 'local_codex'
            ? ['stdout:json']
            : []

      return {
        skill_id: selectedSkill.skill_id,
        executor: skillDef.executor,
        params: selectedSkill.params ?? {},
        expected_artifacts: expectedArtifacts,
        stop_on_failure: Boolean(selectedSkill.stop_on_failure),
      }
    })
    .filter((skill): skill is {
      skill_id: string
      executor: SkillExecutor
      params: Record<string, unknown>
      expected_artifacts: string[]
      stop_on_failure: boolean
    } => Boolean(skill))

  if (resolvedSkills.length === 0) {
    const fallbackSkill = inputCatalogById.get('manual.human_triage')
    if (!fallbackSkill) {
      throw new Error('incident_to_task_conversion_failed: missing fallback skill manual.human_triage in skill catalog')
    }

    resolvedSkills.push({
      skill_id: fallbackSkill.skill_id,
      executor: fallbackSkill.executor,
      params: {},
      expected_artifacts: [],
      stop_on_failure: false,
    })
  }

  const existingPlanTraceability = (existingPlan?.traceability && typeof existingPlan.traceability === 'object')
    ? existingPlan.traceability
    : null
  const existingPlanAcceptanceProof = (existingPlan?.acceptance_proof && typeof existingPlan.acceptance_proof === 'object')
    ? existingPlan.acceptance_proof as Record<string, unknown>
    : null
  const planAcceptance = existingPlanAcceptanceProof
    ? {
      source_note: toBoundedNote(sourceNote, 300),
      acceptance_note: toBoundedNote(String(existingPlanAcceptanceProof.acceptance_note || planAcceptanceNote), 500) || planAcceptanceNote,
      bounded_evidence_note: toBoundedNote(
        String(existingPlanAcceptanceProof.bounded_evidence_note || 'Store bounded evidence pointers only; never paste unbounded logs.'),
        500,
      ) || 'Store bounded evidence pointers only; never paste unbounded logs.',
      rollback_evidence_note: toBoundedNote(
        String(existingPlanAcceptanceProof.rollback_evidence_note || 'Capture rollback evidence pointers before execution handoff.'),
        500,
      ) || 'Capture rollback evidence pointers before execution handoff.',
    }
    : buildAcceptanceProof(sourceNote, planAcceptanceNote)

  const planSnapshots = hadExistingArtifacts
    ? appendPlanSnapshot(
      existingPlan?.plan_snapshots,
      'plan_refreshed',
      'Plan refreshed from repeat signal while preserving deterministic case identity.',
    )
    : buildInitialPlanSnapshots()

  const plan = {
    case_id: caseId,
    goal: String(existingPlan?.goal || '').trim() || 'Collect evidence, pinpoint root cause, and recommend next steps.',
    traceability: existingPlanTraceability ?? buildTraceability(),
    acceptance_proof: planAcceptance,
    plan_snapshots: planSnapshots,
    constraints: [
      `prod_read_only=${guardProd ? 'true' : 'false'}`,
      'no secrets in artifacts',
    ],
    skills: resolvedSkills,
    guardrails: {
      max_runtime_minutes: 30,
      max_diff_lines: 0,
      prod_read_only: guardProd,
    },
  }

  writeUtf8(prdPath, stringifyYaml(prd))
  writeUtf8(planPath, stringifyYaml(plan))
  upsertCaseLifecycle(caseId, signal.env, 'open')

  return {
    caseId,
    hadExistingArtifacts,
    githubIssueUrl: String(existingLinks?.github_issue || '').trim(),
  }
}

let inputCatalogById = new Map<string, SkillDef>()

const handleCaseAction = async (catalog: SkillCatalog, event: CaseActionEvent) => {
  const caseId = String(event.case_id || '').trim()
  const caseDir = path.join(casesDir, caseId)
  const prdPath = path.join(caseDir, 'prd.yaml')
  const planPath = path.join(caseDir, 'plan.yaml')
  if (!fs.existsSync(prdPath) || !fs.existsSync(planPath)) {
    await postSlackThreadReply(caseId, `Case action failed: missing PRD/Plan for \`${caseId}\`.`)
    return
  }

  const prd = parseYaml(readUtf8(prdPath)) as any
  const plan = parseYaml(readUtf8(planPath)) as any
  const env = (prd?.env === 'prod' || prd?.env === 'staging' || prd?.env === 'dev') ? prd.env : 'dev'
  const catalogById = new Map(catalog.skills.map((s) => [s.skill_id, s] as const))

  if (event.action === 'acknowledge') {
    const userId = String(event?.requested_by?.slack_user_id || '').trim()
    const owner = userId ? `slack:${userId}` : `slack:unknown`
    updateCasePrd(caseId, {
      human_owner: owner,
      owner_assignment: {
        status: 'assigned',
        owner,
        ownership_tag: 'owner.human.slack@v1',
        assigned_at: nowIso(),
        assignment_note: 'Assigned from Slack acknowledge action.',
      },
    })
    upsertCaseLifecycle(caseId, env, 'open')
    await postSlackThreadReply(caseId, userId ? `Acknowledged by <@${userId}>.` : 'Acknowledged.')
    return
  }

  if (event.action === 'suppress') {
    const minutes = Math.max(1, Math.min(24 * 60, Number(event?.params?.suppress_minutes ?? 60)))
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    const s = loadSuppressions()
    s.cases[caseId] = { until, reason: 'slack_button', requested_by: event.requested_by || null }
    saveSuppressions(s)
    await postSlackThreadReply(caseId, `Suppressed Slack Case card posting for \`${caseId}\` until \`${until}\`.`)
    return
  }

  if (event.action === 'dispatch_evidence') {
    upsertCaseLifecycle(caseId, env, 'open')
    const evidenceOnly = Boolean(event?.params?.evidence_only)
    const triageMode = getIssueOpsTriageMode()
    const skills = Array.isArray(plan?.skills) ? plan.skills : []
    const selected = skills.filter((s: any) => {
      const skillId = String(s?.skill_id || '').trim()
      if (!skillId) return false
      if (evidenceOnly && !skillId.startsWith('evidence.')) return false
      const def = catalogById.get(skillId)
      return Boolean(def?.executor === 'github_actions' && def?.workflow)
    })

    if (!selected.length) {
      await postSlackThreadReply(caseId, `No dispatchable GitHub Actions skills found in plan.yaml for \`${caseId}\`.`)
      return
    }

    const dispatched: string[] = []
    const simulated: string[] = []
    const failed: string[] = []

    for (const [selectedIndex, s] of selected.entries()) {
      const skillId = String(s?.skill_id || '').trim()
      const def = catalogById.get(skillId)
      if (!def?.workflow) continue
      const routeOrder = selectedIndex + 1
      const requestedAt = nowIso()

      const rawParams = (s?.params && typeof s.params === 'object') ? (s.params as Record<string, unknown>) : {}
      const wantsDispatchId = Boolean(def?.required_inputs &&
        typeof def.required_inputs === 'object' &&
        Object.prototype.hasOwnProperty.call(def.required_inputs, 'dispatch_id'))
      const dispatchId = wantsDispatchId ? randomUUID() : ''
      const inputs: Record<string, unknown> = {
        ...rawParams,
        env: rawParams.env ?? env,
        case_id: caseId,
        ...(wantsDispatchId ? { dispatch_id: dispatchId } : {}),
      }

      const request = {
        kind: 'github_workflow_dispatch',
        requested_at: requestedAt,
        route_order: routeOrder,
        case_id: caseId,
        triage_mode: triageMode,
        ...(wantsDispatchId ? { dispatch_id: dispatchId } : {}),
        skill_id: skillId,
        workflow: def.workflow,
        inputs,
        ...(triageMode === 'dry_run'
          ? {
            simulation: {
              enabled: true,
              bounded_evidence_note: triageDryRunBoundedEvidenceNote,
              rollback_evidence_note: triageDryRunRollbackEvidenceNote,
            },
          }
          : {}),
      }

      const filename = buildDispatchOutboxFilename({
        caseId,
        skillId,
        requestedAt,
        routeOrder,
        ...(wantsDispatchId ? { dispatchId } : {}),
      })
      const requestPath = path.join(outboxDir, filename)
      writeUtf8(requestPath, JSON.stringify({ ...request, status: 'pending' }, null, 2) + '\n')

      const dispatch = await dispatchGithubWorkflow(def.workflow, request.inputs)
      if (dispatch.dispatched) {
        if (dispatch.simulated) {
          simulated.push(skillId)
          writeUtf8(requestPath, JSON.stringify({ ...request, status: 'simulated', simulated_at: nowIso() }, null, 2) + '\n')
        } else {
          dispatched.push(skillId)
          writeUtf8(requestPath, JSON.stringify({ ...request, status: 'dispatched', dispatched_at: nowIso() }, null, 2) + '\n')
        }
      } else {
        failed.push(skillId)
        writeUtf8(requestPath, JSON.stringify({ ...request, status: 'failed', failed_at: nowIso(), error: dispatch }, null, 2) + '\n')
      }
    }

    const msg = [
      `Run Evidence requested (evidence_only=${evidenceOnly ? 'true' : 'false'}, triage_mode=${triageMode}).`,
      dispatched.length ? `Dispatched: ${dispatched.map((s) => `\`${s}\``).join(', ')}` : null,
      simulated.length
        ? `Simulated (dry-run): ${simulated.map((s) => `\`${s}\``).join(', ')}. Bounded evidence: ${triageDryRunBoundedEvidenceNote} Rollback evidence: ${triageDryRunRollbackEvidenceNote}`
        : null,
      failed.length ? `Failed: ${failed.map((s) => `\`${s}\``).join(', ')}` : null,
    ].filter(Boolean).join('\n')

    await postSlackThreadReply(caseId, msg)
  }
}

type GithubWorkflowDispatchOutbox = {
  kind: 'github_workflow_dispatch'
  requested_at: string
  route_order?: number
  case_id: string
  triage_mode?: IssueOpsTriageMode
  dispatch_id?: string
  skill_id: string
  workflow: string
  inputs: Record<string, unknown>
  simulation?: {
    enabled: boolean
    bounded_evidence_note: string
    rollback_evidence_note: string
  }
  status?: 'pending' | 'dispatched' | 'simulated' | 'failed'
  dispatched_at?: string
  simulated_at?: string
  failed_at?: string
  ingested_at?: string
  github_run_id?: number
  github_actions_run_url?: string
  github_artifact_id?: number
  github_actions_artifact_url?: string
}

type RunEvidenceRef = {
  kind: 'github_artifact' | 's3' | 'cloudwatch' | 'link' | 'log'
  ref: string
}

const isGithubWorkflowDispatchOutbox = (value: unknown): value is GithubWorkflowDispatchOutbox => {
  if (!value || typeof value !== 'object') return false
  const v = value as any
  return v.kind === 'github_workflow_dispatch' &&
    typeof v.case_id === 'string' &&
    typeof v.skill_id === 'string' &&
    typeof v.workflow === 'string' &&
    v.inputs && typeof v.inputs === 'object'
}

const dedupeEvidenceRefs = (refs: RunEvidenceRef[], maxItems: number): RunEvidenceRef[] => {
  const deduped: RunEvidenceRef[] = []
  for (const ref of refs) {
    const kind = ref?.kind
    const value = String(ref?.ref || '').trim()
    if (!kind || !value) continue
    if (deduped.some((existing) => existing.kind === kind && existing.ref === value)) continue
    deduped.push({ kind, ref: value })
    if (deduped.length >= maxItems) break
  }
  return deduped
}

const reconstructIncidentTimelineFromEvents = (args: {
  caseId: string
  dispatchId: string
  outboxPath: string
  outboxRecord: GithubWorkflowDispatchOutbox
  startedAt: string
  finishedAt: string
}): {
  ok: boolean
  reasonCode: 'triage.timeline_reconstruction_failed'
  summary: string
  rollbackEvidenceRefs: RunEvidenceRef[]
} => {
  const boundedRefs: string[] = []
  const timelineEvents: Array<{ ts: number; at: string }> = []
  const reconstructionIssues: string[] = []

  const outboxRef = path.relative(repoRoot, args.outboxPath).split(path.sep).join('/')
  appendBounded(boundedRefs, outboxRef)

  const appendTimelineEvent = (timestamp: unknown, issueLabel: string) => {
    const raw = String(timestamp || '').trim()
    const parsed = toTimestampMs(raw)
    if (parsed === null) {
      appendBounded(reconstructionIssues, `${issueLabel}=missing_or_invalid`)
      return
    }
    timelineEvents.push({ ts: parsed, at: new Date(parsed).toISOString() })
  }

  appendTimelineEvent(args.outboxRecord.requested_at, 'outbox.requested_at')
  if (args.outboxRecord.dispatched_at) appendTimelineEvent(args.outboxRecord.dispatched_at, 'outbox.dispatched_at')
  if (args.outboxRecord.simulated_at) appendTimelineEvent(args.outboxRecord.simulated_at, 'outbox.simulated_at')
  appendTimelineEvent(args.startedAt, 'run.started_at')
  appendTimelineEvent(args.finishedAt, 'run.finished_at')

  const runsDir = path.join(casesDir, args.caseId, 'runs')
  if (fs.existsSync(runsDir) && fs.statSync(runsDir).isDirectory()) {
    const runFiles = fs.readdirSync(runsDir)
      .filter((fileName) => fileName.endsWith('.json'))
      .sort((left, right) => left.localeCompare(right))
      .slice(-5)

    for (const runFile of runFiles) {
      const runPath = path.join(runsDir, runFile)
      const runRef = path.relative(repoRoot, runPath).split(path.sep).join('/')
      appendBounded(boundedRefs, runRef)
      let run: Record<string, unknown> | null = null
      try {
        run = safeJson(readUtf8(runPath)) as Record<string, unknown> | null
      } catch {
        run = null
      }
      if (!run) {
        appendBounded(reconstructionIssues, `run_record_invalid=${runRef}`)
        continue
      }
      appendTimelineEvent(run.finished_at, `run.finished_at:${runRef}`)
    }
  }

  const inboxFiles = listSignalFiles().slice(-50)
  for (const inboxFile of inboxFiles) {
    let payload: unknown
    try {
      payload = safeJson(readUtf8(inboxFile))
    } catch {
      payload = null
    }
    if (!payload) continue
    const envelopes = Array.isArray(payload)
      ? payload
      : (Array.isArray((payload as Record<string, unknown>)?.signals)
        ? (payload as Record<string, unknown>).signals as unknown[]
        : [payload])

    for (const envelope of envelopes) {
      if (!envelope || typeof envelope !== 'object') continue
      const record = envelope as Record<string, unknown>
      if (String(record.kind || '').trim() !== 'case_action') continue
      if (String(record.case_id || '').trim() !== args.caseId) continue

      const inboxRef = path.relative(repoRoot, inboxFile).split(path.sep).join('/')
      appendBounded(boundedRefs, inboxRef)
      appendTimelineEvent(record.requested_at, `inbox.case_action.requested_at:${inboxRef}`)
    }
  }

  timelineEvents.sort((left, right) => left.ts - right.ts)
  const firstEvent = timelineEvents[0]
  const lastEvent = timelineEvents[timelineEvents.length - 1]

  if (timelineEvents.length < 2) {
    appendBounded(reconstructionIssues, 'timeline_events_insufficient')
  }

  const requestedAtMs = toTimestampMs(args.outboxRecord.requested_at)
  const finishedAtMs = toTimestampMs(args.finishedAt)
  if (requestedAtMs !== null && finishedAtMs !== null && requestedAtMs > finishedAtMs) {
    appendBounded(reconstructionIssues, 'timeline_out_of_order=dispatch_requested_after_run_finished')
  }

  const rollbackEvidenceRefs = boundedRefs.map((ref) => ({ kind: 'log' as const, ref }))
  if (reconstructionIssues.length > 0) {
    const issueSummary = reconstructionIssues.slice(0, 5).join(', ')
    return {
      ok: false,
      reasonCode: 'triage.timeline_reconstruction_failed',
      summary:
        `Incident timeline reconstruction from events failed for dispatch ${args.dispatchId}: ${issueSummary}; `
        + 'escalating for manual triage with bounded and rollback evidence refs.',
      rollbackEvidenceRefs,
    }
  }

  return {
    ok: true,
    reasonCode: 'triage.timeline_reconstruction_failed',
    summary:
      `Incident timeline reconstructed from ${timelineEvents.length} bounded events `
      + `(${firstEvent.at} -> ${lastEvent.at}); rollback via listed event refs.`,
    rollbackEvidenceRefs,
  }
}

const listOutboxFiles = (): string[] => {
  if (!fs.existsSync(outboxDir)) return []
  return fs.readdirSync(outboxDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(outboxDir, f))
    .sort()
}

const resolveGithubApiBase = (): string => {
  const raw = String(process.env.GITHUB_API_URL || 'https://api.github.com').trim()
  return raw.replace(/\/+$/, '') || 'https://api.github.com'
}

const githubApiRequest = async (args: {
  method: 'GET' | 'POST'
  url: string
  body?: unknown
}): Promise<{ ok: boolean; status: number; json?: any; text?: string }> => {
  const repo = String(process.env.GITHUB_REPOSITORY || '').trim()
  const token = String(process.env.GITHUB_TOKEN || '').trim()
  if (!repo || !token) return { ok: false, status: 0, text: 'Missing GITHUB_REPOSITORY or GITHUB_TOKEN' }

  const apiBase = resolveGithubApiBase()
  const full = args.url.startsWith('http://') || args.url.startsWith('https://')
    ? args.url
    : `${apiBase}${args.url.startsWith('/') ? '' : '/'}${args.url}`

  const res = await fetch(full, {
    method: args.method,
    headers: {
      'accept': 'application/vnd.github+json',
      'authorization': `Bearer ${token}`,
      'user-agent': 'remit-scout-brain',
      'x-github-api-version': '2022-11-28',
      ...(args.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
  })

  const status = res.status
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return { ok: false, status, text: text.slice(0, 2000) }
  }

  // Some endpoints (dispatch) return 204 No Content.
  if (status === 204) return { ok: true, status }

  const text = await res.text().catch(() => '')
  const json = safeJson(text)
  return json ? { ok: true, status, json } : { ok: true, status, text }
}

const parseGithubIssueNumber = (issueUrl: string): number | null => {
  const m = String(issueUrl || '').trim().match(/\/issues\/(\d+)(?:$|[?#])/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isInteger(n) && n > 0 ? n : null
}

const postGithubIssueComment = async (issueUrl: string, body: string): Promise<void> => {
  const repo = String(process.env.GITHUB_REPOSITORY || '').trim()
  if (!repo) return

  const issueNumber = parseGithubIssueNumber(issueUrl)
  if (!issueNumber) return

  await githubApiRequest({
    method: 'POST',
    url: `/repos/${repo}/issues/${issueNumber}/comments`,
    body: { body: String(body || '').slice(0, 65000) },
  })
}

const extractEvidenceJsonFromZip = (zipPath: string): { ok: boolean; evidence?: any; error?: string } => {
  const list = spawnSync('unzip', ['-Z1', zipPath], {
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 2 * 1024 * 1024,
  })

  if (list.status !== 0) {
    return { ok: false, error: `unzip_list_failed status=${list.status}` }
  }

  const files = String(list.stdout || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

  const evidencePath = files.find((x) => x.endsWith('evidence.json')) || null
  if (!evidencePath) return { ok: false, error: 'evidence.json not found in artifact zip' }

  const extracted = spawnSync('unzip', ['-p', zipPath, evidencePath], {
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 5 * 1024 * 1024,
  })

  if (extracted.status !== 0) {
    return { ok: false, error: `unzip_extract_failed status=${extracted.status}` }
  }

  const json = safeJson(String(extracted.stdout || ''))
  if (!json) return { ok: false, error: 'evidence.json is not valid JSON' }
  return { ok: true, evidence: json }
}

const buildRunRecordFromEvidence = (args: {
  caseId: string
  dispatchId: string
  skillId: string
  startedAt: string
  finishedAt: string
  runUrl: string
  artifactUrl: string
  artifactName: string
  outboxPath: string
  outboxRecord: GithubWorkflowDispatchOutbox
  evidence: any
}) => {
  const findings = Array.isArray(args.evidence?.findings) ? args.evidence.findings : []
  const evidenceSuccess = Boolean(args.evidence?.success)

  const recommended = Array.isArray(args.evidence?.recommended_next_skill_ids)
    ? args.evidence.recommended_next_skill_ids.map((x: any) => String(x || '').trim()).filter(Boolean)
    : []

  const timelineReconstruction = reconstructIncidentTimelineFromEvents({
    caseId: args.caseId,
    dispatchId: args.dispatchId,
    outboxPath: args.outboxPath,
    outboxRecord: args.outboxRecord,
    startedAt: args.startedAt,
    finishedAt: args.finishedAt,
  })

  const triageTimebox = buildTriageTimeboxContext(args.caseId, args.finishedAt)

  const judgedDecision = judgeIssueOpsDecision({
    evidenceSuccess,
    findings,
    recommendedNextSkillIds: recommended,
    reasonCodeRules: loadReasonCodeRules(),
    timelineReconstruction: {
      ok: timelineReconstruction.ok,
      reasonCode: timelineReconstruction.reasonCode,
      summary: timelineReconstruction.summary,
    },
    triageTimebox,
  })

  const nextRecommendation = judgedDecision.recommendation
  const resultsSuccess = evidenceSuccess && nextRecommendation !== 'escalate'

  const normalizedFindings = findings.slice(0, 25).map((f: any) => {
    const details = (f?.details && typeof f.details === 'object') ? f.details : undefined
    return {
      reason_code: String(f?.reason_code || 'unknown'),
      message: String(f?.message || 'unknown'),
      details: {
        ...(details ? details : {}),
        severity: String(f?.severity || 'sev3'),
      },
    }
  })

  const evidenceRefs = dedupeEvidenceRefs([
    { kind: 'link', ref: args.runUrl },
    { kind: 'github_artifact', ref: args.artifactName },
    { kind: 'link', ref: args.artifactUrl },
    ...timelineReconstruction.rollbackEvidenceRefs,
  ], 20)

  const decisionSummary = [
    String(args.evidence?.summary || '').trim(),
    judgedDecision.summary,
  ].filter(Boolean).join(' | ')
    || `Decision ${nextRecommendation} based on evidence findings.`
  const reasonCodes = judgedDecision.reasonCodes.slice(0, 25)
  const humanInLoop = buildHumanInLoopEscalationContract({
    recommendation: nextRecommendation,
    reasonCodes,
    summary: decisionSummary,
  })

  const maxFindings = Math.max(1, Math.min(200, Number(args.evidence?.budgets?.max_findings ?? 25)))
  const maxEvidenceRefs = Math.max(0, Math.min(200, Number(args.evidence?.budgets?.max_pointer_items ?? 20)))

  return {
    case_id: args.caseId,
    run_id: `run-${args.dispatchId}`,
    dispatch_id: args.dispatchId,
    started_at: args.startedAt,
    finished_at: args.finishedAt,
    ingested_at: nowIso(),
    executor: 'github_actions',
    github_actions_run_url: args.runUrl,
    github_actions_artifact_url: args.artifactUrl,
    skills_executed: [
      {
        skill_id: args.skillId,
        status: evidenceSuccess ? 'pass' : 'fail',
        summary: String(args.evidence?.summary || '').slice(0, 500),
      },
    ],
    results: {
      success: resultsSuccess,
      findings: normalizedFindings,
    },
    evidence_refs: evidenceRefs,
    decision_record: {
      template_version: 'v1',
      decision: nextRecommendation,
      summary: decisionSummary.slice(0, 500),
      reason_codes: reasonCodes,
      human_in_loop: humanInLoop,
      bounded_evidence: {
        findings_considered: normalizedFindings.length,
        max_findings: maxFindings,
        evidence_refs_considered: evidenceRefs.length,
        max_evidence_refs: maxEvidenceRefs,
      },
      rollback_evidence: {
        required: true,
        available: evidenceRefs.length > 0,
        refs: evidenceRefs,
        note: 'Use linked run and artifact refs to replay or roll back this decision.',
      },
    },
    next_recommendation: nextRecommendation,
  }
}

const ingestDispatchedRunsOnce = async (): Promise<void> => {
  const enabled = String(process.env.BRAIN_INGEST_GITHUB_ACTIONS || '').trim() === '1'
  if (!enabled) return

  const repo = String(process.env.GITHUB_REPOSITORY || '').trim()
  const token = String(process.env.GITHUB_TOKEN || '').trim()
  if (!repo || !token) return

  const maxPerLoop = Math.max(1, Math.min(25, Number(process.env.BRAIN_INGEST_MAX_PER_LOOP ?? 5)))

  const ingestion = loadDispatchIngestionState()
  const outboxFiles = listOutboxFiles()

  const candidates: Array<{ filePath: string; record: GithubWorkflowDispatchOutbox }> = []
  for (const filePath of outboxFiles) {
    const record = safeJson(readUtf8(filePath)) as any
    if (!isGithubWorkflowDispatchOutbox(record)) continue
    if (record.status !== 'dispatched') continue
    const dispatchId = String(record.dispatch_id || '').trim()
    if (!dispatchId) continue
    if (record.ingested_at) continue
    if (ingestion.dispatches[dispatchId]) continue
    candidates.push({ filePath, record })
  }

  const orderedCandidates = candidates
    .sort((left, right) => {
      const requestedAtCompare = toRequestedAtSortKey(left.record.requested_at)
        .localeCompare(toRequestedAtSortKey(right.record.requested_at))
      if (requestedAtCompare !== 0) return requestedAtCompare

      const routeOrderCompare = Number(left.record.route_order ?? Number.MAX_SAFE_INTEGER)
        - Number(right.record.route_order ?? Number.MAX_SAFE_INTEGER)
      if (routeOrderCompare !== 0) return routeOrderCompare

      return left.filePath.localeCompare(right.filePath)
    })
    .slice(0, maxPerLoop)

  for (const c of orderedCandidates) {
    const dispatchId = String(c.record.dispatch_id || '').trim()
    const caseId = String(c.record.case_id || '').trim()
    const skillId = String(c.record.skill_id || '').trim()
    const workflowFile = path.basename(String(c.record.workflow || '').trim())

    try {
      const runsRes = await githubApiRequest({
        method: 'GET',
        url: `/repos/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}/runs?event=workflow_dispatch&per_page=50`,
      })
      if (!runsRes.ok || !runsRes.json) continue

      const runs = Array.isArray(runsRes.json?.workflow_runs) ? runsRes.json.workflow_runs : []
      const match = runs.find((r: any) => {
        const hay = [
          r?.display_title,
          r?.name,
          r?.head_commit?.message,
          r?.head_branch,
        ].map((x) => String(x || '')).join(' ')
        return hay.includes(dispatchId)
      })

      if (!match) continue
      if (String(match?.status || '') !== 'completed') continue

      const runId = Number(match?.id)
      if (!Number.isFinite(runId)) continue

      const runUrl = String(match?.html_url || '').trim()
        || `${String(process.env.GITHUB_SERVER_URL || 'https://github.com').trim()}/${repo}/actions/runs/${runId}`

      const artifactsRes = await githubApiRequest({
        method: 'GET',
        url: `/repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
      })
      if (!artifactsRes.ok || !artifactsRes.json) continue

      const artifacts = Array.isArray(artifactsRes.json?.artifacts) ? artifactsRes.json.artifacts : []
      const artifact = artifacts.find((a: any) => String(a?.name || '').includes(dispatchId))
        || ((artifacts.length === 1) ? artifacts[0] : null)
      if (!artifact) continue

      const artifactId = Number(artifact?.id)
      const artifactName = String(artifact?.name || '').trim()
      const artifactUrl = String(artifact?.archive_download_url || artifact?.url || '').trim()
      if (!artifactUrl || !artifactName || !Number.isFinite(artifactId)) continue

      const bin = await fetch(artifactUrl, {
        headers: {
          'accept': 'application/vnd.github+json',
          'authorization': `Bearer ${token}`,
          'user-agent': 'remit-scout-brain',
          'x-github-api-version': '2022-11-28',
        },
      })
      if (!bin.ok) continue
      const buf = Buffer.from(await bin.arrayBuffer())

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remit-scout-artifact-'))
      const zipPath = path.join(tmpDir, `artifact-${dispatchId}.zip`)
      fs.writeFileSync(zipPath, buf)

      const extracted = extractEvidenceJsonFromZip(zipPath)
      if (!extracted.ok || !extracted.evidence) continue

      const startedAt = String(match?.created_at || nowIso())
      const finishedAt = String(match?.updated_at || nowIso())

      const runRecord = buildRunRecordFromEvidence({
        caseId,
        dispatchId,
        skillId,
        startedAt,
        finishedAt,
        runUrl,
        artifactUrl,
        artifactName,
        outboxPath: c.filePath,
        outboxRecord: c.record,
        evidence: extracted.evidence,
      })

      const runsDir = path.join(casesDir, caseId, 'runs')
      fs.mkdirSync(runsDir, { recursive: true })
      const runPath = path.join(
        runsDir,
        buildRunOutputFilename({ dispatchId, finishedAt }),
      )
      writeUtf8(runPath, JSON.stringify(runRecord, null, 2) + '\n')

      const casePrdPath = path.join(casesDir, caseId, 'prd.yaml')
      const casePrd = fs.existsSync(casePrdPath)
        ? parseYaml(readUtf8(casePrdPath)) as Record<string, unknown>
        : null
      const caseEnv = parseCaseEnv(casePrd?.env)
      const caseStatus = lifecycleStatusFromRecommendation(String(runRecord.next_recommendation || 'iterate'))
      upsertCaseLifecycle(caseId, caseEnv, caseStatus)

      // Update outbox + ingestion state for idempotency.
      const updatedOutbox: GithubWorkflowDispatchOutbox = {
        ...c.record,
        ingested_at: nowIso(),
        github_run_id: runId,
        github_actions_run_url: runUrl,
        github_artifact_id: artifactId,
        github_actions_artifact_url: artifactUrl,
      }
      writeUtf8(c.filePath, JSON.stringify(updatedOutbox, null, 2) + '\n')
      ingestion.dispatches[dispatchId] = { run_id: runId, artifact_id: artifactId, ingested_at: updatedOutbox.ingested_at! }
      saveDispatchIngestionState(ingestion)

      const findings = Array.isArray(extracted.evidence?.findings) ? extracted.evidence.findings : []
      let redactedSlackFindings = 0
      const topForSlack = findings.slice(0, 8).map((f: any) => {
        const sev = String(f?.severity || '').trim()
        const code = String(f?.reason_code || '').trim()
        const msg = toSlackSafeFindingMessage(f?.message)
        if (msg.redacted) redactedSlackFindings += 1
        return `- (${sev || 'sev?'}) \`${code || 'unknown'}\`: ${msg.text || 'unknown'}`
      }).join('\n')

      const topForGithub = findings.slice(0, 8).map((f: any) => {
        const sev = String(f?.severity || '').trim()
        const code = String(f?.reason_code || '').trim()
        const msg = String(f?.message || '').trim()
        return `- (${sev || 'sev?'}) \`${code || 'unknown'}\`: ${msg || 'unknown'}`
      }).join('\n')

      const runRecordRef = path.relative(repoRoot, runPath)
      const slackRedactionNote = redactedSlackFindings > 0
        ? `Failure-bundle archive refs were redacted in ${redactedSlackFindings} finding(s); use \`${runRecordRef}\` decision_record.rollback_evidence.refs for replay pointers.`
        : null

      await postSlackThreadReply(
        caseId,
        [
          `Evidence ingested: \`${skillId}\` dispatch=\`${dispatchId}\`.`,
          `Run: ${runUrl}`,
          topForSlack ? `Findings:\n${topForSlack}` : `No findings.`,
          slackRedactionNote,
        ].filter(Boolean).join('\n'),
      )

      const prdPath = path.join(casesDir, caseId, 'prd.yaml')
      if (fs.existsSync(prdPath)) {
        const prd = parseYaml(readUtf8(prdPath)) as any
        const issueUrl = String(prd?.links?.github_issue || '').trim()
        if (issueUrl) {
          await postGithubIssueComment(
            issueUrl,
            [
              `Evidence ingested: ${skillId}`,
              ``,
              `- Case: \`${caseId}\``,
              `- Dispatch: \`${dispatchId}\``,
              `- Run: ${runUrl}`,
              `- Artifact: ${artifactName}`,
              ``,
              topForGithub ? `Findings:\n${topForGithub}` : `No findings.`,
            ].join('\n'),
          )
        }
      }
    } catch (error) {
       
      console.error('brain_ingest_dispatch_failed', {
        case_id: caseId,
        dispatch_id: dispatchId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

const processInboxOnce = async () => {
  fs.mkdirSync(casesDir, { recursive: true })
  fs.mkdirSync(inboxDir, { recursive: true })
  fs.mkdirSync(outboxDir, { recursive: true })

  const catalog = loadSkillCatalog()
  inputCatalogById = new Map(catalog.skills.map((s) => [s.skill_id, s] as const))

  const state = loadState()
  const files = listSignalFiles()

  for (const file of files) {
    let signals: unknown[]
    try {
      signals = parseSignalFile(file)
    } catch (error) {
       
      console.error('brain_signal_parse_failed', { file, error: error instanceof Error ? error.message : String(error) })
      continue
    }

    for (const raw of signals) {
      if (isCaseActionEvent(raw)) {
        const dedupeKey = String(raw.action_id || sha256(JSON.stringify(raw))).trim()
        if (!dedupeKey) continue
        if (state.seen[dedupeKey]) continue
        try {
          await handleCaseAction(catalog, raw)
          state.seen[dedupeKey] = { processed_at: nowIso(), case_id: raw.case_id }
        } catch (error) {
           
          console.error('brain_case_action_failed', { file, error: error instanceof Error ? error.message : String(error) })
        }
        continue
      }

      if (!isValidSignal(raw)) {
         
        console.error('brain_signal_invalid', { file, signal: raw })
        continue
      }

      const parsedCaseHints = parseSignalCaseHints((raw as any)?.case_hints)
      const signal: Signal = {
        ...(raw as Signal),
        ...(parsedCaseHints ? { case_hints: parsedCaseHints } : {}),
        domain: classifyIssueOpsDomain({
          domain: (raw as any)?.domain,
          signal_id: (raw as any)?.signal_id,
          signal_sources: (raw as any)?.signal_sources,
          symptoms: (raw as any)?.symptoms,
          queue_kind: (raw as any)?.queue_kind,
          target_url: (raw as any)?.target_url,
          provider_id: (raw as any)?.provider_id,
        }),
      }
      const dedupeKey = String(signal.signal_id || sha256(JSON.stringify(signal))).trim()
      if (!dedupeKey) continue
      if (state.seen[dedupeKey]) continue

      try {
        const brainInput: BrainInput = {
          case_state: {},
          signals: [signal],
          skills_catalog: catalog,
        }

        const openclaw = openClawDecider(brainInput)
        const base = openclaw ?? deterministicDecider(brainInput)
        let decision = enforceDecision(base, brainInput)
        if (!decision.selected_skills || decision.selected_skills.length === 0) {
          decision = {
            ...decision,
            selected_skills: [{ skill_id: 'manual.human_triage', params: {}, stop_on_failure: false }],
            human_attention_required: true,
            why: `${decision.why ? `${decision.why} ` : ''}No allowed skills selected after enforcement; routing to manual triage.`,
          }
        }

        const { caseId, githubIssueUrl: existingGithubIssueUrl } = writeCaseArtifacts(signal, decision)
        state.seen[dedupeKey] = { processed_at: nowIso(), case_id: caseId }

        let githubIssueUrl = existingGithubIssueUrl
        if (!githubIssueUrl) {
          const issue = await createGithubIssue({ caseId, signal, decision })
          if (issue.ok && issue.url) {
            updateCasePrdLinks(caseId, { github_issue: issue.url })
            githubIssueUrl = issue.url
          }
        }

        await maybePostSlackCaseCard({ caseId, signal, decision, githubIssueUrl: githubIssueUrl || undefined })

        // Emit GitHub workflow dispatch requests for executors.
        const triageMode = getIssueOpsTriageMode()
        for (const [selectedIndex, selected] of (decision.selected_skills || []).entries()) {
          const def = inputCatalogById.get(selected.skill_id)
          if (!def || def.executor !== 'github_actions' || !def.workflow) continue
          const routeOrder = selectedIndex + 1
          const requestedAt = nowIso()

          const rawParams = ((selected.params ?? {}) as Record<string, unknown>)
          const wantsDispatchId = Boolean(def?.required_inputs &&
            typeof def.required_inputs === 'object' &&
            Object.prototype.hasOwnProperty.call(def.required_inputs, 'dispatch_id'))
          const dispatchId = wantsDispatchId ? randomUUID() : ''
          const inputs: Record<string, unknown> = {
            ...rawParams,
            env: rawParams.env ?? signal.env,
            case_id: caseId,
            ...(wantsDispatchId ? { dispatch_id: dispatchId } : {}),
          }

          const request = {
            kind: 'github_workflow_dispatch',
            requested_at: requestedAt,
            route_order: routeOrder,
            case_id: caseId,
            triage_mode: triageMode,
            ...(wantsDispatchId ? { dispatch_id: dispatchId } : {}),
            skill_id: selected.skill_id,
            workflow: def.workflow,
            inputs,
            ...(triageMode === 'dry_run'
              ? {
                simulation: {
                  enabled: true,
                  bounded_evidence_note: triageDryRunBoundedEvidenceNote,
                  rollback_evidence_note: triageDryRunRollbackEvidenceNote,
                },
              }
              : {}),
          }

          const filename = buildDispatchOutboxFilename({
            caseId,
            skillId: selected.skill_id,
            requestedAt,
            routeOrder,
            ...(wantsDispatchId ? { dispatchId } : {}),
          })
          const requestPath = path.join(outboxDir, filename)
          writeUtf8(requestPath, JSON.stringify({ ...request, status: 'pending' }, null, 2) + '\n')

          const dispatch = await dispatchGithubWorkflow(def.workflow, request.inputs)
          if (dispatch.dispatched) {
            if (dispatch.simulated) {
              writeUtf8(requestPath, JSON.stringify({ ...request, status: 'simulated', simulated_at: nowIso() }, null, 2) + '\n')
            } else {
              writeUtf8(requestPath, JSON.stringify({ ...request, status: 'dispatched', dispatched_at: nowIso() }, null, 2) + '\n')
            }
          } else {
            writeUtf8(requestPath, JSON.stringify({ ...request, status: 'failed', failed_at: nowIso(), error: dispatch }, null, 2) + '\n')
          }
        }

         
        console.log(JSON.stringify({ ok: true, case_id: caseId, decision }, null, 2))
      } catch (error) {
         
        console.error('brain_signal_processing_failed', { file, error: error instanceof Error ? error.message : String(error) })
      }
    }
  }

  await ingestDispatchedRunsOnce()
  emitCaseIndexRetentionObservability()
  saveState(state)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const parseArgs = () => {
  const args = new Set(process.argv.slice(2))
  const once = args.has('--once')
  const loop = args.has('--loop')
  const intervalIndex = process.argv.indexOf('--interval-seconds')
  const intervalSeconds = intervalIndex >= 0 ? Number(process.argv[intervalIndex + 1]) : 30
  return { once, loop, intervalSeconds: Number.isFinite(intervalSeconds) ? intervalSeconds : 30 }
}

const main = async () => {
  const { once, loop, intervalSeconds } = parseArgs()
  const triageMode = getIssueOpsTriageMode()
  console.log(`brain_triage_mode mode=${triageMode}`)
  if (!once && !loop) {
    // Default to --once for safety.
    await processInboxOnce()
    return
  }
  if (once) {
    await processInboxOnce()
    return
  }
   
  console.log(`brain_loop_start interval_seconds=${intervalSeconds}`)
  for (;;) {
    await processInboxOnce()
    await sleep(Math.max(5, intervalSeconds) * 1000)
  }
}

main().catch((error) => {
   
  console.error('brain_failed', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
