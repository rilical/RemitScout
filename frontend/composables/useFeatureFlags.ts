import { computed } from 'vue'

// Single source of truth for feature flags.
// Use runtimeConfig so flags behave consistently in SSR + client.
export const useFeatureFlags = () => {
  const config = useRuntimeConfig()
  const { pulseLevel } = useEntitlements()

  // Paying subscribers (pulseLevel lite or full) always see Pulse,
  // even when the build-time flag is off. The flag controls promo
  // visibility for non-subscribers only.
  const pulseEnabled = computed(() => {
    if (pulseLevel.value !== 'none') return true
    return Boolean(config.public.pulseEnabled)
  })

  const pulseScreenerEnabled = computed(() => Boolean(config.public.pulseScreenerEnabled))
  const enterpriseEnabled = computed(() => Boolean(config.public.enterpriseEnabled))

  return {
    pulseEnabled,
    pulseScreenerEnabled,
    enterpriseEnabled,
  }
}
