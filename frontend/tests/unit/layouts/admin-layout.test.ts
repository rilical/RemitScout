import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import AdminLayout from '~/layouts/admin.vue'

describe('admin layout', () => {
  const route = reactive({
    path: '/admin',
    fullPath: '/admin',
  })

  const ensureAdminSession = vi.fn().mockResolvedValue(true)
  const signOutAdmin = vi.fn().mockResolvedValue(undefined)
  const ensureHydrated = vi.fn().mockResolvedValue(undefined)
  const request = vi.fn().mockResolvedValue({ user: { email: 'admin@remit-scout.com' } })
  const navigateTo = vi.fn()
  const isAuthenticated = ref(true)
  const authUser = ref<{ email: string } | null>({ email: 'admin@remit-scout.com' })

  beforeEach(() => {
    vi.clearAllMocks()
    ensureHydrated.mockResolvedValue(undefined)
    request.mockResolvedValue({ user: { email: 'admin@remit-scout.com' } })
    isAuthenticated.value = true
    authUser.value = { email: 'admin@remit-scout.com' }
    if (typeof window.localStorage?.clear === 'function') {
      window.localStorage.clear()
    }

    ;(globalThis as any).useRoute = () => route
    ;(globalThis as any).useAuth = () => ({
      user: authUser,
      ensureHydrated,
      isAuthenticated,
    })
    ;(globalThis as any).useAdminSession = () => ({
      ensureAdminSession,
      signOutAdmin,
    })
    ;(globalThis as any).useRuntimeConfig = () => ({
      public: { remitScoutEnv: 'dev' },
    })
    ;(globalThis as any).useApi = () => ({
      request,
    })
    ;(globalThis as any).navigateTo = navigateTo
  })

  afterEach(() => {
    delete (globalThis as any).useRoute
    delete (globalThis as any).useAuth
    delete (globalThis as any).useAdminSession
    delete (globalThis as any).useRuntimeConfig
    delete (globalThis as any).useApi
    delete (globalThis as any).navigateTo
  })

  const mountLayout = () =>
    mount(AdminLayout, {
      slots: {
        default: '<div data-testid="layout-content">content</div>',
      },
      global: {
        stubs: {
          NuxtLink: defineComponent({
            props: { to: { type: String, required: false } },
            template: '<a><slot /></a>',
          }),
          AdminCommandPalette: true,
        },
      },
    })

  const flushLayoutBootstrap = async () => {
    await flushPromises()
    await nextTick()
  }

  it('bootstraps an admin session on mount', async () => {
    mountLayout()
    await flushLayoutBootstrap()

    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
  })

  it('keeps authenticated admins on the page when admin bootstrap fails transiently', async () => {
    ensureAdminSession.mockResolvedValueOnce(false)

    mountLayout()
    await flushLayoutBootstrap()

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('redirects to sign-in when neither admin bootstrap nor app auth is available', async () => {
    ensureAdminSession.mockResolvedValueOnce(false)
    isAuthenticated.value = false

    mountLayout()
    await flushLayoutBootstrap()

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/sign-in')
  })

  it('signs out and redirects to sign-in', async () => {
    const wrapper = mountLayout()
    await flushLayoutBootstrap()

    const signOutButton = wrapper.findAll('button').find(button => button.text().includes('Sign Out'))
    expect(signOutButton).toBeTruthy()

    await signOutButton!.trigger('click')

    expect(signOutAdmin).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/sign-in')
  })

  it('hydrates the admin header email from /me when the auth user is missing on reload', async () => {
    authUser.value = null

    const wrapper = mountLayout()
    await flushLayoutBootstrap()

    expect(request).toHaveBeenCalledWith('/me', { retries: 0 })
    expect(wrapper.text()).toContain('admin@remit-scout.com')
    expect(wrapper.text()).not.toContain('Unknown')
  })
})
