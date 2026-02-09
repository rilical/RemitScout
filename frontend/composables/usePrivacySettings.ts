type PrivacySettings = {
  analytics: boolean
  marketing: boolean
  personalization: boolean
  updated_at: string | null
}

type PrivacySettingsWire = {
  analytics?: boolean
  marketing?: boolean
  personalization?: boolean
  updated_at?: string | null
}

const storageKey = 'rs:privacy:settings'

const normalizeSettings = (input: PrivacySettingsWire | null | undefined): PrivacySettings | null => {
  if (!input) return null

  const updated_at = input.updated_at ?? null
  if (!updated_at) {
    return {
      analytics: false,
      marketing: false,
      personalization: false,
      updated_at: null,
    }
  }

  return {
    analytics: input.analytics ?? false,
    marketing: input.marketing ?? false,
    personalization: input.personalization ?? false,
    updated_at,
  }
}

const readStored = (): PrivacySettings | null => {
  if (!import.meta.client) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PrivacySettingsWire
    return normalizeSettings(parsed)
  }
  catch {
    return null
  }
}

const persistStored = (settings: PrivacySettings) => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings))
  }
  catch {
    // ignore storage failures
  }
}

export const usePrivacySettings = () => {
  const { request } = useApi()
  const { isLoggedIn } = useAuth()

  const settings = useState<PrivacySettings>('privacy:settings', () => (
    readStored() ?? {
      analytics: false,
      marketing: false,
      personalization: false,
      updated_at: null,
    }
  ))
  const loaded = useState<boolean>('privacy:settings:loaded', () => Boolean(readStored()))
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasConsent = computed(() => Boolean(settings.value.updated_at))
  const functionalConsent = computed(() => hasConsent.value && settings.value.personalization)
  const analyticsConsent = computed(() => hasConsent.value && settings.value.analytics)
  const marketingConsent = computed(() => hasConsent.value && settings.value.marketing)

  const hydrateFromStorage = () => {
    const stored = readStored()
    if (!stored) return
    settings.value = stored
    loaded.value = true
  }

  const fetchSettings = async () => {
    if (!isLoggedIn.value) return
    loading.value = true
    error.value = null
    try {
      const response = await request<{ settings: PrivacySettingsWire }>('/account/privacy', {
        method: 'GET',
      })
      settings.value = normalizeSettings(response.settings) ?? settings.value
      persistStored(settings.value)
      loaded.value = true
    }
    catch (err: any) {
      error.value = err?.message || 'Failed to load privacy settings.'
    }
    finally {
      loading.value = false
    }
  }

  const saveSettings = async (next?: Partial<PrivacySettings>) => {
    loading.value = true
    error.value = null
    const payload = {
      analytics: next?.analytics ?? settings.value.analytics,
      marketing: next?.marketing ?? settings.value.marketing,
      personalization: next?.personalization ?? settings.value.personalization,
    }
    try {
      if (!isLoggedIn.value) {
        settings.value = {
          analytics: payload.analytics,
          marketing: payload.marketing,
          personalization: payload.personalization,
          updated_at: new Date().toISOString(),
        }
        persistStored(settings.value)
        loaded.value = true
        return
      }
      const response = await request<{ settings: PrivacySettingsWire }>('/account/privacy', {
        method: 'PUT',
        body: payload,
      })
      settings.value = normalizeSettings(response.settings) ?? {
        analytics: payload.analytics,
        marketing: payload.marketing,
        personalization: payload.personalization,
        updated_at: null,
      }
      persistStored(settings.value)
      loaded.value = true
    }
    catch (err: any) {
      error.value = err?.message || 'Failed to save privacy settings.'
    }
    finally {
      loading.value = false
    }
  }

  watch(
    () => isLoggedIn.value,
    (value) => {
      if (value && !loaded.value) {
        void fetchSettings()
        return
      }
      if (!value && !loaded.value) {
        hydrateFromStorage()
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    if (!loaded.value) {
      hydrateFromStorage()
    }
  })

  return {
    settings,
    loaded,
    loading,
    error,
    fetchSettings,
    saveSettings,
    hasConsent,
    functionalConsent,
    analyticsConsent,
    marketingConsent,
  }
}
