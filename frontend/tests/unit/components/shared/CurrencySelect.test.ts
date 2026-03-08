import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CurrencySelect from '~/components/shared/CurrencySelect.vue'

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

describe('CurrencySelect', () => {
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

  it('matches by currency name and selects with the keyboard', async () => {
    const wrapper = mount(CurrencySelect, {
      attachTo: document.body,
      props: {
        id: 'currency-select-test',
        modelValue: 'USD',
        label: 'Currency',
        currencies: ['USD', 'EUR', 'PHP'],
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    await input.setValue('philippine')
    await flushPromises()

    expect(document.body.textContent).toContain('PHP | Philippine Peso')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['PHP'])
    expect(wrapper.emitted('currency-selected')?.[0]).toEqual(['PHP'])
    expect((input.element as HTMLInputElement).value).toBe('PHP')

    wrapper.unmount()
  })

  it('restores the selected code when escape closes the dropdown', async () => {
    const wrapper = mount(CurrencySelect, {
      attachTo: document.body,
      props: {
        id: 'currency-select-escape',
        modelValue: 'USD',
        label: 'Currency',
        currencies: ['USD', 'EUR', 'PHP'],
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    expect((input.element as HTMLInputElement).value).toBe('')

    await input.setValue('eur')
    await flushPromises()
    await input.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(input.attributes('aria-expanded')).toBe('false')
    expect((input.element as HTMLInputElement).value).toBe('USD')

    wrapper.unmount()
  })
})
