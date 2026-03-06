import { describe, expect, it } from 'vitest'
import {
  findPlanForEmail,
  readAdminSmokeConfig,
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
})
