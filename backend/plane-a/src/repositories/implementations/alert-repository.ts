import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IAlertRepository,
  AlertRuleInput,
  AlertRuleRow,
  AlertWithStateRow,
  AlertStateRow,
  AlertEventRow,
} from '../interfaces/alert-repository.interface'

export class AlertRepository implements IAlertRepository {
  constructor(private readonly pool: Pool) {}

  async listByUserId(userId: string): Promise<AlertWithStateRow[]> {
    const result = await query<AlertWithStateRow>(
      `SELECT 
         ar.id,
         ar.watchlist_item_id,
         ar.metric,
         ar.comparator,
         ar.threshold,
         ar.currency,
         ar.frequency,
         ar.enabled,
         ar.cooldown_minutes,
         ar.created_at,
         ar.updated_at,
         ast.last_triggered_at,
         ast.last_value,
         ast.in_alarm
       FROM silver.alert_rule ar
       JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id
       LEFT JOIN silver.alert_state ast ON ar.id = ast.alert_id
       WHERE wi.user_id = $1 AND wi.deleted_at IS NULL
       ORDER BY ar.updated_at DESC`,
      [userId],
      this.pool,
    )
    return result.rows
  }

  async findById(id: string, userId: string): Promise<AlertRuleRow | null> {
    const result = await query<AlertRuleRow>(
      `SELECT ar.id, ar.watchlist_item_id, ar.metric, ar.comparator, ar.threshold, ar.currency, 
              ar.frequency, ar.enabled, ar.cooldown_minutes, ar.created_at, ar.updated_at
       FROM silver.alert_rule ar
       JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id
       WHERE ar.id = $1 AND wi.user_id = $2`,
      [id, userId],
      this.pool,
    )
    return result.rows[0] || null
  }

  async findByWatchlistItemAndRule(
    watchlistItemId: string,
    metric: string,
    comparator: string,
    threshold: number,
    currency?: string | null,
  ): Promise<AlertRuleRow | null> {
    const result = await query<AlertRuleRow>(
      `SELECT id, watchlist_item_id, metric, comparator, threshold, currency, 
              frequency, enabled, cooldown_minutes, created_at, updated_at
       FROM silver.alert_rule
       WHERE watchlist_item_id = $1 
         AND metric = $2 
         AND comparator = $3 
         AND threshold = $4
         AND (currency IS NULL AND $5::text IS NULL OR currency = $5)`,
      [watchlistItemId, metric, comparator, threshold, currency || null],
      this.pool,
    )
    return result.rows[0] || null
  }

  async create(input: AlertRuleInput): Promise<AlertRuleRow> {
    const now = new Date()
    const result = await query<AlertRuleRow>(
      `INSERT INTO silver.alert_rule (
         watchlist_item_id, metric, comparator, threshold, currency, 
         frequency, enabled, cooldown_minutes, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING id, watchlist_item_id, metric, comparator, threshold, currency, 
                  frequency, enabled, cooldown_minutes, created_at, updated_at`,
      [
        input.watchlist_item_id,
        input.metric,
        input.comparator,
        input.threshold,
        input.currency || null,
        input.frequency,
        input.enabled,
        input.cooldown_minutes ?? 360,
        now,
      ],
      this.pool,
    )
    const alert = result.rows[0]

    // Initialize alert state
    await query(
      `INSERT INTO silver.alert_state (alert_id, version)
       VALUES ($1, 1)
       ON CONFLICT (alert_id) DO NOTHING`,
      [alert.id],
      this.pool,
    )

    return alert
  }

  async update(
    id: string,
    userId: string,
    updates: {
      metric?: string
      comparator?: string
      threshold?: number
      currency?: string | null
      frequency?: string
      cooldown_minutes?: number
      enabled?: boolean
    },
  ): Promise<AlertRuleRow | null> {
    const updateFields: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (updates.metric !== undefined) {
      updateFields.push(`metric = $${paramIndex++}`)
      values.push(updates.metric)
    }
    if (updates.comparator !== undefined) {
      updateFields.push(`comparator = $${paramIndex++}`)
      values.push(updates.comparator)
    }
    if (updates.threshold !== undefined) {
      updateFields.push(`threshold = $${paramIndex++}`)
      values.push(updates.threshold)
    }
    if (updates.currency !== undefined) {
      updateFields.push(`currency = $${paramIndex++}`)
      values.push(updates.currency)
    }
    if (updates.frequency !== undefined) {
      updateFields.push(`frequency = $${paramIndex++}`)
      values.push(updates.frequency)
    }
    if (updates.cooldown_minutes !== undefined) {
      updateFields.push(`cooldown_minutes = $${paramIndex++}`)
      values.push(updates.cooldown_minutes)
    }
    if (updates.enabled !== undefined) {
      updateFields.push(`enabled = $${paramIndex++}`)
      values.push(updates.enabled)
    }

    if (updateFields.length === 0) {
      return this.findById(id, userId)
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id, userId)

    const result = await query<AlertRuleRow>(
      `UPDATE silver.alert_rule
       SET ${updateFields.join(', ')}
       FROM silver.watchlist_item wi
       WHERE silver.alert_rule.id = $${paramIndex} 
         AND silver.alert_rule.watchlist_item_id = wi.id 
         AND wi.user_id = $${paramIndex + 1}
       RETURNING silver.alert_rule.id, silver.alert_rule.watchlist_item_id, silver.alert_rule.metric, 
                  silver.alert_rule.comparator, silver.alert_rule.threshold, silver.alert_rule.currency, 
                  silver.alert_rule.frequency, silver.alert_rule.enabled, silver.alert_rule.cooldown_minutes, 
                  silver.alert_rule.created_at, silver.alert_rule.updated_at`,
      values,
      this.pool,
    )
    return result.rows[0] || null
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `DELETE FROM silver.alert_rule ar
       USING silver.watchlist_item wi
       WHERE ar.id = $1 AND ar.watchlist_item_id = wi.id AND wi.user_id = $2
       RETURNING ar.id`,
      [id, userId],
      this.pool,
    )
    return result.rows.length > 0
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM silver.alert_rule ar
       JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id
       WHERE wi.user_id = $1 AND ar.enabled = TRUE`,
      [userId],
      this.pool,
    )
    return parseInt(result.rows[0]?.count || '0', 10)
  }

  async getAlertState(alertId: string): Promise<AlertStateRow | null> {
    const result = await query<AlertStateRow>(
      `SELECT alert_id, last_evaluated_at, last_value, in_alarm, last_triggered_at, last_notified_at, snoozed_until, version
       FROM silver.alert_state
       WHERE alert_id = $1`,
      [alertId],
      this.pool,
    )
    return result.rows[0] || null
  }

  async updateAlertState(
    alertId: string,
    updates: {
      last_evaluated_at?: Date
      last_value?: number | null
      in_alarm?: boolean
      last_triggered_at?: Date | null
      last_notified_at?: Date | null
      snoozed_until?: Date | null
      version?: number
    },
  ): Promise<void> {
    const updateFields: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (updates.last_evaluated_at !== undefined) {
      updateFields.push(`last_evaluated_at = $${paramIndex++}`)
      values.push(updates.last_evaluated_at)
    }
    if (updates.last_value !== undefined) {
      updateFields.push(`last_value = $${paramIndex++}`)
      values.push(updates.last_value)
    }
    if (updates.in_alarm !== undefined) {
      updateFields.push(`in_alarm = $${paramIndex++}`)
      values.push(updates.in_alarm)
    }
    if (updates.last_triggered_at !== undefined) {
      updateFields.push(`last_triggered_at = $${paramIndex++}`)
      values.push(updates.last_triggered_at)
    }
    if (updates.last_notified_at !== undefined) {
      updateFields.push(`last_notified_at = $${paramIndex++}`)
      values.push(updates.last_notified_at)
    }
    if (updates.snoozed_until !== undefined) {
      updateFields.push(`snoozed_until = $${paramIndex++}`)
      values.push(updates.snoozed_until)
    }
    if (updates.version !== undefined) {
      updateFields.push(`version = $${paramIndex++}`)
      values.push(updates.version)
    }

    if (updateFields.length === 0) {
      return
    }

    updateFields.push(`updated_at = NOW()`)
    const updateValues = [...values, alertId]
    const updateParamIndex = paramIndex

    // Get current state to use as defaults for INSERT
    const currentState = await this.getAlertState(alertId)
    
    await query(
      `INSERT INTO silver.alert_state (
         alert_id, last_evaluated_at, last_value, in_alarm, 
         last_triggered_at, last_notified_at, snoozed_until, version, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (alert_id) DO UPDATE SET
         ${updateFields.map((field, idx) => {
           const newParamIndex = idx + 9
           return field.replace(`$${idx + 1}`, `$${newParamIndex}`)
         }).join(', ')},
         updated_at = NOW()`,
      [
        alertId,
        updates.last_evaluated_at ?? currentState?.last_evaluated_at ?? null,
        updates.last_value ?? currentState?.last_value ?? null,
        updates.in_alarm ?? currentState?.in_alarm ?? false,
        updates.last_triggered_at ?? currentState?.last_triggered_at ?? null,
        updates.last_notified_at ?? currentState?.last_notified_at ?? null,
        updates.snoozed_until ?? currentState?.snoozed_until ?? null,
        updates.version ?? (currentState?.version ?? 1) + 1,
        ...updateValues,
      ],
      this.pool,
    )
  }

  async createAlertEvent(
    alertId: string,
    value: number,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<AlertEventRow> {
    const result = await query<AlertEventRow>(
      `INSERT INTO silver.alert_event (
         alert_id, triggered_at, value, message, context, notification_status
       )
       VALUES ($1, NOW(), $2, $3, $4::jsonb, 'queued')
       RETURNING id, alert_id, triggered_at, value, message, context, notification_status, provider_safe`,
      [alertId, value, message, context ? JSON.stringify(context) : null],
      this.pool,
    )
    return result.rows[0]
  }

  async updateAlertEventStatus(eventId: string, status: 'queued' | 'sent' | 'failed'): Promise<void> {
    await query(
      `UPDATE silver.alert_event
       SET notification_status = $1
       WHERE id = $2`,
      [status, eventId],
      this.pool,
    )
  }

  async getAlertWithWatchlist(alertId: string): Promise<{
    alert: AlertRuleRow
    watchlist_item: {
      user_id: string
      target_type: string
      target_payload: Record<string, unknown>
    }
    state: AlertStateRow | null
  } | null> {
    const result = await query<{
      alert_id: string
      watchlist_item_id: string
      metric: string
      comparator: string
      threshold: number
      currency: string | null
      frequency: string
      enabled: boolean
      cooldown_minutes: number
      created_at: Date
      updated_at: Date
      user_id: string
      target_type: string
      target_payload: Record<string, unknown>
      state_alert_id: string | null
      last_evaluated_at: Date | null
      last_value: number | null
      in_alarm: boolean
      last_triggered_at: Date | null
      last_notified_at: Date | null
      snoozed_until: Date | null
      version: number
    }>(
      `SELECT 
         ar.id as alert_id,
         ar.watchlist_item_id,
         ar.metric,
         ar.comparator,
         ar.threshold,
         ar.currency,
         ar.frequency,
         ar.enabled,
         ar.cooldown_minutes,
         ar.created_at,
         ar.updated_at,
         wi.user_id,
         wi.target_type,
         wi.target_payload,
         ast.alert_id as state_alert_id,
         ast.last_evaluated_at,
         ast.last_value,
         ast.in_alarm,
         ast.last_triggered_at,
         ast.last_notified_at,
         ast.snoozed_until,
         ast.version
       FROM silver.alert_rule ar
       JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id
       LEFT JOIN silver.alert_state ast ON ar.id = ast.alert_id
       WHERE ar.id = $1 AND ar.enabled = TRUE`,
      [alertId],
      this.pool,
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      alert: {
        id: row.alert_id,
        watchlist_item_id: row.watchlist_item_id,
        metric: row.metric as AlertRuleRow['metric'],
        comparator: row.comparator as AlertRuleRow['comparator'],
        threshold: row.threshold,
        currency: row.currency,
        frequency: row.frequency as AlertRuleRow['frequency'],
        enabled: row.enabled,
        cooldown_minutes: row.cooldown_minutes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      watchlist_item: {
        user_id: row.user_id,
        target_type: row.target_type,
        target_payload: row.target_payload,
      },
      state: row.state_alert_id
        ? {
            alert_id: row.state_alert_id,
            last_evaluated_at: row.last_evaluated_at,
            last_value: row.last_value,
            in_alarm: row.in_alarm,
            last_triggered_at: row.last_triggered_at,
            last_notified_at: row.last_notified_at,
            snoozed_until: row.snoozed_until,
            version: row.version,
          }
        : null,
    }
  }
}
