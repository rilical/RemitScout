import type { FastifyRequest } from 'fastify'
import type { Pool } from 'pg'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getErrorMessage } from '../types/errors'
import { deleteAvatar } from './avatar-upload'
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
  avatar_url: string | null
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
    `SELECT email, avatar_url
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
    avatar_url: account.avatar_url,
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

  const deletionResult = await query<{ user_id: string }>(
    `DELETE FROM silver.user_account
     WHERE user_id = $1
     RETURNING user_id`,
    [userId],
    pool,
  )

  if (!deletionResult.rowCount) {
    errors.push('user_delete_failed')
    return {
      deleted: false,
      anonymized,
      errors,
      warnings,
    }
  }

  try {
    await logAuditEvent(pool, {
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
    })
  } catch (error) {
    logger.warn('audit_log_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
  }

  try {
    await deleteExportObjects(exportKeys, warnings)
  } catch (error) {
    warnings.push('export_delete_failed')
    logger.warn('export_delete_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
  }

  try {
    await deleteAvatar(account.avatar_url)
  } catch (error) {
    warnings.push('avatar_delete_failed')
    logger.warn('avatar_delete_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
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

  return {
    deleted: true,
    anonymized,
    errors,
    warnings,
  }
}
