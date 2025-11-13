<template>
  <section class="py-16 sm:py-20 bg-gradient-to-b from-white via-brand-50/30 to-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Educational header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
            <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-left">
            <div class="text-2xl font-bold text-success-600">Save MXN 214+</div>
            <div class="text-sm text-neutral-600">by choosing the right provider</div>
          </div>
        </div>
      </div>

      <div v-if="pending" class="flex justify-center py-12">
        <div class="animate-pulse">
          <div class="h-8 w-48 bg-neutral-200 rounded mb-4"></div>
          <div class="h-32 w-64 bg-neutral-200 rounded"></div>
        </div>
      </div>

      <!-- Comparison cards -->
      <div v-else-if="comparison" class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
        <!-- Bank card -->
        <div class="bg-white rounded-3xl border-2 border-neutral-300 p-8 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-neutral-900">{{ comparison.bank.name }}</h3>
                <p class="text-sm text-neutral-500">Traditional bank</p>
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
                <div class="text-sm text-neutral-600 mb-2">Your recipient gets</div>
                <div class="text-4xl font-bold text-neutral-900 mb-3">
                  {{ comparison.corridor.recvCurrency }} {{ comparison.bank.recipientGets.toLocaleString() }}
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
        </div>

        <!-- Top provider card -->
        <div class="bg-gradient-to-br from-brand-50 via-white to-brand-50 rounded-3xl border-3 border-brand-600 p-8 shadow-2xl relative overflow-hidden">
          <!-- Glow effect -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-brand-300 rounded-full blur-3xl opacity-20"></div>
          
          <div class="relative mb-8">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-2xl font-bold text-neutral-900">{{ comparison.top.name }}</h3>
                  <span class="bg-success-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Best deal
                  </span>
                </div>
                <p class="text-sm text-brand-700 font-medium">Our pick for today</p>
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
                <div class="text-sm opacity-90 mb-2">Your recipient gets</div>
                <div class="text-4xl font-bold mb-3">
                  {{ comparison.corridor.recvCurrency }} {{ comparison.top.recipientGets.toLocaleString() }}
                </div>
                <div class="bg-success-500 rounded-lg px-4 py-2 mb-3 inline-block">
                  <div class="text-lg font-bold">
                    +{{ comparison.corridor.recvCurrency }} {{ (comparison.top.recipientGets - comparison.bank.recipientGets).toLocaleString() }} more
                  </div>
                </div>
                <div class="flex items-center gap-2 text-sm opacity-90">
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

      <!-- Educational breakdown section - 3 column landscape -->
      <div class="max-w-7xl mx-auto mb-12">
        <div class="bg-gradient-to-br from-neutral-50 to-white rounded-3xl border-2 border-neutral-200 p-10 sm:p-12">
          <!-- Header -->
          <div class="text-center mb-10">
            <h3 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
              Understanding the hidden costs
            </h3>
            <p class="text-lg text-neutral-600 max-w-3xl mx-auto">
              Banks don't just charge fees—they make most of their money through the exchange rate markup. Here's what you need to know.
            </p>
          </div>

          <!-- 3 Column Layout -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <!-- Column 1: The Hidden Markup -->
            <div class="bg-white rounded-2xl border-2 border-neutral-200 p-7 hover:border-brand-300 transition-colors">
              <div class="text-5xl mb-5">
                🕵️
              </div>
              
              <h4 class="text-xl font-bold text-neutral-900 mb-3">The Hidden Markup</h4>
              
              <p class="text-sm text-neutral-700 mb-4 leading-relaxed">
                Traditional banks advertise "low fees" or even "no fees," but they hide their profit in the exchange rate itself. This markup can range from <span class="whitespace-nowrap">3-5%</span> above the real mid-market rate.
              </p>
              
              <div class="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-4">
                <p class="text-xs font-semibold text-danger-800 mb-1">Real Example:</p>
                <p class="text-sm text-neutral-700">
                  If the real <span class="whitespace-nowrap">USD to MXN</span> rate is 18.50, a bank might offer you 18.00, pocketing the <span class="whitespace-nowrap">0.50 difference</span> on every dollar you send.
                </p>
              </div>
              
              <p class="text-sm text-neutral-600 leading-relaxed">
                On a <span class="whitespace-nowrap">$500 transfer,</span> that <span class="whitespace-nowrap">3% hidden markup</span> alone costs you <span class="whitespace-nowrap">$15—before</span> any stated fees. Most customers never notice this "hidden tax."
              </p>
            </div>

            <!-- Column 2: Why Specialists Win -->
            <div class="bg-white rounded-2xl border-2 border-neutral-200 p-7 hover:border-brand-300 transition-colors">
              <div class="text-5xl mb-5">
                🚀
              </div>
              
              <h4 class="text-xl font-bold text-neutral-900 mb-3">Why Specialists Win</h4>
              
              <p class="text-sm text-neutral-700 mb-4 leading-relaxed">
                Money transfer specialists like Remitly, Wise, and Instarem focus exclusively on international transfers. They've built modern technology that processes transfers faster and cheaper than banks.
              </p>
              
              <div class="space-y-3 mb-4">
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-neutral-700">Near mid-market exchange rates <span class="whitespace-nowrap">(0.5-1% markup</span> vs <span class="whitespace-nowrap">3-5%</span> for banks)</p>
                </div>
                
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-neutral-700">Lower transfer fees <span class="whitespace-nowrap">($0-5</span> vs <span class="whitespace-nowrap">$15-45</span> for banks)</p>
                </div>
                
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-sm text-neutral-700">Faster delivery (minutes to hours vs days for banks)</p>
                </div>
              </div>
              
              <p class="text-sm text-neutral-600 leading-relaxed">
                They pass savings to customers because they compete on price and speed, not brand recognition.
              </p>
            </div>

            <!-- Column 3: Your Savings -->
            <div class="bg-white rounded-2xl border-2 border-neutral-200 p-7 hover:border-brand-300 transition-colors">
              <div class="text-5xl mb-5">
                💰
              </div>
              
              <h4 class="text-xl font-bold text-neutral-900 mb-3">Your Real Savings</h4>
              
              <p class="text-sm text-neutral-700 mb-4 leading-relaxed">
                Using the example above with real data from today, here's what comparing actually saves you:
              </p>
              
              <div class="bg-success-50 border-2 border-success-300 rounded-xl p-5 mb-4">
                <div class="text-center mb-3">
                  <div class="text-3xl font-bold text-success-700 mb-1"><span class="whitespace-nowrap">MXN 214+</span></div>
                  <div class="text-xs text-success-600 font-medium">saved per <span class="whitespace-nowrap">$500 transfer</span></div>
                </div>
                
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between text-neutral-700">
                    <span>Wells Fargo delivers:</span>
                    <span class="font-semibold whitespace-nowrap">MXN 9,196</span>
                  </div>
                  <div class="flex justify-between text-success-700">
                    <span>Remitly delivers:</span>
                    <span class="font-bold whitespace-nowrap">MXN 9,410</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-brand-50 rounded-xl p-4">
                <p class="text-sm font-semibold text-brand-900 mb-2">Annual Impact:</p>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  If you send <span class="whitespace-nowrap">$500 monthly,</span> choosing the right provider saves you <span class="font-bold text-brand-700 whitespace-nowrap">over $140/year.</span> That's money that can support your family, not bank profits.
                </p>
              </div>
            </div>
          </div>

          <!-- Bottom Line Callout -->
          <div class="bg-brand-600 rounded-2xl p-8 text-white">
            <div class="flex items-start gap-5 max-w-4xl mx-auto">
              <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 class="text-2xl font-bold mb-3">💡 The Bottom Line</h4>
                <p class="text-white/95 text-lg leading-relaxed">
                  Banks count on customers not comparing. By taking <span class="whitespace-nowrap">5 minutes</span> to check rates on <span class="whitespace-nowrap">Remit-Scout,</span> you ensure more of your hard-earned money reaches your family. 
                  <span class="font-bold whitespace-nowrap">Every dollar counts.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer disclaimer -->
      <p class="text-center text-sm text-neutral-500 max-w-2xl mx-auto">
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
  amount
)

const comparison = computed(() => data.value?.data)

const lastUpdated = computed(() => {
  if (!comparison.value) return ''
  return getRelativeTime(comparison.value.updatedAt)
})
</script>




