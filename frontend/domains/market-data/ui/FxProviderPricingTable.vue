<script setup lang="ts">
import { DataTable } from '~/ui'
import type { DataTableColumn } from '~/ui'
import type { FxProviderPricingRow } from '~/domains/market-data/application/fxProviderPricing'

type Props = {
  rows: FxProviderPricingRow[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Provider' },
  { key: 'speed', label: 'Speed' },
  { key: 'rate', label: 'Rate', align: 'right' },
  { key: 'markupPercent', label: 'Markup vs mid', align: 'right' },
]
</script>

<template>
  <DataTable
    variant="consumer"
    caption="Provider markups"
    :columns="columns"
    :rows="rows"
    :row-key="(row: any, idx: number) => row.name ?? String(idx)"
    :loading="loading"
    :empty="{ title: 'No provider pricing available' }"
  />
</template>
