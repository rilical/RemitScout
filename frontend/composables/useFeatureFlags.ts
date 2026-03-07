import { computed } from 'vue'

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

type EffectiveRuntimeFlagsResponse = {
  generated_at: string
  flags: EffectiveRuntimeFlag[]
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
  const { pulseLevel } = useEntitlements()

  const snapshot = useState<EffectiveRuntimeFlagsResponse | null>('feature-flags:runtime-snapshot', () => null)
  const loading = useState<boolean>('feature-flags:runtime-loading', () => false)
  const hydrated = useState<boolean>('feature-flags:runtime-hydrated', () => false)
  const error = useState<string | null>('feature-flags:runtime-error', () => null)

  const fallbackFlags = computed(() => buildFallbackFlags(pulseLevel.value, config))
  const runtimeFlags = computed(() => {
    const flags = snapshot.value?.flags?.length ? snapshot.value.flags : fallbackFlags.value
    const complete: EffectiveRuntimeFlag[] = []
    const byKey = new Map(flags.map(flag => [flag.key, flag]))
    for (const key of runtimeFlagKeys) {
      const flag = byKey.get(key)
      if (flag) {
        complete.push(flag)
      }
    }
    return complete
  })
  const runtimeFlagMap = computed<Record<RuntimeFlagKey, EffectiveRuntimeFlag>>(() => {
    const map = {} as Record<RuntimeFlagKey, EffectiveRuntimeFlag>
    for (const flag of runtimeFlags.value) {
      map[flag.key] = flag
    }
    return map
  })

  const loadRuntimeFlags = async (force = false) => {
    if (loading.value) return
    if (!force && hydrated.value && snapshot.value?.flags?.length) return

    loading.value = true
    error.value = null
    try {
      snapshot.value = await request<EffectiveRuntimeFlagsResponse>('/feature-flags/effective', {
        method: 'GET',
        retries: 0,
      })
      hydrated.value = true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load runtime flags.'
      hydrated.value = true
    }
    finally {
      loading.value = false
    }
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
    runtimeFlagsHydrated: hydrated,
    runtimeFlagsLoading: loading,
    runtimeFlagsError: error,
    refreshRuntimeFlags: () => loadRuntimeFlags(true),
  }
}
