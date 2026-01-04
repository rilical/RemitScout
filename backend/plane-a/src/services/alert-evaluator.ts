import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { AlertRepository, FxRateRepository, LatestQuoteRepository } from '../repositories'
import { sendAlertEmail, sendAlertSms } from './alert-notifications'

const logger = createLogger('plane-a.alert-evaluator')

export async function evaluateAlert(pool: Pool, alertId: string): Promise<boolean> {
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
    const fxRateRepository = new FxRateRepository(pool)
    const latestQuoteRepository = new LatestQuoteRepository(pool)

    if (alert.metric === 'midMarketRate' || alert.metric === 'rate') {
      if (watchlist_item.target_type === 'corridor' && targetPayload.from && targetPayload.to) {
        const from = targetPayload.from as string
        const to = targetPayload.to as string
        currentValue = await fxRateRepository.getRate(from, to)
      } else if (watchlist_item.target_type === 'fxPair' && targetPayload.base && targetPayload.quote) {
        const base = targetPayload.base as string
        const quote = targetPayload.quote as string
        currentValue = await fxRateRepository.getRate(base, quote)
      }
    } else if (alert.metric === 'recipientGets' && watchlist_item.target_type === 'corridor') {
      // Get best quote for recipient amount
      const corridorId = `${targetPayload.from}-${targetPayload.to}`
      const amountBucket = (targetPayload.amountBucket as number) || 500
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
          const recipient = parseFloat(quote.recipient_gets || '0')
          const bestRecipient = parseFloat(best.recipient_gets || '0')
          return recipient > bestRecipient ? quote : best
        })
        currentValue = parseFloat(bestQuote.recipient_gets || '0')
      }
    }

    if (currentValue === null) {
      logger.warn('alert_value_unavailable', {
        alert_id: alertId,
        metric: alert.metric,
        target_type: alert.target_type,
      })
      return false
    }

    const threshold = alert.threshold
    const lastValue = state?.last_value ?? null
    const inAlarm = state?.in_alarm || false

    // Evaluate comparator
    let shouldTrigger = false
    let message = ''

    switch (alert.comparator) {
      case 'gt':
        shouldTrigger = currentValue > threshold
        message = shouldTrigger
          ? `Rate is now ${currentValue.toFixed(4)} (above ${threshold.toFixed(4)})`
          : `Rate is ${currentValue.toFixed(4)} (below ${threshold.toFixed(4)})`
        break
      case 'gte':
        shouldTrigger = currentValue >= threshold
        message = shouldTrigger
          ? `Rate is now ${currentValue.toFixed(4)} (at or above ${threshold.toFixed(4)})`
          : `Rate is ${currentValue.toFixed(4)} (below ${threshold.toFixed(4)})`
        break
      case 'lt':
        shouldTrigger = currentValue < threshold
        message = shouldTrigger
          ? `Rate is now ${currentValue.toFixed(4)} (below ${threshold.toFixed(4)})`
          : `Rate is ${currentValue.toFixed(4)} (above ${threshold.toFixed(4)})`
        break
      case 'lte':
        shouldTrigger = currentValue <= threshold
        message = shouldTrigger
          ? `Rate is now ${currentValue.toFixed(4)} (at or below ${threshold.toFixed(4)})`
          : `Rate is ${currentValue.toFixed(4)} (above ${threshold.toFixed(4)})`
        break
      case 'crosses_above':
        shouldTrigger = lastValue !== null && lastValue <= threshold && currentValue > threshold
        message = shouldTrigger
          ? `Rate crossed above ${threshold.toFixed(4)} (now ${currentValue.toFixed(4)})`
          : `Rate is ${currentValue.toFixed(4)}`
        break
      case 'crosses_below':
        shouldTrigger = lastValue !== null && lastValue >= threshold && currentValue < threshold
        message = shouldTrigger
          ? `Rate crossed below ${threshold.toFixed(4)} (now ${currentValue.toFixed(4)})`
          : `Rate is ${currentValue.toFixed(4)}`
        break
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

    await alertRepository.updateAlertState(alertId, {
      last_evaluated_at: now,
      last_value: currentValue,
      in_alarm: newInAlarm,
      last_triggered_at: newInAlarm ? now : state?.last_triggered_at || null,
      last_notified_at: newInAlarm && !state?.last_notified_at ? now : state?.last_notified_at || null,
      version: newVersion,
    })

    // Create alert event if triggered
    if (shouldTrigger) {
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
      await sendAlertSms(pool, watchlist_item.user_id, alertId, message)

      // Update event notification status
      await alertRepository.updateAlertEventStatus(event.id, emailSent ? 'sent' : 'failed')

      logger.info('alert_triggered', {
        alert_id: alertId,
        user_id: watchlist_item.user_id,
        metric: alert.metric,
        current_value: currentValue,
        threshold: threshold,
        email_sent: emailSent,
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
  frequency: 'realtime' | 'hourly' | 'daily',
  timeBucket?: number,
): Promise<number> {
  try {
    const startTime = Date.now()
    const { query } = await import('../../../shared/db')
    const params: Array<string | number> = [frequency]
    const conditions: string[] = [
      'ar.enabled = TRUE',
      'ar.frequency = $1',
      'wi.deleted_at IS NULL',
    ]
    let joins = 'JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id'

    if (frequency === 'realtime') {
      joins += ' JOIN silver.user_plan up ON up.user_id = wi.user_id'
      conditions.push(`up.plan_code IN ('plus', 'enterprise')`)
      conditions.push(`up.status IN ('active', 'trialing')`)
    }

    if (frequency === 'daily') {
      joins += ` LEFT JOIN silver.notification_pref np
        ON np.user_id = wi.user_id AND np.owner_type = 'user'`
      conditions.push('COALESCE(np.unsubscribed, FALSE) = FALSE')
      conditions.push(
        `EXTRACT(HOUR FROM (NOW() AT TIME ZONE COALESCE(np.timezone, 'UTC')))
         = COALESCE(np.daily_send_hour, 9)`,
      )
      if (Number.isFinite(timeBucket)) {
        params.push(timeBucket as number)
        conditions.push(
          `EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'UTC')) = $${params.length}`,
        )
      }
    }

    const result = await query<{ id: string }>(
      `SELECT ar.id
       FROM silver.alert_rule ar
       ${joins}
       WHERE ${conditions.join(' AND ')}`,
      params,
      pool,
    )

    let triggeredCount = 0
    for (const row of result.rows) {
      const triggered = await evaluateAlert(pool, row.id)
      if (triggered) {
        triggeredCount++
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000
    recordCloudWatchMetric({
      name: 'alerts_evaluated',
      value: result.rows.length,
      unit: 'Count',
      dimensions: { frequency },
    })
    recordCloudWatchMetric({
      name: 'alerts_triggered',
      value: triggeredCount,
      unit: 'Count',
      dimensions: { frequency },
    })
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
    })

    return triggeredCount
  } catch (error: unknown) {
    logger.error('alerts_evaluation_batch_failed', {
      frequency,
      error: error instanceof Error ? error.message : String(error),
    })
    return 0
  }
}
