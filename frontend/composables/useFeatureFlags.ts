import { computed, watch } from 'vue'

export type RuntimeFlagKey =
  | 'pulse.public'
  | 'pulse.screener'
  | 'enterprise.public'
  | 'ads.public'

export type RuntimeFlagSource =
  | 'hard_env_disabled'
  | 'entitlement_override'
  | 'db_flag'
  | 'bootstrap_default'

export type EffectiveRuntimeFlag = {
  key: RuntimeFlagKey
  label: string
  description: string
  enabled: boolean
  source: RuntimeFlagSource
  reason: string
  hard_gate_enabled: boolean
  bootstrap_enabled: boolean
  plan_code: string
  pulse_access: 'none' | 'lite' | 'full'
  matched_audience_rules: boolean
  db_flag: {
    key: string
    enabled: boolean
    audience_rules: Record<string, unknown>
    metadata: Record<string, unknown>
    updated_by: string | null
    updated_at: string
    created_at: string
  } | null
}

type PublicEffectiveRuntimeFlag = Pick<EffectiveRuntimeFlag, 'key' | 'enabled'>

type EffectiveRuntimeFlagsResponse = {
  generated_at: string
  flags: PublicEffectiveRuntimeFlag[]
}

const runtimeFlagKeys: RuntimeFlagKey[] = [
  'pulse.public',
  'pulse.screener',
  'enterprise.public',
  'ads.public',
]

const buildFallbackFlags = (
  pulseLevel: 'none' | 'lite' | 'full',
  config: ReturnType<typeof useRuntimeConfig>,
): EffectiveRuntimeFlag[] => {
  const pulseBootstrap = Boolean(config.public.pulseEnabled)
  const pulseEnabled = pulseLevel !== 'none' ? true : pulseBootstrap
  const enterpriseBootstrap = Boolean(config.public.enterpriseEnabled)
  const adsBootstrap = Boolean(config.public.adsEnabled)
  const screenerBootstrap = Boolean(config.public.pulseScreenerEnabled)

  return [
    {
      key: 'pulse.public',
      label: 'Pulse public rollout',
      description: 'Controls whether Pulse is visible to non-entitled users.',
      enabled: pulseEnabled,
      source: pulseLevel !== 'none' ? 'entitlement_override' : 'bootstrap_default',
      reason: pulseLevel !== 'none'
        ? `Enabled by paid entitlement (${pulseLevel}).`
        : 'Using runtime bootstrap default.',
      hard_gate_enabled: pulseBootstrap,
      bootstrap_enabled: pulseBootstrap,
      plan_code: pulseLevel === 'full' ? 'enterprise' : pulseLevel === 'lite' ? 'plus' : 'free',
      pulse_access: pulseLevel,
      matched_audience_rules: true,
      db_flag: null,
    },
    {
      key: 'pulse.screener',
      label: 'Pulse screener',
      description: 'Controls the screener-first Pulse experience.',
      enabled: screenerBootstrap,
      source: 'bootstrap_default',
      reason: 'Using runtime bootstrap default.',
      hard_gate_enabled: screenerBootstrap,
      bootstrap_enabled: screenerBootstrap,
      plan_code: pulseLevel === 'full' ? 'enterprise' : pulseLevel === 'lite' ? 'plus' : 'free',
      pulse_access: pulseLevel,
      matched_audience_rules: true,
      db_flag: null,
    },
    {
      key: 'enterprise.public',
      label: 'Enterprise visibility',
      description: 'Controls public enterprise marketing and navigation visibility.',
      enabled: enterpriseBootstrap,
      source: 'bootstrap_default',
      reason: 'Using runtime bootstrap default.',
      hard_gate_enabled: enterpriseBootstrap,
      bootstrap_enabled: enterpriseBootstrap,
      plan_code: pulseLevel === 'full' ? 'enterprise' : pulseLevel === 'lite' ? 'plus' : 'free',
      pulse_access: pulseLevel,
      matched_audience_rules: true,
      db_flag: null,
    },
    {
      key: 'ads.public',
      label: 'Ads serving',
      description: 'Controls whether monetized ads may render for free users.',
      enabled: adsBootstrap,
      source: 'bootstrap_default',
      reason: 'Using runtime bootstrap default.',
      hard_gate_enabled: adsBootstrap,
      bootstrap_enabled: adsBootstrap,
      plan_code: pulseLevel === 'full' ? 'enterprise' : pulseLevel === 'lite' ? 'plus' : 'free',
      pulse_access: pulseLevel,
      matched_audience_rules: true,
      db_flag: null,
    },
  ]
}

export const useFeatureFlags = () => {
  const config = useRuntimeConfig()
  const { request } = useApi()
  const { isAuthenticated } = useAuth()
  const { pulseLevel } = useEntitlements()

  const snapshot = useState<EffectiveRuntimeFlagsResponse | null>('feature-flags:runtime-snapshot', () => null)
  const loading = useState<boolean>('feature-flags:runtime-loading', () => false)
  const hydrated = useState<boolean>('feature-flags:runtime-hydrated', () => false)
  const error = useState<string | null>('feature-flags:runtime-error', () => null)
  const loadedContext = useState<string>('feature-flags:runtime-context', () => '')
  const pendingContext = useState<string>('feature-flags:runtime-pending-context', () => '')
  const watcherAttached = useState<boolean>('feature-flags:runtime-watcher', () => false)

  const fallbackFlags = computed(() => buildFallbackFlags(pulseLevel.value, config))
  const authContextKey = computed(() =>
    `${isAuthenticated.value ? 'auth' : 'anon'}:${pulseLevel.value}`,
  )
  const runtimeFlags = computed(() => {
    const enabledByKey = new Map(
      loadedContext.value === authContextKey.value
        ? snapshot.value?.flags?.map(flag => [flag.key, flag.enabled]) ?? []
        : [],
    )

    return fallbackFlags.value.map((flag) => ({
      ...flag,
      enabled: enabledByKey.get(flag.key) ?? flag.enabled,
    }))
  })
  const runtimeFlagMap = computed<Record<RuntimeFlagKey, EffectiveRuntimeFlag>>(() => {
    const map = {} as Record<RuntimeFlagKey, EffectiveRuntimeFlag>
    for (const flag of runtimeFlags.value) {
      map[flag.key] = flag
    }
    return map
  })

  const loadRuntimeFlags = async (force = false) => {
    const currentContextKey = authContextKey.value

    if (loading.value) {
      pendingContext.value = currentContextKey
      return
    }
    if (
      !force
      && hydrated.value
      && snapshot.value?.flags?.length
      && loadedContext.value === currentContextKey
    ) return

    loading.value = true
    error.value = null
    pendingContext.value = ''
    try {
      snapshot.value = await request<EffectiveRuntimeFlagsResponse>('/feature-flags/effective', {
        method: 'GET',
        retries: 0,
      })
      loadedContext.value = currentContextKey
      hydrated.value = true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load runtime flags.'
      loadedContext.value = currentContextKey
      hydrated.value = true
    }
    finally {
      loading.value = false

      const nextContextKey = pendingContext.value || authContextKey.value
      if (nextContextKey && nextContextKey !== loadedContext.value) {
        pendingContext.value = ''
        void loadRuntimeFlags(true)
      }
    }
  }

  if (!watcherAttached.value) {
    watcherAttached.value = true
    watch(authContextKey, (nextContextKey, previousContextKey) => {
      if (!previousContextKey || nextContextKey === previousContextKey) return
      pendingContext.value = nextContextKey
      void loadRuntimeFlags(true)
    })
  }

  if (import.meta.client && !hydrated.value && !loading.value) {
    void loadRuntimeFlags()
  }

  const pulseEnabled = computed(() => runtimeFlagMap.value['pulse.public']?.enabled ?? fallbackFlags.value[0].enabled)
  const pulseScreenerEnabled = computed(() => runtimeFlagMap.value['pulse.screener']?.enabled ?? fallbackFlags.value[1].enabled)
  const enterpriseEnabled = computed(() => runtimeFlagMap.value['enterprise.public']?.enabled ?? fallbackFlags.value[2].enabled)
  const adsEnabled = computed(() => runtimeFlagMap.value['ads.public']?.enabled ?? fallbackFlags.value[3].enabled)

  return {
    pulseEnabled,
    pulseScreenerEnabled,
    enterpriseEnabled,
    adsEnabled,
    runtimeFlags,
    runtimeFlagMap,
    runtimeFlagsHydrated: computed(() => hydrated.value && loadedContext.value === authContextKey.value),
    runtimeFlagsLoading: loading,
    runtimeFlagsError: error,
    refreshRuntimeFlags: () => loadRuntimeFlags(true),
  }
}
