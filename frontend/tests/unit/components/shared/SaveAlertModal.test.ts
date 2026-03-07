import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

vi.mock('~/composables/useCorridorCurrencies', async () => {
  const { ref } = await import('vue')
  return {
    useCorridorCurrencies: () => ({
      availableFromCurrencies: ref(['USD']),
      availableToCurrencies: ref(['PHP']),
    }),
  }
})

vi.mock('~/composables/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}))

describe('SaveAlertModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('useSaveAlertModal', () => ({
      isOpen: ref(true),
      context: ref({
        target: { type: 'corridor', from: 'US', to: 'PH', method: 'bank' },
        label: 'US -> PH',
        source: 'dashboard',
      }),
      close: vi.fn(),
    }))
    vi.stubGlobal('useAlerts', () => ({
      alerts: ref([]),
      count: ref(0),
      remove: vi.fn(),
      update: vi.fn(),
      createForTarget: vi.fn(),
      findById: vi.fn().mockReturnValue(null),
    }))
    vi.stubGlobal('useWatchlist', () => ({
      items: ref([]),
      count: ref(0),
      remove: vi.fn(),
      findById: vi.fn().mockReturnValue(null),
    }))
    vi.stubGlobal('useEntitlements', () => ({
      isPlus: ref(true),
      smartAlertsEnabled: ref(true),
      dailyAlertsEnabled: ref(true),
      indexThresholdAlertsEnabled: ref(false),
      recoveryAvailable: ref(false),
      recoveryAction: ref('none'),
    }))
    vi.stubGlobal('useApi', () => ({
      request: vi.fn().mockImplementation((path: string) => {
        if (path === '/alerts/corridor-eligibility') {
          return Promise.resolve({
            success: true,
            isMacroCorridor: true,
            regularAlerts: {
              quoteCoverage: { supported: true },
              triangulation: { available: false },
            },
            smartAlerts: {
              programEligible: true,
              status: 'available',
            },
          })
        }
        if (path === '/rates/spot') {
          return Promise.resolve({ rate: 56.12 })
        }
        return Promise.resolve({})
      }),
    }))
    vi.stubGlobal('useRoute', () => ({
      fullPath: '/dashboard?tab=alerts',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not render Enterprise-only threshold controls for Plus users', async () => {
    const SaveAlertModal = (await import('~/components/shared/SaveAlertModal.vue')).default
    const wrapper = mount(SaveAlertModal, {
      global: {
        stubs: {
          Teleport: true,
          Transition: false,
          NuxtLink: defineComponent({
            props: { to: { type: [String, Object], required: false } },
            template: '<a><slot /></a>',
          }),
          CountrySelect: true,
          SuccessToast: true,
          ErrorState: true,
          UniversalDropdown: defineComponent({
            props: {
              options: {
                type: Array,
                default: () => [],
              },
            },
            template: '<div data-testid="dropdown-options">{{ options.map((option) => option.label).join(" | ") }}</div>',
          }),
        },
      },
    })

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('FX rate')
    expect(wrapper.text()).not.toContain('RCI Threshold')
    expect(wrapper.text()).not.toContain('RVI Threshold')
  })
})
