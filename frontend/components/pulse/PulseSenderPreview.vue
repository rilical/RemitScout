<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Demo Gauge -->
    <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
      <div class="border-b border-neutral-700 px-6 py-4">
        <h2 class="text-lg font-bold text-white">
          Best Time to Send
        </h2>
        <p class="text-sm text-neutral-400">
          Example signal for an example corridor
        </p>
      </div>

      <div class="p-6">
        <div class="flex flex-col items-center">
          <div class="relative h-44 w-44">
            <svg
              viewBox="0 0 120 120"
              class="h-full w-full"
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="rgba(255,255,255,0.10)"
                stroke-width="12"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                :stroke="ringColor"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                :stroke-dasharray="`${dash} ${circumference}`"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-4xl font-extrabold text-white font-mono">
                {{ sendScore }}
              </div>
              <div
                class="mt-1 text-xs font-semibold uppercase tracking-wider"
                :class="ringTextClass"
              >
                {{ label }}
              </div>
              <div class="mt-1 text-[11px] text-neutral-400">
                {{ corridorLabel }}
              </div>
            </div>
          </div>

          <p class="mt-4 max-w-xs text-center text-sm text-neutral-300">
            Example preview. Plus unlocks corridor timing signals and deeper history.
          </p>
        </div>
      </div>
    </div>

    <!-- Demo Quotes -->
    <div class="rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden">
      <div class="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
        <div>
          <h2 class="text-lg font-bold text-white">
            Sample Provider Quotes
          </h2>
          <p class="text-sm text-neutral-400">
            Example rates for {{ amountLabel }} ({{ fromCurrency }} → {{ toCurrency }})
          </p>
        </div>
        <div class="text-sm">
          <span class="text-neutral-400">Mid-market:</span>
          <span class="ml-2 font-mono font-bold text-white">{{ midMarket.toFixed(4) }}</span>
        </div>
      </div>

      <div class="p-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(quote, index) in quotes"
            :key="quote.provider"
            class="group relative flex items-center justify-between rounded-lg border p-4 transition-all"
            :class="index === 0 ? 'border-brand-600 bg-brand-600/10' : 'border-neutral-700 bg-neutral-900'"
          >
            <div
              v-if="index === 0"
              class="absolute -top-2 -right-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase"
            >
              Best
            </div>

            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
                :style="{ backgroundColor: quote.color + '30' }"
              >
                {{ quote.provider.charAt(0) }}
              </div>
              <div>
                <div class="font-semibold text-white">
                  {{ quote.provider }}
                </div>
                <div class="text-xs text-neutral-400">
                  {{ quote.speed }}
                </div>
              </div>
            </div>

            <div class="text-right">
              <div
                class="text-lg font-bold"
                :class="index === 0 ? 'text-brand-600' : 'text-white'"
              >
                {{ formatMoney(quote.recipientGets, { currency: toCurrency, maximumFractionDigits: 0 }) }}
              </div>
              <div class="flex items-center justify-end gap-2 text-xs">
                <span class="text-neutral-500">Fee: {{ formatMoney(quote.fee, { currency: fromCurrency, maximumFractionDigits: 2 }) }}</span>
                <span class="text-neutral-600">•</span>
                <span class="rounded bg-neutral-700 px-1.5 py-0.5 text-neutral-300">
                  {{ quote.markupBps }} bps
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 border-t border-neutral-700 pt-4">
          <div class="flex items-center justify-between gap-3">
            <div class="text-xs text-neutral-500">
              Preview only. Quotes are shown as an example.
            </div>
            <div class="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300">
              Compare all providers
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '~/shared/lib/format'

const sendScore = 86
const amount = 1000
const fromCurrency = 'USD'
const toCurrency = 'PHP'
const corridorLabel = 'US → PH'
const midMarket = 56.1234

const amountLabel = computed(() => formatMoney(amount, { currency: fromCurrency, maximumFractionDigits: 0 }))

const quotes = [
  { provider: 'Wise', recipientGets: 55600, fee: 3.99, markupBps: 42, speed: 'Minutes', color: '#10B981' },
  { provider: 'Remitly', recipientGets: 55320, fee: 2.99, markupBps: 78, speed: 'Minutes', color: '#2563EB' },
  { provider: 'WorldRemit', recipientGets: 54980, fee: 1.99, markupBps: 110, speed: 'Same day', color: '#F59E0B' },
]

const circumference = 2 * Math.PI * 50
const dash = (sendScore / 100) * circumference

const label = computed(() => {
  if (sendScore >= 90) return 'Great'
  if (sendScore >= 80) return 'Good'
  if (sendScore >= 70) return 'Fair'
  return 'Wait'
})

const ringColor = computed(() => {
  if (sendScore >= 90) return '#10B981'
  if (sendScore >= 80) return '#2563EB'
  if (sendScore >= 70) return '#EAB308'
  return '#6B7280'
})

const ringTextClass = computed(() => {
  if (sendScore >= 90) return 'text-emerald-400'
  if (sendScore >= 80) return 'text-blue-400'
  if (sendScore >= 70) return 'text-yellow-400'
  return 'text-neutral-300'
})
</script>
