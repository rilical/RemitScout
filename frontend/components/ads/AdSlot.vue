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
import { claimAdSlotId, getAdSlotId, releaseAdSlotId } from '~/lib/ad-slots'

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
const { adsEnabled } = useFeatureFlags()
const { marketingConsent } = usePrivacySettings()
const runtimeConfig = useRuntimeConfig()
type AdSlotMap = Partial<Record<AdPlacement, number[]>>
const activeId = ref<number | null>(null)
const runtimeAdPlacementIds = computed<AdSlotMap>(() => {
  const raw = runtimeConfig.public?.adPlacementIds as AdSlotMap | undefined
  return raw || {}
})
const placeholderId = computed(() =>
  getAdSlotId(
    props.placement,
    props.slotIndex,
    props.placeholderId,
    runtimeAdPlacementIds.value,
  ),
)
const placeholderDomId = computed(() => (activeId.value ? `ad-slot-${activeId.value}` : ''))
const allowAds = computed(() => adsEnabled.value && marketingConsent.value)

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

const shouldRender = computed(() => allowAds.value && hydrated.value && !isPlus.value && activeId.value !== null)

// Ad provider SDK integration point — no-op until a provider is configured.
// When integrating AdSense/etc., add SDK showAd/destroyAd calls here.

const activateAd = async () => {
  if (!import.meta.client || !allowAds.value || !hydrated.value || isPlus.value || activeId.value !== null) return
  const id = placeholderId.value
  if (!id) return
  if (!claimAdSlotId(id)) return
  activeId.value = id
  await nextTick()
}

const deactivateAd = () => {
  if (!import.meta.client || activeId.value === null) return
  const id = activeId.value
  activeId.value = null
  releaseAdSlotId(id)
}

onMounted(() => {
  void activateAd()
})

watch(
  () => [allowAds.value, hydrated.value, isPlus.value, placeholderId.value] as const,
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
