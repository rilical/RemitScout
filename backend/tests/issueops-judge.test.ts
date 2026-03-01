import { describe, expect, it } from 'vitest'

import {
  buildHumanInLoopEscalationContract,
  buildReasonCodeRules,
  judgeIssueOpsDecision,
} from '../scripts/lib/issueops-judge'

const reasonCodeRules = buildReasonCodeRules({
  reason_codes: [
    {
      code: 'queue.stats',
      default_severity: 'sev0',
      suggested_next_skill_ids: [],
    },
    {
      code: 'http.p95_high',
      default_severity: 'sev2',
      suggested_next_skill_ids: ['evidence.http_latency.github_actions'],
    },
    {
      code: 'queue.dlq_nonzero',
      default_severity: 'sev3',
      suggested_next_skill_ids: ['evidence.queue_backlog.github_actions'],
    },
  ],
})

describe('issueops judge decision model', () => {
  it('closes case for informational findings only', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'queue.stats', severity: 'sev3' }],
      recommendedNextSkillIds: ['manual.human_triage'],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('close_case')
    expect(result.reasonCodes).toEqual(['queue.stats'])
    expect(result.summary).toContain('Closure rationale')
  })

  it('escalates closure when informational rationale is missing', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [],
      recommendedNextSkillIds: [],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toEqual(['triage.close_case_rationale_missing'])
    expect(result.summary).toContain('Close-case conditions were not met')
  })

  it('iterates when actionable findings have non-manual next skills', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'http.p95_high', severity: 'sev1' }],
      recommendedNextSkillIds: ['manual.human_triage'],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('iterate')
    expect(result.reasonCodes).toEqual(['http.p95_high'])
  })

  it('escalates when actionable findings have no non-manual next skills', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'http.p95_high', severity: 'sev2' }],
      recommendedNextSkillIds: ['manual.human_triage'],
      reasonCodeRules: new Map([
        ['http.p95_high', { defaultSeverity: 'sev2', suggestedNextSkillIds: [] }],
      ]),
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toEqual(['http.p95_high'])
  })

  it('escalates on explicit escalation severity signals', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'queue.dlq_nonzero', severity: 'sev1' }],
      recommendedNextSkillIds: ['evidence.queue_backlog.github_actions'],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toEqual(['queue.dlq_nonzero'])
  })

  it('escalates failed evidence runs even without findings', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: false,
      findings: [],
      recommendedNextSkillIds: [],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toEqual(['evidence.error'])
  })

  it('escalates iterate decisions when triage timebox loop limit is exceeded', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'http.p95_high', severity: 'sev2' }],
      recommendedNextSkillIds: ['evidence.http_latency.github_actions'],
      reasonCodeRules,
      triageTimebox: {
        previousIterateCount: 3,
        maxIterateCount: 3,
        maxElapsedMinutes: 90,
        streakStartedAt: '2026-02-28T09:00:00.000Z',
        decisionAt: '2026-02-28T09:10:00.000Z',
      },
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toContain('triage.timebox_exceeded')
    expect(result.summary).toContain('Triage timebox exceeded')
  })

  it('builds pending human-in-loop contract for escalations', () => {
    const contract = buildHumanInLoopEscalationContract({
      recommendation: 'escalate',
      reasonCodes: ['queue.dlq_nonzero', 'evidence.error'],
      summary: 'Escalation required due to sev3 findings.',
    })

    expect(contract.required).toBe(true)
    expect(contract.status).toBe('pending_human_triage')
    expect(contract.route_skill_id).toBe('manual.human_triage')
    expect(contract.escalation_sla_minutes).toBe(30)
    expect(contract.escalation_owner_tag).toBe('owner.issueops.oncall@v1')
    expect(contract.reason_codes).toEqual(['queue.dlq_nonzero', 'evidence.error'])
  })

  it('builds not-required human-in-loop contract for non-escalations', () => {
    const contract = buildHumanInLoopEscalationContract({
      recommendation: 'iterate',
      reasonCodes: ['http.p95_high'],
      summary: 'Continue evidence iteration.',
    })

    expect(contract.required).toBe(false)
    expect(contract.status).toBe('not_required')
    expect(contract.escalation_sla_minutes).toBe(0)
    expect(contract.escalation_owner_tag).toBe('owner.none@v1')
    expect(contract.reason_codes).toEqual([])
    expect(contract.handoff_summary).toBe('Escalation not required for this decision.')
  })

  it('escalates when incident timeline reconstruction from events fails', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'http.p95_high', severity: 'sev2' }],
      recommendedNextSkillIds: ['evidence.http_latency.github_actions'],
      reasonCodeRules,
      timelineReconstruction: {
        ok: false,
        reasonCode: 'triage.timeline_reconstruction_failed',
        summary: 'Incident timeline reconstruction from events failed: missing dispatch requested_at anchor.',
      },
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toContain('triage.timeline_reconstruction_failed')
    expect(result.summary).toContain('timeline reconstruction from events failed')
  })

  it('handles empty findings array gracefully', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [],
      recommendedNextSkillIds: [],
      reasonCodeRules: new Map(),
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toContain('triage.close_case_rationale_missing')
  })

  it('handles unknown reason codes not in catalog', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'unknown.code.not_in_catalog', severity: 'sev2' }],
      recommendedNextSkillIds: ['evidence.http_latency.github_actions'],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('iterate')
    expect(result.reasonCodes).toContain('unknown.code.not_in_catalog')
  })

  it('escalates on elapsed timebox even when iterate count is within limit', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ reason_code: 'http.p95_high', severity: 'sev2' }],
      recommendedNextSkillIds: ['evidence.http_latency.github_actions'],
      reasonCodeRules,
      triageTimebox: {
        previousIterateCount: 1,
        maxIterateCount: 10,
        maxElapsedMinutes: 30,
        streakStartedAt: '2026-02-28T08:00:00.000Z',
        decisionAt: '2026-02-28T09:30:00.000Z',
      },
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toContain('triage.timebox_exceeded')
  })

  it('handles findings with missing reason_code', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [{ severity: 'sev2' }],
      recommendedNextSkillIds: ['evidence.http_latency.github_actions'],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('iterate')
  })

  it('handles multiple sev3 findings correctly', () => {
    const result = judgeIssueOpsDecision({
      evidenceSuccess: true,
      findings: [
        { reason_code: 'queue.dlq_nonzero', severity: 'sev3' },
        { reason_code: 'http.p95_high', severity: 'sev2' },
      ],
      recommendedNextSkillIds: [],
      reasonCodeRules,
    })

    expect(result.recommendation).toBe('escalate')
    expect(result.reasonCodes).toContain('queue.dlq_nonzero')
  })

  it('builds reason code rules from valid catalog', () => {
    const rules = buildReasonCodeRules({
      reason_codes: [
        { code: 'test.rule', default_severity: 'sev1', suggested_next_skill_ids: ['skill.a'] },
      ],
    })

    expect(rules.size).toBe(1)
    expect(rules.get('test.rule')?.defaultSeverity).toBe('sev1')
    expect(rules.get('test.rule')?.suggestedNextSkillIds).toEqual(['skill.a'])
  })

  it('builds empty rules from invalid catalog', () => {
    expect(buildReasonCodeRules(null).size).toBe(0)
    expect(buildReasonCodeRules(undefined).size).toBe(0)
    expect(buildReasonCodeRules('string').size).toBe(0)
    expect(buildReasonCodeRules({ reason_codes: 'not_array' }).size).toBe(0)
  })
})
