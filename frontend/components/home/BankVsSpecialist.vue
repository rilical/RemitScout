<template>
  <section class="py-12 sm:py-16 bg-gradient-to-b from-neutral-50 to-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-8">
        {{ STR.explainer.title }}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div class="bg-white rounded-2xl border-2 border-neutral-200 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-neutral-900">
              Your bank
            </h3>
            <span class="text-2xl">🏦</span>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center py-3 border-b border-neutral-100">
              <span class="text-sm text-neutral-600">Exchange rate</span>
              <span class="font-semibold text-neutral-900">1 USD → PHP {{ data.bank.rate }}</span>
            </div>

            <div class="flex justify-between items-center py-3 border-b border-neutral-100">
              <span class="text-sm text-neutral-600">Transfer fee</span>
              <span class="font-semibold text-danger-600">${{ data.bank.fee.toFixed(2) }}</span>
            </div>

            <div class="bg-neutral-50 rounded-xl p-4 mt-4">
              <div class="text-xs text-neutral-500 mb-1">
                Recipient gets
              </div>
              <div class="text-3xl font-bold text-neutral-900">
                PHP {{ formatNumber(data.bank.recipientGets) }}
              </div>
            </div>

            <div class="flex items-center gap-2 text-sm text-neutral-600 pt-2">
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
              <span>{{ data.bank.delivery }}</span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-brand-50 to-white rounded-2xl border-2 border-brand-600 p-6 shadow-lg relative overflow-hidden">
          <div class="absolute top-2 right-2 bg-success-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Best deal
          </div>

          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-neutral-900">
              Top provider today
            </h3>
            <span class="text-2xl">✨</span>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center py-3 border-b border-brand-100">
              <span class="text-sm text-neutral-600">Exchange rate</span>
              <span class="font-semibold text-neutral-900">1 USD → PHP {{ data.specialist.rate }}</span>
            </div>

            <div class="flex justify-between items-center py-3 border-b border-brand-100">
              <span class="text-sm text-neutral-600">Transfer fee</span>
              <span class="font-semibold text-success-600">${{ data.specialist.fee.toFixed(2) }}</span>
            </div>

            <div class="bg-brand-600 rounded-xl p-4 mt-4 text-white">
              <div class="text-xs opacity-90 mb-1">
                Recipient gets
              </div>
              <div class="text-3xl font-bold">
                PHP {{ formatNumber(data.specialist.recipientGets) }}
              </div>
              <div class="text-sm mt-2 opacity-90">
                +PHP {{ formatNumber(data.specialist.recipientGets - data.bank.recipientGets) }} more
              </div>
            </div>

            <div class="flex items-center gap-2 text-sm text-neutral-600 pt-2">
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
              <span>{{ data.specialist.delivery }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 text-center">
        <button
          class="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 rounded-lg px-3 py-1"
          @click="showTooltip = !showTooltip"
        >
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          What is exchange margin?
        </button>

        <div
          v-if="showTooltip"
          class="mt-3 max-w-2xl mx-auto bg-neutral-100 rounded-lg p-4 text-sm text-neutral-700"
        >
          {{ STR.explainer.tooltip }}
        </div>
      </div>

      <p class="mt-8 text-center text-xs text-neutral-500 max-w-2xl mx-auto">
        {{ STR.explainer.disclaimer }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BANK_VS_SPECIALIST_DATA } from '~/utils/constants'

const { STR } = useStrings()
const { formatNumber } = useFormat()

const data = BANK_VS_SPECIALIST_DATA
const showTooltip = ref(false)
</script>
