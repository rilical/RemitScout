import { afterEach, describe, expect, it } from 'vitest'
import {
  resolveQueueLookupIssue,
  resolveQueueUrlFromEnv,
  resolveWorkerResilienceAdminAuth,
  shouldBypassPrivilegedOpsFailure,
} from '../scripts/ci/worker-resilience-smoke'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('worker resilience smoke admin auth', () => {
  it('accepts the admin exchange token when it is returned directly', () => {
    expect(resolveWorkerResilienceAdminAuth(200, {
      access_token: 'admin-token',
    }, 'supabase-token')).toEqual({
      token: 'admin-token',
      source: 'admin_exchange',
      ok: true,
      note: 'status=200',
    })
  })

  it('falls back to the Supabase token when admin exchange returns 200 without an access token', () => {
    expect(resolveWorkerResilienceAdminAuth(200, {
      token_type: 'Bearer',
    }, 'supabase-token')).toEqual({
      token: 'supabase-token',
      source: 'supabase_fallback',
      ok: true,
      note: 'status=200 fallback=supabase_jwt',
    })
  })

  it('fails closed when admin exchange does not authorize the request', () => {
    expect(resolveWorkerResilienceAdminAuth(403, {
      error: 'forbidden',
    }, 'supabase-token')).toEqual({
      token: '',
      source: 'none',
      ok: false,
      note: 'status=403',
    })
  })

  it('tolerates an MFA challenge when staging is explicitly configured to allow Supabase fallback', () => {
    expect(resolveWorkerResilienceAdminAuth(403, {
      error: 'mfa_required',
      code: 'mfa_required',
    }, 'supabase-token', true)).toEqual({
      token: 'supabase-token',
      source: 'supabase_fallback',
      ok: true,
      note: 'status=403 fallback=supabase_jwt mfa_challenge_tolerated',
    })
  })

  it('classifies direct queue lookup misses as non-fatal fallback issues', () => {
    expect(resolveQueueLookupIssue({
      name: 'AWS.SimpleQueueService.NonExistentQueue',
      message: 'The specified queue does not exist.',
    })).toBe('nonexistent_queue')

    expect(resolveQueueLookupIssue({
      name: 'AccessDeniedException',
      message: 'is not authorized to perform: sqs:GetQueueUrl',
    })).toBe('access_denied')

    expect(resolveQueueLookupIssue(new Error('socket timeout'))).toBeNull()
  })

  it('treats explicit privileged-route auth denials as bypassable in worker smoke', () => {
    expect(shouldBypassPrivilegedOpsFailure(403, {
      error: 'forbidden',
      code: 'super_admin_required',
    })).toBe(true)

    expect(shouldBypassPrivilegedOpsFailure(403, {
      error: 'forbidden',
      code: 'admin_ip_not_allowlisted',
    })).toBe(true)

    expect(shouldBypassPrivilegedOpsFailure(403, {
      error: 'forbidden',
    })).toBe(true)

    expect(shouldBypassPrivilegedOpsFailure(403, null)).toBe(true)

    expect(shouldBypassPrivilegedOpsFailure(403, {
      error: 'forbidden',
      code: 'admin_role_required',
    })).toBe(false)

    expect(shouldBypassPrivilegedOpsFailure(200, {
      error: 'forbidden',
      code: 'super_admin_required',
    })).toBe(false)
  })

  it('uses explicit queue URLs from env before any AWS queue-name lookup', () => {
    process.env.QUOTE_REFRESH_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/quote-refresh'
    process.env.FX_RATE_REFRESH_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/fx-rate-refresh'
    process.env.EXPORT_JOB_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/export-job'

    expect(resolveQueueUrlFromEnv('quote_refresh')).toBe(process.env.QUOTE_REFRESH_QUEUE_URL)
    expect(resolveQueueUrlFromEnv('fx_rate_refresh')).toBe(process.env.FX_RATE_REFRESH_QUEUE_URL)
    expect(resolveQueueUrlFromEnv('exports')).toBe(process.env.EXPORT_JOB_QUEUE_URL)
  })

  it('prefers tiered ingest queue URLs and ignores null-like output placeholders', () => {
    process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL = 'null'
    process.env.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/ingest-fanout'
    process.env.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/ingest-fanout-tier2'
    process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/notifications'
    process.env.PLANE_B_OPS_ALERT_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/ops-alerts'
    process.env.GOLD_LIVE_QUEUE_URL = '  '

    expect(resolveQueueUrlFromEnv('ingest_fanout')).toBe(process.env.PLANE_B_INGEST_FANOUT_TIER1_QUEUE_URL)
    expect(resolveQueueUrlFromEnv('ingest_fanout_tier2')).toBe(process.env.PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL)
    expect(resolveQueueUrlFromEnv('notifications')).toBe(process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL)
    expect(resolveQueueUrlFromEnv('ops_alerts')).toBe(process.env.PLANE_B_OPS_ALERT_QUEUE_URL)
    expect(resolveQueueUrlFromEnv('gold_live')).toBe('')
  })
})
