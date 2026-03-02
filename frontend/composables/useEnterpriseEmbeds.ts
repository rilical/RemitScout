import { ref, computed, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useRuntimeConfig } from '#imports'

type EmbedIndexKey = 'teer' | 'rci' | 'rvi_bps'

type IndicesEmbedSnapshotCreateResponse = {
  success: true
  snapshotId: string
  createdAt: string
  expiresAt: string
  corridorId: string
  amountBucket: number
  methodProfile: string
  returnedDays: number
}

export function useEnterpriseEmbeds() {
  const { request } = useApi()
  const runtimeConfig = useRuntimeConfig()

  const corridorId = ref('US-PH-USD-PHP')
  const amountBucket = ref(500)
  const methodProfile = ref<'standard_bank' | 'standard_card' | 'cash_pickup' | 'mobile_wallet' | 'airtime_topup' | 'card_delivery' | 'home_delivery'>('standard_bank')
  const days = ref(30)
  const theme = ref<'dark' | 'light'>('dark')
  const copyStatus = ref<string | null>(null)
  const snapshotId = ref<string | null>(null)
  const snapshotCreatedAt = ref<string | null>(null)
  const snapshotExpiresAt = ref<string | null>(null)
  const snapshotGenerating = ref(false)
  const snapshotError = ref<string | null>(null)

  const indices: { key: EmbedIndexKey, label: string }[] = [
    { key: 'teer', label: 'TEER' },
    { key: 'rci', label: 'RCI' },
    { key: 'rvi_bps', label: 'RVI (bps)' },
  ]

  const siteOrigin = computed(() => {
    if (runtimeConfig.public?.siteUrl) return runtimeConfig.public.siteUrl
    if (import.meta.client) return window.location.origin
    return ''
  })

  const buildEmbedUrl = (indexKey: EmbedIndexKey) => {
    const baseUrl = siteOrigin.value
    if (!baseUrl) return ''
    const sid = (snapshotId.value || '').trim()
    if (!sid) return ''
    const params = new URLSearchParams({
      snapshot_id: sid,
      theme: theme.value,
    })
    return `${baseUrl}/embed/indices/${indexKey}?${params.toString()}`
  }

  const embedUrls = computed(() => ({
    teer: buildEmbedUrl('teer'),
    rci: buildEmbedUrl('rci'),
    rvi_bps: buildEmbedUrl('rvi_bps'),
  }))

  const embedCodes = computed(() => {
    const buildCode = (indexKey: EmbedIndexKey, label: string) => {
      const url = buildEmbedUrl(indexKey)
      if (!url) return ''
      const retrieved = snapshotCreatedAt.value
        ? new Date(snapshotCreatedAt.value).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
      const citation = `Source: Remit-Scout (${label}) · Synthetic volume weighted · Retrieved ${retrieved}`
      return [
        '<figure class="remit-scout-embed">',
        `  <iframe src="${url}" width="100%" height="320" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
        `  <figcaption style="font-size:12px;color:#64748b;">${citation}</figcaption>`,
        '</figure>',
      ].join('\n')
    }
    return {
      teer: buildCode('teer', 'TEER'),
      rci: buildCode('rci', 'RCI'),
      rvi_bps: buildCode('rvi_bps', 'RVI (bps)'),
    }
  })

  const resetSnapshot = () => {
    snapshotId.value = null
    snapshotCreatedAt.value = null
    snapshotExpiresAt.value = null
    snapshotError.value = null
  }

  const createSnapshot = async () => {
    if (snapshotGenerating.value) return
    snapshotGenerating.value = true
    snapshotError.value = null
    copyStatus.value = null
    try {
      const response = await request<IndicesEmbedSnapshotCreateResponse>('/indices/embed-snapshots', {
        method: 'POST',
        body: {
          corridor_id: corridorId.value.trim().toUpperCase(),
          amount_bucket: amountBucket.value || 500,
          method_profile: methodProfile.value,
          days: days.value || 30,
        },
      })
      snapshotId.value = response.snapshotId
      snapshotCreatedAt.value = response.createdAt
      snapshotExpiresAt.value = response.expiresAt
    }
 catch (error) {
      const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
      snapshotError.value = raw || 'Unable to generate embed snapshot.'
    }
 finally {
      snapshotGenerating.value = false
    }
  }

  watch([corridorId, amountBucket, methodProfile, days], () => {
    if (snapshotId.value) {
      resetSnapshot()
    }
  })

  const copyEmbedCode = async (key: EmbedIndexKey) => {
    const code = embedCodes.value[key]
    if (!code || !import.meta.client) {
      copyStatus.value = 'Generate a static snapshot before copying embed code.'
      setTimeout(() => {
        copyStatus.value = null
      }, 2500)
      return
    }
    try {
      await navigator.clipboard.writeText(code)
      copyStatus.value = `${key.toUpperCase()} embed copied.`
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

  return {
    corridorId,
    amountBucket,
    methodProfile,
    days,
    theme,
    copyStatus,
    snapshotId,
    snapshotCreatedAt,
    snapshotExpiresAt,
    snapshotGenerating,
    snapshotError,
    indices,
    embedUrls,
    embedCodes,
    createSnapshot,
    copyEmbedCode,
  }
}
