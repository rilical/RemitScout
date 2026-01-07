<template>
  <ClientOnly>
    <div v-if="shouldShow && ad" :class="wrapperClass" :style="wrapperStyle">
      <SponsoredAd
        :ad="ad"
        :layout="resolvedLayout"
        :container-class="resolvedContainerClass"
        :label="resolvedLabel"
        :show-remove-link="resolvedShowRemoveLink"
        @click="handleClick"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SponsoredAd from '~/components/shared/SponsoredAd.vue'
import { pickAdForPlacement, getPlacementConfig } from '~/lib/ads'
import type { AdPlacement, AdLayout, AdCreative } from '~/lib/ads'
import { useEntitlements } from '~/composables/useEntitlements'
import { useSession } from '~/composables/useSession'
import { useTelemetry } from '~/composables/useTelemetry'

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
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  allowHouseAds: true,
  wrapperClass: '',
  minHeight: undefined,
  minWidth: undefined,
})

const { isPlus, hydrated } = useEntitlements()
const { ensureSession } = useSession()
const { trackClick } = useTelemetry()

const placementConfig = computed(() => getPlacementConfig(props.placement))

const seed = computed(() => {
  if (import.meta.server) return ''
  const { session_id } = ensureSession()
  return `${session_id}:${props.placement}`
})

const ad = computed<AdCreative | null>(() => {
  if (import.meta.server) return null
  return pickAdForPlacement(props.placement, seed.value, {
    allowHouseAds: props.allowHouseAds,
  })
})

const resolvedLayout = computed<AdLayout>(() => {
  return props.layout ?? placementConfig.value.layout
})

const resolvedLabel = computed(() => {
  if (props.label !== undefined) return props.label
  if (ad.value?.label) return ad.value.label
  return placementConfig.value.label ?? 'Sponsored'
})

const resolvedShowRemoveLink = computed(() => {
  if (props.showRemoveLink !== undefined) return props.showRemoveLink
  if (placementConfig.value.showRemoveLink !== undefined) return placementConfig.value.showRemoveLink
  return ad.value?.kind !== 'house'
})

const resolvedContainerClass = computed(() => {
  return [placementConfig.value.containerClass, props.containerClass].filter(Boolean).join(' ')
})

const wrapperStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.minHeight) style.minHeight = props.minHeight
  if (props.minWidth) style.minWidth = props.minWidth
  return style
})

const shouldShow = computed(() => hydrated.value && !isPlus.value && Boolean(ad.value))

const handleClick = () => {
  if (!ad.value) return
  void trackClick({
    provider_id: ad.value.providerId ?? `ad:${props.placement}:${ad.value.id}`,
    corridor_id: props.corridorId,
    target_url: ad.value.url,
    is_affiliate: ad.value.isAffiliate ?? false,
  })
}
</script>
