<template>
  <div class="py-16 bg-gray-50">
    <div class="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          {{ displayTitle }}
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ displaySubtitle }}
        </p>
      </div>

      <!-- Table Card (960×520) -->
      <div
        class="mx-auto w-full max-w-[960px] rounded-2xl bg-white p-6 shadow-lg"
        style="height: 520px"
      >
        <!-- Currency Chips Row -->
        <div class="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200">
          <div
            v-for="currency in displayCurrencies"
            :key="currency"
            class="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
          >
            {{ currency }}
          </div>
        </div>

        <!-- Exchange Rate Table with horizontal scroll on mobile -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <caption class="mb-4 text-left text-xs text-gray-500">
              {{ displayTableCaption }}
            </caption>

            <!-- Sticky Header -->
            <thead class="sticky top-0 bg-white border-b border-gray-200">
              <tr>
                <th class="border-r border-gray-100 px-3 py-2 text-left font-medium text-gray-900">
                  Currency
                </th>
                <th
                  v-for="colLabel in displayColumnLabels"
                  :key="colLabel"
                  class="border-r border-gray-100 px-3 py-2 text-right font-medium text-gray-900 last:border-r-0"
                >
                  {{ colLabel }}
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody>
              <tr
                v-for="(row, rowIndex) in displayRates"
                :key="displayRowLabels[rowIndex]"
                class="border-b border-gray-100 transition-colors hover:bg-gray-50"
              >
                <td class="border-r border-gray-100 px-3 py-2 font-medium text-gray-900">
                  {{ displayRowLabels[rowIndex] }}
                </td>
                <td
                  v-for="(rate, colIndex) in row"
                  :key="colIndex"
                  class="border-r border-gray-100 px-3 py-2 text-right text-gray-700 last:border-r-0"
                >
                  {{ rate }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Caption with Source and Last Updated -->
        <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500">
          <span>{{ displaySourceCaption }}</span>
          <span>{{ lastUpdatedLabel }}</span>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="text-center mt-8">
        <p class="text-sm text-gray-500 mb-4">
          {{ displayDisclaimer }}
        </p>
        <NuxtLink
          to="/send-money/us-to-in"
          class="inline-flex items-center rounded-lg border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700"
        >
          {{ displayCtaText }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink } from '#components'

const { timeAgo } = useFormat()

interface Props {
  title?: string
  subtitle?: string
  tableCaption?: string
  sourceCaption?: string
  disclaimer?: string
  ctaText?: string
  currencies?: string[]
  columnLabels?: string[]
  rowLabels?: string[]
  rates?: string[][]
  updatedAt?: string
}

const props = defineProps<Props>()

const DEFAULT_TITLE = 'Keep an eye on the exchange rates and set up smart alerts'
const DEFAULT_SUBTITLE
  = 'Monitor live exchange rates for popular currency pairs and get notified when rates reach your target levels.'
const DEFAULT_TABLE_CAPTION = 'Live exchange rates - rates are updated every 60 seconds'
const DEFAULT_SOURCE_CAPTION = 'Source: Financial data providers'
const DEFAULT_DISCLAIMER = 'Rates are indicative and may vary based on amount and payment method.'
const DEFAULT_CTA_TEXT = 'Compare All Rates'

const DEFAULT_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'AUD', 'RUB', 'INR'] as const
const DEFAULT_LABELS = [...DEFAULT_CURRENCIES]
const DEFAULT_RATES = [
  ['1.0000', '0.9205', '0.7956', '1.3456', '0.8956', '1.4567', '95.1234', '83.4567'],
  ['1.0865', '1.0000', '0.8645', '1.4623', '0.9734', '1.5823', '103.4567', '90.7890'],
  ['1.2578', '1.1567', '1.0000', '1.6912', '1.1256', '1.8301', '119.6789', '105.1234'],
  ['0.7432', '0.6834', '0.5912', '1.0000', '0.6656', '1.0823', '70.7890', '62.1234'],
  ['1.1178', '1.0278', '0.8889', '1.5023', '1.0000', '1.6267', '106.3456', '93.4567'],
  ['0.6865', '0.6312', '0.5467', '0.9234', '0.6145', '1.0000', '65.3456', '57.4567'],
  ['0.0105', '0.0097', '0.0084', '0.0141', '0.0094', '0.0153', '1.0000', '0.8789'],
  ['0.0120', '0.0110', '0.0095', '0.0161', '0.0107', '0.0174', '1.1378', '1.0000'],
] as const

const displayTitle = computed(() => props.title ?? DEFAULT_TITLE)
const displaySubtitle = computed(() => props.subtitle ?? DEFAULT_SUBTITLE)
const displayTableCaption = computed(() => props.tableCaption ?? DEFAULT_TABLE_CAPTION)
const displaySourceCaption = computed(() => props.sourceCaption ?? DEFAULT_SOURCE_CAPTION)
const displayDisclaimer = computed(() => props.disclaimer ?? DEFAULT_DISCLAIMER)
const displayCtaText = computed(() => props.ctaText ?? DEFAULT_CTA_TEXT)

const displayCurrencies = computed(() => props.currencies ?? DEFAULT_CURRENCIES)
const displayColumnLabels = computed(() => props.columnLabels ?? DEFAULT_LABELS)
const displayRowLabels = computed(() => props.rowLabels ?? DEFAULT_LABELS)
const displayRates = computed(() => props.rates ?? DEFAULT_RATES)
const displayUpdatedAt = computed(
  () => props.updatedAt ?? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
)
const lastUpdatedLabel = computed(() => timeAgo(displayUpdatedAt.value))
</script>
