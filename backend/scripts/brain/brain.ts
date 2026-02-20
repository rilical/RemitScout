import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

type CaseEnv = 'dev' | 'staging' | 'prod'
type Severity = 'sev0' | 'sev1' | 'sev2' | 'sev3'
type Domain =
  | 'provider_health'
  | 'queue'
  | 'api_latency'
  | 'freshness'
  | 'indices'
  | 'pulse'
  | 'exports'
  | 'infra_drift'
  | 'security'
  | 'other'

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
  planes?: Array<'plane_a' | 'plane_b' | 'plane_c'>
  services?: string[]
  queues?: string[]
  risk_tier?: number
}

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

type DispatchIngestionState = {
  version: number
  dispatches: Record<string, { run_id: number; artifact_id?: number; ingested_at: string }>
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const remitScoutDir = path.join(repoRoot, '.remit-scout')
const casesDir = path.join(remitScoutDir, 'cases')
const skillsCatalogPath = path.join(remitScoutDir, 'skills', 'catalog.yaml')
const inboxDir = path.join(repoRoot, 'ops', 'brain', 'inbox')
const outboxDir = path.join(repoRoot, 'ops', 'brain', 'outbox')
const statePath = path.join(repoRoot, 'ops', 'brain', 'state', 'brain-state.json')
const dispatchIngestionPath = path.join(repoRoot, 'ops', 'brain', 'state', 'dispatch-ingestion.json')

const frontdeskStateDir = path.join(repoRoot, 'ops', 'frontdesk', 'state')
const slackMapPath = path.join(frontdeskStateDir, 'case-slack-map.json')
const suppressionsPath = path.join(frontdeskStateDir, 'suppressions.json')

const nowIso = () => new Date().toISOString()

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex')

const safeCaseId = (prefix: string) => {
  const base = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `case-${Date.now()}`
}

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')
const writeUtf8 = (p: string, value: string) => fs.writeFileSync(p, value, 'utf8')

const safeJson = (raw: string): any => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
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
): Promise<{ dispatched: boolean; status: number; message?: string }> => {
  const enabled = String(process.env.BRAIN_DISPATCH_GITHUB_ACTIONS || '').trim() === '1'
  const repo = String(process.env.GITHUB_REPOSITORY || '').trim() // "owner/name"
  const token = String(process.env.GITHUB_TOKEN || '').trim()
  const ref = String(process.env.GITHUB_REF || 'main')
    .trim()
    .replace(/^refs\/heads\//, '') || 'main'

  if (!enabled) return { dispatched: false, status: 0, message: 'BRAIN_DISPATCH_GITHUB_ACTIONS!=1' }
  if (!repo || !token) return { dispatched: false, status: 0, message: 'Missing GITHUB_REPOSITORY or GITHUB_TOKEN' }

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

  if (res.status === 204) return { dispatched: true, status: res.status }
  const text = await res.text().catch(() => '')
  return { dispatched: false, status: res.status, message: text.slice(0, 1000) }
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

const updateCasePrd = (caseId: string, patch: { human_owner?: string }) => {
  const prdPath = path.join(casesDir, caseId, 'prd.yaml')
  if (!fs.existsSync(prdPath)) return
  const prd = parseYaml(readUtf8(prdPath)) as any
  if (patch.human_owner !== undefined) prd.human_owner = patch.human_owner
  writeUtf8(prdPath, stringifyYaml(prd))
}

const listSignalFiles = (): string[] => {
  if (!fs.existsSync(inboxDir)) return []
  return fs
    .readdirSync(inboxDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(inboxDir, f))
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
  const domainOk = typeof signal?.domain === 'string' && signal.domain.length > 0
  const symptomsOk = typeof signal?.symptoms === 'string' && signal.symptoms.trim().length > 0
  return Boolean(envOk && sevOk && domainOk && symptomsOk)
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

const deterministicDecider = (input: BrainInput): BrainDecision => {
  const signals = input.signals
  const primary = signals[0]
  if (!primary) return { selected_skills: [], priority: 5, why: 'No signals provided', human_attention_required: true }

  const selected: SelectedSkill[] = []

  // Provider evidence
  if (primary.domain === 'provider_health' && primary.provider_id) {
    const providerId = primary.provider_id
    selected.push({
      skill_id: 'evidence.provider_health.github_actions',
      params: { env: primary.env, provider_id: providerId, window_hours: 6 },
      stop_on_failure: false,
    })
  }

  // Queue evidence
  if (primary.domain === 'queue' && primary.queue_kind) {
    selected.push({
      skill_id: 'evidence.queue_backlog.github_actions',
      params: { env: primary.env, queue_kind: primary.queue_kind },
      stop_on_failure: false,
    })
  }

  // API latency evidence
  if (primary.domain === 'api_latency' && primary.target_url) {
    selected.push({
      skill_id: 'evidence.http_latency.github_actions',
      params: { env: primary.env, target_url: primary.target_url, requests: 20, timeout_ms: 5000 },
      stop_on_failure: false,
    })
  }

  // Indices readiness evidence (Gold export snapshot)
  if (primary.domain === 'indices') {
    selected.push({
      skill_id: 'evidence.indices_readiness.github_actions',
      params: { env: primary.env, amount_bucket: 500, method_profile: 'standard_bank' },
      stop_on_failure: false,
    })
  }

  // Pulse cache evidence (Gold pulse cache freshness)
  if (primary.domain === 'pulse') {
    selected.push({
      skill_id: 'evidence.pulse_cache_health.github_actions',
      params: { env: primary.env },
      stop_on_failure: false,
    })
  }

  // Exports health evidence (export_job + queue + S3)
  if (primary.domain === 'exports') {
    selected.push({
      skill_id: 'evidence.exports_health.github_actions',
      params: { env: primary.env, window_hours: 24 },
      stop_on_failure: false,
    })
  }

  // Freshness SLO evidence
  if (primary.domain === 'freshness') {
    selected.push({
      skill_id: 'evidence.freshness_slo.github_actions',
      params: { env: primary.env, window_hours: 24 },
      stop_on_failure: false,
    })
  }

  // Security DAST evidence
  if (primary.domain === 'security' && primary.target_url) {
    selected.push({
      skill_id: 'evidence.security_dast.github_actions',
      params: {
        env: primary.env,
        target_url: primary.target_url,
        run_authenticated: 'true',
        run_full_scan: 'false',
      },
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
    priority: primary.severity === 'sev0' ? 0 : primary.severity === 'sev1' ? 1 : primary.severity === 'sev2' ? 2 : 3,
    why: 'Deterministic routing based on signal kind/domain and safe evidence skills.',
    human_attention_required: primary.severity === 'sev0' || primary.severity === 'sev1',
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
    // eslint-disable-next-line no-console
    console.error('openclaw_decider_failed', { status: res.status, stderr: (res.stderr || '').slice(0, 4000) })
    return null
  }

  try {
    return JSON.parse(String(res.stdout || '')) as BrainDecision
  } catch {
    // eslint-disable-next-line no-console
    console.error('openclaw_decider_invalid_json', { stdout: String(res.stdout || '').slice(0, 4000) })
    return null
  }
}

const enforceDecision = (decision: BrainDecision, input: BrainInput): BrainDecision => {
  const catalogById = new Map(input.skills_catalog.skills.map((s) => [s.skill_id, s] as const))
  const primary = input.signals[0]
  const env = primary?.env || 'dev'
  const maxRisk = Math.max(0, Math.min(3, Number(primary?.risk_tier ?? 1)))

  const filtered: SelectedSkill[] = []
  for (const s of decision.selected_skills || []) {
    const def = catalogById.get(s.skill_id)
    if (!def) continue

    // Hard safety: prod defaults to non-local executors only.
    if (env === 'prod' && def.executor === 'local_codex') continue

    // Risk tier gating.
    if (def.risk_tier > maxRisk) continue

    filtered.push(s)
  }

  return {
    ...decision,
    selected_skills: filtered,
  }
}

const writeCaseArtifacts = (signal: Signal, decision: BrainDecision) => {
  const observedAt = signal.observed_at ? new Date(signal.observed_at) : new Date()
  const dedupe = signal.signal_id ? sha256(signal.signal_id) : sha256(JSON.stringify(signal))
  const short = dedupe.slice(0, 8)
  const date = observedAt.toISOString().slice(0, 10).replace(/-/g, '')
  const caseId = safeCaseId(`case-${date}-${signal.env}-${signal.domain}-${signal.provider_id || 'signal'}-${short}`)

  const caseDir = path.join(casesDir, caseId)
  const runsDir = path.join(caseDir, 'runs')
  fs.mkdirSync(runsDir, { recursive: true })

  const prd = {
    case_id: caseId,
    created_at: nowIso(),
    env: signal.env,
    severity: signal.severity,
    signal_sources: (signal.signal_sources && signal.signal_sources.length)
      ? signal.signal_sources
      : ['unknown'],
    domain: signal.domain,
    symptoms: signal.symptoms,
    suspected_components: {
      planes: signal.planes ?? [],
      services: signal.services ?? [],
      providers: signal.provider_id ? [signal.provider_id] : [],
      queues: Array.from(new Set([
        ...((signal.queues ?? []).map((q) => String(q).trim()).filter(Boolean)),
        ...(signal.queue_kind ? [String(signal.queue_kind).trim()] : []),
      ])).filter(Boolean),
    },
    risk_tier: Math.max(0, Math.min(3, Number(signal.risk_tier ?? 1))),
    human_owner: '',
    links: {
      github_issue: '',
      github_pr: '',
      cloudwatch_alarms: [],
      dashboards: [],
    },
  }

  const guardProd = signal.env === 'prod'
  const plan = {
    case_id: caseId,
    goal: 'Collect evidence, pinpoint root cause, and recommend next steps.',
    constraints: [
      `prod_read_only=${guardProd ? 'true' : 'false'}`,
      'no secrets in artifacts',
    ],
    skills: decision.selected_skills.map((s) => {
      const def = inputCatalogById.get(s.skill_id)!
      const expectedArtifacts =
        def.executor === 'github_actions'
          ? [`github:workflow:${def.workflow}`]
          : def.executor === 'local_codex'
            ? ['stdout:json']
            : []

      return {
        skill_id: s.skill_id,
        executor: def.executor,
        params: s.params ?? {},
        expected_artifacts: expectedArtifacts,
        stop_on_failure: Boolean(s.stop_on_failure),
      }
    }),
    guardrails: {
      max_runtime_minutes: 30,
      max_diff_lines: 0,
      prod_read_only: guardProd,
    },
  }

  writeUtf8(path.join(caseDir, 'prd.yaml'), stringifyYaml(prd))
  writeUtf8(path.join(caseDir, 'plan.yaml'), stringifyYaml(plan))

  return { caseId }
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
    updateCasePrd(caseId, { human_owner: owner })
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
    const evidenceOnly = Boolean(event?.params?.evidence_only)
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
    const failed: string[] = []

    for (const s of selected) {
      const skillId = String(s?.skill_id || '').trim()
      const def = catalogById.get(skillId)
      if (!def?.workflow) continue

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
        requested_at: nowIso(),
        case_id: caseId,
        ...(wantsDispatchId ? { dispatch_id: dispatchId } : {}),
        skill_id: skillId,
        workflow: def.workflow,
        inputs,
      }

      const filename = wantsDispatchId
        ? `dispatch-${caseId}-${dispatchId}-${skillId.replace(/[^a-zA-Z0-9]+/g, '_')}-${Date.now()}.json`
        : `dispatch-${caseId}-${skillId.replace(/[^a-zA-Z0-9]+/g, '_')}-${Date.now()}-${randomUUID()}.json`
      const requestPath = path.join(outboxDir, filename)
      writeUtf8(requestPath, JSON.stringify({ ...request, status: 'pending' }, null, 2) + '\n')

      const dispatch = await dispatchGithubWorkflow(def.workflow, request.inputs)
      if (dispatch.dispatched) {
        dispatched.push(skillId)
        writeUtf8(requestPath, JSON.stringify({ ...request, status: 'dispatched', dispatched_at: nowIso() }, null, 2) + '\n')
      } else {
        failed.push(skillId)
        writeUtf8(requestPath, JSON.stringify({ ...request, status: 'failed', failed_at: nowIso(), error: dispatch }, null, 2) + '\n')
      }
    }

    const msg = [
      `Run Evidence requested (evidence_only=${evidenceOnly ? 'true' : 'false'}).`,
      dispatched.length ? `Dispatched: ${dispatched.map((s) => `\`${s}\``).join(', ')}` : null,
      failed.length ? `Failed: ${failed.map((s) => `\`${s}\``).join(', ')}` : null,
    ].filter(Boolean).join('\n')

    await postSlackThreadReply(caseId, msg)
  }
}

type GithubWorkflowDispatchOutbox = {
  kind: 'github_workflow_dispatch'
  requested_at: string
  case_id: string
  dispatch_id?: string
  skill_id: string
  workflow: string
  inputs: Record<string, unknown>
  status?: 'pending' | 'dispatched' | 'failed'
  dispatched_at?: string
  failed_at?: string
  ingested_at?: string
  github_run_id?: number
  github_actions_run_url?: string
  github_artifact_id?: number
  github_actions_artifact_url?: string
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
  evidence: any
}) => {
  const findings = Array.isArray(args.evidence?.findings) ? args.evidence.findings : []
  const sev3 = findings.some((f: any) => String(f?.severity || '') === 'sev3')
  const sev2or3 = findings.some((f: any) => {
    const s = String(f?.severity || '')
    return s === 'sev2' || s === 'sev3'
  })

  const evidenceSuccess = Boolean(args.evidence?.success)
  const resultsSuccess = evidenceSuccess && !sev3

  const recommended = Array.isArray(args.evidence?.recommended_next_skill_ids)
    ? args.evidence.recommended_next_skill_ids.map((x: any) => String(x || '').trim()).filter(Boolean)
    : []

  const nextRecommendation =
    (!evidenceSuccess || sev3) ? 'escalate'
      : (findings.length === 0) ? 'close_case'
        : (sev2or3 && recommended.length > 0) ? 'iterate'
          : 'iterate'

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
    evidence_refs: [
      { kind: 'link', ref: args.runUrl },
      { kind: 'github_artifact', ref: args.artifactName },
      { kind: 'link', ref: args.artifactUrl },
    ],
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
    if (candidates.length >= maxPerLoop) break
  }

  for (const c of candidates) {
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
        evidence: extracted.evidence,
      })

      const runsDir = path.join(casesDir, caseId, 'runs')
      fs.mkdirSync(runsDir, { recursive: true })
      const stamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14)
      const runPath = path.join(runsDir, `run-${stamp}-${dispatchId}.json`)
      writeUtf8(runPath, JSON.stringify(runRecord, null, 2) + '\n')

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
      const top = findings.slice(0, 8).map((f: any) => {
        const sev = String(f?.severity || '').trim()
        const code = String(f?.reason_code || '').trim()
        const msg = String(f?.message || '').trim()
        return `- (${sev || 'sev?'}) \`${code || 'unknown'}\`: ${msg || 'unknown'}`
      }).join('\n')

      await postSlackThreadReply(
        caseId,
        [
          `Evidence ingested: \`${skillId}\` dispatch=\`${dispatchId}\`.`,
          `Run: ${runUrl}`,
          top ? `Findings:\n${top}` : `No findings.`,
        ].join('\n'),
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
              top ? `Findings:\n${top}` : `No findings.`,
            ].join('\n'),
          )
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
          console.error('brain_case_action_failed', { file, error: error instanceof Error ? error.message : String(error) })
        }
        continue
      }

      if (!isValidSignal(raw)) {
        // eslint-disable-next-line no-console
        console.error('brain_signal_invalid', { file, signal: raw })
        continue
      }

      const signal = raw
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

        const { caseId } = writeCaseArtifacts(signal, decision)
        state.seen[dedupeKey] = { processed_at: nowIso(), case_id: caseId }

        const issue = await createGithubIssue({ caseId, signal, decision })
        if (issue.ok && issue.url) {
          updateCasePrdLinks(caseId, { github_issue: issue.url })
        }

        await maybePostSlackCaseCard({ caseId, signal, decision, githubIssueUrl: issue.ok ? issue.url : undefined })

        // Emit GitHub workflow dispatch requests for executors.
        for (const selected of decision.selected_skills || []) {
          const def = inputCatalogById.get(selected.skill_id)
          if (!def || def.executor !== 'github_actions' || !def.workflow) continue

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
            requested_at: nowIso(),
            case_id: caseId,
            ...(wantsDispatchId ? { dispatch_id: dispatchId } : {}),
            skill_id: selected.skill_id,
            workflow: def.workflow,
            inputs,
          }

          const filename = wantsDispatchId
            ? `dispatch-${caseId}-${dispatchId}-${selected.skill_id.replace(/[^a-zA-Z0-9]+/g, '_')}-${Date.now()}.json`
            : `dispatch-${caseId}-${selected.skill_id.replace(/[^a-zA-Z0-9]+/g, '_')}-${Date.now()}-${randomUUID()}.json`
          const requestPath = path.join(outboxDir, filename)
          writeUtf8(requestPath, JSON.stringify({ ...request, status: 'pending' }, null, 2) + '\n')

          const dispatch = await dispatchGithubWorkflow(def.workflow, request.inputs)
          if (dispatch.dispatched) {
            writeUtf8(requestPath, JSON.stringify({ ...request, status: 'dispatched', dispatched_at: nowIso() }, null, 2) + '\n')
          } else {
            writeUtf8(requestPath, JSON.stringify({ ...request, status: 'failed', failed_at: nowIso(), error: dispatch }, null, 2) + '\n')
          }
        }

        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ ok: true, case_id: caseId, decision }, null, 2))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('brain_signal_processing_failed', { file, error: error instanceof Error ? error.message : String(error) })
      }
    }
  }

  await ingestDispatchedRunsOnce()
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
  if (!once && !loop) {
    // Default to --once for safety.
    await processInboxOnce()
    return
  }
  if (once) {
    await processInboxOnce()
    return
  }
  // eslint-disable-next-line no-console
  console.log(`brain_loop_start interval_seconds=${intervalSeconds}`)
  for (;;) {
    await processInboxOnce()
    await sleep(Math.max(5, intervalSeconds) * 1000)
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('brain_failed', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
