import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, onBeforeUnmount, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import DashboardSignedIn from '~/domains/dashboard/ui/DashboardSignedIn.vue'

describe('DashboardSignedIn alerts tab', () => {
  const route = reactive({
    query: { tab: 'alerts' },
    fullPath: '/dashboard?tab=alerts',
    path: '/dashboard',
  })

  const openAlertModal = vi.fn()
  const isPlusRef = ref(false)
  const isEnterpriseRef = ref(false)
  const limitsRef = ref({
    watchlistItems: 3,
    alerts: 1,
    historyDays: 30,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    route.query.tab = 'alerts'
    isPlusRef.value = false
    isEnterpriseRef.value = false
    limitsRef.value = {
      watchlistItems: 3,
      alerts: 1,
      historyDays: 30,
    }

    ;(globalThis as any).useRoute = () => route
    ;(globalThis as any).ref = ref
    ;(globalThis as any).computed = computed
    ;(globalThis as any).watch = watch
    ;(globalThis as any).onMounted = onMounted
    ;(globalThis as any).onBeforeUnmount = onBeforeUnmount
    ;(globalThis as any).onUnmounted = onUnmounted
    ;(globalThis as any).navigateTo = vi.fn()
    ;(globalThis as any).useHead = vi.fn()
    ;(globalThis as any).useLogger = () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })
    ;(globalThis as any).useAbortableWatch = vi.fn()
    ;(globalThis as any).useAsyncData = vi.fn().mockResolvedValue({
      data: ref([]),
      pending: ref(false),
      error: ref(null),
    })

    ;(globalThis as any).useAuth = () => ({
      user: ref({ name: 'Omar', email: 'omar@example.com', isAdmin: false }),
      isAuthenticated: ref(true),
      isAdmin: ref(false),
      updatePasswordWithCurrent: vi.fn().mockResolvedValue({ ok: true }),
      listMfaFactors: vi.fn().mockResolvedValue([]),
    })
    ;(globalThis as any).useProviderVisits = () => ({
      pendingVisits: ref([]),
    })
    ;(globalThis as any).useSessions = () => ({
      sessions: ref([]),
      loading: ref(false),
      error: ref(null),
      fetchSessions: vi.fn().mockResolvedValue(undefined),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      revokeAllSessions: vi.fn().mockResolvedValue(undefined),
    })
    ;(globalThis as any).useMe = () => ({
      updateProfile: vi.fn().mockResolvedValue({ ok: true }),
    })
    ;(globalThis as any).useEntitlements = () => ({
      isPlus: isPlusRef,
      isEnterprise: isEnterpriseRef,
      apiAccess: ref(false),
      apiTier: ref(2),
      limits: limitsRef,
      billing: ref({ status: 'inactive', next_billing_date: null }),
      refreshPlan: vi.fn().mockResolvedValue(undefined),
      pulseLevel: ref('none'),
    })
    ;(globalThis as any).useBilling = () => ({
      checkoutLoading: ref(false),
      portalLoading: ref(false),
      openCheckout: vi.fn().mockResolvedValue({ ok: true }),
      openBillingPortal: vi.fn().mockResolvedValue({ ok: true }),
    })
    ;(globalThis as any).useExports = () => ({
      createExport: vi.fn().mockResolvedValue({ success: true, job: { id: 'job_1' } }),
      getExportStatus: vi.fn().mockResolvedValue({ job: { status: 'done' } }),
      getExportDownloadUrl: vi.fn().mockResolvedValue({ url: '/download' }),
    })
    ;(globalThis as any).useDataExport = () => ({
      requestExport: vi.fn().mockResolvedValue({ job: { id: 'job_2' } }),
      getExportStatus: vi.fn().mockResolvedValue({ job: { status: 'done' } }),
      getExportDownloadUrl: vi.fn().mockResolvedValue({ url: '/download' }),
    })
    ;(globalThis as any).useAccount = () => ({
      deleting: ref(false),
      deleteAccount: vi.fn().mockResolvedValue({ success: true }),
    })
    ;(globalThis as any).useSaveAlertModal = () => ({
      open: openAlertModal,
    })
    ;(globalThis as any).useToast = () => ({
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    })
    ;(globalThis as any).useApi = () => ({
      request: vi.fn().mockResolvedValue({}),
    })
    ;(globalThis as any).useRecentSearches = () => ({
      data: ref({ data: [] }),
      pending: ref(false),
    })

    const watchlistItems = ref<any[]>([])
    ;(globalThis as any).useWatchlist = () => ({
      items: watchlistItems,
      hydrated: ref(true),
      count: computed(() => watchlistItems.value.length),
      remove: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue({ status: 'saved' }),
    })

    const alerts = ref<any[]>([])
    ;(globalThis as any).useAlerts = () => ({
      alerts,
      hydrated: ref(true),
      count: computed(() => alerts.value.length),
      toggleEnabled: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockReturnValue(null),
      update: vi.fn().mockResolvedValue(undefined),
    })

    ;(globalThis as any).useCompareHistory = () => ({
      runs: ref([]),
      hydrated: ref(true),
      count: ref(0),
      remove: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
    })
    ;(globalThis as any).useRuntimeConfig = () => ({
      public: { apiBase: '/api/v1', siteUrl: 'https://www.remit-scout.com' },
    })
    ;(globalThis as any).useNotificationSettings = () => ({
      settings: ref({}),
      loading: ref(false),
      error: ref(null),
      fetchSettings: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue(undefined),
    })
    ;(globalThis as any).usePushNotifications = () => ({
      supported: ref(false),
      permission: ref('default'),
      loading: ref(false),
      error: ref(null),
      subscribeWebPush: vi.fn().mockResolvedValue(undefined),
      unsubscribeWebPush: vi.fn().mockResolvedValue(undefined),
    })
    ;(globalThis as any).usePrivacySettings = () => ({
      settings: ref({}),
      loading: ref(false),
      error: ref(null),
      fetchSettings: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => {
    delete (globalThis as any).useRoute
    delete (globalThis as any).ref
    delete (globalThis as any).computed
    delete (globalThis as any).watch
    delete (globalThis as any).onMounted
    delete (globalThis as any).onBeforeUnmount
    delete (globalThis as any).onUnmounted
    delete (globalThis as any).navigateTo
    delete (globalThis as any).useHead
    delete (globalThis as any).useLogger
    delete (globalThis as any).useAbortableWatch
    delete (globalThis as any).useAsyncData
    delete (globalThis as any).useAuth
    delete (globalThis as any).useProviderVisits
    delete (globalThis as any).useSessions
    delete (globalThis as any).useMe
    delete (globalThis as any).useEntitlements
    delete (globalThis as any).useBilling
    delete (globalThis as any).useExports
    delete (globalThis as any).useDataExport
    delete (globalThis as any).useAccount
    delete (globalThis as any).useSaveAlertModal
    delete (globalThis as any).useToast
    delete (globalThis as any).useApi
    delete (globalThis as any).useRecentSearches
    delete (globalThis as any).useWatchlist
    delete (globalThis as any).useAlerts
    delete (globalThis as any).useCompareHistory
    delete (globalThis as any).useRuntimeConfig
    delete (globalThis as any).useNotificationSettings
    delete (globalThis as any).usePushNotifications
    delete (globalThis as any).usePrivacySettings
  })

  const mountDashboard = async () => {
    const TestHost = defineComponent({
      components: { DashboardSignedIn },
      template: '<Suspense><DashboardSignedIn /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          NuxtLink: defineComponent({
            props: { to: { type: [String, Object], required: false } },
            template: '<a><slot /></a>',
          }),
          AdPlacement: true,
          UniversalDropdown: true,
          ProviderLogo: true,
          ProviderVisitPrompt: true,
          LimitReachedModal: true,
          CenteredPage: defineComponent({
            props: {
              as: { type: String, required: false, default: 'div' },
            },
            template: '<div><slot /></div>',
          }),
          DataTable: true,
          EmptyState: defineComponent({
            template: '<div><slot /><slot name="actions" /></div>',
          }),
          Icon: true,
          LoadingState: true,
        },
      },
    })

    await flushPromises()
    return wrapper
  }

  it('opens save-alert modal with default corridor from alerts empty state', async () => {
    const wrapper = await mountDashboard()

    const createAlertButton = wrapper.findAll('button').find(button => button.text().trim() === 'Create Alert')
    expect(createAlertButton).toBeTruthy()

    await createAlertButton!.trigger('click')

    expect(openAlertModal).toHaveBeenCalledTimes(1)
    expect(openAlertModal).toHaveBeenCalledWith({
      target: { type: 'corridor', from: 'US', to: 'PH', method: 'bank' },
      label: 'US → PH',
      source: 'dashboard',
    })
  })

  it('shows plus timeframe set up to 3M only', async () => {
    route.query.tab = 'overview'
    isPlusRef.value = true
    limitsRef.value = {
      watchlistItems: 16,
      alerts: 16,
      historyDays: 90,
    }

    const wrapper = await mountDashboard()
    const buttonLabels = wrapper.findAll('button').map(button => button.text().replace(/\s+/g, ' ').trim())

    expect(buttonLabels.some(label => label.startsWith('7D'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('1M'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('3M'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('6M'))).toBe(false)
    expect(buttonLabels.some(label => label.startsWith('1Y'))).toBe(false)
  })

  it('shows enterprise timeframe set including 6M and 1Y', async () => {
    route.query.tab = 'overview'
    isPlusRef.value = true
    isEnterpriseRef.value = true
    limitsRef.value = {
      watchlistItems: 16,
      alerts: 16,
      historyDays: 'unlimited' as any,
    }

    const wrapper = await mountDashboard()
    const buttonLabels = wrapper.findAll('button').map(button => button.text().replace(/\s+/g, ' ').trim())

    expect(buttonLabels.some(label => label.startsWith('7D'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('1M'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('3M'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('6M'))).toBe(true)
    expect(buttonLabels.some(label => label.startsWith('1Y'))).toBe(true)
  })
})
