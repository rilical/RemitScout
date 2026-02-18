import fs from 'node:fs'
import path from 'node:path'

export type CaseEnv = 'dev' | 'staging' | 'prod'
export type Severity = 'sev0' | 'sev1' | 'sev2' | 'sev3'

export type EvidencePointerKind =
  | 'github_artifact'
  | 'github_actions_run'
  | 's3'
  | 'cloudwatch'
  | 'url'
  | 'other'

export type EvidencePointer = {
  kind: EvidencePointerKind
  ref: string
  note?: string
}

export type EvidenceFinding = {
  reason_code: string
  severity: Severity
  message: string
  details?: Record<string, unknown>
}

export type EvidenceBudgets = {
  max_findings: number
  max_pointer_items: number
  max_details_bytes_each: number
}

export type EvidenceResult = {
  success: boolean
  generated_at: string
  environment: CaseEnv
  case_id: string
  dispatch_id?: string
  skill_id: string
  summary: string
  findings: EvidenceFinding[]
  recommended_next_skill_ids: string[]
  pointers: EvidencePointer[]
  budgets: EvidenceBudgets
}

export const DEFAULT_EVIDENCE_BUDGETS: EvidenceBudgets = {
  max_findings: 25,
  max_pointer_items: 20,
  max_details_bytes_each: 2048,
}

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.floor(value)))
}

const truncateString = (value: string, maxChars: number): string => {
  const v = String(value ?? '')
  if (v.length <= maxChars) return v
  const suffix = '...'
  if (maxChars <= suffix.length) return v.slice(0, maxChars)
  return v.slice(0, maxChars - suffix.length) + suffix
}

export const resolveCaseEnv = (value: string | undefined | null): CaseEnv => {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'prod' || raw === 'production') return 'prod'
  if (raw === 'staging' || raw === 'stage') return 'staging'
  return 'dev'
}

export const getGithubActionsRunUrl = (): string | null => {
  const server = String(process.env.GITHUB_SERVER_URL || '').trim()
  const repo = String(process.env.GITHUB_REPOSITORY || '').trim()
  const runId = String(process.env.GITHUB_RUN_ID || '').trim()
  if (!server || !repo || !runId) return null
  return `${server}/${repo}/actions/runs/${runId}`
}

const enforceDetailsBudget = (details: Record<string, unknown>, maxBytes: number): Record<string, unknown> => {
  try {
    const json = JSON.stringify(details)
    const bytes = Buffer.byteLength(json, 'utf8')
    if (bytes <= maxBytes) return details
    return {
      truncated: true,
      original_bytes: bytes,
      max_bytes: maxBytes,
      note: 'details exceeded budget; see pointers for raw evidence',
    }
  } catch {
    return { truncated: true, note: 'details could not be serialized' }
  }
}

export const normalizeEvidenceResult = (input: EvidenceResult): EvidenceResult => {
  const budgets: EvidenceBudgets = {
    max_findings: clampInt(Number(input?.budgets?.max_findings ?? DEFAULT_EVIDENCE_BUDGETS.max_findings), 1, 200),
    max_pointer_items: clampInt(Number(input?.budgets?.max_pointer_items ?? DEFAULT_EVIDENCE_BUDGETS.max_pointer_items), 0, 200),
    max_details_bytes_each: clampInt(Number(input?.budgets?.max_details_bytes_each ?? DEFAULT_EVIDENCE_BUDGETS.max_details_bytes_each), 256, 65536),
  }

  const caseId = String(input.case_id || process.env.CASE_ID || '').trim()
  const dispatchId = String((input as any)?.dispatch_id || process.env.DISPATCH_ID || '').trim()

  const findings = (Array.isArray(input.findings) ? input.findings : [])
    .slice(0, budgets.max_findings)
    .map((f) => {
      const details = f.details && typeof f.details === 'object'
        ? enforceDetailsBudget(f.details, budgets.max_details_bytes_each)
        : undefined
      return {
        reason_code: truncateString(String(f.reason_code || '').trim() || 'unknown', 120),
        severity: (String(f.severity || 'sev3') as Severity),
        message: truncateString(String(f.message || '').trim() || 'unknown', 200),
        ...(details ? { details } : {}),
      }
    })

  const pointers = (Array.isArray(input.pointers) ? input.pointers : [])
    .slice(0, budgets.max_pointer_items)
    .map((p) => ({
      kind: p.kind,
      ref: truncateString(String(p.ref || '').trim(), 1024),
      ...(p.note ? { note: truncateString(String(p.note).trim(), 200) } : {}),
    }))
    .filter((p) => Boolean(p.ref))

  return {
    success: Boolean(input.success),
    generated_at: String(input.generated_at || new Date().toISOString()),
    environment: resolveCaseEnv(String(input.environment || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')),
    case_id: caseId,
    ...(dispatchId ? { dispatch_id: dispatchId } : {}),
    skill_id: String(input.skill_id || '').trim(),
    summary: truncateString(String(input.summary || '').trim() || 'no summary', 500),
    findings,
    recommended_next_skill_ids: Array.from(new Set(
      (Array.isArray(input.recommended_next_skill_ids) ? input.recommended_next_skill_ids : [])
        .map((x) => String(x || '').trim())
        .filter(Boolean),
    )),
    pointers,
    budgets,
  }
}

export const writeEvidenceResult = (input: EvidenceResult): EvidenceResult => {
  const normalized = normalizeEvidenceResult(input)
  const json = JSON.stringify(normalized, null, 2)

  const outFile = String(process.env.EVIDENCE_OUTPUT_FILE || '').trim()
  if (outFile) {
    const resolved = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile)
    fs.writeFileSync(resolved, json + '\n', 'utf8')
  }

  process.stdout.write(json + '\n')
  return normalized
}
