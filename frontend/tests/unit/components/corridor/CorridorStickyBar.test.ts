import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CorridorStickyBar from '~/components/corridor/CorridorStickyBar.vue'

const inputRect = {
  x: 24,
  y: 24,
  top: 24,
  left: 24,
  bottom: 72,
  right: 264,
  width: 240,
  height: 48,
  toJSON: () => '',
} as DOMRect

const CurrencySelectStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  template: '<input :value="modelValue" />',
})

const UniversalDropdownStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  template: '<button type="button">{{ modelValue }}</button>',
})

describe('CorridorStickyBar', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })

    vi.spyOn(HTMLInputElement.prototype, 'getBoundingClientRect').mockReturnValue(inputRect)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('emits the newly typed corridor when compare is clicked immediately', async () => {
    const wrapper = mount(CorridorStickyBar, {
      attachTo: document.body,
      props: {
        amount: 1000,
        payoutMethod: 'bank',
        sortBy: 'recipient',
        currency: 'PHP',
        fromCurrency: 'USD',
        fromCountry: 'US',
        toCountry: 'PH',
      },
      global: {
        stubs: {
          CurrencySelect: CurrencySelectStub,
          UniversalDropdown: UniversalDropdownStub,
        },
      },
    })

    await flushPromises()

    const toCountryInput = wrapper.get('#corridor-to-country')
    await toCountryInput.trigger('focus')
    await flushPromises()

    await toCountryInput.setValue('Mexico')
    await flushPromises()

    await wrapper.get('[data-testid="corridor-query-compare-button"]').trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('new-query')?.at(-1)?.[0] as
      | {
          fromCountry: string
          toCountry: string
          amount: number
          currency: string
          fromCurrency: string
          payoutMethod: string
        }
      | undefined

    expect(emitted).toBeDefined()
    expect(emitted?.fromCountry).toBe('US')
    expect(emitted?.toCountry).toBe('MX')
    expect(emitted?.currency).toBe('MXN')

    wrapper.unmount()
  })
})
