<template>
  <ClientOnly>
    <Transition
      enter-active-class="motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="shouldShow"
        class="fixed right-4 top-20 z-40 w-[min(20rem,calc(100vw-2rem))]"
      >
        <div class="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-body-sm font-semibold text-neutral-900">
                Your last corridor search
              </p>
              <p class="mt-1 text-body-sm text-neutral-600">
                Want to check out your corridor again?
              </p>
            </div>
            <button
              type="button"
              class="text-neutral-400 hover:text-neutral-600"
              aria-label="Dismiss prompt"
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
        </div>

        <div class="mt-4 flex items-center gap-3 rounded-xl border border-rs-border bg-neutral-50 px-4 py-3">
          <div class="text-h4">
            <span>{{ fromFlag }}</span>
            <span class="mx-2 text-neutral-400">→</span>
            <span>{{ toFlag }}</span>
          </div>
          <div class="min-w-0">
            <div class="truncate text-body-sm font-semibold text-rs-fg">
              {{ fromLabel }} → {{ toLabel }}
            </div>
            <div class="truncate text-body-sm text-rs-muted">
              View rates for this corridor again.
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700"
              @click="viewCorridor"
            >
              View corridor
            </button>
            <button
              type="button"
              class="rounded-lg border border-rs-border px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              @click="dismiss"
            >
              Dismiss
            </button>
          </div>

          <NuxtLink
            to="/send-money"
            class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
            @click="dismiss"
          >
            Choose a different corridor
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCompareHistory } from '~/composables/useCompareHistory'
import { usePersistedState } from '~/composables/usePersistedState'
import { usePrivacySettings } from '~/composables/usePrivacySettings'
import { useVisitSession } from '~/composables/useVisitSession'
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
const { functionalConsent, settings } = usePrivacySettings()
const { startedAt: visitStartedAtMs } = useVisitSession()

const lastCorridor = ref<{ from: string, to: string } | null>(null)
const lastSearchAtMs = ref<number | null>(null)
const loading = ref(false)
const searchedThisVisit = ref(false)

const dismissalTtlMs = 24 * 60 * 60 * 1000
const { state: dismissedUntilMs } = usePersistedState<number | null>(
  'welcome_back_corridor:dismissed_until',
  () => null,
  {
    requiredConsent: 'functional',
    validate: (value): value is number | null => value === null || (typeof value === 'number' && Number.isFinite(value)),
  },
)

const corridorUrl = computed(() => {
  if (!lastCorridor.value) return null
  return getCorridorUrl(lastCorridor.value.from, lastCorridor.value.to)
})

const shouldShow = computed(() => {
  if (!functionalConsent.value) return false
  if (!corridorUrl.value) return false
  if (!lastSearchAtMs.value) return false
  if (searchedThisVisit.value) return false
  if (typeof dismissedUntilMs.value === 'number' && Date.now() < dismissedUntilMs.value) return false
  if (lastSearchAtMs.value >= visitStartedAtMs.value) return false
  const consentAt = Date.parse(settings.value.updated_at ?? '')
  if (Number.isFinite(consentAt) && consentAt >= visitStartedAtMs.value) return false
  return route.path !== corridorUrl.value
})

const fromFlag = computed(() => getCountryByCode(lastCorridor.value?.from?.toUpperCase() || '')?.flag || '🏳️')
const toFlag = computed(() => getCountryByCode(lastCorridor.value?.to?.toUpperCase() || '')?.flag || '🏳️')
const fromLabel = computed(() => getCountryByCode(lastCorridor.value?.from?.toUpperCase() || '')?.name || (lastCorridor.value?.from || ''))
const toLabel = computed(() => getCountryByCode(lastCorridor.value?.to?.toUpperCase() || '')?.name || (lastCorridor.value?.to || ''))

const dismiss = () => {
  if (!functionalConsent.value) return
  dismissedUntilMs.value = Date.now() + dismissalTtlMs
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
  const ms = Date.parse(latest.createdAt)
  lastSearchAtMs.value = Number.isFinite(ms) ? ms : null
}

const fetchRecentFromServer = async () => {
  if (!functionalConsent.value) return
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
    const ms = Date.parse(record.created_at)
    lastSearchAtMs.value = Number.isFinite(ms) ? ms : null
  }
  catch {
    // ignore
  }
  finally {
    loading.value = false
  }
}

const readSearchedThisVisit = () => {
  if (!import.meta.client) return
  if (!functionalConsent.value) {
    searchedThisVisit.value = false
    return
  }
  try {
    searchedThisVisit.value = window.sessionStorage.getItem('rs:compare:searched_this_visit') === '1'
  }
  catch {
    searchedThisVisit.value = false
  }
}

const hydrate = async () => {
  readSearchedThisVisit()
  if (typeof dismissedUntilMs.value === 'number' && Date.now() >= dismissedUntilMs.value) {
    dismissedUntilMs.value = null
  }
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
    readSearchedThisVisit()
    if (isLoggedIn.value) return
    deriveFromLocal()
  },
  { deep: true },
)
</script>
