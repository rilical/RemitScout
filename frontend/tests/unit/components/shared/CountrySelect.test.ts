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

  const syncModelValue = async (wrapper: ReturnType<typeof mount>) => {
    const nextValue = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string | undefined
    if (!nextValue) return
    await wrapper.setProps({ modelValue: nextValue })
    await flushPromises()
  }

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
    await syncModelValue(wrapper)

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

  it('commits an exact typed country immediately', async () => {
    const wrapper = mount(CountrySelect, {
      attachTo: document.body,
      props: {
        id: 'country-select-exact-input',
        modelValue: 'US',
        label: 'Receiving in',
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    await input.setValue('Mexico')
    await flushPromises()
    await syncModelValue(wrapper)

    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['MX'])
    expect(wrapper.emitted('country-selected')?.[0]).toEqual(['MX', 'MXN'])
    expect((input.element as HTMLInputElement).value).toBe('Mexico')

    wrapper.unmount()
  })

  it('commits an exact typed country on blur before closing the dropdown', async () => {
    const wrapper = mount(CountrySelect, {
      attachTo: document.body,
      props: {
        id: 'country-select-exact-match',
        modelValue: 'US',
        label: 'Receiving in',
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    await input.setValue('Mexico')
    await flushPromises()

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flushPromises()
    await syncModelValue(wrapper)

    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['MX'])
    expect(wrapper.emitted('country-selected')?.[0]).toEqual(['MX', 'MXN'])
    expect((input.element as HTMLInputElement).value).toBe('Mexico')

    wrapper.unmount()
  })

  it('can hide flag emojis in the dropdown list', async () => {
    const wrapper = mount(CountrySelect, {
      attachTo: document.body,
      props: {
        id: 'country-select-no-flags',
        modelValue: 'US',
        label: 'Sending from',
        showFlags: false,
        allowedCodes: ['US', 'CA'],
      },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await flushPromises()

    const options = Array.from(document.body.querySelectorAll('[role="option"]'))
      .map(option => option.textContent?.trim())

    expect(options).toContain('United States')
    expect(options).toContain('Canada')
    expect(document.body.textContent).not.toContain('🇺🇸')
    expect(document.body.textContent).not.toContain('🇨🇦')

    wrapper.unmount()
  })
})
