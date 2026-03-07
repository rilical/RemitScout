import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

const requestMock = vi.hoisted(() => vi.fn())
const isSavedMock = vi.hoisted(() => vi.fn())
const ensureMock = vi.hoisted(() => vi.fn())
const isPlusState = vi.hoisted(() => ({ value: false }))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: requestMock,
  }),
}))

vi.mock('~/composables/useWatchlist', () => ({
  useWatchlist: () => ({
    isSaved: isSavedMock,
    ensure: ensureMock,
  }),
}))

vi.mock('~/composables/useEntitlements', async () => {
  const { computed } = await import('vue')
  return {
    useEntitlements: () => ({
      isPlus: computed(() => isPlusState.value),
    }),
  }
})

describe('PulseMoversList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isPlusState.value = false
    isSavedMock.mockReturnValue(false)
    ensureMock.mockResolvedValue({ status: 'ok' })
    requestMock.mockResolvedValue({
      success: true,
      updatedAt: null,
      windowHours: 24,
      movers: [],
    })
    vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
      data: ref(await handler()),
      pending: ref(false),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountList = async (props = { variant: 'public' as const, limit: 6 }) => {
    const PulseMoversList = (await import('~/components/pulse/PulseMoversList.vue')).default
    const TestHost = defineComponent({
      components: { PulseMoversList },
      setup() {
        return { props }
      },
      template: '<Suspense><PulseMoversList v-bind="props" /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          SkeletonBlock: true,
        },
      },
    })

    await flushPromises()
    await flushPromises()
    return wrapper
  }

  it('shows a truthful empty state instead of sample movers when teaser data is unavailable', async () => {
    const wrapper = await mountList()

    expect(requestMock).toHaveBeenCalledWith('/pulse/teaser', { retries: 0 })
    expect(wrapper.text()).toContain('Live movers feed warming up')
    expect(wrapper.text()).toContain('No live movers are available yet. Check back after the next Gold export refresh.')
    expect(wrapper.text()).not.toContain('Sample data')
    expect(wrapper.text()).not.toContain('USD → PHP')
  })
})
