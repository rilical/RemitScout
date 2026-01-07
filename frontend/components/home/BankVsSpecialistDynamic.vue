<template>
  <section class="py-16 sm:py-20 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Educational header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
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

        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
          Why comparing saves you money
        </h2>

        <p class="text-lg text-neutral-600 max-w-3xl mx-auto mb-6">
          Banks charge hidden fees through poor exchange rates.<br>
          Here's a real example of sending <span class="font-bold text-neutral-900">$500</span> from
          <span class="inline-flex items-center gap-1.5 font-semibold text-brand-700">
            🇺🇸 United States to 🇲🇽 Mexico
          </span>
        </p>
        <div class="flex justify-center mb-6">
          <span class="inline-block bg-brand-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            {{ new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
          </span>
        </div>

        <!-- Key stat callout -->
        <div
          v-if="comparison?.savings"
          class="inline-flex items-center gap-3 bg-white border-2 border-brand-200 rounded-2xl px-6 py-4 shadow-lg"
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
            <div class="text-2xl font-bold text-success-600">
              Save {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }}+
            </div>
            <div class="text-sm text-neutral-600">
              by choosing the right provider
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
        <p class="text-sm text-neutral-500">
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
        <p class="text-sm text-neutral-500">
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
        <p class="text-sm text-neutral-500">
          Please try again later or check a different corridor.
        </p>
      </div>

      <!-- Side by Side Comparison Boxes -->
      <div
        v-else-if="comparison"
        class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16"
      >
        <!-- Wells Fargo Box -->
        <div class="bg-white rounded-3xl border-2 border-red-200 p-8 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="flex items-center gap-4 mb-6">
            <div
              v-if="comparison.bank.logoUrl"
              class="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-red-200 overflow-hidden flex-shrink-0"
            >
              <img
                :src="comparison.bank.logoUrl"
                :alt="comparison.bank.name"
                class="w-full h-full object-contain p-2"
              />
            </div>
            <div
              v-else
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-neutral-900">
                {{ comparison.bank.name }}
              </h3>
              <p class="text-sm text-neutral-500">
                Traditional Bank
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="bg-red-50 rounded-xl p-5 border border-red-200">
              <div class="text-sm text-neutral-600 mb-2">Exchange Rate</div>
              <div class="text-2xl font-bold text-neutral-900">
                {{ formatRate(comparison.bank.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
              </div>
              <div class="text-xs text-red-600 font-medium mt-2">
                {{ comparison.bank.marginPct.toFixed(1) }}% below market rate
              </div>
            </div>

            <div class="bg-red-50 rounded-xl p-5 border border-red-200">
              <div class="text-sm text-neutral-600 mb-2">Transfer Fee</div>
              <div class="text-2xl font-bold text-red-600">
                {{ formatMoney(comparison.bank.fee, comparison.corridor.sendCurrency) }}
              </div>
            </div>

            <div class="bg-neutral-100 rounded-2xl p-6 border-2 border-neutral-300">
              <div class="text-sm text-neutral-600 mb-2">Recipient Gets</div>
              <div class="text-4xl font-bold text-neutral-900 mb-2">
                {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.bank.recipientGets).toLocaleString() }}
              </div>
              <div class="flex items-center gap-2 text-sm text-neutral-600">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ comparison.bank.delivery }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Best Specialist Box -->
        <div class="bg-white rounded-3xl border-3 border-emerald-500 p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
            BEST DEAL
          </div>
          
          <div class="flex items-center gap-4 mb-6">
            <div
              v-if="comparison.top.logoUrl"
              class="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-emerald-200 overflow-hidden flex-shrink-0"
            >
              <img
                :src="comparison.top.logoUrl"
                :alt="comparison.top.name"
                class="w-full h-full object-contain p-2"
              />
            </div>
            <div
              v-else
              class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-neutral-900">
                {{ comparison.top.name }}
              </h3>
              <p class="text-sm text-emerald-700 font-medium">
                Money Transfer Specialist
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <div class="text-sm text-neutral-600 mb-2">Exchange Rate</div>
              <div class="text-2xl font-bold text-emerald-700">
                {{ formatRate(comparison.top.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
              </div>
              <div class="text-xs text-emerald-600 font-medium mt-2">
                {{ (100 - comparison.top.marginPct).toFixed(1) }}% of market rate
              </div>
            </div>

            <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <div class="text-sm text-neutral-600 mb-2">Transfer Fee</div>
              <div class="text-2xl font-bold text-emerald-600">
                {{ formatMoney(comparison.top.fee, comparison.corridor.sendCurrency) }}
              </div>
            </div>

            <div class="bg-emerald-600 rounded-2xl p-6 border-2 border-emerald-400 text-white">
              <div class="text-sm opacity-90 mb-2">Recipient Gets</div>
              <div class="text-4xl font-bold mb-2">
                {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.top.recipientGets).toLocaleString() }}
              </div>
              <div
                v-if="comparison.savings"
                class="bg-white/20 backdrop-blur rounded-lg px-4 py-2 mt-3"
              >
                <div class="text-lg font-bold">
                  +{{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }} more
                </div>
                <div class="text-sm opacity-90 mt-1">
                  vs {{ comparison.bank.name }}
                </div>
              </div>
              <div class="flex items-center gap-2 text-sm opacity-90 mt-3">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{{ comparison.top.delivery }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Understanding Hidden Costs Section -->
  <section class="w-screen py-20 sm:py-28 bg-gray-900 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]" style="color: var(--tw-ring-offset-color);">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h3 class="text-4xl sm:text-5xl font-bold text-white mb-6">
          Understanding the hidden costs
        </h3>
        <p class="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
          Banks don't just charge fees. They make most of their money through exchange rate markup. Here's how it works, step by step.
        </p>
      </div>

      <!-- 3 Horizontal Steps -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <!-- Step 1: The Hidden Markup -->
        <div class="bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-xl">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-6">
            1
          </div>
          <h4 class="text-2xl font-bold text-neutral-900 mb-4">
            The Hidden Markup
          </h4>
          <p class="text-neutral-700 leading-relaxed mb-4">
            Banks advertise "low fees" or even "no fees," but they hide their profit in the exchange rate itself. This markup typically ranges from <strong class="text-blue-700">3% to 5%</strong> above the real mid-market rate.
          </p>
          <p class="text-neutral-700 leading-relaxed mb-6 text-sm">
            When you send money internationally, there's a real exchange rate that financial institutions use between themselves. But banks offer you a worse rate and pocket the difference.
          </p>
          <div v-if="comparison" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p class="text-sm font-bold text-neutral-900 mb-3">
              {{ comparison.bank.name }}
            </p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-neutral-600">Exchange rate:</span>
                <span class="font-bold text-neutral-900">1 {{ comparison.corridor.sendCurrency }} = {{ formatRate(comparison.bank.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-600">Amount sent:</span>
                <span class="font-bold text-neutral-900">{{ formatMoney(amount, comparison.corridor.sendCurrency) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-600">Upfront fee:</span>
                <span class="font-bold text-neutral-900">{{ formatMoney(comparison.bank.fee, comparison.corridor.sendCurrency) }}</span>
              </div>
              <div v-if="comparison.savings" class="pt-2 border-t border-blue-200">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Lost potential (delta):</span>
                  <span class="font-bold text-blue-700">{{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }}</span>
                </div>
                <p class="text-xs text-neutral-500 mt-1">
                  Even with a good rate, high fees reduce what your family receives
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Compare the Difference -->
        <div class="bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-xl">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-6">
            2
          </div>
          <h4 class="text-2xl font-bold text-neutral-900 mb-4">
            Compare the Difference
          </h4>
          <p class="text-neutral-700 leading-relaxed mb-6">
            Exchange rates fluctuate throughout the day. Money transfer specialists offer better rates because they focus exclusively on international transfers. Remit-Scout shows you real-time comparisons so you can see exactly how much more your family receives.
          </p>
          <div v-if="comparison" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p class="text-xs text-neutral-600 mb-2">Expensive option:</p>
              <p class="text-sm font-bold text-neutral-900 mb-1">
                {{ comparison.bank.name }}
              </p>
              <p class="text-sm text-blue-700">
                1 {{ comparison.corridor.sendCurrency }} = {{ formatRate(comparison.bank.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
              </p>
              <p class="text-xs text-neutral-600 mt-2">
                Recipient gets: {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.bank.recipientGets).toLocaleString() }}
              </p>
            </div>
            <div class="bg-blue-600 rounded-xl p-4 text-white">
              <p class="text-xs text-blue-100 mb-2">Better option:</p>
              <p class="text-sm font-bold mb-1">
                {{ comparison.top.name }}
              </p>
              <p class="text-sm">
                1 {{ comparison.corridor.sendCurrency }} = {{ formatRate(comparison.top.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
              </p>
              <p class="text-xs text-blue-100 mt-2">
                Recipient gets: {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.top.recipientGets).toLocaleString() }}
              </p>
              <p v-if="comparison.savings && comparison.savings.recipientGetsDifference > 0" class="text-xs font-bold mt-2">
                +{{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }} more per transfer
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3: Annual Savings -->
        <div class="bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-xl flex flex-col">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-6">
            3
          </div>
          <h4 class="text-2xl font-bold text-neutral-900 mb-4">
            Potential Savings
          </h4>
          <p class="text-neutral-700 leading-relaxed mb-6">
            If you send money regularly, these small differences add up. By comparing rates and choosing the better option, you can save significantly over a year. The savings from each transfer compound when you send money monthly or weekly, making the annual impact substantial. Even small percentage differences can translate to hundreds of dollars saved annually, money that can go directly to your family instead of fees and hidden markups.
          </p>
          <div v-if="comparison?.savings" class="bg-blue-600 rounded-xl p-4 text-white mt-auto">
            <p class="text-xs text-blue-100 mb-2">Annual savings:</p>
            <p class="text-lg font-bold mb-1">
              {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference * 12).toLocaleString() }}
            </p>
            <p class="text-xs text-blue-100 mb-2">
              ≈ {{ formatMoney(Math.round((comparison.savings.recipientGetsDifference * 12) / comparison.midRate), comparison.corridor.sendCurrency) }} USD per year
            </p>
            <p class="text-xs text-blue-100 mt-2 pt-2 border-t border-blue-500">
              {{ comparison.corridor.recvCurrency }} {{ Math.round(comparison.savings.recipientGetsDifference).toLocaleString() }} saved per transfer × 12 months
            </p>
          </div>
          <div v-else class="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-auto">
            <p class="text-sm text-neutral-700 text-center">
              Compare rates to see your potential annual savings
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom Line -->
      <div class="bg-white rounded-3xl border-2 border-neutral-200 p-10 shadow-xl">
        <div class="flex flex-col lg:flex-row items-center gap-8 max-w-4xl mx-auto">
          <div class="flex-shrink-0 w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="flex-1 text-center lg:text-left">
            <h4 class="text-3xl font-bold text-neutral-900 mb-4">
              The Bottom Line
            </h4>
            <p class="text-neutral-700 text-lg leading-relaxed mb-4">
              Here's the thing: banks make more money when you don't shop around. They count on you using their service out of habit. But if you compare rates—which takes maybe two minutes—you'll often find better options that save you hundreds per year. That's money that could be going to your family instead of bank profits.
            </p>
            <p class="text-neutral-600 text-base leading-relaxed">
              Remit-Scout is free and shows you real rates from dozens of providers. Give it a try next time you send money—you might be surprised how much you can save.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center">
        <p class="text-sm text-slate-400" v-if="comparison">
          Live rates for ${{ amount }} • {{ comparison.corridor.from }} → {{ comparison.corridor.to }} • Updated {{ lastUpdated }}
        </p>
      </div>
    </div>
    </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
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

// Debug: Log data to console
if (process.client) {
  watch([data, pending, error], ([newData, newPending, newError]) => {
    console.log('BankVsSpecialistDynamic Debug:', {
      hasData: !!newData,
      dataValue: newData,
      pending: newPending,
      error: newError,
      comparison: comparison.value,
      hasComparison: !!comparison.value,
    })
  }, { immediate: true })
}
</script>
