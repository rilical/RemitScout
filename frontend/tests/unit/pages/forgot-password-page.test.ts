import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockRequestPasswordReset = vi.hoisted(() => vi.fn())

vi.mock('~/composables/useSeo', () => ({
  setSeo: vi.fn(),
}))

const LinkStub = defineComponent({
  props: {
    to: {
      type: [String, Object],
      required: false,
    },
  },
  template: '<a><slot /></a>',
})

describe('forgot-password page', () => {
  const mountPage = async () => {
    const ForgotPasswordPage = (await import('~/pages/forgot-password.vue')).default
    return mount(ForgotPasswordPage, {
      global: {
        stubs: {
          NuxtImg: true,
          NuxtLink: LinkStub,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockRequestPasswordReset.mockResolvedValue({ ok: true })

    vi.stubGlobal('useAuth', () => ({
      requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
    }))
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('useRoute', () => ({ path: '/forgot-password' }))
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://remit-scout.com',
      },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a confirmation state after the reset link request succeeds', async () => {
    const wrapper = await mountPage()

    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockRequestPasswordReset).toHaveBeenCalledWith('user@example.com')
    expect(wrapper.text()).toContain('We\'ve sent a password reset link to user@example.com')
  })

  it('shows the auth error when the reset link request fails', async () => {
    mockRequestPasswordReset.mockResolvedValue({
      ok: false,
      error: 'Supabase is not configured.',
    })

    const wrapper = await mountPage()

    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Supabase is not configured.')
  })
})
