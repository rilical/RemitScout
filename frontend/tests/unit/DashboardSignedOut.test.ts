import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import DashboardSignedOut from '../../domains/dashboard/ui/DashboardSignedOut.vue'

describe('DashboardSignedOut', () => {
  it('renders the signed-out dashboard hero + CTAs', () => {
    const wrapper = mount(DashboardSignedOut, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          HomeTrustMetricsStrip: {
            template: '<div data-test="trust-strip" />',
          },
        },
      },
    })

    expect(wrapper.find('h1').text()).toBe('Your transfer dashboard')
    expect(wrapper.text()).toContain('Create free account')
    expect(wrapper.text()).toContain('Watchlist')
    expect(wrapper.text()).toContain('Rate alerts')
  })
})
