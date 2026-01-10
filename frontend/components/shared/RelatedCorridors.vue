<template>
  <section class="border-t border-slate-200 bg-gray-900">
    <div class="mx-auto max-w-6xl px-4 py-10">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">
            Popular corridors
          </h2>
          <p class="text-sm text-white/70">
            Top searched routes similar to {{ fromName }} to {{ toName }}.
          </p>
        </div>
        <NuxtLink
          to="/corridors"
          class="text-sm font-semibold text-white hover:text-white/80 hover:underline transition-colors"
        >
          Browse all corridors
        </NuxtLink>
      </div>

      <div
        v-if="pending"
        class="rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-6 text-sm text-white/70"
      >
        Loading corridors...
      </div>

      <div
        v-else-if="!displayCorridors.length"
        class="rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-6 text-sm text-white/70"
      >
        No corridors are available right now.
      </div>

      <div
        v-else
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <NuxtLink
          v-for="corridor in displayCorridors"
          :key="corridor.key"
          :to="corridor.url"
          class="group rounded-xl border-2 border-gray-800 bg-gray-800/50 p-5 hover:border-gray-700 hover:shadow-lg transition-all"
        >
          <div class="flex items-center justify-between mb-3 text-2xl">
            <span aria-hidden="true">{{ corridor.fromFlag }}</span>
            <svg
              class="h-5 w-5 text-white/60 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span aria-hidden="true">{{ corridor.toFlag }}</span>
          </div>
          <p class="text-sm font-semibold text-white group-hover:text-white transition-colors">
            {{ corridor.fromName }} to {{ corridor.toName }}
          </p>
          <p class="text-xs text-white/60 mt-1">
            {{ corridor.from }} to {{ corridor.to }}
          </p>
          <div
            v-if="corridor.count24h"
            class="flex items-center gap-1.5 mt-2 text-xs text-white/50"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ corridor.count24h }} searches today</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { getCorridorUrl, POPULAR_CORRIDOR_CODES } from '~/utils/country-slugs'
import { getCountryByCode } from '~/utils/countries-currencies'

type ApiCorridor = {
  route?: string
  from?: string
  to?: string
  count_24h?: number
  count24h?: number
}

type ApiResponse = {
  corridors?: ApiCorridor[]
  data?: ApiCorridor[]
}

const props = withDefaults(defineProps<{
  fromCountry: string
  toCountry: string
  fromCountryName?: string
  toCountryName?: string
  limit?: number
}>(), {
  limit: 8,
})

const { data, pending } = await useRemittanceApi().usePopularCorridors()

const fromName = computed(() => {
  return props.fromCountryName
    || getCountryByCode(props.fromCountry?.toUpperCase())?.name
    || props.fromCountry
    || 'your country'
})

const toName = computed(() => {
  return props.toCountryName
    || getCountryByCode(props.toCountry?.toUpperCase())?.name
    || props.toCountry
    || 'their country'
})

const parseRoute = (route: string) => {
  if (!route) return { from: '', to: '' }
  const normalized = route.trim().replace(/->/g, 'to').replace(/\u2192/g, 'to')
  const parts = normalized.split('to').map(part => part.trim())
  if (parts.length === 2) {
    return { from: parts[0].toUpperCase(), to: parts[1].toUpperCase() }
  }
  return { from: '', to: '' }
}

const candidates = computed(() => {
  const apiData = data.value as ApiResponse | null
  const raw = apiData?.data?.length ? apiData.data : apiData?.corridors || []

  if (raw.length) {
    return raw.map((entry) => {
      const parsed = parseRoute(entry.route || '')
      const from = parsed.from || entry.from || ''
      const to = parsed.to || entry.to || ''
      return {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        count24h: entry.count24h || entry.count_24h || 0,
      }
    }).filter(item => item.from && item.to)
      .sort((a, b) => (b.count24h || 0) - (a.count24h || 0))
  }

  return POPULAR_CORRIDOR_CODES.map(item => ({
    from: item.from.toUpperCase(),
    to: item.to.toUpperCase(),
    count24h: 0,
  }))
})

const displayCorridors = computed(() => {
  const fromCode = props.fromCountry?.toUpperCase() || ''
  const toCode = props.toCountry?.toUpperCase() || ''
  const seen = new Set<string>()

  const filtered = candidates.value.filter((item) => {
    if (!item.from || !item.to) return false
    if (item.from === fromCode && item.to === toCode) return false
    return true
  })

  const ordered = [
    ...filtered.filter(item => item.from === fromCode || item.to === toCode),
    ...filtered.filter(item => item.from !== fromCode && item.to !== toCode),
  ]

  return ordered.reduce<Array<{
    key: string
    from: string
    to: string
    fromName: string
    toName: string
    fromFlag: string
    toFlag: string
    url: string
    count24h?: number
  }>>((acc, item) => {
    if (acc.length >= props.limit) return acc
    const key = `${item.from}-${item.to}`
    if (seen.has(key)) return acc
    seen.add(key)

    const fromCountry = getCountryByCode(item.from)
    const toCountry = getCountryByCode(item.to)

    acc.push({
      key,
      from: item.from,
      to: item.to,
      fromName: fromCountry?.name || item.from,
      toName: toCountry?.name || item.to,
      fromFlag: fromCountry?.flag || '',
      toFlag: toCountry?.flag || '',
      url: getCorridorUrl(item.from, item.to),
      count24h: item.count24h,
    })
    return acc
  }, [])
})
</script>
