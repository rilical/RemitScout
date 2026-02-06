import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FxProviderPricingTable from '~/domains/market-data/ui/FxProviderPricingTable.vue'

describe('FxProviderPricingTable', () => {
  it('renders provider pricing rows into a DataTable', () => {
    const wrapper = mount(FxProviderPricingTable, {
      props: {
        rows: [
          {
            id: 'Wise',
            name: 'Wise',
            speed: 'Instant',
            rate: 'PHP 55.1234',
            markupPercent: '0.25%',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Provider')
    expect(wrapper.text()).toContain('Markup vs mid')
    expect(wrapper.text()).toContain('Wise')
    expect(wrapper.text()).toContain('PHP 55.1234')
    expect(wrapper.text()).toContain('0.25%')
  })
})
