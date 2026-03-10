<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

type HeightVariant = 'sparkline' | 'compact' | 'standard' | 'tall' | 'full'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: HeightVariant
    loading?: boolean
    theme?: string
    group?: string
    readonly?: boolean
    autoresize?: boolean
    error?: boolean
    skeletonShape?: 'chart-line' | 'chart-bar'
  }>(),
  {
    height: 'standard',
    loading: false,
    theme: 'remitScout',
    group: undefined,
    readonly: false,
    autoresize: true,
    error: false,
    skeletonShape: 'chart-line',
  },
)

const emit = defineEmits<{
  'chart-ready': []
  'data-zoom': [params: unknown]
  'click': [params: unknown]
}>()

const HEIGHT_MAP: Record<HeightVariant, string> = {
  sparkline: 'h-16',
  compact: 'h-[200px]',
  standard: 'h-[320px]',
  tall: 'h-[480px]',
  full: 'h-full',
}

const heightClass = computed(() => HEIGHT_MAP[props.height])

const loadingOptions = {
  text: '',
  color: '#2563EB',
  maskColor: 'rgba(15, 23, 42, 0.6)',
}

function onChartReady() {
  emit('chart-ready')
}

function onDataZoom(params: unknown) {
  emit('data-zoom', params)
}

function onClick(params: unknown) {
  emit('click', params)
}
</script>

<template>
  <ClientOnly>
    <div
      v-if="error"
      class="flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-body-sm text-red-400"
      :class="heightClass"
      role="alert"
    >
      Failed to load chart data
    </div>

    <div
      v-else
      :class="heightClass"
    >
      <VChart
        class="h-full w-full"
        :option="option"
        :theme="theme"
        :loading="loading"
        :loading-options="loadingOptions"
        :autoresize="autoresize"
        :group="group"
        :update-options="{ notMerge: false, lazyUpdate: true }"
        v-bind="readonly ? { 'pointer-events': 'none' } : {}"
        @ready="onChartReady"
        @datazoom="onDataZoom"
        @click="onClick"
      />
    </div>

    <template #fallback>
      <div
        class="animate-pulse rounded-lg bg-neutral-800"
        :class="heightClass"
        role="status"
        aria-label="Loading chart"
      >
        <span class="sr-only">Loading chart</span>
      </div>
    </template>
  </ClientOnly>
</template>
