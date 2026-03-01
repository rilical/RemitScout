import type { Severity } from './evidence'

export type JudgeRecommendation = 'iterate' | 'escalate' | 'close_case'

export type HumanInLoopEscalationContract = {
  contract_version: 'v1'
  required: boolean
  status: 'not_required' | 'pending_human_triage'
  escalation_channel: 'slack_frontdesk'
  route_skill_id: 'manual.human_triage'
  escalation_sla_minutes: number
  escalation_owner_tag: string
  reason_codes: string[]
  handoff_summary: string
  bounded_evidence_note: string
  rollback_evidence_note: string
}

export type JudgeReasonCodeRule = {
  defaultSeverity: Severity
  suggestedNextSkillIds: string[]
}

type JudgeFinding = {
  reason_code?: unknown
  severity?: unknown
}

type JudgeInput = {
  evidenceSuccess: boolean
  findings: JudgeFinding[]
  recommendedNextSkillIds: string[]
  reasonCodeRules: Map<string, JudgeReasonCodeRule>
  timelineReconstruction?: {
    ok: boolean
    reasonCode?: string
    summary?: string
  }
  triageTimebox?: {
    previousIterateCount: number
    maxIterateCount: number
    maxElapsedMinutes: number
    streakStartedAt?: string
    decisionAt?: string
  }
}

type JudgeResult = {
  recommendation: JudgeRecommendation
  reasonCodes: string[]
  summary: string
}

const severityRank: Record<Severity, number> = {
  sev0: 0,
  sev1: 1,
  sev2: 2,
  sev3: 3,
}

const closeCaseRationaleReasonCode = 'triage.close_case_rationale_missing'
const timelineReconstructionReasonCode = 'triage.timeline_reconstruction_failed'
const humanTriageSlaMinutes = 30
const humanTriageOwnerTag = 'owner.issueops.oncall@v1'
const noEscalationOwnerTag = 'owner.none@v1'

const parseSeverity = (value: unknown): Severity => {
  if (value === 'sev0' || value === 'sev1' || value === 'sev2' || value === 'sev3') return value
  return 'sev0'
}

const dedupeStrings = (values: string[]): string[] => {
  const deduped: string[] = []
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (!normalized) continue
    if (!deduped.includes(normalized)) deduped.push(normalized)
  }
  return deduped
}

const toTimestampMs = (value: string | undefined): number | null => {
  if (!value) return null
  const parsed = Date.parse(String(value || '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

const toBoundedSummary = (value: string, maxLength: number, fallback: string): string => {
  const normalized = String(value || '').trim()
  if (!normalized) return fallback
  return normalized.length <= maxLength ? normalized : normalized.slice(0, maxLength)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const buildReasonCodeRules = (rawCatalog: unknown): Map<string, JudgeReasonCodeRule> => {
  const rules = new Map<string, JudgeReasonCodeRule>()
  if (!isRecord(rawCatalog)) return rules

  const reasonCodes = Array.isArray(rawCatalog.reason_codes)
    ? rawCatalog.reason_codes
    : []

  for (const entry of reasonCodes) {
    if (!isRecord(entry)) continue
    const code = String(entry.code || '').trim()
    if (!code) continue
    const defaultSeverity = parseSeverity(entry.default_severity)
    const suggestedNextSkillIds = dedupeStrings(
      Array.isArray(entry.suggested_next_skill_ids)
        ? entry.suggested_next_skill_ids.map((value) => String(value || '').trim())
        : [],
    )
    rules.set(code, {
      defaultSeverity,
      suggestedNextSkillIds,
    })
  }

  return rules
}

export const judgeIssueOpsDecision = (input: JudgeInput): JudgeResult => {
  const findings = Array.isArray(input.findings) ? input.findings : []
  const recommendedNextSkillIds = dedupeStrings(Array.isArray(input.recommendedNextSkillIds)
    ? input.recommendedNextSkillIds
    : [])

  const normalizedFindings = findings.map((finding) => {
    const reasonCode = String(finding?.reason_code || '').trim()
    const observedSeverity = parseSeverity(finding?.severity)
    const rule = reasonCode ? input.reasonCodeRules.get(reasonCode) : undefined
    return {
      reasonCode,
      effectiveSeverity: rule?.defaultSeverity ?? observedSeverity,
      suggestedNextSkillIds: rule?.suggestedNextSkillIds ?? [],
    }
  })

  const derivedSkillIds = dedupeStrings(normalizedFindings.flatMap((finding) => finding.suggestedNextSkillIds))
  const mergedNextSkills = dedupeStrings([...recommendedNextSkillIds, ...derivedSkillIds])
  const nonManualNextSkills = mergedNextSkills.filter((skillId) => skillId !== 'manual.human_triage')

  const informationalFindings = normalizedFindings.filter((finding) => finding.effectiveSeverity === 'sev0')
  const actionableFindings = normalizedFindings.filter((finding) => finding.effectiveSeverity !== 'sev0')
  const escalationFindings = actionableFindings.filter((finding) =>
    finding.effectiveSeverity === 'sev3' || finding.reasonCode === 'evidence.error')
  const informationalReasonCodes = dedupeStrings(
    informationalFindings
      .map((finding) => finding.reasonCode)
      .filter(Boolean),
  )
  const closeCaseConditionsMet =
    input.evidenceSuccess
    && actionableFindings.length === 0
    && informationalReasonCodes.length > 0

  let recommendation: JudgeRecommendation =
    (!input.evidenceSuccess || escalationFindings.length > 0)
      ? 'escalate'
      : (actionableFindings.length === 0)
        ? (closeCaseConditionsMet ? 'close_case' : 'escalate')
        : (nonManualNextSkills.length > 0)
          ? 'iterate'
          : 'escalate'

  const closeCaseEscalationTriggered =
    recommendation === 'escalate'
    && input.evidenceSuccess
    && actionableFindings.length === 0
    && escalationFindings.length === 0

  let timeboxEscalationTriggered = false
  let timeboxSummary = ''
  if (recommendation === 'iterate' && input.triageTimebox) {
    const previousIterateCount = Math.max(0, Math.min(1000, Number(input.triageTimebox.previousIterateCount || 0)))
    const maxIterateCount = Math.max(1, Math.min(1000, Number(input.triageTimebox.maxIterateCount || 1)))
    const maxElapsedMinutes = Math.max(5, Math.min(24 * 60, Number(input.triageTimebox.maxElapsedMinutes || 5)))
    const projectedIterateCount = previousIterateCount + 1

    const streakStartedAtMs = toTimestampMs(input.triageTimebox.streakStartedAt)
    const decisionAtMs = toTimestampMs(input.triageTimebox.decisionAt)
    const elapsedMinutes =
      (streakStartedAtMs !== null && decisionAtMs !== null && decisionAtMs >= streakStartedAtMs)
        ? Math.floor((decisionAtMs - streakStartedAtMs) / (60 * 1000))
        : null

    const iterateLimitExceeded = projectedIterateCount > maxIterateCount
    const elapsedLimitExceeded = elapsedMinutes !== null && elapsedMinutes > maxElapsedMinutes

    if (iterateLimitExceeded || elapsedLimitExceeded) {
      recommendation = 'escalate'
      timeboxEscalationTriggered = true
      const elapsedLabel = elapsedMinutes === null ? 'n/a' : String(elapsedMinutes)
      timeboxSummary =
        `Triage timebox exceeded: iterate_streak=${projectedIterateCount}/${maxIterateCount}, `
        + `elapsed_minutes=${elapsedLabel}/${maxElapsedMinutes}; escalating for manual triage with bounded and rollback evidence refs.`
    }
  }

  let timelineEscalationTriggered = false
  let timelineEscalationReasonCode = timelineReconstructionReasonCode
  let timelineSummary = ''
  if (input.timelineReconstruction && input.timelineReconstruction.ok === false) {
    recommendation = 'escalate'
    timelineEscalationTriggered = true
    const candidateReasonCode = String(input.timelineReconstruction.reasonCode || '').trim()
    if (candidateReasonCode) timelineEscalationReasonCode = candidateReasonCode
    timelineSummary = toBoundedSummary(
      String(input.timelineReconstruction.summary || '').trim(),
      300,
      'Incident timeline reconstruction from events failed; escalating for manual triage with bounded and rollback evidence refs.',
    )
  }

  const prioritizedReasonCodes = (recommendation === 'close_case' ? informationalFindings : actionableFindings)
    .slice()
    .sort((left, right) => severityRank[right.effectiveSeverity] - severityRank[left.effectiveSeverity])
    .map((finding) => finding.reasonCode)
    .filter(Boolean)

  const reasonCodes = dedupeStrings(prioritizedReasonCodes).slice(0, 25)
  if (closeCaseEscalationTriggered && !reasonCodes.includes(closeCaseRationaleReasonCode)) {
    reasonCodes.unshift(closeCaseRationaleReasonCode)
    if (reasonCodes.length > 25) reasonCodes.length = 25
  }
  if (timeboxEscalationTriggered && !reasonCodes.includes('triage.timebox_exceeded')) {
    reasonCodes.unshift('triage.timebox_exceeded')
    if (reasonCodes.length > 25) reasonCodes.length = 25
  }
  if (timelineEscalationTriggered && !reasonCodes.includes(timelineEscalationReasonCode)) {
    reasonCodes.unshift(timelineEscalationReasonCode)
    if (reasonCodes.length > 25) reasonCodes.length = 25
  }
  if (reasonCodes.length === 0 && !input.evidenceSuccess) {
    reasonCodes.push('evidence.error')
  }

  const summaryParts = [
    `Judge ${recommendation}: actionable=${actionableFindings.length}, escalation_signals=${escalationFindings.length}, informational=${informationalFindings.length}.`,
  ]
  if (!input.evidenceSuccess) {
    summaryParts.push('Evidence skill reported success=false.')
  }
  if (actionableFindings.length > 0 && nonManualNextSkills.length === 0) {
    summaryParts.push('No non-manual next skills were recommended; escalating for human triage.')
  }
  if (recommendation === 'iterate' && nonManualNextSkills.length > 0) {
    summaryParts.push(`Next skills: ${nonManualNextSkills.slice(0, 3).join(', ')}.`)
  }
  if (recommendation === 'close_case' && informationalReasonCodes.length > 0) {
    summaryParts.push(
      `Closure rationale: informational findings ${informationalReasonCodes.slice(0, 3).join(', ')} support case closure with bounded and rollback evidence refs.`,
    )
  }
  if (closeCaseEscalationTriggered) {
    summaryParts.push(
      'Close-case conditions were not met: informational rationale is missing from bounded findings, escalating for manual triage with rollback evidence refs.',
    )
  }
  if (timeboxSummary) {
    summaryParts.push(timeboxSummary)
  }
  if (timelineSummary) {
    summaryParts.push(timelineSummary)
  }

  return {
    recommendation,
    reasonCodes,
    summary: summaryParts.join(' '),
  }
}

export const buildHumanInLoopEscalationContract = (input: {
  recommendation: JudgeRecommendation
  reasonCodes: string[]
  summary: string
}): HumanInLoopEscalationContract => {
  const required = input.recommendation === 'escalate'
  const normalizedReasonCodes = required
    ? dedupeStrings(Array.isArray(input.reasonCodes) ? input.reasonCodes : []).slice(0, 10)
    : []

  return {
    contract_version: 'v1',
    required,
    status: required ? 'pending_human_triage' : 'not_required',
    escalation_channel: 'slack_frontdesk',
    route_skill_id: 'manual.human_triage',
    escalation_sla_minutes: required ? humanTriageSlaMinutes : 0,
    escalation_owner_tag: required ? humanTriageOwnerTag : noEscalationOwnerTag,
    reason_codes: normalizedReasonCodes,
    handoff_summary: required
      ? toBoundedSummary(input.summary, 300, 'Escalation required for manual triage.')
      : 'Escalation not required for this decision.',
    bounded_evidence_note: 'Use decision_record.bounded_evidence counters and linked evidence_refs only.',
    rollback_evidence_note: 'Use decision_record.rollback_evidence refs to replay or reverse escalation decisions.',
  }
}
