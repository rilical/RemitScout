import fs from 'node:fs'

import { formatError } from '../../shared/utils/error-handling'
import {
  DEFAULT_EVIDENCE_BUDGETS,
  getGithubActionsRunUrl,
  resolveCaseEnv,
  writeEvidenceResult,
  type EvidenceFinding,
  type EvidencePointer,
  type EvidenceResult,
} from '../lib/evidence'

type ScanSummary = {
  totals?: Record<string, unknown>
  violations?: unknown
  [key: string]: unknown
}

const readJsonIfExists = (filePath: string): ScanSummary | null => {
  const resolved = String(filePath || '').trim()
  if (!resolved || !fs.existsSync(resolved)) return null
  const raw = fs.readFileSync(resolved, 'utf8').trim()
  if (!raw) return null
  return JSON.parse(raw) as ScanSummary
}

const toInt = (value: unknown): number => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.floor(num))
}

const parseOutcome = (value: string): string => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return 'unknown'
  return normalized
}

const resolveFindingSeverity = (env: 'dev' | 'staging' | 'prod') => {
  if (env === 'prod') return 'sev3' as const
  if (env === 'staging') return 'sev2' as const
  return 'sev1' as const
}

const countZapMediumPlus = (summary: ScanSummary | null): number => {
  const totals = summary?.totals ?? {}
  return toInt(totals.high) + toInt(totals.medium)
}

const countNucleiMediumPlus = (summary: ScanSummary | null): number => {
  const totals = summary?.totals ?? {}
  return toInt(totals.critical) + toInt(totals.high) + toInt(totals.medium)
}

const asArray = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) return []
  return value
}

const main = () => {
  const env = resolveCaseEnv(process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()
  const dispatchId = String(process.env.DISPATCH_ID || '').trim()
  const targetUrl = String(process.env.TARGET_URL || '').trim()

  const authRequested = String(process.env.AUTH_SCAN_REQUESTED || 'false').trim() === 'true'
  const runFullScan = String(process.env.RUN_FULL_SCAN || 'false').trim() === 'true'

  const authSecretOutcome = parseOutcome(process.env.AUTH_SECRET_CHECK_OUTCOME || 'skipped')
  const zapAuthPolicyOutcome = parseOutcome(process.env.ZAP_AUTH_POLICY_OUTCOME || 'skipped')
  const nucleiAuthPolicyOutcome = parseOutcome(process.env.NUCLEI_AUTH_POLICY_OUTCOME || 'skipped')

  const zapBaselineOutcome = parseOutcome(process.env.ZAP_BASELINE_POLICY_OUTCOME || 'unknown')
  const nucleiUnauthOutcome = parseOutcome(process.env.NUCLEI_UNAUTH_POLICY_OUTCOME || 'unknown')
  const zapFullOutcome = parseOutcome(process.env.ZAP_FULL_POLICY_OUTCOME || 'skipped')

  const zapBaselineSummary = readJsonIfExists(process.env.ZAP_BASELINE_SUMMARY_FILE || 'zap-baseline-summary.json')
  const nucleiUnauthSummary = readJsonIfExists(process.env.NUCLEI_UNAUTH_SUMMARY_FILE || 'nuclei-unauth-summary.json')
  const zapAuthSummary = readJsonIfExists(process.env.ZAP_AUTH_SUMMARY_FILE || 'zap-api-auth-summary.json')
  const nucleiAuthSummary = readJsonIfExists(process.env.NUCLEI_AUTH_SUMMARY_FILE || 'nuclei-auth-summary.json')
  const zapFullSummary = readJsonIfExists(process.env.ZAP_FULL_SUMMARY_FILE || 'zap-full-auth-summary.json')

  const findingSeverity = resolveFindingSeverity(env)
  const findings: EvidenceFinding[] = []

  const authFailed = authRequested && (
    authSecretOutcome !== 'success'
    || zapAuthPolicyOutcome === 'failure'
    || nucleiAuthPolicyOutcome === 'failure'
  )

  if (authFailed) {
    findings.push({
      reason_code: 'security.auth_scan_failed',
      severity: findingSeverity,
      message: 'Authenticated DAST scan failed or could not run.',
      details: {
        auth_secret_check_outcome: authSecretOutcome,
        zap_auth_policy_outcome: zapAuthPolicyOutcome,
        nuclei_auth_policy_outcome: nucleiAuthPolicyOutcome,
      },
    })
  }

  const scanSummaries: Array<{ label: string; summary: ScanSummary | null; mediumPlusCount: number }> = [
    {
      label: 'zap_baseline_unauth',
      summary: zapBaselineSummary,
      mediumPlusCount: countZapMediumPlus(zapBaselineSummary),
    },
    {
      label: 'nuclei_unauth',
      summary: nucleiUnauthSummary,
      mediumPlusCount: countNucleiMediumPlus(nucleiUnauthSummary),
    },
    {
      label: 'zap_api_auth',
      summary: zapAuthSummary,
      mediumPlusCount: countZapMediumPlus(zapAuthSummary),
    },
    {
      label: 'nuclei_auth',
      summary: nucleiAuthSummary,
      mediumPlusCount: countNucleiMediumPlus(nucleiAuthSummary),
    },
    {
      label: 'zap_full_auth',
      summary: zapFullSummary,
      mediumPlusCount: countZapMediumPlus(zapFullSummary),
    },
  ]

  for (const scan of scanSummaries) {
    if (scan.mediumPlusCount <= 0) continue
    findings.push({
      reason_code: 'security.dast_medium_or_higher',
      severity: findingSeverity,
      message: `${scan.label} reported ${scan.mediumPlusCount} medium-or-higher findings.`,
      details: {
        scan: scan.label,
        medium_plus_count: scan.mediumPlusCount,
        totals: scan.summary?.totals ?? {},
        violations: asArray(scan.summary?.violations),
      },
    })
  }

  if (zapBaselineOutcome === 'failure' || nucleiUnauthOutcome === 'failure') {
    findings.push({
      reason_code: 'security.dast_medium_or_higher',
      severity: findingSeverity,
      message: 'Unauthenticated DAST policy checks failed.',
      details: {
        zap_baseline_policy_outcome: zapBaselineOutcome,
        nuclei_unauth_policy_outcome: nucleiUnauthOutcome,
      },
    })
  }

  if (runFullScan && zapFullOutcome === 'failure') {
    findings.push({
      reason_code: 'security.dast_medium_or_higher',
      severity: findingSeverity,
      message: 'Authenticated full DAST policy check failed.',
      details: {
        zap_full_policy_outcome: zapFullOutcome,
      },
    })
  }

  const pointers: EvidencePointer[] = []
  const runUrl = getGithubActionsRunUrl()
  if (runUrl) {
    pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })
  }

  const summary = [
    `target_url=${targetUrl || 'unset'}`,
    `auth_requested=${String(authRequested)}`,
    `run_full_scan=${String(runFullScan)}`,
    `zap_baseline_medium_plus=${countZapMediumPlus(zapBaselineSummary)}`,
    `nuclei_unauth_medium_plus=${countNucleiMediumPlus(nucleiUnauthSummary)}`,
    `zap_auth_medium_plus=${countZapMediumPlus(zapAuthSummary)}`,
    `nuclei_auth_medium_plus=${countNucleiMediumPlus(nucleiAuthSummary)}`,
    `zap_full_medium_plus=${countZapMediumPlus(zapFullSummary)}`,
  ].join(' | ')

  const evidence: EvidenceResult = {
    success: findings.length === 0,
    generated_at: new Date().toISOString(),
    environment: env,
    case_id: caseId,
    dispatch_id: dispatchId || undefined,
    skill_id: 'evidence.security_dast.github_actions',
    summary,
    findings,
    recommended_next_skill_ids: ['manual.human_triage'],
    pointers,
    budgets: DEFAULT_EVIDENCE_BUDGETS,
  }

  evidence.findings.push({
    reason_code: 'security.scan_stats',
    severity: 'sev0',
    message: 'Security DAST scan snapshot.',
    details: {
      target_url: targetUrl,
      auth_requested: authRequested,
      run_full_scan: runFullScan,
      outcomes: {
        auth_secret_check: authSecretOutcome,
        zap_baseline_policy: zapBaselineOutcome,
        nuclei_unauth_policy: nucleiUnauthOutcome,
        zap_auth_policy: zapAuthPolicyOutcome,
        nuclei_auth_policy: nucleiAuthPolicyOutcome,
        zap_full_policy: zapFullOutcome,
      },
      totals: {
        zap_baseline: zapBaselineSummary?.totals ?? {},
        nuclei_unauth: nucleiUnauthSummary?.totals ?? {},
        zap_auth: zapAuthSummary?.totals ?? {},
        nuclei_auth: nucleiAuthSummary?.totals ?? {},
        zap_full: zapFullSummary?.totals ?? {},
      },
    },
  })

  writeEvidenceResult(evidence)
}

try {
  main()
} catch (error: unknown) {
  const env = resolveCaseEnv(process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()
  const dispatchId = String(process.env.DISPATCH_ID || '').trim()
  const { message, stack } = formatError(error)

  const evidence: EvidenceResult = {
    success: false,
    generated_at: new Date().toISOString(),
    environment: env,
    case_id: caseId,
    dispatch_id: dispatchId || undefined,
    skill_id: 'evidence.security_dast.github_actions',
    summary: 'Security DAST evidence generation failed.',
    findings: [
      {
        reason_code: 'evidence.error',
        severity: env === 'prod' ? 'sev3' : 'sev2',
        message,
        details: { stack },
      },
    ],
    recommended_next_skill_ids: ['manual.human_triage'],
    pointers: [],
    budgets: DEFAULT_EVIDENCE_BUDGETS,
  }

  writeEvidenceResult(evidence)
  process.exit(1)
}
