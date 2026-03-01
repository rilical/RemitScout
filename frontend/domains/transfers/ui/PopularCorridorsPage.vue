<script setup lang="ts">
import { CenteredPage, DataTable } from '~/ui'
import type { DataTableColumn } from '~/ui'
import type { PopularCorridorGroup } from '~/domains/transfers/application/popularCorridorsModel'

type Props = {
  corridorsByCountry: PopularCorridorGroup[]
  pending: boolean
  error: unknown
}

defineProps<Props>()

const columns: DataTableColumn[] = [
  { key: 'to', label: 'Corridor' },
  { key: 'topProvider', label: 'Top provider' },
  { key: 'count24h', label: '24h searches', align: 'right' },
]
</script>

<template>
  <div class="min-h-screen bg-surface">
    <section class="bg-neutral-900 text-white py-16 lg:py-24">
      <CenteredPage padding-y="none">
        <template #header>
          <nav class="mb-8 flex items-center space-x-2 text-body-sm text-white/70">
            <NuxtLink
              to="/"
              class="hover:text-white transition-colors"
            >Home</NuxtLink>
            <span class="text-white/50">›</span>
            <span class="font-medium text-white">Popular Corridors</span>
          </nav>

          <div class="max-w-3xl">
            <h1 class="text-h1 font-bold mb-4">
              Popular Money Transfer Corridors
            </h1>
            <p class="text-h4 text-neutral-300">
              Compare rates across the most popular international money transfer routes. All data is updated in real-time.
            </p>
          </div>
        </template>
      </CenteredPage>
    </section>

    <section>
      <CenteredPage>
        <div
          v-if="pending"
          class="text-center py-12"
        >
          <p class="text-neutral-600">
            Loading popular corridors...
          </p>
        </div>

        <div
          v-else-if="error"
          class="rounded-xl border border-danger-600 bg-danger-600 p-6 text-center"
        >
          <p class="text-danger-600">
            Unable to load popular corridors. Please try again later.
          </p>
        </div>

        <div
          v-else-if="corridorsByCountry.length"
          class="space-y-12"
        >
          <div
            v-for="group in corridorsByCountry"
            :key="group.fromCountry"
            class="space-y-6"
          >
            <div class="flex items-center gap-4">
              <h2 class="text-h3 font-bold text-neutral-900">
                From {{ group.fromCountry }}
              </h2>
              <div class="h-px flex-1 bg-neutral-200" />
              <span class="text-body-sm text-neutral-500">
                {{ group.corridors.length }} corridor{{ group.corridors.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <DataTable
              variant="terminal"
              caption="Popular corridors"
              :columns="columns"
              :rows="group.corridors"
              :row-key="(row: any) => row.id"
              :empty="{ title: 'No corridors' }"
            >
              <template #cell-to="{ row }">
                <NuxtLink
                  :to="(row as any).href as string"
                  class="inline-flex items-center gap-2 font-medium text-neutral-900 hover:text-brand-700"
                >
                  <span class="text-body-lg">{{ (row as any).fromFlag }}</span>
                  <span class="text-neutral-400">→</span>
                  <span class="text-body-lg">{{ (row as any).toFlag }}</span>
                  <span class="ml-1">{{ (row as any).from }} → {{ (row as any).to }}</span>
                </NuxtLink>
              </template>

              <template #cell-count24h="{ value }">
                <span class="tabular-nums">{{ value || '—' }}</span>
              </template>
            </DataTable>
          </div>
        </div>

        <div
          v-else
          class="text-center py-12"
        >
          <p class="text-neutral-600">
            No popular corridors found.
          </p>
        </div>
      </CenteredPage>
    </section>
  </div>
</template>
