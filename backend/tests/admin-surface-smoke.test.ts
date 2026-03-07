import { describe, expect, it } from 'vitest'
import {
  findPlanForEmail,
  findVerifiedTotpFactor,
  hasTotpMfaAmr,
  isAdminMfaRequiredResponse,
  readAdminSmokeConfig,
  readExpectedAdminMfa,
  readSmokeUserMfaCode,
} from '../scripts/ci/admin-surface-smoke'

describe('admin surface smoke helpers', () => {
  it('reads the reversible staging target and reset metadata from env', () => {
    expect(readAdminSmokeConfig({
      ADMIN_SMOKE_TARGET_EMAIL: 'support@remit-scout.com',
      ADMIN_SMOKE_GRANT_NOTES: 'grant for smoke',
      ADMIN_SMOKE_REVOKE_REASON: 'reset after smoke',
    })).toEqual({
      targetEmail: 'support@remit-scout.com',
      grantNotes: 'grant for smoke',
      revokeReason: 'reset after smoke',
    })
  })

  it('finds the target user plan case-insensitively in admin/plans responses', () => {
    expect(findPlanForEmail({
      users: [
        { email: 'other@remit-scout.com', plan_code: 'free', plan_status: 'active' },
        { email: 'Support@Remit-Scout.com', plan_code: 'enterprise', plan_status: 'active' },
      ],
    }, 'support@remit-scout.com')).toEqual({
      email: 'Support@Remit-Scout.com',
      plan_code: 'enterprise',
      plan_status: 'active',
    })
  })

  it('reads the smoke MFA code from dedicated or shared env vars', () => {
    expect(readSmokeUserMfaCode({
      SMOKE_USER_MFA_CODE: ' 654321 ',
    })).toBe('654321')

    expect(readSmokeUserMfaCode({
      E2E_AUTH_MFA_CODE: ' 123456 ',
    })).toBe('123456')
  })

  it('expects admin MFA by default in staging and production smoke runs', () => {
    expect(readExpectedAdminMfa({
      ENVIRONMENT: 'staging',
    })).toBe(true)

    expect(readExpectedAdminMfa({
      ENV_NAME: 'prod',
    })).toBe(true)

    expect(readExpectedAdminMfa({
      NODE_ENV: 'development',
    })).toBe(false)
  })

  it('allows explicit smoke override for admin MFA expectations', () => {
    expect(readExpectedAdminMfa({
      ENVIRONMENT: 'staging',
      SMOKE_EXPECT_ADMIN_MFA: '0',
    })).toBe(false)

    expect(readExpectedAdminMfa({
      ENVIRONMENT: 'development',
      SMOKE_EXPECT_ADMIN_MFA: '1',
    })).toBe(true)
  })

  it('finds a verified TOTP factor when present', () => {
    expect(findVerifiedTotpFactor({
      factors: [
        { id: 'phone-1', factor_type: 'phone', status: 'verified' },
        { id: 'totp-1', factor_type: 'totp', status: 'verified' },
      ],
    })).toEqual({
      id: 'totp-1',
      factor_type: 'totp',
      status: 'verified',
    })
  })

  it('detects TOTP MFA proof in Supabase access-token amr claims', () => {
    const payload = Buffer.from(JSON.stringify({
      amr: [
        { method: 'password' },
        { method: 'totp', mfa: true },
      ],
    })).toString('base64url')
    const token = `header.${payload}.signature`

    expect(hasTotpMfaAmr(token)).toBe(true)
    expect(hasTotpMfaAmr('header.e30.signature')).toBe(false)
  })

  it('only treats admin exchange mfa_required responses as MFA challenges', () => {
    expect(isAdminMfaRequiredResponse(403, {
      error: 'mfa_required',
    })).toBe(true)

    expect(isAdminMfaRequiredResponse(403, {
      code: 'mfa_required',
    })).toBe(true)

    expect(isAdminMfaRequiredResponse(403, {
      error: 'forbidden',
    })).toBe(false)

    expect(isAdminMfaRequiredResponse(200, {
      error: 'mfa_required',
    })).toBe(false)
  })
})
