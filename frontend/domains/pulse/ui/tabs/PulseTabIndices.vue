<template>
  <div class="space-y-6">
    <div :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'">
      <h2 class="text-h3 font-bold">Indices</h2>
      <p :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-600'" class="text-body-sm mt-1">
        Coverage confidence, provider eligibility, and suppression diagnostics for TEER/RCI/RVI
      </p>
    </div>
    <div :class="variant === 'terminal' ? 'card-surface' : 'rounded-xl border border-neutral-200 bg-white'" class="p-8 text-center">
      <p :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'" class="text-body-sm">
        This tab is being redesigned.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PulseDensity, PulseFilters } from '~/types/pulse'
import type { PulseCorridor } from '~/stores/pulse'

interface Props {
  density: PulseDensity
  corridor: PulseCorridor | null
  filters: PulseFilters
}

defineProps<Props>()

const { variant } = usePulseTheme()
</script>
