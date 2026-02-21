import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { HeadlineTile } from '~/types/pulse'
import PulseHeadlineTiles from '~/components/pulse/PulseHeadlineTiles.vue'

const sampleTiles: HeadlineTile[] = [
  {
    id: 'indices-rci',
    label: 'RCI',
    value: '—',
    delta: 'Data pending',
    deltaType: 'neutral',
    deltaLabel: 'bank',
    tooltip: 'RCI tile',
    chartId: 'all-in-cost',
    icon: 'activity',
  },
]

describe('PulseHeadlineTiles', () => {
  it('renders skeleton cards in loading mode', () => {
    const wrapper = mount(PulseHeadlineTiles, {
      props: {
        tiles: sampleTiles,
        loading: true,
      },
    })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders fallback values once loading stops', () => {
    const wrapper = mount(PulseHeadlineTiles, {
      props: {
        tiles: sampleTiles,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('RCI')
    expect(wrapper.text()).toContain('—')
    expect(wrapper.text()).toContain('Data pending')
  })
})
