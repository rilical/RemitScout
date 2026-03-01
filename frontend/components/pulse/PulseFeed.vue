<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-h4 font-bold text-white flex items-center gap-2">
        <svg
          class="h-5 w-5 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        What's Moving
      </h2>
      <select
        v-model="timeRange"
        class="rounded-xl border border-white/10 bg-surface/5 px-4 py-2 text-body-sm text-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
      >
        <option
          value="24h"
          class="bg-neutral-800"
        >
          Last 24 hours
        </option>
        <option
          value="7d"
          class="bg-neutral-800"
        >
          Last 7 days
        </option>
        <option
          value="30d"
          class="bg-neutral-800"
        >
          Last 30 days
        </option>
      </select>
    </div>

    <div class="space-y-4">
      <div
        v-for="card in feedCards"
        :key="card.id"
        class="group rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 overflow-hidden transition-all duration-300 hover:border-white/20"
      >
        <div class="flex items-stretch">
          <div
            class="w-1.5 flex-shrink-0"
            :class="card.trendClass"
          />
          <div class="flex-1 p-6">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-body-sm font-semibold"
                    :class="card.impactClass"
                  >
                    <svg
                      v-if="card.impact === 'high'"
                      class="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.942 1.312 3.346.47 1.254.78 2.654 1.058 3.654z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{ card.impactLabel }}
                  </span>
                  <span class="text-body-sm text-rs-muted">{{ card.timestamp }}</span>
                </div>

                <h3 class="text-body-lg font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
                  {{ card.title }}
                </h3>

                <div class="flex flex-wrap gap-2 mb-4">
                  <span
                    v-for="tag in card.tags"
                    :key="tag"
                    class="rounded-full bg-surface/5 border border-white/10 px-3 py-1 text-body-sm font-medium text-neutral-400"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="hidden sm:block w-24 h-14 flex-shrink-0">
                <svg
                  viewBox="0 0 100 50"
                  class="h-full w-full"
                >
                  <defs>
                    <linearGradient
                      :id="`gradient-${card.id}`"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        :style="`stop-color: ${card.gradientStart}; stop-opacity: 0.3`"
                      />
                      <stop
                        offset="100%"
                        :style="`stop-color: ${card.gradientStart}; stop-opacity: 0`"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    :d="`M0,${card.sparklineStart} ${card.sparkline} L100,50 L0,50 Z`"
                    :fill="`url(#gradient-${card.id})`"
                  />
                  <polyline
                    :points="card.sparkline"
                    fill="none"
                    :stroke="card.trendColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div class="rounded-xl bg-surface/5 p-4 mb-4">
              <p class="text-body-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Why it matters
              </p>
              <ul class="space-y-2">
                <li
                  v-for="reason in card.reasons"
                  :key="reason"
                  class="flex items-start gap-2 text-body-sm text-neutral-300"
                >
                  <svg
                    class="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span>{{ reason }}</span>
                </li>
              </ul>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-white/5">
              <div class="flex gap-3">
                <button
                  :id="`pulse-feed-details-toggle-${card.id}`"
                  type="button"
                  class="text-body-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                  :aria-expanded="expandedCards.has(card.id)"
                  :aria-controls="`pulse-feed-details-panel-${card.id}`"
                  @click="toggleDetails(card.id)"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {{ expandedCards.has(card.id) ? 'Hide' : 'View' }} details
                </button>
              </div>
              <button
                class="flex items-center gap-2 rounded-lg border border-white/10 bg-surface/5 px-3 py-1.5 text-body-sm font-medium text-neutral-300 transition-all hover:bg-surface/10 hover:text-white"
                @click="setAlert(card)"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Set alert
                <span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-body-sm font-bold text-primary-400">Plus</span>
              </button>
            </div>

                <div
                  v-if="expandedCards.has(card.id)"
                  :id="`pulse-feed-details-panel-${card.id}`"
                  class="mt-4 rounded-xl bg-neutral-900/50 border border-white/5 p-4"
                  role="region"
                  :aria-labelledby="`pulse-feed-details-toggle-${card.id}`"
                >
                  <p class="text-body-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Provider comparison
                  </p>
              <div class="space-y-3">
                <div
                  v-for="(provider, index) in card.providers"
                  :key="provider.name"
                  class="flex items-center justify-between p-3 rounded-lg"
                  :class="index === 0 ? 'bg-success-600/10 border border-success-600/20' : 'bg-surface/5'"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="w-6 h-6 rounded-full flex items-center justify-center text-body-sm font-bold"
                      :class="index === 0 ? 'bg-success-600 text-white' : 'bg-surface/10 text-neutral-400'"
                    >
                      {{ index + 1 }}
                    </span>
                    <span class="font-medium text-white">{{ provider.name }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-neutral-300">{{ provider.recipientGets }}</span>
                    <span
                      class="text-body-sm font-semibold px-2 py-0.5 rounded"
                      :class="provider.change.startsWith('+') ? 'bg-success-600/20 text-success-600' : provider.change === 'Available' ? 'bg-primary-500/20 text-primary-400' : 'bg-danger-600/20 text-danger-600'"
                    >
                      {{ provider.change }}
                    </span>
                  </div>
                </div>
              </div>
              <p class="mt-4 text-body-sm text-rs-muted italic">
                Note: Actual amounts may change at checkout based on payment method, KYC status, and timing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  filters: {
    from: string
    to: string
  }
}

defineProps<Props>()

const timeRange = ref('24h')
const expandedCards = ref(new Set<string>())

const feedCards = ref([
  {
    id: '1',
    title: 'US→MX: Recipients get ~+MXN 120 more today vs yesterday',
    tags: ['US→MX', 'Bank Transfer', 'Wise', 'Remitly'],
    sparkline: '0,40 20,35 40,45 60,30 80,20 100,10',
    sparklineStart: 40,
    trendColor: '#10b981',
    trendClass: 'bg-success-600',
    gradientStart: '#10b981',
    impact: 'high',
    impactLabel: 'High impact',
    impactClass: 'bg-success-600/20 text-success-600',
    reasons: [
      'USD/MXN mid-rate moved 0.8% in recipients\' favor overnight',
      'Wise reduced their margin from 0.7% to 0.5% on this corridor',
    ],
    timestamp: '23 minutes ago',
    providers: [
      { name: 'Wise', recipientGets: 'MXN 18,342', change: '+MXN 145' },
      { name: 'Remitly', recipientGets: 'MXN 18,298', change: '+MXN 112' },
      { name: 'Xoom', recipientGets: 'MXN 18,156', change: '+MXN 98' },
    ],
  },
  {
    id: '2',
    title: 'Best deal switched: Remitly overtakes Wise for US→PH cash pickup',
    tags: ['US→PH', 'Cash Pickup', 'Remitly'],
    sparkline: '0,45 20,42 40,38 60,35 80,25 100,15',
    sparklineStart: 45,
    trendColor: '#3b82f6',
    trendClass: 'bg-primary-500',
    gradientStart: '#3b82f6',
    impact: 'medium',
    impactLabel: 'New leader',
    impactClass: 'bg-primary-500/20 text-primary-400',
    reasons: [
      'Remitly launched a 72-hour promo: 0% fee for cash pickup',
      'Better exchange rate vs Wise by 0.3%',
    ],
    timestamp: '1 hour ago',
    providers: [
      { name: 'Remitly', recipientGets: '₱56,890', change: '+₱234' },
      { name: 'Wise', recipientGets: '₱56,656', change: '+₱12' },
      { name: 'XE Money', recipientGets: '₱56,420', change: '-₱8' },
    ],
  },
  {
    id: '3',
    title: 'GB→IN: Quote success rate dropped 12% for weekend transfers',
    tags: ['GB→IN', 'Reliability', 'Weekend'],
    sparkline: '0,10 20,12 40,18 60,30 80,42 100,45',
    sparklineStart: 10,
    trendColor: '#ef4444',
    trendClass: 'bg-danger-600',
    gradientStart: '#ef4444',
    impact: 'warning',
    impactLabel: 'Service alert',
    impactClass: 'bg-warning-600/20 text-warning-600',
    reasons: [
      'Several providers experiencing API timeout issues',
      'Indian banking holiday may affect Monday deliveries',
    ],
    timestamp: '3 hours ago',
    providers: [
      { name: 'Wise', recipientGets: '₹92,340', change: 'Delayed' },
      { name: 'Remitly', recipientGets: '₹92,120', change: 'Available' },
      { name: 'WorldRemit', recipientGets: '₹91,850', change: 'Delayed' },
    ],
  },
])

const toggleDetails = (cardId: string) => {
  if (expandedCards.value.has(cardId)) {
    expandedCards.value.delete(cardId)
  }
  else {
    expandedCards.value.add(cardId)
  }
}

const setAlert = (_card: typeof feedCards.value[0]) => {
  // TODO: Implement alert creation via useSaveAlertModal composable
}
</script>
