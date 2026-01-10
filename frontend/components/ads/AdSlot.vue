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
import { computed, onMounted, ref, watch } from 'vue'
import SponsoredAd from '~/components/shared/SponsoredAd.vue'
import { pickAdForPlacement, getPlacementConfig } from '~/lib/ads'
import type { AdPlacement, AdLayout, AdCreative } from '~/lib/ads'
import { useEntitlements } from '~/composables/useEntitlements'
import { useSession } from '~/composables/useSession'
import { useTelemetry } from '~/composables/useTelemetry'
import { useAds } from '~/composables/useAds'

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
const { fetchAdForPlacement, trackAdClick } = useAds()
const route = useRoute()

const placementConfig = computed(() => getPlacementConfig(props.placement))

const seed = computed(() => {
  if (import.meta.server) return ''
  const { session_id } = ensureSession()
  return `${session_id}:${props.placement}`
})

const ad = ref<AdCreative | null>(null)
const adLayoutOverride = ref<AdLayout | undefined>(undefined)
const loading = ref(false)
const hasLoaded = ref(false)

const ensureFallbackAd = () => {
  if (import.meta.server || isPlus.value) return
  if (ad.value || props.allowHouseAds === false) return
  ad.value = pickAdForPlacement(props.placement, seed.value, {
    allowHouseAds: props.allowHouseAds,
  })
}

const loadAd = async () => {
  if (loading.value || hasLoaded.value || import.meta.server) return
  loading.value = true
  try {
    const response = await fetchAdForPlacement(props.placement, {
      corridorId: props.corridorId,
      pagePath: route.fullPath,
    })
    if (response?.ad) {
      ad.value = {
        ...response.ad,
        placements: response.ad.placements ?? [props.placement],
      }
      if (response.ad.layout === 'horizontal' || response.ad.layout === 'vertical' || response.ad.layout === 'compact') {
        adLayoutOverride.value = response.ad.layout as AdLayout
      }
    } else {
      ad.value = pickAdForPlacement(props.placement, seed.value, {
        allowHouseAds: props.allowHouseAds,
      })
    }
  } catch {
    ad.value = pickAdForPlacement(props.placement, seed.value, {
      allowHouseAds: props.allowHouseAds,
    })
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

onMounted(() => {
  if (hydrated.value && !isPlus.value) {
    ensureFallbackAd()
    void loadAd()
  }
})

watch(
  () => [hydrated.value, isPlus.value] as const,
  ([isHydrated, plus]) => {
    if (isHydrated && !plus) {
      ensureFallbackAd()
      void loadAd()
      return
    }
    if (plus) {
      ad.value = null
    }
  },
)

const resolvedLayout = computed<AdLayout>(() => {
  return adLayoutOverride.value ?? props.layout ?? placementConfig.value.layout
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
  void trackAdClick({
    adId: ad.value.id,
    placement: props.placement,
    corridorId: props.corridorId,
    pagePath: route.fullPath,
    targetUrl: ad.value.url,
    isAffiliate: ad.value.isAffiliate ?? false,
  })
  void trackClick({
    provider_id: ad.value.providerId ?? `ad:${props.placement}:${ad.value.id}`,
    corridor_id: props.corridorId,
    target_url: ad.value.url,
    is_affiliate: ad.value.isAffiliate ?? false,
  })
}
</script>
