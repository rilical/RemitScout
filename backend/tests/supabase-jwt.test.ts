import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { config } from '../shared/config'
import { verifySupabaseJwt } from '../plane-a/src/auth/verify-supabase-jwt'
import { fetchJwks } from '../plane-a/src/auth/jwks-fetch'
import { getCachedJwks } from '../plane-a/src/auth/jwks-cache'
import { verifyWithJwks } from '../plane-a/src/auth/jwks-verify'
import { remoteVerify } from '../plane-a/src/auth/remote-verify'

vi.mock('../plane-a/src/auth/jwks-fetch', () => ({ fetchJwks: vi.fn() }))
vi.mock('../plane-a/src/auth/jwks-cache', () => ({ getCachedJwks: vi.fn(), setCachedJwks: vi.fn() }))
vi.mock('../plane-a/src/auth/jwks-verify', () => ({ verifyWithJwks: vi.fn() }))
vi.mock('../plane-a/src/auth/remote-verify', () => ({ remoteVerify: vi.fn() }))

describe('verifySupabaseJwt', () => {
  const originalVerifyMode = config.auth.supabase.verifyMode

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    config.auth.supabase.verifyMode = originalVerifyMode
  })

  it('returns missing_token when header is missing', async () => {
    const result = await verifySupabaseJwt(undefined)
    expect('code' in result && result.code).toBe('missing_token')
  })

  it('verifies with jwks when available', async () => {
    config.auth.supabase.verifyMode = 'jwks'
    vi.mocked(getCachedJwks).mockReturnValue([{ kid: '1' }])
    vi.mocked(verifyWithJwks).mockResolvedValue({ user_id: 'u1', claims: {} })

    const result = await verifySupabaseJwt('Bearer token')
    expect('user_id' in result && result.user_id).toBe('u1')
  })

  it('falls back to remote when jwks is empty', async () => {
    config.auth.supabase.verifyMode = 'auto'
    vi.mocked(getCachedJwks).mockReturnValue(null)
    vi.mocked(fetchJwks).mockResolvedValue([])
    vi.mocked(remoteVerify).mockResolvedValue({ user_id: 'u2', claims: {} })

    const result = await verifySupabaseJwt('Bearer token')
    expect('user_id' in result && result.user_id).toBe('u2')
  })

  it('returns verification_failed when remote fails', async () => {
    config.auth.supabase.verifyMode = 'remote'
    vi.mocked(remoteVerify).mockResolvedValue(null)

    const result = await verifySupabaseJwt('Bearer token')
    expect('code' in result && result.code).toBe('verification_failed')
  })
})
