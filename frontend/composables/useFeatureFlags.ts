import { computed } from 'vue'

// Single source of truth for feature flags.
// Use runtimeConfig so flags behave consistently in SSR + client.
export const useFeatureFlags = () => {
  const config = useRuntimeConfig()

  const pulseEnabled = computed(() => Boolean(config.public.pulseEnabled))
  const pulseScreenerEnabled = computed(() => Boolean(config.public.pulseScreenerEnabled))
  const enterpriseEnabled = computed(() => Boolean(config.public.enterpriseEnabled))

  return {
    pulseEnabled,
    pulseScreenerEnabled,
    enterpriseEnabled,
  }
}
