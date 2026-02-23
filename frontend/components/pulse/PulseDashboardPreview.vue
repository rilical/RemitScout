<template>
  <div class="rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden">
    <!-- Window chrome -->
    <div class="flex items-center justify-between border-b border-neutral-800 px-4 py-2.5">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span class="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span class="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        </div>
        <span class="text-body-sm font-bold text-white/80">Remit-Scout Pulse</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded-full border border-success-600/30 bg-success-600/15 px-2.5 py-0.5 text-[10px] font-semibold text-success-400">
          Verified Pipeline v2.4.1
        </span>
        <span class="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Sender View
        </span>
      </div>
    </div>

    <!-- Dashboard body -->
    <div class="relative">
      <div class="px-4 pt-4 pb-14 space-y-4">
        <!-- Live indicator + corridor -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
            </span>
            <span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Live — USD → PHP</span>
          </div>
          <span class="text-[11px] text-neutral-500">Updated 4m ago</span>
        </div>

        <!-- Mini KPI row -->
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="kpi in kpis"
            :key="kpi.label"
            class="rounded-lg border border-neutral-800 bg-neutral-800/60 px-2.5 py-2"
          >
            <div class="text-[10px] text-neutral-500">{{ kpi.label }}</div>
            <div class="text-body-sm font-bold text-white tabular-nums">{{ kpi.value }}</div>
            <div class="text-[10px] font-semibold" :class="kpi.deltaClass">{{ kpi.delta }}</div>
          </div>
        </div>

        <!-- Mini area chart -->
        <div class="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold text-white">All-in Cost Index</span>
            <div class="flex items-center gap-3 text-[10px] text-neutral-500">
              <span class="flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Best rate
              </span>
              <span class="flex items-center gap-1">
                <span class="h-px w-3 border-b border-dashed border-neutral-500" />
                Mid-market
              </span>
            </div>
          </div>
          <svg viewBox="0 0 400 100" class="w-full" preserveAspectRatio="xMidYMid meet">
            <line x1="0" y1="20" x2="400" y2="20" stroke="#262626" stroke-width="0.5" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="#262626" stroke-width="0.5" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="#262626" stroke-width="0.5" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="#404040" stroke-width="0.5" stroke-dasharray="4 3" />
            <defs>
              <linearGradient id="dash-area" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#3B82F6" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0,65 L 57,58 L 114,45 L 171,52 L 228,38 L 285,30 L 342,35 L 400,28 L 400,90 L 0,90 Z" fill="url(#dash-area)" />
            <polyline points="0,65 57,58 114,45 171,52 228,38 285,30 342,35 400,28" fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="285" cy="30" r="2.5" fill="#3B82F6" stroke="#1e293b" stroke-width="1" />
            <circle cx="400" cy="28" r="2.5" fill="#3B82F6" stroke="#1e293b" stroke-width="1" />
            <text x="395" y="22" text-anchor="end" fill="#93c5fd" font-size="8" font-weight="600" font-family="system-ui">56.04</text>
          </svg>
        </div>

        <!-- Mini data table -->
        <div class="rounded-lg border border-neutral-800 bg-neutral-800/40 overflow-hidden">
          <div class="grid grid-cols-[1fr,auto,auto,auto] gap-x-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
            <span>Provider</span>
            <span>Rate</span>
            <span>Markup</span>
            <span class="text-right">Gets</span>
          </div>
          <div
            v-for="(row, idx) in tableRows"
            :key="row.provider"
            class="grid grid-cols-[1fr,auto,auto,auto] gap-x-3 items-center px-3 py-2 text-body-sm"
            :class="idx === 0 ? 'bg-brand-600/5' : ''"
          >
            <div class="flex items-center gap-2">
              <div class="flex h-5 w-5 items-center justify-center rounded bg-white overflow-hidden p-0.5">
                <ProviderLogo :slug="row.slug" :alt="row.provider" size="small" fit />
              </div>
              <span class="font-semibold" :class="idx === 0 ? 'text-brand-400' : 'text-white'">{{ row.provider }}</span>
              <span v-if="idx === 0" class="rounded bg-brand-600/20 px-1 py-px text-[9px] font-bold text-brand-400 uppercase">Best</span>
            </div>
            <span class="text-neutral-300 tabular-nums">{{ row.rate }}</span>
            <span class="text-neutral-400 tabular-nums">{{ row.markup }}</span>
            <span class="text-right font-bold tabular-nums" :class="idx === 0 ? 'text-brand-400' : 'text-white'">{{ row.gets }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom fade overlay -->
      <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-900 via-neutral-900/90 to-transparent flex items-end justify-center pb-3">
        <NuxtLink
          to="/plus"
          class="text-body-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
        >
          See full dashboard &rarr;
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProviderLogo from '~/components/shared/ProviderLogo.vue'

const kpis = [
  { label: 'Best rate', value: '₱56.04', delta: '+0.12%', deltaClass: 'text-success-400' },
  { label: 'Avg fee', value: '$1.59', delta: '-$0.20', deltaClass: 'text-success-400' },
  { label: 'Providers', value: '7', delta: 'reporting', deltaClass: 'text-neutral-500' },
  { label: 'RCI', value: '2.34%', delta: '-8 bps', deltaClass: 'text-success-400' },
]

const tableRows = [
  { provider: 'Wise', slug: 'wise', rate: '56.035', markup: '42 bps', gets: '₱55,811' },
  { provider: 'Remitly', slug: 'remitly', rate: '55.910', markup: '78 bps', gets: '₱55,320' },
  { provider: 'WorldRemit', slug: 'worldremit', rate: '55.850', markup: '110 bps', gets: '₱54,980' },
]
</script>
