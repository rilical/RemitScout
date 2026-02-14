import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { getCountryByCode } from '../../../shared/countries-currencies'
import { parseCorridorId } from '../../../shared/corridor'
import { FIXED_EXCHANGE_RATES } from '../../../shared/currency-limits'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { recordBusinessMetric } from '../../../shared/business-metrics'
import { AlertRepository, FxRateRepository, LatestQuoteRepository } from '../repositories'
import { sendAlertEmail, sendAlertPush, sendAlertSms } from './alert-notifications'
import { getUserPlan } from './user-plan'

const logger = createLogger('plane-a.alert-evaluator')

const getDefaultCurrency = (countryCode: string | null) => {
  if (!countryCode) return null
  return getCountryByCode(countryCode)?.currency ?? null
}

const resolveCorridorId = (payload: Record<string, unknown>): string | null => {
  if (typeof payload.corridorId === 'string' && payload.corridorId.length > 0) {
    return payload.corridorId.toUpperCase()
  }

  const from = typeof payload.from === 'string' ? payload.from.toUpperCase() : null
  const to = typeof payload.to === 'string' ? payload.to.toUpperCase() : null
  if (!from || !to) return null

  const fromCurrency = typeof payload.fromCurrency === 'string'
    ? payload.fromCurrency.toUpperCase()
    : getDefaultCurrency(from)
  const toCurrency = typeof payload.toCurrency === 'string'
    ? payload.toCurrency.toUpperCase()
    : getDefaultCurrency(to)

  if (!fromCurrency || !toCurrency) return null

  return `${from}-${to}-${fromCurrency}-${toCurrency}`
}

const isPlusEntitled = (plan: Awaited<ReturnType<typeof getUserPlan>> | null) => {
  return !!plan
    && ['plus', 'enterprise'].includes(plan.plan_code)
    && ['active', 'trialing'].includes(plan.status)
}

const formatMetricValue = (metric: string, rawValue: number) => {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) return 'n/a'
  if (metric === 'sendScore') return `${Math.round(value)}`
  if (metric === 'rate' || metric === 'midMarketRate') return value.toFixed(4)
  return value.toFixed(2)
}

const metricLabel = (metric: string) => {
  switch (metric) {
    case 'sendScore':
      return 'Smart score'
    case 'recipientGets':
      return 'Recipient gets'
    case 'totalCost':
      return 'Total cost'
    case 'fee':
      return 'Fee'
    case 'midMarketRate':
      return 'Mid-market rate'
    case 'rate':
      return 'Rate'
    case 'index':
      return 'Index'
    default:
      return 'Value'
  }
}

const resolveCorridorCurrencies = (payload: Record<string, unknown>): { base: string; quote: string } | null => {
  const directBase = typeof payload.fromCurrency === 'string' ? payload.fromCurrency.toUpperCase() : null
  const directQuote = typeof payload.toCurrency === 'string' ? payload.toCurrency.toUpperCase() : null
  if (directBase && directQuote) {
    return { base: directBase, quote: directQuote }
  }

  const corridorId = typeof payload.corridorId === 'string' ? payload.corridorId : null
  if (corridorId) {
    const parts = parseCorridorId(corridorId)
    if (parts) {
      return {
        base: parts.sourceCurrency.toUpperCase(),
        quote: parts.destCurrency.toUpperCase(),
      }
    }
  }

  const from = typeof payload.from === 'string' ? payload.from.toUpperCase() : null
  const to = typeof payload.to === 'string' ? payload.to.toUpperCase() : null
  if (!from || !to) return null

  const fromCurrency = getDefaultCurrency(from)
  const toCurrency = getDefaultCurrency(to)
  if (!fromCurrency || !toCurrency) return null

  return { base: fromCurrency.toUpperCase(), quote: toCurrency.toUpperCase() }
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'string' ? Number(value) : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const resolveUsdEquivalentBucket = (payload: Record<string, unknown>): number => {
  const explicit = toNumberOrNull(payload.amountBucket)
  if (explicit !== null && explicit > 0) return Math.round(explicit)

  const payloadCurrency = typeof payload.fromCurrency === 'string' ? payload.fromCurrency.toUpperCase() : null
  const from = typeof payload.from === 'string' ? payload.from.toUpperCase() : null
  const corridorId = typeof payload.corridorId === 'string' ? payload.corridorId : null
  const corridorCurrency = corridorId ? parseCorridorId(corridorId)?.sourceCurrency?.toUpperCase() ?? null : null
  const fromCurrency = payloadCurrency
    || corridorCurrency
    || (from ? getCountryByCode(from)?.currency?.toUpperCase() ?? null : null)
  const rate = fromCurrency ? FIXED_EXCHANGE_RATES[fromCurrency] ?? 1 : 1
  const amount = 500 * rate
  return computeBucketSelection(amount).bucket_used
}

const SMART_ALERT_MIN_CONFIDENCE = config.alerts.smart.minConfidence
const SMART_ALERT_MIN_SAMPLE_DAYS = config.alerts.smart.minSampleDays
const WEEKLY_SEND_DOW = config.alerts.smart.weeklySendDow
const WEEKLY_SEND_HOUR = config.alerts.smart.weeklySendHour
const ALERT_EVALUATION_CONCURRENCY = config.alerts.evaluation.concurrency

export async function evaluateAlert(
  pool: Pool,
  alertId: string,
  options?: { dryRun?: boolean },
): Promise<boolean> {
  const dryRun = options?.dryRun === true
  try {
    // Get alert rule and watchlist item
    const alertRepository = new AlertRepository(pool)
    const alertData = await alertRepository.getAlertWithWatchlist(alertId)

    if (!alertData) {
      logger.warn('alert_not_found', { alert_id: alertId })
      return false
    }

    const { alert, watchlist_item, state } = alertData
    const targetPayload = watchlist_item.target_payload

    if (alert.metric === 'sendScore') {
      const plan = await getUserPlan(pool, watchlist_item.user_id)
      if (!isPlusEntitled(plan)) {
        logger.warn('alert_metric_not_entitled', {
          alert_id: alertId,
          user_id: watchlist_item.user_id,
          metric: alert.metric,
          plan: plan?.plan_code ?? 'none',
          status: plan?.status ?? 'unknown',
        })
        return false
      }
    }

    // Check if snoozed
    if (state?.snoozed_until) {
      const snoozedUntil = new Date(state.snoozed_until)
      if (snoozedUntil > new Date()) {
        logger.debug('alert_snoozed', {
          alert_id: alertId,
          snoozed_until: state.snoozed_until,
        })
        return false
      }
    }

    // Get current value based on metric
    let currentValue: number | null = null
    let alertEligible = true
    let smartWindowStart: Date | null = null
    let smartWindowEnd: Date | null = null
    const fxRateRepository = new FxRateRepository(pool)
    const latestQuoteRepository = new LatestQuoteRepository(pool)

    if (alert.metric === 'midMarketRate' || alert.metric === 'rate') {
      if (watchlist_item.target_type === 'corridor') {
        const currencies = resolveCorridorCurrencies(targetPayload)
        if (!currencies) {
          logger.warn('alert_corridor_currency_unresolved', {
            alert_id: alertId,
            metric: alert.metric,
            target_payload: targetPayload,
          })
          return false
        }
        currentValue = await fxRateRepository.getRate(currencies.base, currencies.quote)
      } else if (watchlist_item.target_type === 'fxPair' && targetPayload.base && targetPayload.quote) {
        const base = targetPayload.base as string
        const quote = targetPayload.quote as string
        currentValue = await fxRateRepository.getRate(base, quote)
      }
    } else if (alert.metric === 'recipientGets' && watchlist_item.target_type === 'corridor') {
      // Get best quote for recipient amount
      const corridorId = resolveCorridorId(targetPayload)
      if (!corridorId) {
        logger.warn('alert_corridor_unresolved', {
          alert_id: alertId,
          metric: alert.metric,
          target_payload: targetPayload,
        })
        return false
      }
      const amountBucket = resolveUsdEquivalentBucket(targetPayload)
      const payin = (targetPayload.method as string) || 'bank'
      const payout = 'bank'

      const quotes = await latestQuoteRepository.listLatestByCorridor(
        corridorId,
        amountBucket,
        payin,
        payout,
      )

      if (quotes.length > 0) {
        // Get best recipient amount
        const bestQuote = quotes.reduce((best, quote) => {
          const recipient =
            toNumberOrNull((quote as { receive_amount?: unknown }).receive_amount)
            ?? toNumberOrNull((quote as { recipient_gets?: unknown }).recipient_gets)
            ?? 0
          const bestRecipient =
            toNumberOrNull((best as { receive_amount?: unknown }).receive_amount)
            ?? toNumberOrNull((best as { recipient_gets?: unknown }).recipient_gets)
            ?? 0
          return recipient > bestRecipient ? quote : best
        })
        currentValue =
          toNumberOrNull((bestQuote as { receive_amount?: unknown }).receive_amount)
          ?? toNumberOrNull((bestQuote as { recipient_gets?: unknown }).recipient_gets)
          ?? 0
      }
    } else if ((alert.metric === 'totalCost' || alert.metric === 'fee') && watchlist_item.target_type === 'corridor') {
      const corridorId = resolveCorridorId(targetPayload)
      if (!corridorId) {
        logger.warn('alert_corridor_unresolved', {
          alert_id: alertId,
          metric: alert.metric,
          target_payload: targetPayload,
        })
        return false
      }
      const amountBucket = resolveUsdEquivalentBucket(targetPayload)
      const payin = (targetPayload.method as string) || 'bank'
      const payout = 'bank'

      const quotes = await latestQuoteRepository.listLatestByCorridor(
        corridorId,
        amountBucket,
        payin,
        payout,
      )

      if (quotes.length > 0) {
        const currencyPair = resolveCorridorCurrencies(targetPayload)
        const midMarketRate = currencyPair
          ? await fxRateRepository.getRate(currencyPair.base, currencyPair.quote)
          : null

        if (alert.metric === 'totalCost' && (!midMarketRate || midMarketRate <= 0)) {
          logger.warn('alert_midmarket_unavailable', {
            alert_id: alertId,
            metric: alert.metric,
            target_payload: targetPayload,
          })
          return false
        }

        let bestValue: number | null = null

        for (const quote of quotes) {
          const sendAmount = toNumberOrNull(quote.send_amount) ?? amountBucket
          if (!Number.isFinite(sendAmount) || sendAmount <= 0) continue

          const promoRate = toNumberOrNull(quote.promotional_rate)
          const promoFee = toNumberOrNull(quote.promotional_fee_amount)
          const feeAmount = promoFee !== null ? promoFee : (toNumberOrNull(quote.fee_amount) ?? 0)

          if (!Number.isFinite(feeAmount) || feeAmount < 0) continue

          if (alert.metric === 'fee') {
            const nextFee = feeAmount
            if (bestValue === null || nextFee < bestValue) {
              bestValue = nextFee
            }
            continue
          }

          const providerRate = promoRate !== null ? promoRate : (toNumberOrNull(quote.implied_fx_rate) ?? 0)
          if (!Number.isFinite(providerRate) || providerRate <= 0) continue

          const amountAfterFee = Math.max(sendAmount - feeAmount, 0)
          const hiddenMarkup = (amountAfterFee * (midMarketRate as number - providerRate)) / (midMarketRate as number)
          const totalCost = Math.max(0, feeAmount + (Number.isFinite(hiddenMarkup) ? hiddenMarkup : 0))

          if (bestValue === null || totalCost < bestValue) {
            bestValue = totalCost
          }
        }

        if (bestValue !== null) {
          currentValue = bestValue
        }
      }
    } else if (alert.metric === 'sendScore' && watchlist_item.target_type === 'corridor') {
      const corridorId = resolveCorridorId(targetPayload)
      if (!corridorId) {
        logger.warn('alert_corridor_unresolved', {
          alert_id: alertId,
          metric: alert.metric,
          target_payload: targetPayload,
        })
        return false
      }

      const result = await query<{
        send_score: number
        alert_eligible: boolean
        best_window_start: Date | null
        best_window_end: Date | null
        confidence: number | null
        sample_days: number | null
      }>(
        `SELECT send_score::double precision AS send_score,
                alert_eligible,
                best_window_start,
                best_window_end,
                confidence,
                sample_days
         FROM silver.corridor_signals
         WHERE corridor_id = $1`,
        [corridorId],
        pool,
      )

      const row = result.rows[0]
      if (row) {
        currentValue = parseFloat(String(row.send_score))
        smartWindowStart = row.best_window_start ? new Date(row.best_window_start) : null
        smartWindowEnd = row.best_window_end ? new Date(row.best_window_end) : null

        const confidence = toNumberOrNull(row.confidence)
        const sampleDays = toNumberOrNull(row.sample_days)
        const now = new Date()
        const inWindow = !!(
          smartWindowStart
          && smartWindowEnd
          && now >= smartWindowStart
          && now <= smartWindowEnd
        )
        const hasConfidence = confidence !== null && confidence >= SMART_ALERT_MIN_CONFIDENCE
        const hasSamples = sampleDays !== null && sampleDays >= SMART_ALERT_MIN_SAMPLE_DAYS

        alertEligible = row.alert_eligible === true && inWindow && hasConfidence && hasSamples

        if (!inWindow) {
          logger.debug('smart_alert_outside_window', {
            alert_id: alertId,
            corridor_id: corridorId,
            window_start: smartWindowStart,
            window_end: smartWindowEnd,
          })
        }

        if (!hasSamples || !hasConfidence) {
          logger.debug('smart_alert_insufficient_data', {
            alert_id: alertId,
            corridor_id: corridorId,
            sample_days: sampleDays,
            confidence,
            min_sample_days: SMART_ALERT_MIN_SAMPLE_DAYS,
            min_confidence: SMART_ALERT_MIN_CONFIDENCE,
          })
        }
      }
    }

    if (currentValue === null) {
      logger.warn('alert_value_unavailable', {
        alert_id: alertId,
        metric: alert.metric,
      })
      return false
    }

    const threshold = alert.threshold
    const lastValue = state?.last_value ?? null

    // Evaluate comparator
    let shouldTrigger = false
    let message = ''
    const label = metricLabel(alert.metric)
    const currentFormatted = formatMetricValue(alert.metric, currentValue)
    const thresholdFormatted = formatMetricValue(alert.metric, threshold)

    switch (alert.comparator) {
      case 'gt':
        shouldTrigger = currentValue > threshold
        message = shouldTrigger
          ? `${label} is now ${currentFormatted} (above ${thresholdFormatted})`
          : `${label} is ${currentFormatted} (below ${thresholdFormatted})`
        break
      case 'gte':
        shouldTrigger = currentValue >= threshold
        message = shouldTrigger
          ? `${label} is now ${currentFormatted} (at or above ${thresholdFormatted})`
          : `${label} is ${currentFormatted} (below ${thresholdFormatted})`
        break
      case 'lt':
        shouldTrigger = currentValue < threshold
        message = shouldTrigger
          ? `${label} is now ${currentFormatted} (below ${thresholdFormatted})`
          : `${label} is ${currentFormatted} (above ${thresholdFormatted})`
        break
      case 'lte':
        shouldTrigger = currentValue <= threshold
        message = shouldTrigger
          ? `${label} is now ${currentFormatted} (at or below ${thresholdFormatted})`
          : `${label} is ${currentFormatted} (above ${thresholdFormatted})`
        break
      case 'crosses_above':
        shouldTrigger = lastValue !== null && lastValue <= threshold && currentValue > threshold
        message = shouldTrigger
          ? `${label} crossed above ${thresholdFormatted} (now ${currentFormatted})`
          : `${label} is ${currentFormatted}`
        break
      case 'crosses_below':
        shouldTrigger = lastValue !== null && lastValue >= threshold && currentValue < threshold
        message = shouldTrigger
          ? `${label} crossed below ${thresholdFormatted} (now ${currentFormatted})`
          : `${label} is ${currentFormatted}`
        break
    }

    if (alert.metric === 'sendScore' && !alertEligible) {
      logger.debug('smart_alert_ineligible', {
        alert_id: alertId,
        current_value: currentValue,
        threshold,
      })
      shouldTrigger = false
    }

    if (alert.metric === 'sendScore' && shouldTrigger && smartWindowStart && state?.last_notified_at) {
      const lastNotified = new Date(state.last_notified_at)
      if (lastNotified >= smartWindowStart) {
        logger.debug('smart_alert_already_notified_in_window', {
          alert_id: alertId,
          window_start: smartWindowStart,
          last_notified_at: state.last_notified_at,
        })
        shouldTrigger = false
      }
    }

    // Check cooldown
    if (shouldTrigger && state?.last_notified_at) {
      const lastNotified = new Date(state.last_notified_at)
      const cooldownMs = alert.cooldown_minutes * 60 * 1000
      const timeSinceLastNotification = Date.now() - lastNotified.getTime()

      if (timeSinceLastNotification < cooldownMs) {
        logger.debug('alert_cooldown_active', {
          alert_id: alertId,
          time_since_last: timeSinceLastNotification,
          cooldown_ms: cooldownMs,
        })
        shouldTrigger = false
      }
    }

    // Update alert state
    const now = new Date()
    const newInAlarm = shouldTrigger
    const newVersion = (state?.version || 1) + 1

    if (!dryRun) {
      await alertRepository.updateAlertState(alertId, {
        last_evaluated_at: now,
        last_value: currentValue,
        in_alarm: newInAlarm,
        last_triggered_at: newInAlarm ? now : state?.last_triggered_at || null,
        last_notified_at: newInAlarm && !state?.last_notified_at ? now : state?.last_notified_at || null,
        version: newVersion,
      })
    }

    // Create alert event if triggered
    if (shouldTrigger && !dryRun) {
      const context = {
        alert_id: alertId,
        metric: alert.metric,
        current_value: currentValue,
        threshold: threshold,
        comparator: alert.comparator,
        target_type: watchlist_item.target_type,
        target_payload: targetPayload,
      }

      const event = await alertRepository.createAlertEvent(alertId, currentValue, message, context)

      // Send notifications
      const emailSent = await sendAlertEmail(
        pool,
        watchlist_item.user_id,
        alertId,
        `Rate Alert: ${message}`,
        message,
        context,
      )

      // SMS prepared for future (not active yet)
      const smsSent = await sendAlertSms(pool, watchlist_item.user_id, alertId, message)

      const pushSent = await sendAlertPush(
        pool,
        watchlist_item.user_id,
        alertId,
        `Rate Alert: ${message}`,
        message,
      )

      // Update event notification status
      const notificationSent = emailSent || smsSent || pushSent
      await alertRepository.updateAlertEventStatus(event.id, notificationSent ? 'sent' : 'failed')

      logger.info('alert_triggered', {
        alert_id: alertId,
        user_id: watchlist_item.user_id,
        metric: alert.metric,
        current_value: currentValue,
        threshold: threshold,
        email_sent: emailSent,
        sms_sent: smsSent,
        push_sent: pushSent,
      })
    }
    if (shouldTrigger && dryRun) {
      logger.info('alert_would_trigger', {
        alert_id: alertId,
        user_id: watchlist_item.user_id,
        metric: alert.metric,
        current_value: currentValue,
        threshold,
      })
    }

    return shouldTrigger
  } catch (error: unknown) {
    logger.error('alert_evaluation_failed', {
      alert_id: alertId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return false
  }
}

export async function evaluateAlertsForFrequency(
  pool: Pool,
  frequency: 'weekly' | 'daily',
  timeBucket?: number,
  options?: { ignoreSchedule?: boolean; limit?: number; dryRun?: boolean },
): Promise<{ total: number; triggered: number }> {
  try {
    const startTime = Date.now()
    const { query } = await import('../../../shared/db')
    const params: Array<string | number> = [frequency]
    const ignoreSchedule = options?.ignoreSchedule === true
    const dryRun = options?.dryRun === true
    const limit = Math.max(1, Math.min(options?.limit ?? 5000, 5000))
    const conditions: string[] = [
      'ar.enabled = TRUE',
      'ar.frequency = $1',
      'wi.deleted_at IS NULL',
    ]
    let joins = 'JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id'

    if (frequency === 'daily') {
      joins += ' JOIN silver.user_plan up ON up.user_id = wi.user_id'
      conditions.push(`up.plan_code IN ('plus', 'enterprise')`)
      conditions.push(`up.status IN ('active', 'trialing')`)
    }

    if (frequency === 'daily' || frequency === 'weekly') {
      joins += ` LEFT JOIN silver.notification_pref np
        ON np.user_id = wi.user_id AND np.owner_type = 'user' AND np.channel = 'email'`
      conditions.push('COALESCE(np.unsubscribed, FALSE) = FALSE')

      if (!ignoreSchedule) {
        conditions.push(
          `EXTRACT(HOUR FROM (NOW() AT TIME ZONE COALESCE(np.timezone, 'UTC')))
           = COALESCE(np.daily_send_hour, ${frequency === 'weekly' ? WEEKLY_SEND_HOUR : 9})`,
        )
        if (frequency === 'weekly') {
          conditions.push(
            `EXTRACT(ISODOW FROM (NOW() AT TIME ZONE COALESCE(np.timezone, 'UTC')))
             = ${WEEKLY_SEND_DOW}`,
          )
        }
        if (Number.isFinite(timeBucket)) {
          params.push(timeBucket as number)
          conditions.push(
            `EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'UTC')) = $${params.length}`,
          )
        }
      }
    }

    params.push(limit)
    const limitParam = `$${params.length}`
    const result = await query<{ id: string }>(
      `SELECT ar.id
       FROM silver.alert_rule ar
       ${joins}
       WHERE ${conditions.join(' AND ')}
       ORDER BY ar.updated_at DESC
       LIMIT ${limitParam}`,
      params,
      pool,
    )

    const ids = result.rows.map((r) => r.id)
    let triggeredCount = 0

    // Concurrency-limited evaluation to avoid sequential N+1 latency and DB pool exhaustion.
    // Default is 5; override via ALERT_EVALUATION_CONCURRENCY.
    let nextIndex = 0
    const workerCount = Math.min(ALERT_EVALUATION_CONCURRENCY, ids.length)
    const workers = Array.from({ length: workerCount }, async () => {
      for (;;) {
        const i = nextIndex++
        if (i >= ids.length) return
        const triggered = await evaluateAlert(pool, ids[i]!, { dryRun })
        if (triggered) triggeredCount++
      }
    })
    await Promise.all(workers)

    const durationSeconds = (Date.now() - startTime) / 1000
    recordCloudWatchMetric({
      name: 'alerts_evaluated',
      value: result.rows.length,
      unit: 'Count',
      dimensions: { frequency },
    })
    recordBusinessMetric('alerts_evaluated_total', result.rows.length, { frequency })
    recordCloudWatchMetric({
      name: 'alerts_triggered',
      value: triggeredCount,
      unit: 'Count',
      dimensions: { frequency },
    })
    recordBusinessMetric('alerts_triggered_total', triggeredCount, { frequency })
    recordCloudWatchMetric({
      name: 'alerts_evaluation_duration_seconds',
      value: durationSeconds,
      unit: 'Seconds',
      dimensions: { frequency },
    })

    logger.info('alerts_evaluated', {
      frequency,
      time_bucket: timeBucket,
      total: result.rows.length,
      triggered: triggeredCount,
      ignore_schedule: ignoreSchedule,
      dry_run: dryRun,
      limit,
    })

    return { total: result.rows.length, triggered: triggeredCount }
  } catch (error: unknown) {
    logger.error('alerts_evaluation_batch_failed', {
      frequency,
      error: error instanceof Error ? error.message : String(error),
    })
    return { total: 0, triggered: 0 }
  }
}
