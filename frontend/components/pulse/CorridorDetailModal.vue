<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="flex min-h-screen items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="$emit('close')"
      />

      <div class="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ corridor.from }} → {{ corridor.to }}
            </h2>
            <p class="mt-1 text-sm text-gray-600">
              $1,000 • Bank Transfer
            </p>
          </div>
          <button
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="$emit('close')"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <div class="mb-6 flex gap-3">
            <button class="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700">
              Compare results
            </button>
            <button class="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
              Create alert
              <span class="ml-1 text-xs text-primary-600">Plus</span>
            </button>
            <button class="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
              Add to watchlist
              <span class="ml-1 text-xs text-primary-600">Plus</span>
            </button>
          </div>

          <div class="mb-6">
            <h3 class="mb-3 font-semibold text-gray-900">
              Recipient gets trend (Last 7 days)
            </h3>
            <div class="h-48 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div class="flex h-full items-center justify-center text-sm text-gray-500">
                Chart placeholder - Shows trend line
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="mb-3 font-semibold text-gray-900">
              Provider leaderboard
            </h3>
            <div class="overflow-hidden rounded-lg border border-gray-200">
              <table class="w-full">
                <thead class="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                      Provider
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-600">
                      Recipient gets
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-600">
                      Fees
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-600">
                      FX spread
                    </th>
                    <th class="px-4 py-3 text-center text-xs font-medium uppercase text-gray-600">
                      ETA
                    </th>
                    <th class="px-4 py-3 text-center text-xs font-medium uppercase text-gray-600" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 bg-white">
                  <tr
                    v-for="provider in providers"
                    :key="provider.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded bg-gray-100" />
                        <div>
                          <div class="font-medium text-gray-900">
                            {{ provider.name }}
                          </div>
                          <div
                            v-if="provider.badge"
                            class="text-xs text-gray-500"
                          >
                            {{ provider.badge }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4 text-right font-semibold text-gray-900">
                      {{ provider.recipientGets }}
                    </td>
                    <td class="px-4 py-4 text-right text-gray-600">
                      {{ provider.fees }}
                    </td>
                    <td class="px-4 py-4 text-right text-gray-600">
                      {{ provider.fxSpread }}
                    </td>
                    <td class="px-4 py-4 text-center">
                      <span class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {{ provider.eta }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-center">
                      <button class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                        Go to provider
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
            <strong>Disclosure:</strong> We may earn a commission when you click provider links. Rankings are independent and based solely on value delivered to recipients. Amounts shown are estimates and may change at checkout based on your payment method, KYC status, and current market conditions.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  corridor: {
    from: string
    to: string
  }
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const providers = [
  {
    id: 'wise',
    name: 'Wise',
    recipientGets: '₱56,234',
    fees: '$4.50',
    fxSpread: '0.5%',
    eta: '1-2 days',
    badge: 'Official Data Feed',
  },
  {
    id: 'remitly',
    name: 'Remitly',
    recipientGets: '₱56,192',
    fees: '$3.99',
    fxSpread: '0.8%',
    eta: '15 min',
    badge: 'We may earn commission',
  },
  {
    id: 'xe',
    name: 'XE Money',
    recipientGets: '₱56,087',
    fees: '$0',
    fxSpread: '1.2%',
    eta: '2-4 days',
    badge: null,
  },
]
</script>



