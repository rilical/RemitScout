<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="mx-auto max-w-6xl px-6 py-10">
      <div class="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-h3 font-semibold text-rs-fg">
            Ad Inventory
          </h1>
          <p class="text-body-sm text-rs-muted">
            Manage sponsored placements and track impressions.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center rounded-lg border border-rs-border px-3 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          :disabled="loading"
          @click="loadAds"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          class="bg-surface rounded-xl border border-rs-border p-6 space-y-4"
          @submit.prevent="handleCreate"
        >
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Create Ad
          </h2>
          <label class="block text-body-sm font-medium text-neutral-700">
            Name
            <input
              v-model="form.name"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              required
            >
          </label>
          <label class="block text-body-sm font-medium text-neutral-700">
            Tagline
            <input
              v-model="form.tagline"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              required
            >
          </label>
          <label class="block text-body-sm font-medium text-neutral-700">
            Brand color
            <input
              v-model="form.brandColor"
              type="color"
              class="mt-1 h-10 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
          </label>
          <label class="block text-body-sm font-medium text-neutral-700">
            Destination URL
            <input
              v-model="form.url"
              type="url"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
              required
            >
          </label>
          <label class="block text-body-sm font-medium text-neutral-700">
            CTA text
            <input
              v-model="form.ctaText"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
          </label>
          <label class="block text-body-sm font-medium text-neutral-700">
            Status
            <select
              v-model="form.status"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label class="block text-body-sm font-medium text-neutral-700">
            Layout
            <select
              v-model="form.layout"
              class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <div class="space-y-2">
            <div class="text-body-sm font-medium text-neutral-700">
              Placements
            </div>
            <label
              v-for="placement in placements"
              :key="placement"
              class="flex items-center gap-2 text-body-sm text-neutral-600"
            >
              <input
                v-model="form.placements"
                type="checkbox"
                :value="placement"
                class="h-4 w-4 rounded border-neutral-300 text-brand-600"
              >
              {{ placement }}
            </label>
          </div>
          <button
            type="submit"
            class="w-full rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:bg-neutral-300"
            :disabled="saving"
          >
            {{ saving ? 'Creating…' : 'Create ad' }}
          </button>
          <p
            v-if="formError"
            class="text-body-sm text-danger-600"
          >
            {{ formError }}
          </p>
          <p
            v-if="formSuccess"
            class="text-body-sm text-success-600"
          >
            {{ formSuccess }}
          </p>
        </form>

          <div class="space-y-4">
          <ErrorState
            v-if="error"
            mode="card"
            :message="error || 'Failed to load data'"
            :on-retry="refresh"
          />
          <div
            v-else-if="ads.length === 0"
            class="rounded-lg border border-rs-border bg-surface px-4 py-6 text-body-sm text-rs-muted"
          >
            No ads yet.
          </div>
          <div
            v-else
            class="grid gap-4"
          >
            <div
              v-for="ad in ads"
              :key="ad.id"
              class="rounded-xl border border-rs-border bg-surface p-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <div
                      class="h-3 w-3 rounded-full"
                      :style="{ backgroundColor: ad.brandColor }"
                    />
                    <h3 class="text-body-sm font-semibold text-rs-fg">
                      {{ ad.name }}
                    </h3>
                    <span class="text-body-sm text-rs-muted">{{ ad.status }}</span>
                  </div>
                  <p class="text-body-sm text-rs-muted mt-1">
                    {{ ad.tagline }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-body-sm font-semibold text-brand-600 hover:text-brand-700"
                  @click="toggleStatus(ad)"
                >
                  {{ ad.status === 'active' ? 'Disable' : 'Enable' }}
                </button>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 text-body-sm text-neutral-600">
                <span
                  v-for="placement in ad.placements"
                  :key="placement.placement"
                  class="rounded-full bg-neutral-100 px-2 py-1"
                >
                  {{ placement.placement }} · {{ placement.layout || 'auto' }}
                </span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-body-sm text-neutral-600">
                <div>Impressions (30d): <span class="font-semibold text-rs-fg">{{ ad.impressionCount }}</span></div>
                <div>Clicks (30d): <span class="font-semibold text-rs-fg">{{ ad.clickCount }}</span></div>
              </div>
              <div class="mt-3 text-body-sm text-rs-muted">
                {{ ad.url }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { setSeo } from '~/composables/useSeo'

definePageMeta({ middleware: ['auth', 'admin'] })

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Admin: Ads | Remit-Scout',
  description: 'Admin tools for managing ad placements.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const ErrorState = defineAsyncComponent(() => import('~/ui/states/ErrorState.vue'))

type AdPlacement = {
  placement: string
  layout: string | null
  priority: number
}

type AdminAd = {
  id: string
  name: string
  tagline: string
  brandColor: string
  url: string
  status: string
  impressionCount: number
  clickCount: number
  placements: AdPlacement[]
}

const { request } = useApi()

const placements = [
  'compare_inline',
  'compare_sidebar',
  'home_inline',
  'dashboard_inline',
  'blog_sidebar',
  'blog_inline',
  'blog_banner',
]

const ads = ref<AdminAd[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  name: '',
  tagline: '',
  brandColor: '#2563EB',
  url: '',
  ctaText: 'View offer',
  status: 'active',
  layout: 'horizontal',
  placements: [] as string[],
})
const saving = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)

const loadAds = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await request<{ ads: AdminAd[] }>('/admin/ads', { method: 'GET' })
    ads.value = response.ads ?? []
  }
  catch (err: any) {
    error.value = err?.message || 'Failed to load ads.'
  }
  finally {
    loading.value = false
  }
}

const refresh = () => {
  void loadAds()
}

const handleCreate = async () => {
  formError.value = null
  formSuccess.value = null
  if (form.placements.length === 0) {
    formError.value = 'Select at least one placement.'
    return
  }
  saving.value = true
  try {
    await request('/admin/ads', {
      method: 'POST',
      body: {
        ad: {
          name: form.name,
          tagline: form.tagline,
          brandColor: form.brandColor,
          url: form.url,
          ctaText: form.ctaText,
          status: form.status,
        },
        placements: form.placements.map(placement => ({
          placement,
          layout: form.layout,
        })),
      },
    })
    formSuccess.value = 'Ad created.'
    form.name = ''
    form.tagline = ''
    form.url = ''
    form.placements = []
    await loadAds()
  }
  catch (err: any) {
    formError.value = err?.message || 'Failed to create ad.'
  }
  finally {
    saving.value = false
  }
}

const toggleStatus = async (ad: AdminAd) => {
  const nextStatus = ad.status === 'active' ? 'inactive' : 'active'
  try {
    await request(`/admin/ads/${ad.id}`, {
      method: 'PATCH',
      body: {
        ad: { status: nextStatus },
      },
    })
    await loadAds()
  }
  catch (err: any) {
    error.value = err?.message || 'Failed to update status.'
  }
}

onMounted(() => {
  void loadAds()
})
</script>
