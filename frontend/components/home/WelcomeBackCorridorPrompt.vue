<template>
  <ClientOnly>
    <div
      v-if="shouldShow"
      class="fixed left-4 right-4 top-20 z-40 mx-auto max-w-xl"
    >
      <div class="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-900">
              Welcome back
            </p>
            <p class="mt-1 text-sm text-slate-600">
              Want to check out your corridor again?
            </p>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600"
            @click="dismiss"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div class="text-xl">
            <span>{{ fromFlag }}</span>
            <span class="mx-2 text-slate-400">→</span>
            <span>{{ toFlag }}</span>
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-slate-900">
              {{ fromLabel }} → {{ toLabel }}
            </div>
            <div class="truncate text-xs text-slate-500">
              View rates for this corridor again.
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              @click="viewCorridor"
            >
              View corridor
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="dismiss"
            >
              Not now
            </button>
          </div>

          <NuxtLink
            to="/send-money"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
            @click="dismiss"
          >
            Choose a different corridor
          </NuxtLink>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCompareHistory } from '~/composables/useCompareHistory'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { getCountryByCode } from '~/utils/countries-currencies'
import { getCorridorUrl } from '~/utils/country-slugs'

type RecentHistoryRecord = {
  id: string
  from_country: string
  to_country: string
  amount: number
  method: string
  path?: string | null
  created_at: string
}

const route = useRoute()
const router = useRouter()
const { request } = useApi()
const { isLoggedIn } = useAuth()
const { runs } = useCompareHistory()
const { functionalConsent } = usePrivacySettings()

const lastCorridor = ref<{ from: string, to: string } | null>(null)
const dismissed = ref(false)
const loading = ref(false)

const dismissalKey = 'rs:welcome_back_corridor:dismissed_until'
const dismissalTtlMs = 24 * 60 * 60 * 1000

const corridorUrl = computed(() => {
  if (!lastCorridor.value) return null
  return getCorridorUrl(lastCorridor.value.from, lastCorridor.value.to)
})

const shouldShow = computed(() => {
  if (!corridorUrl.value) return false
  if (dismissed.value) return false
  return route.path !== corridorUrl.value
})

const fromFlag = computed(() => getCountryByCode(lastCorridor.value?.from?.toUpperCase() || '')?.flag || '🏳️')
const toFlag = computed(() => getCountryByCode(lastCorridor.value?.to?.toUpperCase() || '')?.flag || '🏳️')
const fromLabel = computed(() => getCountryByCode(lastCorridor.value?.from?.toUpperCase() || '')?.name || (lastCorridor.value?.from || ''))
const toLabel = computed(() => getCountryByCode(lastCorridor.value?.to?.toUpperCase() || '')?.name || (lastCorridor.value?.to || ''))

const readDismissal = () => {
  if (!import.meta.client) return
  if (!functionalConsent.value) return
  try {
    const raw = window.sessionStorage.getItem(dismissalKey)
    if (!raw) return
    const until = Number(raw)
    if (!Number.isFinite(until)) return
    if (Date.now() < until) {
      dismissed.value = true
      return
    }
    window.sessionStorage.removeItem(dismissalKey)
  }
  catch {
    // ignore
  }
}

const persistDismissal = () => {
  if (!import.meta.client) return
  if (!functionalConsent.value) return
  try {
    window.sessionStorage.setItem(dismissalKey, String(Date.now() + dismissalTtlMs))
  }
  catch {
    // ignore
  }
}

const dismiss = () => {
  dismissed.value = true
  persistDismissal()
}

const viewCorridor = async () => {
  if (!corridorUrl.value) return
  dismiss()
  await router.push(corridorUrl.value)
}

const deriveFromLocal = () => {
  if (!functionalConsent.value) return
  const latest = runs.value[0]
  if (!latest) return
  lastCorridor.value = {
    from: latest.from,
    to: latest.to,
  }
}

const fetchRecentFromServer = async () => {
  if (!isLoggedIn.value) return
  if (loading.value) return
  loading.value = true
  try {
    const response = await request<{ success: boolean, records: RecentHistoryRecord[] }>('/history/recent', {
      method: 'GET',
      query: { limit: 1 },
    })
    const record = response.records?.[0]
    if (!record) return
    lastCorridor.value = {
      from: record.from_country,
      to: record.to_country,
    }
  }
  catch {
    // ignore
  }
  finally {
    loading.value = false
  }
}

const hydrate = async () => {
  readDismissal()
  if (isLoggedIn.value) {
    await fetchRecentFromServer()
    return
  }
  deriveFromLocal()
}

onMounted(() => {
  void hydrate()
})

watch(
  () => isLoggedIn.value,
  () => {
    void hydrate()
  },
)

watch(
  () => functionalConsent.value,
  () => {
    void hydrate()
  },
)

watch(
  () => runs.value,
  () => {
    if (isLoggedIn.value) return
    deriveFromLocal()
  },
  { deep: true },
)
</script>

