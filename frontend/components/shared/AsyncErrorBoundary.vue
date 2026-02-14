<script setup lang="ts">
import { computed, onErrorCaptured, ref } from 'vue'
import { ErrorState } from '~/ui/states'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    skeletonHeight?: string
  }>(),
  {
    title: 'Failed to load',
    message: 'This section failed to load. Try reloading the page.',
    skeletonHeight: '40',
  },
)

const error = ref<unknown>(null)

onErrorCaptured((err) => {
  error.value = err
  return false
})

const details = computed(() => {
  const err = error.value as any
  return typeof err?.message === 'string' ? err.message : undefined
})

const reload = () => {
  if (!import.meta.client) return
  window.location.reload()
}
</script>

<template>
  <ErrorState
    v-if="error"
    mode="card"
    :title="props.title"
    :message="props.message"
    :details="details"
    :on-retry="reload"
    retry-label="Reload"
  />

  <Suspense v-else>
    <template #default>
      <slot />
    </template>
    <template #fallback>
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading content"
      >
        <SkeletonBlock
          width="full"
          :height="props.skeletonHeight"
        />
      </div>
    </template>
  </Suspense>
</template>
