import { computed } from 'vue'

export function usePulseTheme() {
  const { pulseLevel, isEnterprise } = useEntitlements()

  const variant = computed<'terminal' | 'consumer'>(() =>
    pulseLevel.value === 'full' ? 'terminal' : 'consumer'
  )

  const echartsTheme = computed(() =>
    pulseLevel.value === 'full' ? 'remitScout' : 'remitScoutConsumer'
  )

  const gridCols = computed(() =>
    isEnterprise.value
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2'
  )

  const cardSize = computed<'sm' | 'md' | 'lg'>(() =>
    isEnterprise.value ? 'sm' : 'md'
  )

  const tableDense = computed(() => isEnterprise.value)

  const pageBg = computed(() =>
    isEnterprise.value ? 'bg-neutral-900' : 'bg-neutral-50'
  )

  const cardSurface = computed(() =>
    isEnterprise.value
      ? 'bg-neutral-800/50 border border-neutral-700/50 rounded-xl'
      : 'bg-white border border-neutral-200 rounded-xl shadow-sm'
  )

  return { variant, echartsTheme, gridCols, cardSize, tableDense, pageBg, cardSurface }
}
