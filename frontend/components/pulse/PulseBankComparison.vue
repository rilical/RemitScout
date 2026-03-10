<template>
  <div class="card-surface overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-600/20">
          <Icon
            name="building-library"
            :size="20"
            class="text-danger-600"
          />
        </div>
        <div>
          <h2 class="text-body-lg font-bold text-white">
            Bank Reference Pricing Gap
          </h2>
          <p class="text-body-sm text-neutral-400">
            Reference benchmark used for savings estimates
          </p>
          <p class="text-body-sm text-neutral-500">
            Benchmark only - not part of provider rankings
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div
        v-if="loading"
        class="flex h-48 w-full items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading chart"
      >
        <SkeletonBlock
          width="full"
          height="12rem"
          tone="dark"
        />
        <span class="sr-only">Loading chart</span>
      </div>

      <div v-else>
        <!-- Amount Context -->
        <div class="mb-6 text-center">
          <p class="text-body-sm text-neutral-400">
            If you send
          </p>
          <p class="text-h2 font-bold text-white text-mono-value">
            {{ amountDisplay }}
          </p>
          <p class="text-body-sm text-neutral-400">
            {{ store.corridor?.fromCode }} → {{ store.corridor?.toCode }}
          </p>
        </div>

        <!-- Comparison Cards -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <!-- Bank Card -->
          <div class="rounded-lg border border-danger-600/30 bg-danger-600/10 p-4">
            <div class="flex items-center gap-2 mb-3">
              <Icon
                name="building-library"
                :size="20"
                class="text-danger-600"
              />
              <span class="text-body-sm font-semibold text-white">Bank Benchmark</span>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-400">Hidden markup</span>
                <span class="font-semibold text-danger-600 text-mono-value">{{ money(data?.bankMarkup) }}</span>
              </div>
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-400">Wire fee</span>
                <span class="font-semibold text-white text-mono-value">{{ money(data?.bankFee) }}</span>
              </div>
              <div class="border-t border-danger-600/30 pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-body-sm font-semibold text-white">Total cost</span>
                  <span class="text-body-lg font-bold text-danger-600 text-mono-value">{{ money(data?.bankTotalCost) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Specialist Card -->
          <div class="rounded-lg border border-brand-600/30 bg-brand-600/10 p-4">
            <div class="flex items-center gap-2 mb-3">
              <Icon
                name="bolt"
                :size="20"
                class="text-brand-600"
              />
              <span class="text-body-sm font-semibold text-white">{{ data?.bestSpecialistName || 'n/a' }}</span>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-400">Hidden markup</span>
                <span class="font-semibold text-brand-600 text-mono-value">{{ money(data?.bestSpecialistMarkup) }}</span>
              </div>
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-400">Transfer fee</span>
                <span class="font-semibold text-white text-mono-value">{{ money(data?.bestSpecialistFee) }}</span>
              </div>
              <div class="border-t border-brand-600/30 pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-body-sm font-semibold text-white">Total cost</span>
                  <span class="text-body-lg font-bold text-brand-600 text-mono-value">{{ money(data?.bestSpecialistTotalCost) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-center">
          <div class="text-label text-neutral-500 mb-1">
            Benchmark Gap
          </div>
          <div class="text-h2 font-bold text-white text-mono-value">
            {{ money(data?.savings) }}
          </div>
          <div class="text-body-sm text-neutral-400">
            Bank all-in cost is {{ typeof data?.savingsPercent === 'number' ? data.savingsPercent : 'n/a' }}% higher than specialist leader
          </div>
        </div>
      </div>
    </div>

    <PulseTrustStamp
      v-if="data"
      :last-updated="store.lastUpdated || null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import type { BankComparisonData } from '~/types/remit'
import { getBankComparisonData } from '~/lib/pulseApi'
import { Icon } from '~/ui'
import { formatMoney as formatMoneyUtil } from '~/shared/lib/format'
import SkeletonBlock from '~/components/shared/SkeletonBlock.vue'

const store = usePulseStore()

const loading = ref(true)
const data = ref<BankComparisonData | null>(null)

const sendCurrency = computed(() => store.corridor?.fromCode || 'USD')

const money = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a'
  return formatMoneyUtil(value, { currency: sendCurrency.value })
}

const amountDisplay = computed(() =>
  formatMoneyUtil(store.amount, { currency: sendCurrency.value, maximumFractionDigits: 0 }),
)

async function loadData() {
  loading.value = true
  try {
    data.value = await getBankComparisonData(store.corridor, store.timeframe, store.amount)
  }
  catch (e) {
    useLogger('PulseBankComparison').error('Failed to load bank comparison', e)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.timeframe, store.amount],
  () => loadData(),
  { deep: true },
)

onMounted(() => {
  loadData()
})
</script>
