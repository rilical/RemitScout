import { computed, type Ref } from 'vue'
import type { PulseTimeframe } from '~/stores/pulse'

export function getAvailableTimeframes(daysAvailable: number): PulseTimeframe[] {
  if (daysAvailable < 7) return ['24H']
  if (daysAvailable < 30) return ['24H', '7D']
  if (daysAvailable < 90) return ['24H', '7D', '30D']
  if (daysAvailable < 365) return ['24H', '7D', '30D']
  return ['24H', '7D', '30D', '1Y', 'MAX']
}

export function isTimeframeAvailable(daysAvailable: number, tf: PulseTimeframe): boolean {
  return getAvailableTimeframes(daysAvailable).includes(tf)
}

export const usePulseTimeframes = (daysAvailable: Ref<number>) => {
  const availableTimeframes = computed<PulseTimeframe[]>(() =>
    getAvailableTimeframes(daysAvailable.value),
  )

  const isTimeframeSufficient = (tf: PulseTimeframe) =>
    availableTimeframes.value.includes(tf)

  return { availableTimeframes, isTimeframeSufficient }
}
