type NotificationSettings = {
  rateAlerts: boolean
  weeklySummary: boolean
  marketUpdates: boolean
  productUpdates: boolean
  promotional: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  updatedAt: string | null
}

const defaults: NotificationSettings = {
  rateAlerts: true,
  weeklySummary: true,
  marketUpdates: false,
  productUpdates: true,
  promotional: false,
  pushEnabled: false,
  emailEnabled: true,
  smsEnabled: false,
  updatedAt: null,
}

export const useNotificationSettings = () => {
  const { request } = useApi()
  const { isLoggedIn } = useAuth()

  const settings = useState<NotificationSettings>('notifications:settings', () => ({ ...defaults }))
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = useState<boolean>('notifications:settings:loaded', () => false)

  const fetchSettings = async () => {
    if (!isLoggedIn.value) return
    loading.value = true
    error.value = null
    try {
      const response = await request<{ settings: NotificationSettings }>('/notifications/preferences', {
        method: 'GET',
      })
      settings.value = { ...defaults, ...response.settings }
      loaded.value = true
    } catch (err: any) {
      error.value = err?.message || 'Failed to load notification settings.'
    } finally {
      loading.value = false
    }
  }

  const saveSettings = async (next?: Partial<NotificationSettings>) => {
    if (!isLoggedIn.value) return
    loading.value = true
    error.value = null
    const payload = {
      rateAlerts: next?.rateAlerts ?? settings.value.rateAlerts,
      weeklySummary: next?.weeklySummary ?? settings.value.weeklySummary,
      marketUpdates: next?.marketUpdates ?? settings.value.marketUpdates,
      productUpdates: next?.productUpdates ?? settings.value.productUpdates,
      promotional: next?.promotional ?? settings.value.promotional,
      pushEnabled: next?.pushEnabled ?? settings.value.pushEnabled,
    }

    try {
      const response = await request<{ settings: NotificationSettings }>('/notifications/preferences', {
        method: 'PUT',
        body: payload,
      })
      settings.value = { ...defaults, ...response.settings }
      loaded.value = true
    } catch (err: any) {
      error.value = err?.message || 'Failed to save notification settings.'
    } finally {
      loading.value = false
    }
  }

  watch(
    () => isLoggedIn.value,
    (value) => {
      if (value && !loaded.value) {
        void fetchSettings()
      }
    },
    { immediate: true },
  )

  return {
    settings,
    loading,
    error,
    loaded,
    fetchSettings,
    saveSettings,
  }
}
