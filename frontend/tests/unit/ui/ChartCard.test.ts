import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChartCard from '~/ui/charts/ChartCard.vue'

describe('ChartCard', () => {
  it('stretches as a full-height column shell for Pulse hero-and-rail layouts', () => {
    const wrapper = mount(ChartCard, {
      props: {
        variant: 'consumer',
        title: 'Benchmark Cost vs FX Markup',
        subtitle: 'Cost on the left axis and FX markup on the right',
      },
      slots: {
        chart: '<div data-testid="chart-slot">chart</div>',
      },
    })

    const section = wrapper.get('section')
    expect(section.classes()).toContain('h-full')
    expect(section.classes()).toContain('flex')
    expect(section.classes()).toContain('flex-col')

    const body = wrapper.findAll('div').find(node => node.classes().includes('flex-1'))
    expect(body).toBeTruthy()
  })
})
