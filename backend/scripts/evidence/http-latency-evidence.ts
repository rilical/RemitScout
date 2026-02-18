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

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.floor(value)))
}

const percentile = (values: number[], p: number): number | null => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1))))
  return sorted[idx] ?? null
}

const main = async () => {
  const targetUrl = String(process.env.TARGET_URL || '').trim()
  if (!targetUrl) {
    console.error('Missing TARGET_URL')
    process.exit(2)
  }

  const env = resolveCaseEnv(process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()
  const requests = clampInt(Number(process.env.REQUESTS ?? 20), 1, 100)
  const timeoutMs = clampInt(Number(process.env.TIMEOUT_MS ?? 5000), 250, 60000)

  const latenciesMs: number[] = []
  const statusCounts: Record<string, number> = {}
  let timeoutCount = 0
  let errorCount = 0
  const sampleErrors: Array<{ status?: number; message: string; body_preview?: string }> = []

  const recordStatus = (status: number) => {
    const key = String(status)
    statusCounts[key] = (statusCounts[key] ?? 0) + 1
  }

  try {
    for (let i = 0; i < requests; i += 1) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      const started = Date.now()
      try {
        const res = await fetch(targetUrl, { method: 'GET', signal: controller.signal })
        const elapsed = Date.now() - started
        latenciesMs.push(elapsed)
        recordStatus(res.status)

        if (!res.ok && sampleErrors.length < 3) {
          const text = await res.text().catch(() => '')
          sampleErrors.push({
            status: res.status,
            message: `non_2xx status=${res.status}`,
            body_preview: text.slice(0, 500),
          })
        }
      } catch (error: unknown) {
        const elapsed = Date.now() - started
        if (elapsed > 0) latenciesMs.push(elapsed)
        errorCount += 1
        const msg = error instanceof Error ? error.message : String(error)
        if (msg.toLowerCase().includes('aborted')) timeoutCount += 1
        if (sampleErrors.length < 3) {
          sampleErrors.push({ message: msg })
        }
      } finally {
        clearTimeout(timer)
      }
    }

    const p50 = percentile(latenciesMs, 0.50)
    const p95 = percentile(latenciesMs, 0.95)
    const max = latenciesMs.length ? Math.max(...latenciesMs) : null

    const timeoutRate = requests > 0 ? timeoutCount / requests : 0
    const errorRate = requests > 0 ? errorCount / requests : 0

    const p95ThresholdMs = env === 'prod' ? 1500 : (env === 'staging' ? 2500 : 5000)

    const findings: EvidenceFinding[] = []
    if (p95 !== null && p95 >= p95ThresholdMs) {
      findings.push({
        reason_code: 'http.p95_high',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `p95 latency ${p95}ms exceeds threshold ${p95ThresholdMs}ms.`,
        details: { p95_ms: p95, threshold_ms: p95ThresholdMs },
      })
    }

    if (errorRate >= 0.2) {
      findings.push({
        reason_code: 'http.error_rate_high',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: `Error rate ${(errorRate * 100).toFixed(1)}% is high.`,
        details: { error_rate: errorRate, errors: errorCount, requests },
      })
    }

    if (timeoutRate >= 0.1) {
      findings.push({
        reason_code: 'http.timeout_rate_high',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: `Timeout rate ${(timeoutRate * 100).toFixed(1)}% is high.`,
        details: { timeout_rate: timeoutRate, timeouts: timeoutCount, requests, timeout_ms: timeoutMs },
      })
    }

    const pointers: EvidencePointer[] = []
    const runUrl = getGithubActionsRunUrl()
    if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.http_latency.github_actions',
      summary: [
        `url=${targetUrl}`,
        `requests=${requests}`,
        `timeout_ms=${timeoutMs}`,
        `p50_ms=${p50 ?? 'null'}`,
        `p95_ms=${p95 ?? 'null'}`,
        `max_ms=${max ?? 'null'}`,
        `errors=${errorCount} timeouts=${timeoutCount}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'http.stats',
      severity: 'sev3',
      message: 'HTTP stats snapshot.',
      details: {
        target_url: targetUrl,
        requests,
        timeout_ms: timeoutMs,
        p50_ms: p50,
        p95_ms: p95,
        max_ms: max,
        status_counts: statusCounts,
        error_count: errorCount,
        timeout_count: timeoutCount,
        sample_errors: sampleErrors,
      },
    })

    writeEvidenceResult(evidence)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    const evidence: EvidenceResult = {
      success: false,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.http_latency.github_actions',
      summary: 'HTTP latency evidence generation failed.',
      findings: [
        { reason_code: 'evidence.error', severity: env === 'prod' ? 'sev1' : 'sev2', message, details: { stack } },
      ],
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers: [],
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }
    writeEvidenceResult(evidence)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('http_latency_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
