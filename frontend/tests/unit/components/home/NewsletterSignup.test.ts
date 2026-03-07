import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: (...args: unknown[]) => mockRequest(...args),
  }),
}))

vi.mock('~/ui', () => ({
  Icon: defineComponent({
    template: '<span />',
  }),
}))

describe('NewsletterSignup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest.mockResolvedValue({ success: true, status: 'pending' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits a newsletter subscription and shows the welcome state', async () => {
    const NewsletterSignup = (await import('~/components/home/NewsletterSignup.vue')).default
    const wrapper = mount(NewsletterSignup)

    await wrapper.get('input[type="email"]').setValue('user@example.com')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockRequest).toHaveBeenCalledWith('/newsletter/subscribe', {
      method: 'POST',
      body: { email: 'user@example.com', source: 'NewsletterSignup' },
    })
    expect(wrapper.text()).toContain("You're In!")
    expect(wrapper.text()).toContain('Welcome to the Remit-Scout community')
  })

  it('shows the API error when newsletter subscription fails', async () => {
    mockRequest.mockRejectedValue(new Error('Already subscribed'))

    const NewsletterSignup = (await import('~/components/home/NewsletterSignup.vue')).default
    const wrapper = mount(NewsletterSignup)

    await wrapper.get('input[type="email"]').setValue('user@example.com')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Already subscribed')
  })
})
