import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { getChartById } from '~/lib/pulseChartRegistry'
import PulseChartFull from '~/components/pulse/PulseChartFull.vue'
import type { PulseFilters } from '~/types/pulse'

const mockGetChartData = vi.hoisted(() => vi.fn())
const mockGetMethodCoverage = vi.hoisted(() => vi.fn())

vi.mock('~/lib/pulseApi', () => ({
  getChartData: (...args: unknown[]) => mockGetChartData(...args),
  getMethodCoverage: (...args: unknown[]) => mockGetMethodCoverage(...args),
}))

describe('PulseChartFull', () => {
  const filters: PulseFilters = {
    corridor: 'usd-php',
    amount: 500,
    fundingMethod: 'bank',
    payoutMethod: 'bank',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountChart = async (pulseLevel: 'none' | 'lite' | 'full') => {
    const metadata = getChartById('all-in-cost')
    if (!metadata) throw new Error('all-in-cost chart metadata missing')

    mockGetChartData.mockResolvedValue({
      metadata: {
        ...metadata,
        lastUpdated: '2026-02-25T00:00:00.000Z',
      },
      series: [],
      insight: '',
      dataAvailable: true,
      updatedAt: '2026-02-25T00:00:00.000Z',
      source: 'gold_export',
    })
    mockGetMethodCoverage.mockResolvedValue([])

    const wrapper = mount(PulseChartFull, {
      props: {
        chartId: 'all-in-cost',
        filters,
        pulseLevel,
      },
      global: {
        stubs: {
          AsyncErrorBoundary: {
            template: '<div><slot /></div>',
          },
          PulsePlusGate: {
            template: '<div><slot /></div>',
          },
          PulseTableView: true,
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('shows explicit pending state when chart has no renderable series', async () => {
    const metadata = getChartById('all-in-cost')
    if (!metadata) throw new Error('all-in-cost chart metadata missing')

    mockGetChartData.mockResolvedValue({
      metadata: {
        ...metadata,
        lastUpdated: '',
      },
      series: [],
      insight: '',
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    })
    mockGetMethodCoverage.mockResolvedValue([])

    const wrapper = mount(PulseChartFull, {
      props: {
        chartId: 'all-in-cost',
        filters,
        pulseLevel: 'full',
      },
      global: {
        stubs: {
          AsyncErrorBoundary: {
            template: '<div><slot /></div>',
          },
          PulsePlusGate: {
            template: '<div><slot /></div>',
          },
          PulseTableView: true,
        },
      },
    })

    await flushPromises()

    expect(mockGetChartData).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Data pending')
    expect(wrapper.text()).toContain('Data is being prepared for this corridor. Check back shortly.')
  })

  it('shows 7D/30D/90D and hides 1Y for Plus users', async () => {
    const wrapper = await mountChart('lite')
    const labels = wrapper.findAll('button').map(button => button.text().trim())

    expect(labels).toContain('7D')
    expect(labels).toContain('30D')
    expect(labels).toContain('90D')
    expect(labels).not.toContain('1Y')
  })

  it('shows 1Y for Enterprise users', async () => {
    const wrapper = await mountChart('full')
    const labels = wrapper.findAll('button').map(button => button.text().trim())

    expect(labels).toContain('7D')
    expect(labels).toContain('30D')
    expect(labels).toContain('90D')
    expect(labels).toContain('1Y')
  })
})
