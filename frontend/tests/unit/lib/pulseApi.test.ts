import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestMock = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: requestMock,
  }),
}))

describe('pulseApi indices contracts', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue({})
  })

  it('sends corridor_id for indices series requests', async () => {
    const { getIndicesSeries } = await import('~/lib/pulseApi')

    await getIndicesSeries({
      from: 'US',
      to: 'PH',
      fromCode: 'USD',
      toCode: 'PHP',
      fromFlag: '🇺🇸',
      toFlag: '🇵🇭',
      label: 'United States to Philippines',
      slug: 'us-ph-usd-php',
      corridorId: 'US-PH-USD-PHP',
    }, 30, 500, 'standard_bank')

    expect(requestMock).toHaveBeenCalledWith('/indices/series', {
      query: expect.objectContaining({
        corridor_id: 'US-PH-USD-PHP',
        corridor: 'us-ph-usd-php',
        amount_bucket: 500,
        method_profile: 'standard_bank',
      }),
    })
  })

  it('does not expose an exports tab in shipped Pulse navigation', async () => {
    const { PULSE_TABS } = await import('~/lib/pulseTabs')

    expect(PULSE_TABS.map(tab => String(tab.id))).not.toContain('exports')
  })
})
