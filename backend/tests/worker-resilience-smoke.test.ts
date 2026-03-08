import { describe, expect, it } from 'vitest'
import { resolveWorkerResilienceAdminAuth } from '../scripts/ci/worker-resilience-smoke'

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
})
