import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive, ref } from 'vue'
import { mount } from '@vue/test-utils'
import AdminLayout from '~/layouts/admin.vue'

describe('admin layout', () => {
  const route = reactive({
    path: '/admin',
    fullPath: '/admin',
  })

  const ensureAdminSession = vi.fn().mockResolvedValue(true)
  const signOutAdmin = vi.fn().mockResolvedValue(undefined)
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')
    window.localStorage.clear()

    ;(globalThis as any).useRoute = () => route
    ;(globalThis as any).useAuth = () => ({
      user: ref({ email: 'admin@remit-scout.com' }),
    })
    ;(globalThis as any).useAdminSession = () => ({
      ensureAdminSession,
      signOutAdmin,
    })
    ;(globalThis as any).useRuntimeConfig = () => ({
      public: { remitScoutEnv: 'dev' },
    })
    ;(globalThis as any).navigateTo = navigateTo
  })

  afterEach(() => {
    delete (globalThis as any).useRoute
    delete (globalThis as any).useAuth
    delete (globalThis as any).useAdminSession
    delete (globalThis as any).useRuntimeConfig
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

  it('toggles dark mode and persists preference', async () => {
    const wrapper = mountLayout()
    await nextTick()

    const darkToggle = wrapper.findAll('button').find(button => button.text() === 'Dark')
    expect(darkToggle).toBeTruthy()

    await darkToggle!.trigger('click')
    await nextTick()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('admin:theme')).toBe('dark')
  })

  it('signs out and redirects to sign-in', async () => {
    const wrapper = mountLayout()
    await nextTick()

    const signOutButton = wrapper.findAll('button').find(button => button.text().includes('Sign Out'))
    expect(signOutButton).toBeTruthy()

    await signOutButton!.trigger('click')

    expect(signOutAdmin).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith('/sign-in')
  })
})
