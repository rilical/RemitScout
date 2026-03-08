// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed as vueComputed, nextTick, ref, watch as vueWatch } from 'vue'

type PulseLevel = 'none' | 'lite' | 'full'

const buildRuntimeFlag = (
  key: 'pulse.public' | 'pulse.screener' | 'enterprise.public' | 'ads.public',
  enabled = false,
) => ({
  key,
  enabled,
})

describe('useFeatureFlags', () => {
  const stateStore = new Map<string, { value: unknown }>()
  const mockRequest = vi.fn()
  const isAuthenticated = ref(false)
  const pulseLevel = ref<PulseLevel>('none')

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    stateStore.clear()
    isAuthenticated.value = false
    pulseLevel.value = 'none'

    vi.stubGlobal('computed', vueComputed)
    vi.stubGlobal('watch', vueWatch)
    vi.stubGlobal('useState', (key: string, init: (() => unknown) | unknown) => {
      if (!stateStore.has(key)) {
        const value = typeof init === 'function'
          ? (init as () => unknown)()
          : init
        stateStore.set(key, ref(value))
      }
      return stateStore.get(key)
    })
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        pulseEnabled: false,
        pulseScreenerEnabled: false,
        enterpriseEnabled: false,
        adsEnabled: false,
      },
    }))
    vi.stubGlobal('useApi', () => ({
      request: mockRequest,
    }))
    vi.stubGlobal('useAuth', () => ({
      isAuthenticated,
    }))
    vi.stubGlobal('useEntitlements', () => ({
      pulseLevel,
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refreshes runtime flags when auth context changes after hydration', async () => {
    mockRequest
      .mockResolvedValueOnce({
        generated_at: '2026-03-07T12:00:00.000Z',
        flags: [
          buildRuntimeFlag('pulse.public', false),
          buildRuntimeFlag('pulse.screener', false),
          buildRuntimeFlag('enterprise.public', false),
          buildRuntimeFlag('ads.public', false),
        ],
      })
      .mockResolvedValueOnce({
        generated_at: '2026-03-07T12:05:00.000Z',
        flags: [
          buildRuntimeFlag('pulse.public', true),
          buildRuntimeFlag('pulse.screener', true),
          buildRuntimeFlag('enterprise.public', false),
          buildRuntimeFlag('ads.public', false),
        ],
      })

    const { useFeatureFlags } = await import('~/composables/useFeatureFlags')
    const featureFlags = useFeatureFlags()

    await featureFlags.refreshRuntimeFlags()
    await nextTick()

    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(featureFlags.pulseEnabled.value).toBe(false)

    isAuthenticated.value = true
    pulseLevel.value = 'lite'

    await nextTick()
    await nextTick()

    expect(mockRequest).toHaveBeenCalledTimes(2)
    expect(featureFlags.pulseEnabled.value).toBe(true)
    expect(featureFlags.pulseScreenerEnabled.value).toBe(true)
  })
})
