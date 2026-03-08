// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  extractStoredSupabaseSession,
  isEmailConfirmed,
  mapSupabaseUser,
} from '~/composables/useAuth'

describe('useAuth helpers', () => {
  it('isEmailConfirmed returns true when email_confirmed_at is set', () => {
    expect(isEmailConfirmed({ email_confirmed_at: '2024-01-01T00:00:00Z' } as any)).toBe(true)
  })

  it('isEmailConfirmed returns true when confirmed_at is set', () => {
    expect(isEmailConfirmed({ confirmed_at: '2024-01-01T00:00:00Z' } as any)).toBe(true)
  })

  it('mapSupabaseUser maps id/email/name with metadata fallback', () => {
    const mapped = mapSupabaseUser({
      id: 'user_1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    } as any)
    expect(mapped).toEqual({ id: 'user_1', email: 'test@example.com', name: 'Test User' })
  })

  it('extractStoredSupabaseSession reads direct persisted session payloads', () => {
    expect(
      extractStoredSupabaseSession(
        JSON.stringify({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        }),
      ),
    ).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    })
  })

  it('extractStoredSupabaseSession reads wrapped currentSession payloads', () => {
    expect(
      extractStoredSupabaseSession(
        JSON.stringify({
          currentSession: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        }),
      ),
    ).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    })
  })

  it('extractStoredSupabaseSession reads full Supabase session payloads', () => {
    expect(
      extractStoredSupabaseSession(
        JSON.stringify({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 1773012292,
          user: {
            id: '92bd2179-5d84-400e-949a-bcdef6351854',
            email: 'omar@remit-scout.com',
          },
        }),
      ),
    ).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    })
  })
})
