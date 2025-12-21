<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Top Corridors
      </h2>
      <NuxtLink
        to="/pulse/corridors"
        class="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
      >
        View all
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="corridor in spotlightCorridors"
        :key="`${corridor.from}-${corridor.to}`"
        class="group relative cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-800/40 overflow-hidden transition-all duration-300 hover:border-white/20 hover:scale-[1.02]"
        @click="$emit('corridor-click', { from: corridor.from, to: corridor.to })"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div class="relative p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-3xl">
                <span>{{ corridor.fromFlag }}</span>
                <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span>{{ corridor.toFlag }}</span>
              </div>
            </div>
            <span
              class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              :class="corridor.freshnessClass"
            >
              <span class="relative flex h-1.5 w-1.5">
                <span 
                  v-if="corridor.freshness.includes('5m') || corridor.freshness.includes('8m')"
                  class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  :class="corridor.freshnessClass.includes('green') ? 'bg-emerald-400' : 'bg-amber-400'"
                />
                <span 
                  class="relative inline-flex h-1.5 w-1.5 rounded-full"
                  :class="corridor.freshnessClass.includes('green') ? 'bg-emerald-500' : 'bg-amber-500'"
                />
              </span>
              {{ corridor.freshness }}
            </span>
          </div>

          <div class="text-sm font-medium text-slate-400 mb-4">
            {{ corridor.from }} → {{ corridor.to }}
          </div>

          <div class="mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <div class="text-xs text-slate-500 mb-1">Best provider</div>
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-white">{{ corridor.bestProvider }}</span>
              <span 
                class="flex items-center gap-1 text-sm font-semibold"
                :class="corridor.changeType === 'up' ? 'text-emerald-400' : 'text-red-400'"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    v-if="corridor.changeType === 'up'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                {{ corridor.change24h }}
              </span>
            </div>
          </div>

          <div class="flex items-end justify-between">
            <div>
              <div class="text-xs text-slate-500 mb-1">Recipient gets</div>
              <div class="text-2xl font-bold text-emerald-400">
                {{ corridor.recipientGets }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500">
                ${{ corridor.amount }} • {{ corridor.method }}
              </div>
            </div>
          </div>
        </div>

        <div 
          class="h-1 w-full"
          :class="corridor.changeType === 'up' ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-500/0' : 'bg-gradient-to-r from-red-500/50 to-red-500/0'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'corridor-click': [corridor: { from: string; to: string }]
}>()

const spotlightCorridors = [
  {
    from: 'US',
    to: 'Philippines',
    fromFlag: '🇺🇸',
    toFlag: '🇵🇭',
    bestProvider: 'Wise',
    recipientGets: '₱56,234',
    change24h: '+₱142',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Bank',
    freshness: '5m ago',
    freshnessClass: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    from: 'US',
    to: 'Mexico',
    fromFlag: '🇺🇸',
    toFlag: '🇲🇽',
    bestProvider: 'Remitly',
    recipientGets: 'MXN 18,342',
    change24h: '+MXN 120',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Cash',
    freshness: '12m ago',
    freshnessClass: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    from: 'GB',
    to: 'India',
    fromFlag: '🇬🇧',
    toFlag: '🇮🇳',
    bestProvider: 'Wise',
    recipientGets: '₹92,340',
    change24h: '-₹86',
    changeType: 'down' as const,
    amount: 1000,
    method: 'Bank',
    freshness: '18m ago',
    freshnessClass: 'bg-amber-500/20 text-amber-400',
  },
  {
    from: 'US',
    to: 'India',
    fromFlag: '🇺🇸',
    toFlag: '🇮🇳',
    bestProvider: 'Remitly',
    recipientGets: '₹83,450',
    change24h: '+₹234',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Bank',
    freshness: '8m ago',
    freshnessClass: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    from: 'CA',
    to: 'India',
    fromFlag: '🇨🇦',
    toFlag: '🇮🇳',
    bestProvider: 'Wise',
    recipientGets: '₹62,780',
    change24h: '+₹156',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Bank',
    freshness: '22m ago',
    freshnessClass: 'bg-amber-500/20 text-amber-400',
  },
  {
    from: 'US',
    to: 'Nigeria',
    fromFlag: '🇺🇸',
    toFlag: '🇳🇬',
    bestProvider: 'Sendwave',
    recipientGets: '₦1,234,500',
    change24h: '+₦2,340',
    changeType: 'up' as const,
    amount: 1000,
    method: 'Wallet',
    freshness: '15m ago',
    freshnessClass: 'bg-emerald-500/20 text-emerald-400',
  },
]
</script>

