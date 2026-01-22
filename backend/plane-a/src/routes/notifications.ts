import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'

const logger = createLogger('plane-a.notifications')
const pool = getPool(config.db.planeAUrl)

const settingsSchema = z.object({
  rateAlerts: z.boolean(),
  weeklySummary: z.boolean(),
  marketUpdates: z.boolean(),
  productUpdates: z.boolean(),
  promotional: z.boolean(),
  pushEnabled: z.boolean(),
})

const pushSubscribeSchema = z.object({
  platform: z.enum(['web', 'ios', 'android']),
  token: z.string().min(6).optional(),
  subscription: z
    .object({
      endpoint: z.string().min(1),
      keys: z.object({
        p256dh: z.string().optional(),
        auth: z.string().optional(),
      }).optional(),
    })
    .optional(),
  deviceLabel: z.string().min(1).optional(),
})

const pushUnsubscribeSchema = z.object({
  platform: z.enum(['web', 'ios', 'android']),
  token: z.string().min(6).optional(),
  endpoint: z.string().min(1).optional(),
}).refine((value) => Boolean(value.token || value.endpoint), {
  message: 'token_or_endpoint_required',
})

const defaultSettings = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
  rateAlerts: true,
  weeklySummary: true,
  marketUpdates: false,
  productUpdates: true,
  promotional: false,
  updatedAt: null as string | null,
}

const toSettingsPayload = (row?: {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  rate_alerts_enabled: boolean
  weekly_summary_enabled: boolean
  market_updates_enabled: boolean
  product_updates_enabled: boolean
  promotional_enabled: boolean
  updated_at: string
} | null) => {
  if (!row) return { ...defaultSettings }
  return {
    emailEnabled: row.email_enabled,
    smsEnabled: row.sms_enabled,
    pushEnabled: row.push_enabled,
    rateAlerts: row.rate_alerts_enabled,
    weeklySummary: row.weekly_summary_enabled,
    marketUpdates: row.market_updates_enabled,
    productUpdates: row.product_updates_enabled,
    promotional: row.promotional_enabled,
    updatedAt: row.updated_at,
  }
}

const getSettings = async (userId: string) => {
  const result = await query<{
    email_enabled: boolean
    sms_enabled: boolean
    push_enabled: boolean
    rate_alerts_enabled: boolean
    weekly_summary_enabled: boolean
    market_updates_enabled: boolean
    product_updates_enabled: boolean
    promotional_enabled: boolean
    updated_at: string
  }>(
    `SELECT email_enabled,
            sms_enabled,
            push_enabled,
            rate_alerts_enabled,
            weekly_summary_enabled,
            market_updates_enabled,
            product_updates_enabled,
            promotional_enabled,
            updated_at
     FROM silver.notification_settings
     WHERE user_id = $1`,
    [userId],
    pool,
  )
  return result.rows[0] ?? null
}

const upsertSettings = async (
  userId: string,
  settings: ReturnType<typeof toSettingsPayload>,
) => {
  const result = await query<{
    email_enabled: boolean
    sms_enabled: boolean
    push_enabled: boolean
    rate_alerts_enabled: boolean
    weekly_summary_enabled: boolean
    market_updates_enabled: boolean
    product_updates_enabled: boolean
    promotional_enabled: boolean
    updated_at: string
  }>(
    `INSERT INTO silver.notification_settings (
       user_id,
       email_enabled,
       sms_enabled,
       push_enabled,
       rate_alerts_enabled,
       weekly_summary_enabled,
       market_updates_enabled,
       product_updates_enabled,
       promotional_enabled,
       updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
     )
     ON CONFLICT (user_id) DO UPDATE SET
       email_enabled = EXCLUDED.email_enabled,
       sms_enabled = EXCLUDED.sms_enabled,
       push_enabled = EXCLUDED.push_enabled,
       rate_alerts_enabled = EXCLUDED.rate_alerts_enabled,
       weekly_summary_enabled = EXCLUDED.weekly_summary_enabled,
       market_updates_enabled = EXCLUDED.market_updates_enabled,
       product_updates_enabled = EXCLUDED.product_updates_enabled,
       promotional_enabled = EXCLUDED.promotional_enabled,
       updated_at = NOW()
     RETURNING email_enabled,
               sms_enabled,
               push_enabled,
               rate_alerts_enabled,
               weekly_summary_enabled,
               market_updates_enabled,
               product_updates_enabled,
               promotional_enabled,
               updated_at`,
    [
      userId,
      settings.emailEnabled,
      settings.smsEnabled,
      settings.pushEnabled,
      settings.rateAlerts,
      settings.weeklySummary,
      settings.marketUpdates,
      settings.productUpdates,
      settings.promotional,
    ],
    pool,
  )
  return result.rows[0]
}

const upsertNotificationPref = async (options: {
  userId: string
  channel: 'email' | 'sms' | 'push'
  digestEnabled: boolean
  marketingOptIn: boolean
  unsubscribed: boolean
}) => {
  const existing = await query<{ id: string }>(
    `SELECT id
     FROM silver.notification_pref
     WHERE owner_type = 'user' AND user_id = $1 AND channel = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [options.userId, options.channel],
    pool,
  )

  if (existing.rows[0]?.id) {
    await query(
      `UPDATE silver.notification_pref
       SET digest_enabled = $2,
           marketing_opt_in = $3,
           unsubscribed = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [
        existing.rows[0].id,
        options.digestEnabled,
        options.marketingOptIn,
        options.unsubscribed,
      ],
      pool,
    )
    return
  }

  await query(
    `INSERT INTO silver.notification_pref (
       owner_type,
       user_id,
       channel,
       timezone,
       daily_send_hour,
       digest_enabled,
       marketing_opt_in,
       unsubscribed,
       created_at,
       updated_at
     ) VALUES (
       'user',
       $1,
       $2,
       'UTC',
       9,
       $3,
       $4,
       $5,
       NOW(),
       NOW()
     )`,
    [
      options.userId,
      options.channel,
      options.digestEnabled,
      options.marketingOptIn,
      options.unsubscribed,
    ],
    pool,
  )
}

const recordOptInEvent = async (input: {
  userId: string
  channel: 'email' | 'sms' | 'push'
  platform?: string | null
  optIn: boolean
  source?: string
  metadata?: Record<string, unknown> | null
}) => {
  await query(
    `INSERT INTO silver.notification_opt_in_event (
       user_id,
       channel,
       platform,
       opt_in,
       source,
       metadata,
       created_at
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
    [
      input.userId,
      input.channel,
      input.platform ?? null,
      input.optIn,
      input.source ?? 'user_action',
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
    pool,
  )
}

const syncChannelPrefs = async (userId: string, settings: ReturnType<typeof toSettingsPayload>) => {
  await upsertNotificationPref({
    userId,
    channel: 'email',
    digestEnabled: settings.weeklySummary,
    marketingOptIn: settings.promotional,
    unsubscribed: !settings.rateAlerts || !settings.emailEnabled,
  })

  await upsertNotificationPref({
    userId,
    channel: 'push',
    digestEnabled: settings.weeklySummary,
    marketingOptIn: settings.promotional,
    unsubscribed: !settings.rateAlerts || !settings.pushEnabled,
  })

  await upsertNotificationPref({
    userId,
    channel: 'sms',
    digestEnabled: settings.weeklySummary,
    marketingOptIn: settings.promotional,
    unsubscribed: !settings.rateAlerts || !settings.smsEnabled,
  })
}

const insertDevice = async (options: {
  userId: string
  platform: 'web' | 'ios' | 'android'
  token?: string | null
  endpoint?: string | null
  subscription?: Record<string, unknown> | null
  deviceLabel?: string | null
}) => {
  if (options.endpoint) {
    const result = await query(
      `INSERT INTO silver.notification_device (
         user_id,
         platform,
         endpoint,
         subscription_json,
         device_label,
         is_active,
         created_at,
         updated_at,
         last_seen_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5, TRUE, NOW(), NOW(), NOW())
       ON CONFLICT (user_id, platform, endpoint)
       DO UPDATE SET
         subscription_json = EXCLUDED.subscription_json,
         device_label = COALESCE(EXCLUDED.device_label, silver.notification_device.device_label),
         is_active = TRUE,
         updated_at = NOW(),
         last_seen_at = NOW()
       RETURNING id`,
      [
        options.userId,
        options.platform,
        options.endpoint,
        options.subscription ? JSON.stringify(options.subscription) : null,
        options.deviceLabel ?? null,
      ],
      pool,
    )
    return result.rows[0]?.id ?? null
  }

  const result = await query(
    `INSERT INTO silver.notification_device (
       user_id,
       platform,
       token,
       subscription_json,
       device_label,
       is_active,
       created_at,
       updated_at,
       last_seen_at
     ) VALUES ($1, $2, $3, $4::jsonb, $5, TRUE, NOW(), NOW(), NOW())
     ON CONFLICT (user_id, platform, token)
     DO UPDATE SET
       subscription_json = EXCLUDED.subscription_json,
       device_label = COALESCE(EXCLUDED.device_label, silver.notification_device.device_label),
       is_active = TRUE,
       updated_at = NOW(),
       last_seen_at = NOW()
     RETURNING id`,
    [
      options.userId,
      options.platform,
      options.token ?? null,
      options.subscription ? JSON.stringify(options.subscription) : null,
      options.deviceLabel ?? null,
    ],
    pool,
  )
  return result.rows[0]?.id ?? null
}

const deactivateDevice = async (options: {
  userId: string
  platform: 'web' | 'ios' | 'android'
  token?: string | null
  endpoint?: string | null
}) => {
  if (options.endpoint) {
    await query(
      `UPDATE silver.notification_device
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE user_id = $1 AND platform = $2 AND endpoint = $3`,
      [options.userId, options.platform, options.endpoint],
      pool,
    )
    return
  }

  await query(
    `UPDATE silver.notification_device
     SET is_active = FALSE,
         updated_at = NOW()
     WHERE user_id = $1 AND platform = $2 AND token = $3`,
    [options.userId, options.platform, options.token ?? null],
    pool,
  )
}

const getActivePushDeviceCount = async (userId: string) => {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count
     FROM silver.notification_device
     WHERE user_id = $1 AND is_active = TRUE`,
    [userId],
    pool,
  )
  return Number(result.rows[0]?.count ?? 0)
}

export const notificationsRoutes = async (app: FastifyInstance) => {
  app.get('/notifications/preferences', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    try {
      const settings = toSettingsPayload(await getSettings(user.user_id))
      return { settings }
    } catch (error) {
      logger.error('notification_settings_fetch_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.put('/notifications/preferences', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = settingsSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const user = request.user!
    try {
      const previous = toSettingsPayload(await getSettings(user.user_id))
      const next = {
        ...previous,
        rateAlerts: parsed.data.rateAlerts,
        weeklySummary: parsed.data.weeklySummary,
        marketUpdates: parsed.data.marketUpdates,
        productUpdates: parsed.data.productUpdates,
        promotional: parsed.data.promotional,
        pushEnabled: parsed.data.pushEnabled,
      }

      const updatedRow = await upsertSettings(user.user_id, next)
      const updatedSettings = toSettingsPayload(updatedRow)
      await syncChannelPrefs(user.user_id, updatedSettings)

      const channelChanges: Array<{ channel: 'email' | 'sms' | 'push'; before: boolean; after: boolean }> = [
        { channel: 'email', before: previous.emailEnabled, after: updatedSettings.emailEnabled },
        { channel: 'sms', before: previous.smsEnabled, after: updatedSettings.smsEnabled },
        { channel: 'push', before: previous.pushEnabled, after: updatedSettings.pushEnabled },
      ]
      for (const change of channelChanges) {
        if (change.before !== change.after) {
          await recordOptInEvent({
            userId: user.user_id,
            channel: change.channel,
            optIn: change.after,
            source: 'preference_update',
          })
        }
      }

      try {
        await logAuditEvent(pool, {
          actorId: user.user_id,
          actorType: 'user',
          action: 'notification.preferences.updated',
          entityType: 'notification_settings',
          entityId: user.user_id,
          category: 'user_action',
          severity: 'info',
          metadata: {
            rateAlerts: updatedSettings.rateAlerts,
            weeklySummary: updatedSettings.weeklySummary,
            marketUpdates: updatedSettings.marketUpdates,
            productUpdates: updatedSettings.productUpdates,
            promotional: updatedSettings.promotional,
            pushEnabled: updatedSettings.pushEnabled,
          },
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('notification_settings_audit_failed', {
          user_id: user.user_id,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      return { settings: updatedSettings }
    } catch (error) {
      logger.error('notification_settings_update_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/notifications/push/subscribe', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = pushSubscribeSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    const user = request.user!
    const endpoint = input.subscription?.endpoint ?? null
    const token = input.token ?? null

    if (!endpoint && !token) {
      reply.code(400)
      return { error: 'missing_token_or_subscription' }
    }

    try {
      const deviceId = await insertDevice({
        userId: user.user_id,
        platform: input.platform,
        endpoint,
        token,
        subscription: input.subscription ?? null,
        deviceLabel: input.deviceLabel ?? null,
      })

      const current = toSettingsPayload(await getSettings(user.user_id))
      const updatedRow = await upsertSettings(user.user_id, {
        ...current,
        pushEnabled: true,
      })
      const updated = toSettingsPayload(updatedRow)
      await syncChannelPrefs(user.user_id, updated)

      await recordOptInEvent({
        userId: user.user_id,
        channel: 'push',
        platform: input.platform,
        optIn: true,
        source: 'push_subscribe',
        metadata: {
          endpoint: endpoint ?? undefined,
        },
      })

      return {
        success: true,
        device_id: deviceId,
        settings: updated,
      }
    } catch (error) {
      logger.error('push_subscribe_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/notifications/push/unsubscribe', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = pushUnsubscribeSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    const user = request.user!
    try {
      await deactivateDevice({
        userId: user.user_id,
        platform: input.platform,
        token: input.token ?? null,
        endpoint: input.endpoint ?? null,
      })

      const activeCount = await getActivePushDeviceCount(user.user_id)
      const current = toSettingsPayload(await getSettings(user.user_id))
      const updatedRow = await upsertSettings(user.user_id, {
        ...current,
        pushEnabled: activeCount > 0,
      })
      const updated = toSettingsPayload(updatedRow)
      await syncChannelPrefs(user.user_id, updated)

      await recordOptInEvent({
        userId: user.user_id,
        channel: 'push',
        platform: input.platform,
        optIn: false,
        source: 'push_unsubscribe',
        metadata: {
          endpoint: input.endpoint ?? undefined,
        },
      })

      return { success: true, settings: updated }
    } catch (error) {
      logger.error('push_unsubscribe_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
