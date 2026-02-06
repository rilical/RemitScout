<script setup lang="ts">
import DataTable from '~/shared/ui/DataTable.vue'
import type { DataTableColumn } from '~/shared/ui/DataTable.vue'
import type { FxProviderPricingRow } from '~/domains/market-data/application/fxProviderPricing'

type Props = {
  rows: FxProviderPricingRow[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const columns: DataTableColumn[] = [
  { key: 'name', header: 'Provider' },
  { key: 'speed', header: 'Speed' },
  { key: 'rate', header: 'Rate', align: 'right' },
  { key: 'markupPercent', header: 'Markup vs mid', align: 'right' },
]
</script>

<template>
  <DataTable
    variant="dashboard"
    caption="Provider markups"
    :columns="columns"
    :rows="rows"
    :loading="loading"
    empty-text="No provider pricing available"
  />
</template>
