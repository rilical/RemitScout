// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  extractStoredSupabaseSession,
  extractSupabaseSessionFromHash,
  isEmailConfirmed,
  mapSupabaseUser,
} from '~/composables/useAuth';

describe('useAuth helpers', () => {
  it('isEmailConfirmed returns true when email_confirmed_at is set', () => {
    expect(isEmailConfirmed({ email_confirmed_at: '2024-01-01T00:00:00Z' } as any)).toBe(true);
  });

  it('isEmailConfirmed returns true when confirmed_at is set', () => {
    expect(isEmailConfirmed({ confirmed_at: '2024-01-01T00:00:00Z' } as any)).toBe(true);
  });

  it('mapSupabaseUser maps id/email/name with metadata fallback', () => {
    const mapped = mapSupabaseUser({
      id: 'user_1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    } as any);
    expect(mapped).toEqual({ id: 'user_1', email: 'test@example.com', name: 'Test User' });
  });

  it('extractStoredSupabaseSession reads direct persisted session payloads', () => {
    expect(
      extractStoredSupabaseSession(
        JSON.stringify({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        })
      )
    ).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  it('extractStoredSupabaseSession reads wrapped currentSession payloads', () => {
    expect(
      extractStoredSupabaseSession(
        JSON.stringify({
          currentSession: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        })
      )
    ).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  it('extractSupabaseSessionFromHash returns access and refresh tokens', () => {
    expect(
      extractSupabaseSessionFromHash('#access_token=access-token&refresh_token=refresh-token')
    ).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });
});
