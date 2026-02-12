import type { FastifyRequest } from 'fastify'
import type { Pool } from 'pg'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { recordBusinessMetric } from '../../../shared/business-metrics'
import { safeAsync } from '../../../shared/safe-async'
import { getErrorMessage } from '../types/errors'
import { getRequestContext, logAuditEvent } from './audit-log'
import { deleteStripeCustomer } from './stripe-admin'
import { deleteSupabaseAccount } from './supabase-admin'
import { anonymizeTelemetryData } from './telemetry-anonymization'
import { getUserPlan } from './user-plan'

const logger = createLogger('plane-a.account-deletion')
const s3Client = new S3Client({})

export type AccountDeletionResult = {
  deleted: boolean
  anonymized: boolean
  errors: string[]
  warnings: string[]
}

type UserAccountRow = {
  email: string | null
}

const deleteExportObjects = async (keys: string[], warnings: string[]) => {
  const bucket = config.storage.exports.bucket
  if (!bucket) {
    if (keys.length > 0) {
      warnings.push('exports_bucket_not_configured')
    }
    return
  }

  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (uniqueKeys.length === 0) return

  const results = await Promise.allSettled(
    uniqueKeys.map((key) =>
      s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      ),
    ),
  )

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      warnings.push(`export_delete_failed:${uniqueKeys[index]}`)
      logger.warn('export_object_delete_failed', {
        key: uniqueKeys[index],
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    }
  })
}

export const deleteUserAccount = async (
  pool: Pool,
  userId: string,
  options?: {
    request?: FastifyRequest
    actorRole?: string
    reason?: string
  },
): Promise<AccountDeletionResult> => {
  const errors: string[] = []
  const warnings: string[] = []

  const accountResult = await query<UserAccountRow>(
    `SELECT email
     FROM silver.user_account
     WHERE user_id = $1`,
    [userId],
    pool,
  )
  const account = accountResult.rows[0]
  if (!account) {
    return {
      deleted: false,
      anonymized: false,
      errors: ['user_not_found'],
      warnings,
    }
  }

  const exportRows = await query<{ s3_key: string | null }>(
    `SELECT s3_key
     FROM silver.export_job
     WHERE user_id = $1
       AND s3_key IS NOT NULL`,
    [userId],
    pool,
  )
  const exportKeys = exportRows.rows.map((row) => row.s3_key).filter(Boolean) as string[]

  const plan = await getUserPlan(pool, userId)

  const beforeSnapshot = {
    email: account.email,
    plan_code: plan?.plan_code ?? null,
  }

  if (plan?.stripe_customer_id) {
    if (!config.billing.stripe.secretKey) {
      warnings.push('stripe_secret_missing')
    } else {
      try {
        await deleteStripeCustomer(plan.stripe_customer_id)
      } catch (error) {
        warnings.push('stripe_customer_delete_failed')
        logger.warn('stripe_customer_delete_failed', {
          user_id: userId,
          customer_id: plan.stripe_customer_id,
          error: getErrorMessage(error),
        })
      }
    }
  }

  let anonymized = false
  try {
    await anonymizeTelemetryData(pool, userId)
    anonymized = true
  } catch (error) {
    warnings.push('telemetry_anonymization_failed')
    logger.warn('telemetry_anonymization_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO silver.account_deletion_tombstone (user_id, deleted_at)
       VALUES ($1, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET deleted_at = EXCLUDED.deleted_at`,
      [userId],
    )

    const deletionResult = await client.query<{ user_id: string }>(
      `DELETE FROM silver.user_account
       WHERE user_id = $1
       RETURNING user_id`,
      [userId],
    )

    if (!deletionResult.rowCount) {
      await client.query('ROLLBACK')
      errors.push('user_delete_failed')
      return {
        deleted: false,
        anonymized,
        errors,
        warnings,
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      logger.error('transaction_rollback_failed', {
        user_id: userId,
        error: getErrorMessage(rollbackError),
      })
    }
    errors.push('user_delete_failed')
    logger.warn('account_delete_transaction_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
    return {
      deleted: false,
      anonymized,
      errors,
      warnings,
    }
  } finally {
    client.release()
  }

  await safeAsync(
    () => logAuditEvent(pool, {
      actorId: userId,
      actorType: 'user',
      actorRole: options?.actorRole,
      action: 'account.delete',
      entityType: 'user_account',
      entityId: userId,
      beforeSnapshot,
      afterSnapshot: null,
      reason: options?.reason || 'User requested account deletion',
      category: 'user_action',
      severity: 'info',
      ...getRequestContext(options?.request),
    }),
    logger,
    'audit_log_write_failed',
    { user_id: userId, action: 'account.delete' },
  )

  const exportDeleteOk = await safeAsync(
    async () => {
      await deleteExportObjects(exportKeys, warnings)
      return true
    },
    logger,
    'export_delete_failed',
    { user_id: userId },
    { defaultValue: false },
  )
  if (!exportDeleteOk) {
    warnings.push('export_delete_failed')
  }

  const serviceRoleKey = config.auth.supabase.serviceRoleKey
  if (serviceRoleKey && config.auth.supabase.url) {
    try {
      await deleteSupabaseAccount(userId, serviceRoleKey, config.auth.supabase.url)
    } catch (error) {
      warnings.push('supabase_account_delete_failed')
      logger.warn('supabase_account_delete_failed', {
        user_id: userId,
        error: getErrorMessage(error),
      })
    }
  } else {
    warnings.push('supabase_service_role_missing')
  }

  logger.info('account_deleted', {
    user_id: userId,
    email: account.email,
    warnings: warnings.length,
  })
  recordBusinessMetric('user_deletions_total', 1)

  return {
    deleted: true,
    anonymized,
    errors,
    warnings,
  }
}
