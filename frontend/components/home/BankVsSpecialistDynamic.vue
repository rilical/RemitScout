<template>
  <section class="py-16 sm:py-20 bg-surface">
    <div class="container">
      <!-- Educational header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-body-sm font-semibold px-4 py-2 rounded-full mb-4">
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Educational comparison
        </div>

        <h2 class="text-h2 font-bold text-neutral-900 mb-4">
          Why comparative pricing preserves capital
        </h2>

        <p class="text-body-lg text-neutral-600 max-w-3xl mx-auto mb-6">
          Banks monetize FX Spread through off-market execution.<br>
          This is a real example of sending <span class="font-bold text-neutral-900">$500</span> from
          <span class="inline-flex items-center gap-1.5 font-semibold text-brand-700">
            🇺🇸 United States to 🇲🇽 Mexico
          </span>
        </p>
        <div class="flex justify-center mb-6">
          <span class="inline-block bg-brand-600 text-white text-body-sm font-bold px-3 py-1 rounded-full">
            {{ new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
          </span>
        </div>

        <!-- Key stat callout -->
        <div
          v-if="comparison?.savings"
          class="inline-flex items-center gap-3 bg-surface border-2 border-brand-200 rounded-2xl px-6 py-4 shadow-lg"
        >
          <div class="flex items-center justify-center w-12 h-12 bg-success-100 rounded-full">
            <svg
              class="w-6 h-6 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="text-left">
            <div class="text-h3 font-bold text-success-600">
              Net Delivered Value delta: {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }}+
            </div>
            <div
              v-if="comparison.midRate && comparison.midRate > 0"
              class="text-body-sm text-neutral-600"
            >
              ≈ {{ formatMoney(Math.round(comparison.savings.recipientGetsDifference / comparison.midRate), comparison.corridor.sendCurrency) }} USD retained by selecting the optimal provider
            </div>
            <div
              v-else
              class="text-body-sm text-neutral-600"
            >
              retained by selecting the optimal provider
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="pending"
        class="flex justify-center py-12"
      >
        <div class="animate-pulse">
          <div class="h-8 w-48 bg-neutral-200 rounded mb-4" />
          <div class="h-32 w-64 bg-neutral-200 rounded" />
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center py-12"
      >
        <p class="text-neutral-600 mb-4">
          Unable to load comparison data. Please try again later.
        </p>
        <p class="text-body-sm text-neutral-500">
          Error: {{ error }}
        </p>
      </div>

      <!-- No Data State -->
      <div
        v-else-if="!comparison && !pending"
        class="text-center py-12"
      >
        <p class="text-neutral-600 mb-4">
          Comparison data is not available at this time.
        </p>
        <p class="text-body-sm text-neutral-500">
          Data: {{ data ? 'exists' : 'null' }}, Comparison: {{ comparison ? 'exists' : 'null' }}
        </p>
      </div>

      <!-- Invalid Data State -->
      <div
        v-else-if="comparison && (!comparison.bank || !comparison.bank.fxRate || comparison.bank.fxRate <= 0)"
        class="text-center py-12"
      >
        <p class="text-neutral-600 mb-4">
          Bank comparison data is incomplete. Wells Fargo quote data is not available for this corridor.
        </p>
        <p class="text-body-sm text-neutral-500">
          Please try again later or check a different corridor.
        </p>
      </div>

      <!-- Side by Side Comparison Boxes -->
      <div
        v-else-if="comparison"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-10"
      >
        <!-- Wells Fargo Box -->
        <div class="bg-surface rounded-3xl border-2 border-red-200 p-8 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="flex items-center gap-4 mb-6">
            <div
              v-if="comparison.bank.logoUrl"
              class="h-20 w-20 flex-shrink-0 flex items-center justify-center overflow-visible"
            >
              <NuxtImg
                :src="comparison.bank.logoUrl"
                :alt="comparison.bank.name"
                width="80"
                height="80"
                loading="lazy"
                :format="comparison.bank.logoUrl?.toLowerCase().endsWith('.svg') ? undefined : 'webp'"
                class="h-full w-full object-contain"
              />
            </div>
            <div
              v-else
              class="h-20 w-20 flex-shrink-0 flex items-center justify-center overflow-visible"
            >
              <NuxtImg
                src="/logos/wellsfargo.svg"
                alt="Wells Fargo"
                width="80"
                height="80"
                class="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div>
              <h3 class="text-h3 font-bold text-neutral-900">
                {{ comparison.bank.name }}
              </h3>
              <p class="text-body-sm text-neutral-500">
                Traditional Bank
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="bg-red-50 rounded-xl p-5 border border-red-200">
              <div class="text-body-sm text-neutral-600 mb-2">
                Exchange Rate
              </div>
              <div class="text-h3 font-bold text-neutral-900">
                {{ formatRate(comparison.bank.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
              </div>
              <div class="text-body-sm text-red-600 font-medium mt-2">
                {{ comparison.bank.marginPct.toFixed(1) }}% below market rate
              </div>
            </div>

            <div class="bg-red-50 rounded-xl p-5 border border-red-200">
              <div class="text-body-sm text-neutral-600 mb-2">
                Transfer Fee
              </div>
              <div class="text-h3 font-bold text-red-600">
                {{ formatMoney(comparison.bank.fee, comparison.corridor.sendCurrency) }}
              </div>
            </div>

            <div class="bg-red-50 rounded-2xl p-6 border-2 border-red-300">
              <div class="text-body-sm text-red-700 mb-2">
                Net Delivered Value
              </div>
              <div class="text-h1 font-bold text-red-900 mb-2">
                {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.bank.recipientGets).toLocaleString() }}
              </div>
              <div
                v-if="comparison.midRate && comparison.midRate > 0"
                class="text-body-sm text-red-600"
              >
                ≈ {{ formatMoney(Math.round(comparison.bank.recipientGets / comparison.midRate), comparison.corridor.sendCurrency) }} USD
              </div>
            </div>
          </div>
        </div>

        <!-- Best Specialist Box -->
        <div class="bg-surface rounded-3xl border-3 border-emerald-500 p-8 shadow-2xl relative overflow-hidden">
          <div class="flex items-center gap-4 mb-6">
            <div class="h-14 flex-shrink-0 flex items-center justify-center">
              <NuxtImg
                v-if="comparison.top.logoUrl"
                :src="comparison.top.logoUrl"
                :alt="comparison.top.name"
                width="140"
                height="56"
                loading="lazy"
                :format="comparison.top.logoUrl?.toLowerCase().endsWith('.svg') ? undefined : 'webp'"
                class="h-14 w-auto max-w-[160px] object-contain"
              />
              <div
                v-else
                class="h-full w-full flex items-center justify-center rounded-xl bg-success-100 text-success-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  class="h-10 w-10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m12 17.75-5.45 2.865.97-6.063L4 9.95l6.06-.88L12 3.75l1.94 5.32L20 9.95l-3.52 4.602.97 6.063z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-h3 font-bold text-neutral-900">
                {{ comparison.top.name }}
              </h3>
              <p class="text-body-sm text-emerald-700 font-medium">
                Money Transfer Specialist
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <div class="text-body-sm text-neutral-600 mb-2">
                Exchange Rate
              </div>
              <div class="text-h3 font-bold text-emerald-700">
                {{ formatRate(comparison.top.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
              </div>
              <div class="text-body-sm text-emerald-600 font-medium mt-2">
                Above mid-market rate
              </div>
            </div>

            <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <div class="text-body-sm text-neutral-600 mb-2">
                Transfer Fee
              </div>
              <div class="text-h3 font-bold text-emerald-600">
                {{ formatMoney(comparison.top.fee, comparison.corridor.sendCurrency) }}
              </div>
            </div>

            <div class="bg-emerald-600 rounded-2xl p-6 border-2 border-emerald-400 text-white">
              <div class="text-body-sm opacity-90 mb-2">
                Net Delivered Value
              </div>
              <div class="text-h1 font-bold mb-2">
                {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.top.recipientGets).toLocaleString() }}
              </div>
              <div
                v-if="comparison.midRate && comparison.midRate > 0"
                class="text-body-sm opacity-90 mb-3"
              >
                ≈ {{ formatMoney(Math.round(comparison.top.recipientGets / comparison.midRate), comparison.corridor.sendCurrency) }} USD
              </div>
              <div
                v-if="comparison.savings"
                class="bg-surface/20 backdrop-blur rounded-lg px-4 py-2 mt-3"
              >
                <div class="text-body-lg font-bold">
                  +{{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }} Net Delivered Value delta
                </div>
                <div class="text-body-sm opacity-90 mt-1">
                  <span v-if="comparison.midRate && comparison.midRate > 0">≈ {{ formatMoney(Math.round(comparison.savings.recipientGetsDifference / comparison.midRate), comparison.corridor.sendCurrency) }} USD </span>vs {{ comparison.bank.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Spread Analysis Section -->
  <section class="w-screen py-20 sm:py-28 bg-neutral-900 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div class="container">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h3 class="text-h1 font-bold text-white mb-6">
          Deconstructing the Spread.
        </h3>
        <p class="text-h4 text-neutral-300 max-w-4xl mx-auto leading-relaxed">
          The "Zero Fee" claim is an arbitrage strategy. Institutions generate revenue by offering exchange rates below the mid-market reference price. We visualize this gap.
        </p>
      </div>

      <!-- 3 Horizontal Steps -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <!-- Step 1: Spread Delta -->
        <div class="bg-surface rounded-3xl border-2 border-neutral-200 p-8 shadow-xl">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-h3 font-bold mb-6">
            1
          </div>
          <h4 class="text-h3 font-bold text-neutral-900 mb-4">
            The Spread Delta
          </h4>
          <p class="text-neutral-700 leading-relaxed mb-4">
            Banks typically widen the FX Spread by <strong class="text-brand-700">3% to 5%</strong> above the mid-market rate. This is an invisible tax on your capital.
          </p>
          <p class="text-neutral-700 leading-relaxed mb-6 text-body-sm">
            The mid-market rate is the reference price institutions use between themselves. The spread delta is the margin captured by the intermediary.
          </p>
          <div
            v-if="comparison"
            class="bg-primary-50 border border-primary-200 rounded-xl p-4"
          >
            <p class="text-body-sm font-bold text-neutral-900 mb-3">
              {{ comparison.bank.name }}
            </p>
            <div class="space-y-2">
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-600">Exchange rate:</span>
                <span class="font-bold text-neutral-900">{{ comparison.bank.fxRate.toFixed(2) }} {{ comparison.corridor.recvCurrency }}</span>
              </div>
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-600">Amount sent:</span>
                <span class="font-bold text-neutral-900">{{ formatMoney(amount, comparison.corridor.sendCurrency) }}</span>
              </div>
              <div class="flex justify-between text-body-sm">
                <span class="text-neutral-600">Upfront fee:</span>
                <span class="font-bold text-neutral-900">{{ formatMoney(comparison.bank.fee, comparison.corridor.sendCurrency) }}</span>
              </div>
              <div
                v-if="comparison.savings"
                class="pt-2 border-t border-primary-200"
              >
                <div class="flex justify-between text-body-sm">
                  <span class="text-neutral-600">Spread delta impact:</span>
                  <span class="font-bold text-brand-700">{{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }}</span>
                </div>
                <p class="text-body-sm text-neutral-500 mt-1">
                  Even with a competitive fee, FX Spread reduces Net Delivered Value
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Comparative Indexing -->
        <div class="bg-surface rounded-3xl border-2 border-neutral-200 p-8 shadow-xl">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-h3 font-bold mb-6">
            2
          </div>
          <h4 class="text-h3 font-bold text-neutral-900 mb-4">
            Comparative Indexing
          </h4>
          <p class="text-neutral-700 leading-relaxed mb-6">
            We overlay provider rates against the live mid-market benchmark. This reveals the exact margin being captured by the intermediary.
          </p>
          <div
            v-if="comparison"
            class="space-y-4"
          >
            <div class="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <p class="text-body-sm text-neutral-600 mb-2">
                Lower Effective Rate:
              </p>
              <p class="text-body-sm font-bold text-neutral-900 mb-1">
                {{ comparison.bank.name }}
              </p>
              <p class="text-body-sm text-brand-700">
                {{ comparison.bank.fxRate.toFixed(2) }} {{ comparison.corridor.recvCurrency }}
              </p>
              <p class="text-body-sm text-neutral-600 mt-2">
                Net Delivered Value: {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.bank.recipientGets).toLocaleString() }}
              </p>
            </div>
            <div class="bg-brand-600 rounded-xl p-4 text-white">
              <p class="text-body-sm text-primary-100 mb-2">
                Higher Effective Rate:
              </p>
              <p class="text-body-sm font-bold mb-1">
                {{ comparison.top.name }}
              </p>
              <p class="text-body-sm">
                {{ comparison.top.fxRate.toFixed(2) }} {{ comparison.corridor.recvCurrency }}
              </p>
              <p class="text-body-sm text-primary-100 mt-2">
                Net Delivered Value: {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.top.recipientGets).toLocaleString() }}
              </p>
              <p
                v-if="comparison.savings && comparison.savings.recipientGetsDifference > 0"
                class="text-body-sm font-bold mt-2"
              >
                +{{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }} Net Delivered Value delta per transfer
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3: Yield Optimization -->
        <div class="bg-surface rounded-3xl border-2 border-neutral-200 p-8 shadow-xl flex flex-col">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-h3 font-bold mb-6">
            3
          </div>
          <h4 class="text-h3 font-bold text-neutral-900 mb-4">
            Yield Optimization
          </h4>
          <p class="text-neutral-700 leading-relaxed mb-6">
            For recurring transfers, spread optimization compounds. A 2% tighter spread on monthly volume materially improves annual retained capital and capital preservation.
          </p>
          <div
            v-if="comparison?.savings"
            class="bg-brand-600 rounded-xl p-4 text-white mt-auto"
          >
            <p class="text-body-sm text-primary-100 mb-2">
              Annual retained capital:
            </p>
            <p class="text-body-lg font-bold mb-1">
              {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference * 12).toLocaleString() }}
            </p>
            <p class="text-body-sm text-primary-100 mb-2">
              ≈ {{ formatMoney(Math.round((comparison.savings.recipientGetsDifference * 12) / comparison.midRate), comparison.corridor.sendCurrency) }} USD per year
            </p>
            <p class="text-body-sm text-primary-100 mt-2 pt-2 border-t border-primary-500">
              {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }} Net Delivered Value delta per transfer × 12 months
            </p>
          </div>
          <div
            v-else
            class="bg-primary-50 border border-primary-200 rounded-xl p-4 mt-auto"
          >
            <p class="text-body-sm text-neutral-700 text-center">
              Compare quotes to see annual retained capital
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom Line -->
      <div class="bg-surface rounded-3xl border-2 border-neutral-200 p-10 shadow-xl">
        <div class="flex flex-col lg:flex-row items-center gap-8 max-w-4xl mx-auto">
          <div class="flex-shrink-0 w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center">
            <svg
              class="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div class="flex-1 text-center lg:text-left">
            <h4 class="text-h2 font-bold text-neutral-900 mb-4">
              The Bottom Line
            </h4>
            <p class="text-neutral-700 text-body-lg leading-relaxed mb-4">
              Incumbents benefit from opaque FX Spread when transfers are executed without comparison. A disciplined quote audit surfaces tighter spreads and higher Net Delivered Value across corridors.
            </p>
            <p class="text-neutral-600 text-body leading-relaxed">
              Remit-Scout publishes real-time quotes from licensed providers so execution decisions are based on measurable cost and liquidity.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center">
        <p
          v-if="comparison"
          class="text-body-sm text-neutral-400"
        >
          Live rates for ${{ amount }} • {{ comparison.corridor.from }} → {{ comparison.corridor.to }} • Updated {{ lastUpdated }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRemittanceApi } from '~/composables/useRemittanceApi'

const amount = 500

// Fixed corridor: US → Mexico
const corridor = { from: 'US', to: 'MX' }

const { formatMoney, formatRate, getRelativeTime } = useRemittanceApi()
const { data, pending, error } = await useRemittanceApi().useBankVsSpecialist(
  corridor.from,
  corridor.to,
  amount,
)

const comparison = computed(() => data.value?.data)

const lastUpdated = computed(() => {
  if (!comparison.value) return ''
  return getRelativeTime(comparison.value.updatedAt)
})
</script>
