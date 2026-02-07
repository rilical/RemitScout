<template>
  <DataTable
    variant="consumer"
    caption="Provider comparison"
    :columns="columns"
    :rows="providers"
    :row-key="row => asProvider(row).id"
    :empty="{ title: 'No providers to compare' }"
  >
    <template #cell-provider="{ row }">
      <div class="flex items-center">
        <ProviderLogo
          :slug="asProvider(row).slug"
          :alt="asProvider(row).name"
          class="mr-3 h-8 w-8"
        />
        <div>
          <div class="text-sm font-medium text-slate-900">
            {{ asProvider(row).name }}
          </div>
          <div class="text-sm text-slate-600">
            {{ asProvider(row).countries }} countries
          </div>
        </div>
      </div>
    </template>

    <template #cell-rating="{ row }">
      <div class="flex items-center">
        <Stars
          :rating="asProvider(row).rating"
          size="sm"
        />
        <span class="ml-2 text-sm text-slate-900">{{ asProvider(row).rating }}/5</span>
      </div>
    </template>

    <template #cell-fees="{ row }">
      <span class="text-sm text-slate-700">{{ asProvider(row).fees || 'N/A' }}</span>
    </template>

    <template #cell-action="{ row }">
      <NuxtLink
        :to="`/learn/providers/${asProvider(row).slug}`"
        class="font-medium text-primary-600 hover:text-primary-900"
      >
        View Details
      </NuxtLink>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataTable } from '~/shared/ui'
import type { DataTableColumn } from '~/shared/ui'

interface Provider {
  id: string
  name: string
  slug: string
  rating: number
  countries: number
  fees?: string
  speed: string
}

interface Props {
  providers?: Provider[]
  offers?: any[]
  comparison?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  providers: () => [],
  comparison: false,
})

const columns: DataTableColumn[] = [
  {
    key: 'provider',
    label: 'Provider',
  },
  {
    key: 'rating',
    label: 'Rating',
  },
  {
    key: 'fees',
    label: 'Fees',
  },
  {
    key: 'speed',
    label: 'Speed',
  },
  {
    key: 'action',
    label: 'Action',
    align: 'right',
  },
]

const providers = computed(() => props.providers)

function asProvider(row: unknown): Provider {
  return row as Provider
}
</script>
