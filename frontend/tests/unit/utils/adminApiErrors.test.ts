import { describe, expect, it } from 'vitest'
import { getAdminApiErrorMessage } from '~/utils/adminApiErrors'

describe('getAdminApiErrorMessage', () => {
  it('maps admin allowlist and IP failures to actionable copy', () => {
    expect(getAdminApiErrorMessage({
      data: { error: 'forbidden', code: 'admin_allowlist_denied' },
    }, 'fallback')).toBe('Your account is not on the admin allowlist.')

    expect(getAdminApiErrorMessage({
      data: { error: 'forbidden', code: 'admin_ip_not_allowlisted' },
    }, 'fallback')).toBe('This IP address is not allowlisted for the admin surface.')
  })

  it('maps super-admin and revoked-session failures', () => {
    expect(getAdminApiErrorMessage({
      data: { error: 'forbidden', code: 'super_admin_required' },
    }, 'fallback')).toBe('Super-admin access is required for this action.')

    expect(getAdminApiErrorMessage({
      data: { error: 'unauthorized', code: 'revoked_token' },
    }, 'fallback')).toBe('Admin session has been revoked. Sign in again to continue.')
  })
})
