<template>
  <ClientOnly>
    <div
      v-if="shouldRender"
      :class="containerClasses"
      :style="wrapperStyle"
    >
      <div
        v-if="showHeader"
        class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100"
      >
        <span class="text-xs text-slate-400 uppercase tracking-wide font-medium">{{ resolvedLabel }}</span>
        <NuxtLink
          v-if="showRemoveLink"
          to="/plus"
          class="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Remove ads
        </NuxtLink>
      </div>
      <div class="p-4">
        <div :id="placeholderDomId" />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AdPlacement, AdLayout } from '~/lib/ads'
import { useEntitlements } from '~/composables/useEntitlements'
import { claimEzoicPlaceholderId, getEzoicPlaceholderId, releaseEzoicPlaceholderId } from '~/lib/ezoic'

interface Props {
  placement: AdPlacement
  layout?: AdLayout
  containerClass?: string
  label?: string
  showRemoveLink?: boolean
  corridorId?: string
  allowHouseAds?: boolean
  wrapperClass?: string
  minHeight?: string
  minWidth?: string
  slotIndex?: number
  placeholderId?: number
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  allowHouseAds: true,
  wrapperClass: '',
  minHeight: undefined,
  minWidth: undefined,
  slotIndex: undefined,
  placeholderId: undefined,
})

const { isPlus, hydrated } = useEntitlements()
const runtimeConfig = useRuntimeConfig()
const activeId = ref<number | null>(null)
const placeholderId = computed(() => getEzoicPlaceholderId(props.placement, props.slotIndex, props.placeholderId))
const placeholderDomId = computed(() => (activeId.value ? `ezoic-pub-ad-placeholder-${activeId.value}` : ''))
const adsEnabled = computed(() => runtimeConfig.public?.adsEnabled === true)

const containerClasses = computed(() => {
  return [
    'bg-white rounded-xl border border-slate-200 overflow-hidden',
    props.containerClass,
    props.wrapperClass,
  ].filter(Boolean).join(' ')
})

const resolvedLabel = computed(() => props.label ?? 'Sponsored')
const showRemoveLink = computed(() => props.showRemoveLink === true)
const showHeader = computed(() => props.label !== undefined || showRemoveLink.value)

const wrapperStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.minHeight) style.minHeight = props.minHeight
  if (props.minWidth) style.minWidth = props.minWidth
  return style
})

const shouldRender = computed(() => adsEnabled.value && hydrated.value && !isPlus.value && activeId.value !== null)

const pushShowAds = (id: number) => {
  if (!import.meta.client) return
  if (!adsEnabled.value) return
  const win = window as typeof window & { ezstandalone?: any }
  win.ezstandalone = win.ezstandalone || {}
  win.ezstandalone.cmd = win.ezstandalone.cmd || []
  win.ezstandalone.cmd.push(() => {
    if (typeof win.ezstandalone.showAds === 'function') {
      win.ezstandalone.showAds(id)
    }
  })
}

const pushDestroy = (id: number) => {
  if (!import.meta.client) return
  if (!adsEnabled.value) return
  const win = window as typeof window & { ezstandalone?: any }
  if (!win.ezstandalone?.cmd) return
  win.ezstandalone.cmd.push(() => {
    if (typeof win.ezstandalone.destroyPlaceholders === 'function') {
      win.ezstandalone.destroyPlaceholders(id)
    }
  })
}

const activateAd = async () => {
  if (!import.meta.client || !adsEnabled.value || !hydrated.value || isPlus.value || activeId.value !== null) return
  const id = placeholderId.value
  if (!id) return
  if (!claimEzoicPlaceholderId(id)) return
  activeId.value = id
  await nextTick()
  pushShowAds(id)
}

const deactivateAd = () => {
  if (!import.meta.client || activeId.value === null) return
  const id = activeId.value
  activeId.value = null
  releaseEzoicPlaceholderId(id)
  pushDestroy(id)
}

onMounted(() => {
  void activateAd()
})

watch(
  () => [adsEnabled.value, hydrated.value, isPlus.value, placeholderId.value] as const,
  ([enabled, isHydrated, plus, id]) => {
    if (!import.meta.client) return
    if (!enabled || !isHydrated || plus || !id) {
      deactivateAd()
      return
    }
    if (activeId.value && activeId.value !== id) {
      deactivateAd()
    }
    if (activeId.value === null) {
      void activateAd()
    }
  },
)

onBeforeUnmount(() => {
  deactivateAd()
})
</script>
