import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'

describe('ProviderLogo', () => {
  it('falls through to the next logo source when image loading fails', async () => {
    const wrapper = mount(ProviderLogo, {
      props: {
        slug: 'wise',
        source: '/broken-logo.svg',
      },
    })

    expect(wrapper.find('img').attributes('src')).toBe('/broken-logo.svg')

    await wrapper.find('img').trigger('error')
    await nextTick()

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('/logos/wise.svg')
  })

  it('renders text fallback after exhausting all candidate sources', async () => {
    const wrapper = mount(ProviderLogo, {
      props: {
        slug: 'missing-provider',
        source: '/broken-logo.svg',
      },
    })

    expect(wrapper.find('img').exists()).toBe(true)

    let guard = 0
    while (wrapper.find('img').exists() && guard < 16) {
      await wrapper.find('img').trigger('error')
      await nextTick()
      guard += 1
    }

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('M')
  })
})
