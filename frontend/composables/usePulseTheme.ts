import { computed } from 'vue'

export function usePulseTheme() {
  const { isEnterprise } = useEntitlements()

  const variant = computed<'terminal' | 'consumer'>(() => 'consumer')

  const echartsTheme = computed(() => 'remitScoutConsumer')

  const gridCols = computed(() =>
    isEnterprise.value
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2',
  )

  const cardSize = computed<'sm' | 'md' | 'lg'>(() =>
    isEnterprise.value ? 'sm' : 'md',
  )

  const tableDense = computed(() => isEnterprise.value)

  const pageBg = computed(() =>
    'bg-[#F6FAFF]',
  )

  const cardSurface = computed(() =>
    'rounded-3xl border border-[#D8E5F8] bg-white shadow-[0_12px_32px_rgba(37,99,235,0.06)]',
  )

  return { variant, echartsTheme, gridCols, cardSize, tableDense, pageBg, cardSurface }
}
