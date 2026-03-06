import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CountrySelect from '~/components/shared/CountrySelect.vue'

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

describe('CountrySelect', () => {
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

  it('supports keyboard search and selection', async () => {
    const wrapper = mount(CountrySelect, {
      attachTo: document.body,
      props: {
        id: 'country-select-test',
        modelValue: 'US',
        label: 'Sending from',
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    expect(input.attributes('aria-expanded')).toBe('true')

    await input.setValue('phil')
    await flushPromises()

    expect(document.body.textContent).toContain('Philippines')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['PH'])
    expect(wrapper.emitted('country-selected')?.[0]).toEqual(['PH', 'PHP'])
    expect((input.element as HTMLInputElement).value).toBe('Philippines')

    wrapper.unmount()
  })

  it('closes on outside click and restores the selected country label', async () => {
    const wrapper = mount(CountrySelect, {
      attachTo: document.body,
      props: {
        id: 'country-select-outside-click',
        modelValue: 'US',
        label: 'Sending from',
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    expect((input.element as HTMLInputElement).value).toBe('')

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flushPromises()

    expect(input.attributes('aria-expanded')).toBe('false')
    expect((input.element as HTMLInputElement).value).toBe('United States')

    wrapper.unmount()
  })
})
