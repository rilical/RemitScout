<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">
        What changed recently
      </h2>
      <select
        v-model="timeRange"
        class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="24h">
          Last 24 hours
        </option>
        <option value="7d">
          Last 7 days
        </option>
        <option value="30d">
          Last 30 days
        </option>
      </select>
    </div>

    <div class="space-y-4">
      <div
        v-for="card in feedCards"
        :key="card.id"
        class="rounded-lg border border-gray-200 bg-white p-6"
      >
        <div class="mb-3 flex items-start justify-between">
          <div class="flex-1">
            <h3 class="mb-2 text-lg font-semibold text-gray-900">
              {{ card.title }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in card.tags"
                :key="tag"
                class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="ml-4 h-12 w-24">
            <svg
              viewBox="0 0 100 50"
              class="h-full w-full"
            >
              <polyline
                :points="card.sparkline"
                fill="none"
                :stroke="card.trendColor"
                stroke-width="2"
              />
            </svg>
          </div>
        </div>

        <div class="mb-4 space-y-2">
          <p class="text-sm font-medium text-gray-700">
            Why it matters:
          </p>
          <ul class="space-y-1 text-sm text-gray-600">
            <li
              v-for="reason in card.reasons"
              :key="reason"
              class="flex items-start"
            >
              <span class="mr-2">•</span>
              <span>{{ reason }}</span>
            </li>
          </ul>
        </div>

        <div class="flex items-center justify-between border-t border-gray-100 pt-4">
          <div class="text-xs text-gray-500">
            Quotes captured {{ card.timestamp }}
          </div>
          <div class="flex gap-2">
            <button
              class="text-sm font-medium text-primary-600 hover:text-primary-700"
              @click="toggleDetails(card.id)"
            >
              {{ expandedCards.has(card.id) ? 'Hide' : 'Open' }} details
            </button>
            <button
              class="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="setAlert(card)"
            >
              Set alert
              <span class="ml-1 text-xs text-primary-600">Plus</span>
            </button>
          </div>
        </div>

        <div
          v-if="expandedCards.has(card.id)"
          class="mt-4 rounded-lg bg-gray-50 p-4"
        >
          <p class="mb-3 text-sm font-medium text-gray-700">
            Provider comparison:
          </p>
          <div class="space-y-2">
            <div
              v-for="provider in card.providers"
              :key="provider.name"
              class="flex items-center justify-between text-sm"
            >
              <span class="font-medium text-gray-900">{{ provider.name }}</span>
              <div class="flex items-center gap-3">
                <span class="text-gray-600">{{ provider.recipientGets }}</span>
                <span
                  :class="[
                    'text-xs font-medium',
                    provider.change.startsWith('+') ? 'text-green-600' : 'text-red-600',
                  ]"
                >
                  {{ provider.change }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 text-xs text-gray-500">
            Note: Actual amounts may change at checkout based on payment method, KYC status, and timing.
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

const props = defineProps<Props>()

const timeRange = ref('24h')
const expandedCards = ref(new Set<string>())

const feedCards = ref([
  {
    id: '1',
    title: 'US→MX: recipients get ~+MXN 120 more today vs yesterday',
    tags: ['US→MX', 'Bank Transfer', 'Wise', 'Remitly'],
    sparkline: '0,40 20,35 40,45 60,30 80,20 100,10',
    trendColor: '#10b981',
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
    sparkline: '0,10 20,15 40,25 60,20 80,35 100,40',
    trendColor: '#3b82f6',
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
    sparkline: '0,10 20,12 40,15 60,30 80,42 100,45',
    trendColor: '#ef4444',
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

const setAlert = (card: typeof feedCards.value[0]) => {
  console.log('Set alert for', card.title)
}
</script>

