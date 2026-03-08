import { describe, expect, it } from 'vitest'

import {
  evaluateRequiredMfaTruth,
  readAuthSmokeConfig,
  readSupabaseSignupMessage,
  shouldTreatSupabaseSignupFailureAsAdvisory,
} from '../scripts/ci/auth-surface-smoke'

describe('auth-surface-smoke helpers', () => {
  it('treats a verified MFA factor as passing when MFA is expected', () => {
    expect(
      evaluateRequiredMfaTruth({
        expectMfa: true,
        factorPresent: true,
        factorVerified: true,
        hasVerificationCode: false,
      }),
    ).toEqual({ ok: true, advisory: false })
  })

  it('treats a verified factor without a CI MFA code as advisory-pass', () => {
    expect(
      evaluateRequiredMfaTruth({
        expectMfa: true,
        factorPresent: true,
        factorVerified: false,
        hasVerificationCode: false,
      }),
    ).toEqual({ ok: true, advisory: true })
  })

  it('fails MFA truth when no factor is present and MFA is expected', () => {
    expect(
      evaluateRequiredMfaTruth({
        expectMfa: true,
        factorPresent: false,
        factorVerified: false,
        hasVerificationCode: false,
      }),
    ).toEqual({ ok: false, advisory: false })
  })

  it('allows staging signup email delivery failures to become advisory', () => {
    const config = readAuthSmokeConfig({ ENVIRONMENT: 'staging' })
    expect(
      shouldTreatSupabaseSignupFailureAsAdvisory(
        500,
        {
          error: { message: 'Error sending confirmation email' },
        },
        config,
      ),
    ).toBe(true)
  })

  it('keeps production signup email delivery failures blocking', () => {
    const config = readAuthSmokeConfig({ ENVIRONMENT: 'production' })
    expect(
      shouldTreatSupabaseSignupFailureAsAdvisory(
        500,
        {
          error: { message: 'Error sending confirmation email' },
        },
        config,
      ),
    ).toBe(false)
  })

  it('reads signup failure messages from string and object payloads', () => {
    expect(readSupabaseSignupMessage({ message: 'top-level message' })).toBe('top-level message')
    expect(readSupabaseSignupMessage({ error: 'plain error' })).toBe('plain error')
    expect(readSupabaseSignupMessage({ error: { message: 'nested error' } })).toBe('nested error')
  })
})
