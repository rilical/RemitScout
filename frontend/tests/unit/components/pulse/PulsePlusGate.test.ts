import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import PulsePlusGate from '~/components/pulse/PulsePlusGate.vue'

describe('PulsePlusGate', () => {
  it('does not mount default slot when gated (enterprise)', () => {
    const wrapper = mount(PulsePlusGate, {
      props: {
        isGated: true,
        tier: 'enterprise',
      },
      slots: {
        default: '<div data-test="default-slot">secret</div>',
        preview: '<div data-test="preview-slot">preview</div>',
      },
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.find('[data-test="default-slot"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="preview-slot"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/contact?type=enterprise&topic=pulse"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Contact sales')
    expect(wrapper.text()).not.toContain('Learn more about Plus')
  })
})
