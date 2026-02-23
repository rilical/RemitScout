<template>
  <ClientOnly>
    <div
      v-if="shouldRender"
      :class="containerClasses"
      :style="wrapperStyle"
    >
      <div
        v-if="showHeader"
        class="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-100"
      >
        <span class="text-body-sm text-neutral-400 uppercase tracking-wide font-medium">{{ resolvedLabel }}</span>
        <NuxtLink
          v-if="showRemoveLink"
          to="/plus"
          class="text-body-sm text-brand-600 hover:text-brand-700 font-medium"
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
import { usePrivacySettings } from '~/composables/usePrivacySettings'
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
const { marketingConsent } = usePrivacySettings()
const runtimeConfig = useRuntimeConfig()
type EzoicPlacementMap = Partial<Record<AdPlacement, number[]>>
const activeId = ref<number | null>(null)
const runtimeEzoicPlacementIds = computed<EzoicPlacementMap>(() => {
  const raw = runtimeConfig.public?.ezoicPlacementIds as EzoicPlacementMap | undefined
  return raw || {}
})
const placeholderId = computed(() =>
  getEzoicPlaceholderId(
    props.placement,
    props.slotIndex,
    props.placeholderId,
    runtimeEzoicPlacementIds.value,
  ),
)
const placeholderDomId = computed(() => (activeId.value ? `ezoic-pub-ad-placeholder-${activeId.value}` : ''))
const adsEnabled = computed(() => runtimeConfig.public?.adsEnabled === true)
const allowEzoic = computed(() => adsEnabled.value && marketingConsent.value)

const containerClasses = computed(() => {
  return [
    'bg-surface rounded-xl border border-rs-border overflow-hidden',
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

const shouldRender = computed(() => allowEzoic.value && hydrated.value && !isPlus.value && activeId.value !== null)

const pushShowAds = (id: number) => {
  if (!import.meta.client) return
  if (!allowEzoic.value) return
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
  if (!allowEzoic.value) return
  const win = window as typeof window & { ezstandalone?: any }
  if (!win.ezstandalone?.cmd) return
  win.ezstandalone.cmd.push(() => {
    if (typeof win.ezstandalone.destroyPlaceholders === 'function') {
      win.ezstandalone.destroyPlaceholders(id)
    }
  })
}

const activateAd = async () => {
  if (!import.meta.client || !allowEzoic.value || !hydrated.value || isPlus.value || activeId.value !== null) return
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
  () => [allowEzoic.value, hydrated.value, isPlus.value, placeholderId.value] as const,
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
