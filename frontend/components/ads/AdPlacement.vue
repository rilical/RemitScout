<template>
  <ClientOnly>
    <div v-if="shouldRender">
      <AdSlot
        v-if="allowEzoic"
        :placement="placement"
        :layout="resolvedLayout"
        :corridor-id="corridorId"
        :allow-house-ads="allowHouseAds"
        :slot-index="slotIndex"
        :placeholder-id="placeholderId"
        :min-height="minHeight"
        :min-width="minWidth"
        :label="resolvedLabel"
        :show-remove-link="resolvedShowRemoveLink"
        :container-class="placementConfig.containerClass || containerClass"
        :wrapper-class="wrapperClass"
      />

      <div
        v-else
        :style="wrapperStyle"
      >
        <SponsoredAd
          v-if="creative"
          :ad="creative"
          :layout="creativeLayout"
          :label="resolvedLabel"
          :show-remove-link="resolvedShowRemoveLink"
          :container-class="sponsoredContainerClass"
          @click="handleCreativeClick"
        />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdSlot from '~/components/ads/AdSlot.vue'
import SponsoredAd, { type SponsoredAdData } from '~/components/shared/SponsoredAd.vue'
import { useAds } from '~/composables/useAds'
import { useEntitlements } from '~/composables/useEntitlements'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import type { AdLayout, AdPlacement } from '~/lib/ads'
import { getPlacementConfig, pickAdForPlacement } from '~/lib/ads'

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
  layout: undefined,
  containerClass: '',
  label: undefined,
  showRemoveLink: undefined,
  corridorId: undefined,
  allowHouseAds: true,
  wrapperClass: '',
  minHeight: undefined,
  minWidth: undefined,
  slotIndex: undefined,
  placeholderId: undefined,
})

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const { isPlus, hydrated } = useEntitlements()
const { marketingConsent } = usePrivacySettings()
const { fetchAdForPlacement, trackAdClick } = useAds()

const allowEzoic = computed(() => runtimeConfig.public?.adsEnabled === true && marketingConsent.value)

const placementConfig = computed(() => getPlacementConfig(props.placement))
const resolvedLayout = computed<AdLayout>(() => props.layout || placementConfig.value.layout)
const resolvedLabel = computed(() => props.label ?? placementConfig.value.label ?? 'Sponsored')
const resolvedShowRemoveLink = computed(() => props.showRemoveLink ?? placementConfig.value.showRemoveLink ?? true)
const sponsoredContainerClass = computed(() => {
  return [
    placementConfig.value.containerClass || '',
    props.containerClass,
    props.wrapperClass,
  ].filter(Boolean).join(' ')
})

const wrapperStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.minHeight) style.minHeight = props.minHeight
  if (props.minWidth) style.minWidth = props.minWidth
  return style
})

const shouldRender = computed(() => hydrated.value && !isPlus.value)

const creative = ref<(SponsoredAdData & { kind?: string, isAffiliate?: boolean, placement?: string, layout?: AdLayout | string }) | null>(null)
const creativeLayout = computed<AdLayout>(() => {
  const override = creative.value?.layout
  if (override === 'horizontal' || override === 'vertical' || override === 'compact') {
    return override
  }
  return resolvedLayout.value
})

const loadCreative = async () => {
  if (!import.meta.client) return
  if (!shouldRender.value) return
  if (allowEzoic.value) return

  const seed = `${route.fullPath}:${props.corridorId || ''}`
  try {
    const response = await fetchAdForPlacement(props.placement, {
      corridorId: props.corridorId,
      pagePath: route.fullPath,
    })

    if (response?.ad) {
      // Backend inventory does not include `placements` (local type does), so normalize loosely.
      creative.value = response.ad as unknown as SponsoredAdData & {
        kind?: string
        isAffiliate?: boolean
        placement?: string
        layout?: string
      }
      return
    }
  }
  catch {
    // Ignore and fall back to local creatives below.
  }

  const fallback = pickAdForPlacement(props.placement, seed, { allowHouseAds: props.allowHouseAds })
  if (!fallback) {
    creative.value = null
    return
  }

  creative.value = fallback as unknown as SponsoredAdData & {
    kind?: string
    isAffiliate?: boolean
    placement?: string
    layout?: string
  }
}

const uuidV4
  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const handleCreativeClick = async (adId: string) => {
  if (!import.meta.client) return

  const current = creative.value
  if (!current) return

  // Only inventory ads have UUIDs; house creatives are local-only and don't hit the backend click table.
  if (!uuidV4.test(adId)) return

  try {
    await trackAdClick({
      adId,
      placement: props.placement,
      corridorId: props.corridorId,
      pagePath: route.fullPath,
      targetUrl: current.url,
      isAffiliate: Boolean((current as any).isAffiliate),
    })
  }
  catch {
    // ignore click tracking errors
  }
}

onMounted(() => {
  void loadCreative()
})

watch(
  () => [props.placement, props.corridorId, props.allowHouseAds, shouldRender.value, allowEzoic.value, route.fullPath] as const,
  () => {
    void loadCreative()
  },
)
</script>
