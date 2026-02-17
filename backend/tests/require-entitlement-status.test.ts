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
    expect(reply.send).toHaveBeenCalledWith({ error: 'plan_inactive' })
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

  it('denies pulse_pro for active plus plans', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'active',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('pulse_pro')(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'forbidden', entitlement: 'pulse_pro' })
  })

  it('fails closed with plan_inactive for pulse_pro on inactive plans', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u1',
      plan_code: 'plus',
      status: 'past_due',
    })

    const request: any = { user: { user_id: 'u1' } }
    const reply: any = makeReply()

    await requireEntitlement('pulse_pro')(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'plan_inactive' })
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
    expect(reply.send).toHaveBeenCalledWith({ error: 'plan_inactive' })
  })
})
