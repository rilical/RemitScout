import { ref, computed, watch } from 'vue'
import { createIndicesPublishedEmbed } from '~/lib/indicesApi'
import type { PublishedEmbedVariant } from '~/lib/pulseApi'
import { useApi } from '~/composables/useApi'
import { mapPlanStateFailureMessage } from '~/composables/usePlanStateError'

type EmbedIndexKey = 'teer' | 'rci' | 'rvi_bps'

type PublishedEmbedRecord = {
  id: string
  surfaceKind: 'pulse' | 'indices'
  title: string
  theme: 'dark' | 'light'
  createdAt: string
  publishedAt: string
  revokedAt: string | null
  publicUrl: string
  embedCode: string
  variants: PublishedEmbedVariant[]
}

const INDICES_VARIANTS: Array<{ key: EmbedIndexKey, label: string }> = [
  { key: 'teer', label: 'TEER' },
  { key: 'rci', label: 'RCI' },
  { key: 'rvi_bps', label: 'RVI (bps)' },
]

const resolvePublishedEmbedError = (error: unknown, fallback: string) => {
  const data
    = error && typeof error === 'object' && 'data' in error
      ? ((error as { data?: Record<string, unknown> }).data ?? null)
      : null

  if (data?.error === 'published_embed_limit_reached') {
    const max = typeof data.maxPublishedEmbeds === 'number' ? data.maxPublishedEmbeds : 100
    return `Published embed limit reached. Revoke an existing embed or contact support. Max: ${max}.`
  }

  if (data?.error === 'database_error' || data?.error === 'internal_error') {
    return 'Published embeds are temporarily unavailable. The embed store is failing on this environment.'
  }

  return mapPlanStateFailureMessage(error, fallback, {
    enterprise_required: 'Enterprise embed access is required to publish static index embeds.',
    plan_inactive: 'Your paid plan is inactive. Reactivate billing to publish static embeds.',
    forbidden: 'Enterprise embed access is required to publish static index embeds.',
  })
}

export function useEnterpriseEmbeds() {
  const { request } = useApi()

  const corridorId = ref('US-PH-USD-PHP')
  const amountBucket = ref(500)
  const methodProfile = ref<'standard_bank'>('standard_bank')
  const days = ref(30)
  const theme = ref<'dark' | 'light'>('dark')
  const copyStatus = ref<string | null>(null)
  const publishedId = ref<string | null>(null)
  const publishedCreatedAt = ref<string | null>(null)
  const publishedAt = ref<string | null>(null)
  const publishedGenerating = ref(false)
  const publishedError = ref<string | null>(null)
  const currentVariants = ref<PublishedEmbedVariant[]>([])
  const publishedEmbeds = ref<PublishedEmbedRecord[]>([])
  const publishedEmbedsLoading = ref(false)
  const publishedEmbedsError = ref<string | null>(null)

  const indices = INDICES_VARIANTS

  const currentVariantMap = computed<Record<EmbedIndexKey, PublishedEmbedVariant | null>>(() => ({
    teer: currentVariants.value.find(variant => variant.key === 'teer') ?? null,
    rci: currentVariants.value.find(variant => variant.key === 'rci') ?? null,
    rvi_bps: currentVariants.value.find(variant => variant.key === 'rvi_bps') ?? null,
  }))

  const embedUrls = computed(() => ({
    teer: currentVariantMap.value.teer?.publicUrl || '',
    rci: currentVariantMap.value.rci?.publicUrl || '',
    rvi_bps: currentVariantMap.value.rvi_bps?.publicUrl || '',
  }))

  const embedCodes = computed(() => ({
    teer: currentVariantMap.value.teer?.embedCode || '',
    rci: currentVariantMap.value.rci?.embedCode || '',
    rvi_bps: currentVariantMap.value.rvi_bps?.embedCode || '',
  }))

  const resetPublished = () => {
    publishedId.value = null
    publishedCreatedAt.value = null
    publishedAt.value = null
    currentVariants.value = []
    publishedError.value = null
  }

  const copyPublishedValue = async (
    value: string,
    successMessage: string,
    emptyMessage: string,
  ) => {
    if (!value || !import.meta.client) {
      copyStatus.value = emptyMessage
      setTimeout(() => {
        copyStatus.value = null
      }, 2500)
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      copyStatus.value = successMessage
    }
 catch {
      copyStatus.value = 'Copy failed.'
    }
 finally {
      setTimeout(() => {
        copyStatus.value = null
      }, 2000)
    }
  }

  const fetchPublishedEmbeds = async () => {
    if (publishedEmbedsLoading.value) return
    publishedEmbedsLoading.value = true
    publishedEmbedsError.value = null
    try {
      const response = await request<{ success: boolean, embeds: PublishedEmbedRecord[] }>(
        '/me/published-embeds',
      )
      publishedEmbeds.value = response.embeds ?? []
    }
 catch (error) {
      publishedEmbedsError.value = resolvePublishedEmbedError(
        error,
        'Unable to load published embeds.',
      )
      publishedEmbedsError.value = mapPlanStateFailureMessage(error, publishedEmbedsError.value, {
        plan_inactive: 'Published embeds are temporarily unavailable while billing is inactive.',
      })
    }
 finally {
      publishedEmbedsLoading.value = false
    }
  }

  const publishEmbed = async () => {
    if (publishedGenerating.value) return
    publishedGenerating.value = true
    publishedError.value = null
    copyStatus.value = null
    try {
      const response = await createIndicesPublishedEmbed({
        corridor_id: corridorId.value.trim().toUpperCase(),
        amount_bucket: amountBucket.value || 500,
        method_profile: methodProfile.value,
        days: days.value || 30,
        theme: theme.value,
      })
      publishedId.value = response.publishedId
      publishedCreatedAt.value = response.createdAt
      publishedAt.value = response.publishedAt
      currentVariants.value = response.variants ?? []
      await fetchPublishedEmbeds()
    }
 catch (error) {
      publishedError.value = resolvePublishedEmbedError(error, 'Unable to publish static embed.')
    }
 finally {
      publishedGenerating.value = false
    }
  }

  const revokePublishedEmbed = async (id: string) => {
    if (!id) return
    publishedEmbedsLoading.value = true
    publishedEmbedsError.value = null
    try {
      const response = await request<{ success: boolean, embed: PublishedEmbedRecord }>(
        `/me/published-embeds/${id}/revoke`,
        {
          method: 'POST',
        },
      )
      publishedEmbeds.value = publishedEmbeds.value.map(item =>
        item.id === id ? response.embed : item,
      )
      if (publishedId.value === id) {
        resetPublished()
      }
    }
 catch (error) {
      publishedEmbedsError.value = mapPlanStateFailureMessage(
        error,
        'Unable to revoke published embed.',
        {
          not_found: 'Published embed no longer exists.',
        },
      )
    }
 finally {
      publishedEmbedsLoading.value = false
    }
  }

  watch([corridorId, amountBucket, days, theme], () => {
    if (publishedId.value) {
      resetPublished()
    }
  })

  const copyEmbedCode = async (key: EmbedIndexKey) => {
    await copyPublishedValue(
      embedCodes.value[key],
      `${key.toUpperCase()} embed code copied.`,
      'Publish a static embed before copying embed code.',
    )
  }

  return {
    corridorId,
    amountBucket,
    methodProfile,
    days,
    theme,
    copyStatus,
    publishedId,
    publishedCreatedAt,
    publishedAt,
    publishedGenerating,
    publishedError,
    indices,
    embedUrls,
    embedCodes,
    publishEmbed,
    copyEmbedCode,
    copyPublishedValue,
    publishedEmbeds,
    publishedEmbedsLoading,
    publishedEmbedsError,
    fetchPublishedEmbeds,
    revokePublishedEmbed,
  }
}
