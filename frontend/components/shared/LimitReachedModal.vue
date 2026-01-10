<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        
        <!-- Modal -->
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <!-- Close button -->
          <button
            type="button"
            class="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Icon -->
          <div class="mx-auto w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <!-- Content -->
          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-slate-900 mb-2">
              {{ title }}
            </h3>
            <p class="text-slate-600">
              {{ message }}
            </p>
          </div>

          <!-- Current usage -->
          <div class="bg-slate-50 rounded-xl p-4 mb-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-slate-700">{{ featureLabel }}</span>
              <span class="text-sm font-bold text-slate-900">{{ currentCount }}/{{ limit }}</span>
            </div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-brand-600 rounded-full transition-all"
                :style="{ width: `${Math.min(100, (currentCount / limit) * 100)}%` }"
              ></div>
            </div>
            <p v-if="showUpgrade" class="mt-3 text-xs text-slate-500">
              Upgrade to Remit-Scout Plus for unlimited {{ featureLabel.toLowerCase() }}.
            </p>
          </div>

          <div v-if="hasItems" class="mb-6 text-left">
            <div class="text-sm font-semibold text-slate-800 mb-2">
              {{ itemsTitle }}
            </div>
            <div class="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
              >
                <div class="min-w-0">
                  <div class="text-sm font-medium text-slate-800 truncate">
                    {{ item.label }}
                  </div>
                  <div v-if="item.meta" class="text-xs text-slate-500 truncate">
                    {{ item.meta }}
                  </div>
                </div>
                <button
                  type="button"
                  class="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  @click="handleRemove(item.id)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <button
              v-if="showUpgrade"
              type="button"
              class="w-full h-12 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700 transition-colors flex items-center justify-center"
              @click="handleUpgrade"
            >
              Upgrade to Plus
            </button>
            <button
              type="button"
              class="w-full h-12 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              @click="handleManage"
            >
              {{ manageLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  feature?: 'watchlist' | 'alert'
  limit?: number
  currentCount?: number
  showUpgrade?: boolean
  manageLabel?: string
  managePath?: string
  items?: Array<{ id: string; label: string; meta?: string }>
  itemsTitle?: string
}>(), {
  title: 'Limit reached',
  message: 'You\'ve reached the maximum number of items for your plan.',
  feature: 'watchlist',
  limit: 3,
  currentCount: 3,
  showUpgrade: true,
  items: () => [],
})

const emit = defineEmits<{
  close: []
  remove: [id: string]
}>()

const featureLabel = computed(() => {
  return props.feature === 'watchlist' ? 'Watchlist items' : 'Rate alerts'
})

const manageLabel = computed(() => {
  if (props.manageLabel) return props.manageLabel
  return props.feature === 'watchlist' ? 'Manage watchlist' : 'Manage alerts'
})

const managePath = computed(() => {
  if (props.managePath) return props.managePath
  return props.feature === 'watchlist'
    ? '/dashboard?tab=watchlist'
    : '/dashboard?tab=alerts'
})

const items = computed(() => props.items ?? [])
const hasItems = computed(() => items.value.length > 0)
const itemsTitle = computed(() => {
  if (props.itemsTitle) return props.itemsTitle
  return props.feature === 'watchlist' ? 'Remove a saved corridor' : 'Remove an alert'
})

function close() {
  emit('close')
}

function handleRemove(id: string) {
  emit('remove', id)
}

async function handleUpgrade() {
  await navigateTo('/plus')
}

async function handleManage() {
  await navigateTo(managePath.value)
  close()
}
</script>
