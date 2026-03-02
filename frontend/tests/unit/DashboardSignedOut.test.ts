import { describe, expect, it, vi } from 'vitest'
import { ref, computed } from 'vue'
import { mount } from '@vue/test-utils'

import DashboardSignedOut from '../../domains/dashboard/ui/DashboardSignedOut.vue'

vi.mock('~/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    pulseEnabled: computed(() => true),
    pulseScreenerEnabled: computed(() => false),
    enterpriseEnabled: computed(() => false),
  }),
}))

describe('DashboardSignedOut', () => {
  it('renders the signed-out dashboard hero + CTAs', () => {
    const wrapper = mount(DashboardSignedOut, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          NuxtImg: {
            template: '<img />',
          },
          HomeTrustMetricsStrip: {
            template: '<div data-test="trust-strip" />',
          },
          Icon: {
            props: ['name', 'size'],
            template: '<span />',
          },
          CenteredPage: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.find('h1').text()).toBe('Your transfer dashboard')
    expect(wrapper.text()).toContain('Create free account')
    expect(wrapper.text()).toContain('Watchlist')
    expect(wrapper.text()).toContain('Rate alerts')
    expect(wrapper.text()).toContain('Plus: 90 days.')
  })
})
