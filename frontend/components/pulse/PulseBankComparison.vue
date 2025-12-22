<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-600/20">
          <svg class="h-5 w-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">Bank vs Specialists</h2>
          <p class="text-sm text-neutral-400">Your potential savings</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div v-if="loading" class="flex h-48 items-center justify-center">
        <div class="flex items-center gap-3 text-neutral-400">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>

      <div v-else>
        <!-- Amount Context -->
        <div class="mb-6 text-center">
          <p class="text-sm text-neutral-400">If you send</p>
          <p class="text-3xl font-bold text-white">${{ store.amount.toLocaleString() }}</p>
          <p class="text-sm text-neutral-400">{{ store.corridor.fromCode }} → {{ store.corridor.toCode }}</p>
        </div>

        <!-- Comparison Cards -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <!-- Bank Card -->
          <div class="rounded-lg border border-danger-600/30 bg-danger-600/10 p-4">
            <div class="flex items-center gap-2 mb-3">
              <svg class="h-5 w-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span class="text-sm font-semibold text-white">Your Bank</span>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Hidden markup</span>
                <span class="font-semibold text-danger-600">${{ data?.bankMarkup.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Wire fee</span>
                <span class="font-semibold text-white">${{ data?.bankFee.toFixed(2) }}</span>
              </div>
              <div class="border-t border-danger-600/30 pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-sm font-semibold text-white">Total cost</span>
                  <span class="text-lg font-bold text-danger-600">${{ data?.bankTotalCost.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Specialist Card -->
          <div class="rounded-lg border border-brand-600/30 bg-brand-600/10 p-4">
            <div class="flex items-center gap-2 mb-3">
              <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span class="text-sm font-semibold text-white">{{ data?.bestSpecialistName }}</span>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Hidden markup</span>
                <span class="font-semibold text-brand-600">${{ data?.bestSpecialistMarkup.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Transfer fee</span>
                <span class="font-semibold text-white">${{ data?.bestSpecialistFee.toFixed(2) }}</span>
              </div>
              <div class="border-t border-brand-600/30 pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-sm font-semibold text-white">Total cost</span>
                  <span class="text-lg font-bold text-brand-600">${{ data?.bestSpecialistTotalCost.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Savings Highlight -->
        <div class="rounded-xl bg-gradient-to-r from-brand-600/20 to-emerald-600/20 border border-brand-600/30 p-6 text-center">
          <div class="mb-2">
            <span class="text-sm font-medium text-neutral-300">YOU SAVE</span>
          </div>
          <div class="text-4xl font-bold text-white mb-1">
            ${{ data?.savings.toFixed(2) }}
          </div>
          <div class="flex items-center justify-center gap-2">
            <span class="rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white">
              {{ data?.savingsPercent }}% less
            </span>
            <span class="text-sm text-neutral-400">in hidden fees</span>
          </div>
        </div>

        <!-- Loss Aversion Message -->
        <div class="mt-6 rounded-lg bg-neutral-900 border border-neutral-700 p-4">
          <div class="flex items-start gap-3">
            <svg class="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-sm text-neutral-300">
                <span class="font-semibold text-danger-600">${{ data?.bankMarkup.toFixed(2) }}</span> of what banks charge is hidden in the exchange rate.
                That's money you're <span class="font-semibold">losing</span> without even knowing it.
              </p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="mt-6">
          <NuxtLink
            :to="`/send-money/united-states-to-philippines?amount=${store.amount}`"
            class="flex items-center justify-center gap-2 w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            <span>Stop Losing Money to Banks</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <PulseTrustStamp v-if="data" :last-updated="lastUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { usePulseStore } from '~/stores/pulse'
import type { BankComparisonData } from '~/types/remit'
import { buildBankComparison } from '~/lib/trueCostCalculator'

const store = usePulseStore()

const loading = ref(true)
const data = ref<BankComparisonData | null>(null)
const lastUpdated = ref(new Date().toISOString())

async function loadData() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const amount = store.amount
    const baseMidRate = 56.25
    
    const bankRate = baseMidRate * 0.944
    const bankFee = 35
    
    const bestSpecialistRate = baseMidRate * 0.996
    const bestSpecialistFee = 4.5
    
    data.value = buildBankComparison(
      amount,
      baseMidRate,
      bankRate,
      bankFee,
      bestSpecialistRate,
      bestSpecialistFee,
      'Wise'
    )
    
    lastUpdated.value = new Date().toISOString()
  } catch (e) {
    console.error('Failed to load bank comparison:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [store.corridor, store.amount],
  () => loadData(),
  { deep: true }
)

onMounted(() => {
  loadData()
})
</script>
