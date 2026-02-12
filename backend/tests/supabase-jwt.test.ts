import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
const mockConfig = vi.hoisted(() => ({
  auth: {
    supabase: {
      verifyMode: 'auto' as 'auto' | 'jwks' | 'remote',
      remoteVerifyCacheTtlSeconds: 60,
    },
  },
}))

vi.mock('../shared/config', () => ({ config: mockConfig }))
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
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    mockConfig.auth.supabase.verifyMode = 'auto'
  })

  it('returns missing_token when header is missing', async () => {
    const result = await verifySupabaseJwt(undefined)
    expect('code' in result && result.code).toBe('missing_token')
  })

  it('verifies with jwks when available', async () => {
    mockConfig.auth.supabase.verifyMode = 'jwks'
    vi.mocked(getCachedJwks).mockReturnValue([{ kid: '1' }])
    vi.mocked(verifyWithJwks).mockResolvedValue({ user_id: 'u1', claims: {} })

    const result = await verifySupabaseJwt('Bearer token')
    expect('user_id' in result && result.user_id).toBe('u1')
  })

  it('falls back to remote when jwks is empty', async () => {
    mockConfig.auth.supabase.verifyMode = 'auto'
    vi.mocked(getCachedJwks).mockReturnValue(null)
    vi.mocked(fetchJwks).mockResolvedValue([])
    vi.mocked(remoteVerify).mockResolvedValue({ user_id: 'u2', claims: {} })

    const result = await verifySupabaseJwt('Bearer token')
    expect('user_id' in result && result.user_id).toBe('u2')
  })

  it('returns verification_failed when remote fails', async () => {
    mockConfig.auth.supabase.verifyMode = 'remote'
    vi.mocked(remoteVerify).mockResolvedValue(null)

    const result = await verifySupabaseJwt('Bearer token')
    expect('code' in result && result.code).toBe('verification_failed')
  })
})
