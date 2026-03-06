import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn(),
}))

import { requireEntitlement } from '../plane-a/src/plugins/auth-plugin'
import { getUserPlan } from '../plane-a/src/services/user-plan'

const mockGetUserPlan = getUserPlan as unknown as ReturnType<typeof vi.fn>

const makeReply = () => {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
  }
  return reply
}

describe('requireEntitlement plan status enforcement', () => {
  beforeEach(() => {
    mockGetUserPlan.mockReset()
  })

  it('denies paid entitlements for inactive user plans', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'past_due',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('exports')(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: 'plan_inactive',
      details: expect.objectContaining({
        plan_failure: 'plan_inactive',
        required_plan: 'plus',
        capability: 'exports_enabled',
        lifecycle_state: 'past_due',
      }),
    }))
  })

  it('allows non-paid entitlements for inactive plans by falling back to free entitlements', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'past_due',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('alerts')(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('allows paid entitlements for active user plans when entitled', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'active',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('exports')(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('denies pulse_full for active plus plans', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'active',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('pulse_full')(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'forbidden',
        details: expect.objectContaining({
          plan_failure: 'enterprise_required',
          required_plan: 'enterprise',
          capability: 'pulse_access',
        }),
      }),
    )
  })

  it('fails closed with plan_inactive for pulse_full on inactive plans', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'past_due',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('pulse_full')(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: 'plan_inactive',
      details: expect.objectContaining({
        plan_failure: 'plan_inactive',
        lifecycle_state: 'past_due',
      }),
    }))
  })

  it('denies inactive enterprise api key plans', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'enterprise',
      status: 'canceled',
    })

    const request: any = { apiKey: { user_id: 'u1', key_id: 'k1' } }
    const reply: any = makeReply()

    await requireEntitlement('api_access')(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: 'plan_inactive',
      details: expect.objectContaining({
        plan_failure: 'plan_inactive',
        required_plan: 'enterprise',
        capability: 'api_access',
        lifecycle_state: 'canceled',
      }),
    }))
  })
})
