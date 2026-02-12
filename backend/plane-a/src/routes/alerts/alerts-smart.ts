import type { FastifyInstance } from 'fastify'
import { query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { recordRequest } from '../../../../shared/api-metrics'
import { getCountryByCode } from '../../../../shared/countries-currencies'
import { getMacroCorridors, isMacroCorridor } from '../../../../shared/macro-corridors'
import { parseCorridorId } from '../../../../shared/corridor'
import {
  SMART_ALERT_MIN_CONFIDENCE,
  SMART_ALERT_MIN_SAMPLE_DAYS,
} from '../../../../shared/constants'
import { ValidationError } from '../../../../shared/errors'
import {
  checkCorridorSignalData,
  computeFxCoverage,
  computeQuoteCoverage,
  resolveBucketForEligibility,
  resolveMethodForEligibility,
  smartAlertRequirements,
  toPositiveNumberOrNull,
} from './shared'

export const registerAlertsSmartRoutes = async (app: FastifyInstance) => {
  const { pool, repositories } = app.container
  const rightsMatrixRepository = repositories.rightsMatrix

  app.get('/alerts/corridor-eligibility', async (request, _reply) => {
    const startTime = Date.now()

    const queryParams = request.query as {
      from?: string
      to?: string
      fromCurrency?: string
      toCurrency?: string
      corridorId?: string
      method?: string
      amountBucket?: string | number
    }

    let corridorId: string | null = null

    if (queryParams.corridorId) {
      corridorId = queryParams.corridorId.toUpperCase()
    } else if (queryParams.from && queryParams.to) {
      const from = queryParams.from.toUpperCase()
      const to = queryParams.to.toUpperCase()
      const fromCurrency = queryParams.fromCurrency?.toUpperCase()
        ?? getCountryByCode(from)?.currency?.toUpperCase()
        ?? null
      const toCurrency = queryParams.toCurrency?.toUpperCase()
        ?? getCountryByCode(to)?.currency?.toUpperCase()
        ?? null

      if (fromCurrency && toCurrency) {
        corridorId = `${from}-${to}-${fromCurrency}-${toCurrency}`
      }
    }

    if (!corridorId) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/corridor-eligibility', 400, durationSeconds)
            throw new ValidationError('Invalid request', { details: {
        success: false,
        error: 'invalid_params',
        message: 'Provide corridorId or from/to country codes',
      } })
    }

    const isMacro = isMacroCorridor(corridorId)
    const programEligible = isMacro
    const signalData = await checkCorridorSignalData(corridorId, pool)

    const hasConfidence = signalData !== null
      && signalData.confidence !== null
      && signalData.confidence >= SMART_ALERT_MIN_CONFIDENCE
    const hasSamples = signalData !== null
      && signalData.sample_days !== null
      && signalData.sample_days >= SMART_ALERT_MIN_SAMPLE_DAYS

    const dataReady = hasConfidence && hasSamples

    const now = new Date()
    const inActiveWindow = signalData !== null
      && signalData.best_window_start !== null
      && signalData.best_window_end !== null
      && now >= new Date(signalData.best_window_start)
      && now <= new Date(signalData.best_window_end)

    const signalActive = programEligible
      && dataReady
      && signalData !== null
      && signalData.alert_eligible === true
      && inActiveWindow

    let reason: string | null = null
    if (!programEligible) {
      reason = 'not_offered'
    } else if (!dataReady) {
      if (signalData === null) {
        reason = 'no_data'
      } else if (!hasSamples) {
        reason = 'insufficient_history'
      } else {
        reason = 'low_confidence'
      }
    }

    const status: 'available' | 'rolling_out' | 'not_offered' =
      !programEligible ? 'not_offered' : dataReady ? 'available' : 'rolling_out'

    const durationSeconds = (Date.now() - startTime) / 1000
    recordRequest('GET', '/alerts/corridor-eligibility', 200, durationSeconds)

    const corridorCurrencies = (() => {
      const parts = parseCorridorId(corridorId)
      return parts
        ? {
            base: parts.sourceCurrency.toUpperCase(),
            quote: parts.destCurrency.toUpperCase(),
          }
        : null
    })()
    const fxCoverage = corridorCurrencies
      ? await computeFxCoverage(corridorCurrencies.base, corridorCurrencies.quote, pool)
      : { supported: false }

    const amountBucket =
      toPositiveNumberOrNull(queryParams.amountBucket) ?? resolveBucketForEligibility(corridorId)
    const method = resolveMethodForEligibility(queryParams.method)
    const maxAgeSeconds = Math.max(60, Math.floor(config.planeA.b2c.maxQuoteAgeSeconds ?? 1800))
    const quoteCoverage = await computeQuoteCoverage({
      corridorId,
      amountBucket,
      payinMethod: method,
      payoutMethod: 'bank',
      maxAgeSeconds,
      pool,
      rightsMatrixRepository,
    })

    return {
      success: true,
      corridorId,
      isMacroCorridor: isMacro,
      smartAlerts: {
        programEligible,
        status,
        eligible: status === 'available',
        reason,
        dataReady: status === 'available',
        signalActive,
        dataProgress: {
          sampleDays: signalData?.sample_days ?? null,
          minSampleDays: SMART_ALERT_MIN_SAMPLE_DAYS,
          confidence: signalData?.confidence ?? null,
          minConfidence: SMART_ALERT_MIN_CONFIDENCE,
        },
        confidence: signalData?.confidence ?? null,
        sampleDays: signalData?.sample_days ?? null,
        sendScore: signalData?.send_score ?? null,
        alertEligible: signalData?.alert_eligible ?? false,
        inActiveWindow,
        activeWindow: signalData?.best_window_start && signalData?.best_window_end
          ? {
              start: new Date(signalData.best_window_start).toISOString(),
              end: new Date(signalData.best_window_end).toISOString(),
            }
          : null,
        requirements: smartAlertRequirements,
      },
      regularAlerts: {
        eligible: true,
        refreshCadence: isMacro ? 'macro_coverage' : 'on_demand',
        note: isMacro
          ? 'This corridor is covered by our regular data collection.'
          : 'Quotes for this corridor are refreshed when users view it or before alert evaluation.',
        fxCoverage,
        quoteCoverage,
      },
    }
  })

  app.get('/alerts/macro-corridors', async (_request, _reply) => {
    const startTime = Date.now()

    const macroCorridors = getMacroCorridors()

    const bySourceCountry = new Map<string, string[]>()
    for (const corridor of macroCorridors) {
      const list = bySourceCountry.get(corridor.sourceCountry) ?? []
      list.push(corridor.corridorId)
      bySourceCountry.set(corridor.sourceCountry, list)
    }

    const signalResult = await query<{
      corridor_id: string
      confidence: number | null
      sample_days: number | null
    }>(
      `SELECT corridor_id, confidence, sample_days
       FROM silver.corridor_signals
       WHERE confidence >= $1 AND sample_days >= $2`,
      [SMART_ALERT_MIN_CONFIDENCE, SMART_ALERT_MIN_SAMPLE_DAYS],
      pool,
    )

    const smartAlertEligible = new Set(signalResult.rows.map(r => r.corridor_id))

    const durationSeconds = (Date.now() - startTime) / 1000
    recordRequest('GET', '/alerts/macro-corridors', 200, durationSeconds)

    return {
      success: true,
      totalMacroCorridors: macroCorridors.length,
      smartAlertEligibleCount: smartAlertEligible.size,
      bySourceCountry: Object.fromEntries(bySourceCountry),
      corridors: macroCorridors.map(c => ({
        corridorId: c.corridorId,
        sourceCountry: c.sourceCountry,
        destCountry: c.destCountry,
        sourceCurrency: c.sourceCurrency,
        destCurrency: c.destCurrency,
        tier: c.tier,
        isHardCurrencyLane: c.isHardCurrencyLane,
        smartAlertEligible: smartAlertEligible.has(c.corridorId),
      })),
    }
  })
}
