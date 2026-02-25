import { defineComponent, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { getChartById } from '~/lib/pulseChartRegistry'
import PulseChartGrid from '~/components/pulse/PulseChartGrid.vue'
import type { ChartData, PulseFilters } from '~/types/pulse'

vi.mock('~/ui', () => ({
  Icon: defineComponent({
    name: 'Icon',
    template: '<i />',
  }),
}))

describe('PulseChartGrid', () => {
  const filters: PulseFilters = {
    corridor: 'usd-php',
    amount: 500,
    fundingMethod: 'bank',
    payoutMethod: 'bank',
  }

  it('shows pending insight for charts marked unavailable in availability metadata', async () => {
    const metadata = getChartById('indices-confidence')
    if (!metadata) throw new Error('indices-confidence chart metadata missing')

    const chartData: Record<string, ChartData | null> = {
      'indices-confidence': {
        metadata,
        series: [],
        insight: '',
        dataAvailable: false,
        updatedAt: null,
        source: 'gold_export',
      },
    }

    const wrapper = mount(PulseChartGrid, {
      props: {
        chartData,
        chartAvailability: {
          'indices-confidence': {
            dataAvailable: false,
            updatedAt: null,
            source: 'gold_export',
          },
        },
        filters,
        pulseLevel: 'full',
      },
      global: {
        stubs: {
          ChartPreviewCard: defineComponent({
            props: {
              metadata: { type: Object, required: true },
              insight: { type: String, required: false, default: '' },
              updatedAt: { type: String, required: false, default: null },
            },
            template: '<div class="preview">{{ metadata.id }}|{{ insight }}|{{ updatedAt || "none" }}</div>',
          }),
        },
      },
    })

    await nextTick()

    const preview = wrapper.findAll('.preview')
      .find(node => node.text().startsWith('indices-confidence|'))
    expect(preview).toBeTruthy()
    expect(preview!.text()).toContain('Data pending for this corridor.')
  })
})
