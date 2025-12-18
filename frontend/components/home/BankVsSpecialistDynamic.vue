<template>
  <section class="py-16 sm:py-20 bg-neutral-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white rounded-3xl shadow-sm py-8 sm:py-12">
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
          Banks charge hidden fees through poor exchange rates. Here's a real example of sending <span class="font-bold text-neutral-900">$500</span> from
          <span class="inline-flex items-center gap-1.5 font-semibold text-brand-700">
            🇺🇸 United States to 🇲🇽 Mexico
          </span>
          <span class="inline-block ml-2 bg-brand-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            {{ new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
          </span>
        </p>

        <!-- Key stat callout -->
        <div class="inline-flex items-center gap-3 bg-white border-2 border-brand-200 rounded-2xl px-6 py-4 shadow-lg">
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
              Save MXN 214+
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

      <!-- Comparison cards -->
      <div
        v-else-if="comparison"
        class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16"
      >
        <!-- Bank card -->
        <div class="bg-white rounded-3xl border-2 border-neutral-300 p-8 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-neutral-900">
                  {{ comparison.bank.name }}
                </h3>
                <p class="text-sm text-neutral-500">
                  Traditional bank
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="bg-neutral-50 rounded-xl p-5">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-neutral-600">Exchange rate</span>
                <span class="text-lg font-bold text-neutral-900">
                  {{ formatRate(comparison.bank.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
                </span>
              </div>
              <div class="text-xs text-danger-600 font-medium">
                {{ comparison.bank.marginPct.toFixed(1) }}% below market rate
              </div>
            </div>

            <div class="bg-neutral-50 rounded-xl p-5">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-neutral-600">Transfer fee</span>
                <span class="text-lg font-bold text-danger-600">
                  {{ formatMoney(comparison.bank.fee, comparison.corridor.sendCurrency) }}
                </span>
              </div>
            </div>

            <div class="border-t-2 border-neutral-200 pt-6">
              <div class="bg-neutral-100 rounded-2xl p-6">
                <div class="text-sm text-neutral-600 mb-2">
                  Your recipient gets
                </div>
                <div class="text-4xl font-bold text-neutral-900 mb-3">
                  {{ comparison.corridor.recvCurrency }} {{ comparison.bank.recipientGets.toLocaleString() }}
                </div>
                <div class="flex items-center gap-2 text-sm text-neutral-600">
                  <svg
                    class="h-4 w-4"
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
                  <span>{{ comparison.bank.delivery }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top provider card -->
        <div class="bg-gradient-to-br from-brand-50 via-white to-brand-50 rounded-3xl border-3 border-brand-600 p-8 shadow-2xl relative overflow-hidden">
          <!-- Glow effect -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-brand-300 rounded-full blur-3xl opacity-20" />

          <div class="relative mb-8">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-2xl font-bold text-neutral-900">
                    {{ comparison.top.name }}
                  </h3>
                  <span class="bg-success-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Best deal
                  </span>
                </div>
                <p class="text-sm text-brand-700 font-medium">
                  Our pick for today
                </p>
              </div>
            </div>
          </div>

          <div class="relative space-y-6">
            <div class="bg-white/80 backdrop-blur rounded-xl p-5 border border-brand-200">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-neutral-600">Exchange rate</span>
                <span class="text-lg font-bold text-brand-700">
                  {{ formatRate(comparison.top.fxRate, comparison.corridor.sendCurrency, comparison.corridor.recvCurrency) }}
                </span>
              </div>
              <div class="text-xs text-success-600 font-medium">
                {{ (100 - comparison.top.marginPct).toFixed(1) }}% of market rate
              </div>
            </div>

            <div class="bg-white/80 backdrop-blur rounded-xl p-5 border border-brand-200">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-neutral-600">Transfer fee</span>
                <span class="text-lg font-bold text-success-600">
                  {{ formatMoney(comparison.top.fee, comparison.corridor.sendCurrency) }}
                </span>
              </div>
            </div>

            <div class="border-t-2 border-brand-200 pt-6">
              <div class="bg-brand-600 rounded-2xl p-6 text-white">
                <div class="text-sm opacity-90 mb-2">
                  Your recipient gets
                </div>
                <div class="text-4xl font-bold mb-3">
                  {{ comparison.corridor.recvCurrency }} {{ comparison.top.recipientGets.toLocaleString() }}
                </div>
                <div class="bg-success-500 rounded-lg px-4 py-2 mb-3 inline-block">
                  <div class="text-lg font-bold">
                    +{{ comparison.corridor.recvCurrency }} {{ (comparison.top.recipientGets - comparison.bank.recipientGets).toLocaleString() }} more
                  </div>
                </div>
                <div class="flex items-center gap-2 text-sm opacity-90">
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>{{ comparison.top.delivery }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Understanding Hidden Costs Section - Full Width -->
  <section class="w-screen py-20 sm:py-24 bg-slate-900 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <!-- Section Header -->
          <div class="text-center mb-16">
            <h3 class="text-4xl sm:text-5xl font-bold text-white mb-6">
              Understanding the hidden costs
            </h3>
            <p class="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Banks don't just charge fees—they make most of their money through exchange rate markup. Here's how it works, step by step.
            </p>
          </div>

          <!-- Horizontal Steps -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <!-- Step 1: The Problem -->
            <div class="relative flex flex-col h-full">
              <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500 text-white text-2xl font-bold mb-5 mx-auto shadow-lg">
                1
              </div>
              <div class="flex-1 bg-white rounded-2xl border-2 border-red-200 p-8 shadow-xl">
                <div class="text-center mb-6">
                  <div class="flex justify-center mb-4">
                    <svg class="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 class="text-2xl font-bold text-neutral-900 mt-4">
                    The Hidden Markup
                  </h4>
                </div>
                <p class="text-base text-neutral-700 mb-6 leading-relaxed">
                  Traditional banks advertise "low fees" or even "no fees," but they hide their profit in the exchange rate itself. This markup can range from <strong class="text-red-700">3-5%</strong> above the real mid-market rate.
                </p>
                <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-5">
                  <p class="text-sm font-bold text-red-900 mb-3">
                    Real Example:
                  </p>
                  <p class="text-sm text-neutral-800 mb-3 leading-relaxed">
                    If the real <strong>USD to MXN</strong> rate is <strong>18.50</strong>, a bank might offer you <strong>18.00</strong>, pocketing the <strong>0.50 difference</strong> on every dollar you send.
                  </p>
                  <p class="text-sm text-neutral-700 leading-relaxed">
                    On a <strong>$500 transfer</strong>, that <strong>3% hidden markup</strong> alone costs you <strong>$15</strong>, before any stated fees.
                  </p>
                </div>
              </div>
            </div>

            <!-- Step 2: The Solution -->
            <div class="relative flex flex-col h-full">
              <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white text-2xl font-bold mb-5 mx-auto shadow-lg">
                2
              </div>
              <div class="flex-1 bg-white rounded-2xl border-2 border-emerald-200 p-8 shadow-xl">
                <div class="text-center mb-6">
                  <div class="flex justify-center mb-4">
                    <svg class="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 class="text-2xl font-bold text-neutral-900 mt-4">
                    Why Specialists Win
                  </h4>
                </div>
                <p class="text-base text-neutral-700 mb-6 leading-relaxed">
                  Money transfer specialists like Remitly, Wise, and Instarem focus exclusively on international transfers. They've built modern technology that processes transfers faster and cheaper than banks.
                </p>
                <div class="space-y-4 mb-4">
                  <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div class="flex items-start gap-3">
                      <svg
                        class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <span class="text-sm font-bold text-emerald-900 block mb-1">Better Rates</span>
                        <span class="text-sm text-neutral-700">0.5-1% vs 3-5% banks</span>
                      </div>
                    </div>
                  </div>
                  <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div class="flex items-start gap-3">
                      <svg
                        class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <span class="text-sm font-bold text-emerald-900 block mb-1">Lower Fees</span>
                        <span class="text-sm text-neutral-700">$0-5 vs $15-45 banks</span>
                      </div>
                    </div>
                  </div>
                  <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div class="flex items-start gap-3">
                      <svg
                        class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <span class="text-sm font-bold text-emerald-900 block mb-1">Faster</span>
                        <span class="text-sm text-neutral-700">Minutes vs days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: The Result -->
            <div class="relative flex flex-col h-full">
              <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white text-2xl font-bold mb-5 mx-auto shadow-lg">
                3
              </div>
              <div class="flex-1 bg-white rounded-2xl border-2 border-brand-200 p-8 shadow-xl">
                <div class="text-center mb-6">
                  <div class="flex justify-center mb-4">
                    <svg class="w-16 h-16 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 class="text-2xl font-bold text-neutral-900 mt-4">
                    Your Real Savings
                  </h4>
                </div>
                <p class="text-base text-neutral-700 mb-6 leading-relaxed">
                  Using the example above with real data from today, here's what comparing actually saves you:
                </p>
                <div class="bg-gradient-to-br from-emerald-50 to-brand-50 border-2 border-emerald-300 rounded-2xl p-5 mb-5">
                  <div class="text-center mb-4">
                    <div class="text-4xl font-bold text-emerald-700 mb-2">
                      MXN 214+
                    </div>
                    <div class="text-sm text-emerald-600 font-semibold">
                      saved per $500 transfer
                    </div>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between items-center bg-white/60 rounded-lg px-4 py-2.5">
                      <span class="text-neutral-700">Wells Fargo:</span>
                      <span class="font-bold text-neutral-900">MXN 9,196</span>
                    </div>
                    <div class="flex justify-between items-center bg-emerald-100 rounded-lg px-4 py-2.5">
                      <span class="text-emerald-900 font-medium">Remitly:</span>
                      <span class="font-bold text-emerald-700 text-base">MXN 9,410</span>
                    </div>
                  </div>
                </div>
                <div class="bg-brand-50 rounded-xl p-5 border border-brand-200">
                  <p class="text-sm font-bold text-brand-900 mb-2">
                    Annual Impact:
                  </p>
                  <p class="text-base text-neutral-700 leading-relaxed">
                    If you send <strong>$500 monthly</strong>, choosing the right provider saves you <strong class="text-brand-700">over $140/year</strong>.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- Bottom Line - Full Width -->
          <div class="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-10 text-white shadow-2xl">
            <div class="flex items-center justify-center gap-6 max-w-5xl mx-auto">
              <div class="flex-shrink-0 w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div class="flex-1 text-center lg:text-left">
                <h4 class="text-3xl font-bold mb-3">
                  The Bottom Line
                </h4>
                <p class="text-white/95 text-xl leading-relaxed">
                  Banks count on customers not comparing. By taking <strong>5 minutes</strong> to check rates on <strong>Remit-Scout</strong>, you ensure more of your hard-earned money reaches your family. <strong>Every dollar counts.</strong>
                </p>
              </div>
            </div>
	          </div>
	        </div>

	      <!-- Footer disclaimer -->
	      <div class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mt-12">
	        <p class="text-center text-sm text-slate-400 max-w-2xl mx-auto">
          Example rates shown for ${{ amount }} transfer. Actual rates vary by amount and delivery method.
          <span class="block mt-2 text-xs">
            Updated {{ lastUpdated }}
          </span>
        </p>
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
const { data, pending } = await useRemittanceApi().useBankVsSpecialist(
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
