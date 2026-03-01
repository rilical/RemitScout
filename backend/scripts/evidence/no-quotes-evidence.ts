/**
 * Evidence: no-quotes audit (Plane A API driven)
 *
 * Goal:
 * - Produce bounded, reason-coded evidence for "no quotes" regressions.
 * - Prefer progressive disclosure: summary + findings + pointers.
 *
 * Required env:
 * - PLANE_A_BASE_URL (or API_BASE_URL)
 *
 * Optional env:
 * - ENVIRONMENT (dev|staging|prod)
 * - CASE_ID
 * - SEND_CURRENCIES=USD,AED,GBP,EUR
 * - METHOD=bank|cash|wallet|airtime (default bank)
 * - AMOUNT=100
 * - REFRESH=0|1 (default 0)
 * - MAX_CORRIDORS=200
 * - PROVIDERS=westernunion,remitly (filter)
 */

import { HEALTH_CORRIDORS } from '../../shared/health-corridors'
import { getGithubActionsRunUrl, resolveCaseEnv, writeEvidenceResult, type EvidenceFinding } from '../lib/evidence'

type ExcludedProvider = { provider: string; reason: string }
type ExcludedProviderDetailed = { provider: string; reason: string; details?: Record<string, unknown> }

const parseList = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const normalizeCurrency = (value: string): string => value.trim().toUpperCase()

const toBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === null || value === '') return defaultValue
  const token = value.trim().toLowerCase()
  if (token === '1' || token === 'true' || token === 'yes' || token === 'y') return true
  if (token === '0' || token === 'false' || token === 'no' || token === 'n') return false
  return defaultValue
}

const getBaseUrl = (): URL => {
  const raw = (process.env.PLANE_A_BASE_URL || process.env.API_BASE_URL || '').trim()
  if (!raw) {
    throw new Error('Missing PLANE_A_BASE_URL (or API_BASE_URL)')
  }
  return new URL(raw)
}

const buildProvidersUrl = (
  base: URL,
  input: { corridorId: string; amount: number; method: string; refresh: boolean },
): string => {
  const url = new URL(base.toString())
  const prefix = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname
  url.pathname = `${prefix}/api/v1/providers`
  const parts = input.corridorId.split('-')
  if (parts.length === 4) {
    url.searchParams.set('from', parts[0] || '')
    url.searchParams.set('to', parts[1] || '')
    url.searchParams.set('fromCurrency', parts[2] || '')
    url.searchParams.set('toCurrency', parts[3] || '')
  } else {
    url.searchParams.set('corridor_id', input.corridorId)
  }
  url.searchParams.set('amount', String(input.amount))
  url.searchParams.set('method', input.method)
  url.searchParams.set('refresh', input.refresh ? '1' : '0')
  return url.toString()
}

const fetchJson = async (url: string, timeoutMs: number): Promise<{ status: number; body: any }> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    const text = await res.text()
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { _raw: text }
    }
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

const parseCorridorSendCurrency = (corridorId: string): string | null => {
  const parts = corridorId.split('-')
  if (parts.length !== 4) return null
  return normalizeCurrency(parts[2] || '')
}

export const runNoQuotesEvidence = async () => {
  const env = resolveCaseEnv(process.env.ENVIRONMENT)
  const caseId = String(process.env.CASE_ID || `case-no-quotes-${Date.now()}`).trim()
  const base = getBaseUrl()

  const sendCurrencies = new Set(
    parseList(process.env.SEND_CURRENCIES || 'USD,AED,GBP,EUR').map(normalizeCurrency),
  )
  const method = (process.env.METHOD || 'bank').trim().toLowerCase()
  const amount = Number(process.env.AMOUNT || '100')
  const refresh = toBool(process.env.REFRESH, false)
  const maxCorridors = Math.max(1, Math.min(1000, Number(process.env.MAX_CORRIDORS || '200')))
  const providerFilter = new Set(parseList(process.env.PROVIDERS).map((p) => p.trim().toLowerCase()))

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid AMOUNT: ${process.env.AMOUNT || '(missing)'}`)
  }

  const allCorridors = Array.from(
    new Set(Object.values(HEALTH_CORRIDORS).flatMap((list) => Array.from(list))),
  )
  const corridors = allCorridors
    .filter((c) => {
      const send = parseCorridorSendCurrency(c)
      return Boolean(send && sendCurrencies.has(send))
    })
    .slice(0, maxCorridors)

  const noQuotesByProvider = new Map<string, number>()
  const noQuotesPairs: Array<{ corridor_id: string; provider: string; details?: unknown }> = []
  const failures: Array<{ corridor_id: string; status: number; error: string }> = []

  for (const corridorId of corridors) {
    const url = buildProvidersUrl(base, { corridorId, amount, method, refresh })
    const { status, body } = await fetchJson(url, 20000)

    if (status !== 200) {
      failures.push({
        corridor_id: corridorId,
        status,
        error: String(body?.error || body?.message || 'request_failed'),
      })
      continue
    }

    const excluded = (body?.excludedProviders || []) as ExcludedProvider[]
    const excludedDetailed = (body?.excludedProvidersDetailed || []) as ExcludedProviderDetailed[]

    for (const entry of excluded) {
      const provider = (entry?.provider || '').toString().trim().toLowerCase()
      const reason = (entry?.reason || '').toString().trim().toLowerCase()
      if (!provider || !reason) continue

      if (providerFilter.size && !providerFilter.has(provider)) continue

      if (reason === 'no_quotes') {
        noQuotesByProvider.set(provider, (noQuotesByProvider.get(provider) ?? 0) + 1)
        if (noQuotesPairs.length < 25) {
          const details = excludedDetailed.find(
            (d) => (d?.provider || '').toString().trim().toLowerCase() === provider,
          )
          noQuotesPairs.push({
            corridor_id: corridorId,
            provider,
            details: details?.details ?? null,
          })
        }
      }
    }
  }

  const topNoQuotesProviders = Array.from(noQuotesByProvider.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([provider, count]) => ({ provider, count }))

  const findings: EvidenceFinding[] = [
    {
      reason_code: 'coverage.audit_stats',
      severity: 'sev3',
      message: 'No-quotes audit summary.',
      details: {
        base_url: base.toString(),
        corridors_scanned: corridors.length,
        failures: failures.length,
        providers_filter: providerFilter.size ? Array.from(providerFilter.values()) : null,
        top_no_quotes_providers: topNoQuotesProviders,
      },
    },
  ]

  if (topNoQuotesProviders.length) {
    findings.push({
      reason_code: 'coverage.no_quotes_detected',
      severity: 'sev2',
      message: 'One or more providers were excluded due to no_quotes in Plane A /providers.',
      details: {
        top_no_quotes_providers: topNoQuotesProviders,
        sample_pairs: noQuotesPairs,
      },
    })
  }

  if (failures.length) {
    findings.push({
      reason_code: 'coverage.audit_failures',
      severity: 'sev2',
      message: 'Some /providers requests failed during the audit.',
      details: {
        failures: failures.slice(0, 10),
      },
    })
  }

  const recommended = new Set<string>()
  if (topNoQuotesProviders.length) {
    recommended.add('forensics.corridor_provider.local')
    recommended.add('evidence.provider_health.github_actions')
  }

  const pointers: Array<{ kind: any; ref: string; note?: string }> = []
  const runUrl = getGithubActionsRunUrl()
  if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'GitHub Actions run for this evidence pack.' })
  pointers.push({ kind: 'url', ref: base.toString(), note: 'Plane A base URL used.' })

  const summary = topNoQuotesProviders.length
    ? `No-quotes detected in /api/v1/providers for ${topNoQuotesProviders.length} provider(s).`
    : (failures.length ? 'No-quotes audit had request failures; review failures finding.' : 'No-quotes not detected in sampled corridors.')

  writeEvidenceResult({
    success: failures.length === 0,
    generated_at: new Date().toISOString(),
    environment: env,
    case_id: caseId,
    skill_id: 'evidence.no_quotes_audit.github_actions',
    summary,
    findings,
    recommended_next_skill_ids: Array.from(recommended.values()),
    pointers,
    budgets: {
      max_findings: 25,
      max_pointer_items: 20,
      max_details_bytes_each: 2048,
    },
  })
}

if (require.main === module) {
  runNoQuotesEvidence().catch((error) => {
     
    console.error('no_quotes_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
    process.exit(1)
  })
}

