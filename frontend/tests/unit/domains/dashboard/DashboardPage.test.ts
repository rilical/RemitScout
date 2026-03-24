import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'

const mockEnsureAuthenticated = vi.hoisted(() => vi.fn())
const mockNavigateTo = vi.hoisted(() => vi.fn())

vi.mock('~/domains/dashboard/ui/DashboardSignedIn.vue', () => ({
  default: defineComponent({
    name: 'DashboardSignedInStub',
    template: '<div data-testid="dashboard-signed-in">Dashboard</div>',
  }),
}))

describe('DashboardPage', () => {
  const isAuthenticated = ref(false)
  const hydrated = ref(false)

  const mountPage = async () => {
    const DashboardPage = (await import('~/domains/dashboard/ui/DashboardPage.vue')).default
    return mount(defineComponent({
      render: () => h(Suspense, null, {
        default: () => h(DashboardPage),
      }),
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    isAuthenticated.value = false
    hydrated.value = false
    mockNavigateTo.mockResolvedValue(undefined)
    mockEnsureAuthenticated.mockImplementation(async () => {
      hydrated.value = true
    })

    vi.stubGlobal('useAuth', () => ({
      ensureHydrated: (...args: unknown[]) => mockEnsureAuthenticated(...args),
      isAuthenticated,
      hydrated,
    }))
    vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args))
    vi.stubGlobal('useHead', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the dashboard route when auth recovers after the initial bootstrap', async () => {
    mockEnsureAuthenticated.mockImplementation(async () => {
      hydrated.value = true
      isAuthenticated.value = true
    })

    const wrapper = await mountPage()
    await flushPromises()

    expect(mockEnsureAuthenticated).toHaveBeenCalledTimes(1)
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="dashboard-signed-in"]').exists()).toBe(true)
  })

  it('does not render dashboard content when no authenticated session can be recovered', async () => {
    const wrapper = await mountPage()
    await flushPromises()

    expect(mockEnsureAuthenticated).toHaveBeenCalledTimes(1)
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="dashboard-signed-in"]').exists()).toBe(false)
  })
})
