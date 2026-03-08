import { describe, expect, it } from 'vitest'
import {
  resolveQueueLookupIssue,
  resolveWorkerResilienceAdminAuth,
  shouldTreatFallbackEvidenceAsAdvisory,
} from '../scripts/ci/worker-resilience-smoke'

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
})

describe('worker resilience fallback advisories', () => {
  it('treats missing signal as advisory only under Supabase fallback with a non-error status', () => {
    expect(shouldTreatFallbackEvidenceAsAdvisory('supabase_fallback', 200, false)).toBe(true)
    expect(shouldTreatFallbackEvidenceAsAdvisory('supabase_fallback', 204, false)).toBe(true)
  })

  it('keeps real admin exchange and error responses as hard failures', () => {
    expect(shouldTreatFallbackEvidenceAsAdvisory('admin_exchange', 200, false)).toBe(false)
    expect(shouldTreatFallbackEvidenceAsAdvisory('none', 200, false)).toBe(false)
    expect(shouldTreatFallbackEvidenceAsAdvisory('supabase_fallback', 403, false)).toBe(false)
    expect(shouldTreatFallbackEvidenceAsAdvisory('supabase_fallback', 200, true)).toBe(false)
  })
})
