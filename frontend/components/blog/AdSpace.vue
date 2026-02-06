<template>
  <div
    v-if="show"
    class="my-8 flex items-center justify-center"
    :class="containerClass"
  >
    <div
      class="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center"
      :class="adClass"
    >
      <div class="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        Advertisement
      </div>
      <div
        class="bg-white rounded border border-neutral-200"
        :style="{ width: width, height: height, minHeight: height }"
      >
        <slot>
          <div class="flex items-center justify-center h-full text-neutral-400 text-sm">
            Ad Space {{ width }} × {{ height }}
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  width?: string
  height?: string
  position?: 'sidebar' | 'inline' | 'banner'
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  width: '300px',
  height: '250px',
  position: 'inline',
})

const containerClass = computed(() => {
  return ''
})

const adClass = computed(() => {
  if (props.position === 'banner') {
    return 'w-full max-w-7xl'
  }
  return ''
})
</script>
