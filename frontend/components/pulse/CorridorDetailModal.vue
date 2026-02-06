<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        @click="$emit('close')"
      />

      <!-- Modal -->
      <div class="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-3xl">
              <span>{{ corridorData.fromFlag }}</span>
              <svg
                class="h-5 w-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <span>{{ corridorData.toFlag }}</span>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">
                {{ corridorData.from }} → {{ corridorData.to }}
              </h2>
              <p class="text-sm text-slate-400">
                Live corridor data
              </p>
            </div>
          </div>
          <button
            class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            @click="$emit('close')"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Quick Stats -->
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-xl bg-white/5 border border-white/5 p-4 text-center">
              <div class="text-xs text-slate-500 mb-1">
                Best rate
              </div>
              <div class="text-lg font-bold text-white">
                {{ corridorData.bestProvider }}
              </div>
            </div>
            <div class="rounded-xl bg-white/5 border border-white/5 p-4 text-center">
              <div class="text-xs text-slate-500 mb-1">
                Recipient gets
              </div>
              <div class="text-lg font-bold text-emerald-400">
                {{ corridorData.recipientGets }}
              </div>
            </div>
            <div class="rounded-xl bg-white/5 border border-white/5 p-4 text-center">
              <div class="text-xs text-slate-500 mb-1">
                24h change
              </div>
              <div class="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                {{ corridorData.change24h }}
              </div>
            </div>
          </div>

          <!-- Provider Comparison -->
          <div>
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Provider Comparison
            </h3>
            <div class="space-y-3">
              <div
                v-for="(provider, index) in corridorData.providers"
                :key="provider.name"
                class="flex items-center justify-between p-4 rounded-xl"
                :class="index === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/5'"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                    :class="index === 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <div>
                    <div class="font-semibold text-white">
                      {{ provider.name }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ provider.speed }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-white">
                    {{ provider.recipientGets }}
                  </div>
                  <div class="text-xs text-slate-400">
                    Fee: {{ provider.fee }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-white/10">
            <button class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Compare now
            </button>
            <button class="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white">
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
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              Save
            </button>
            <button class="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white">
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  corridor: {
    from: string
    to: string
  }
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const corridorData = computed(() => ({
  from: props.corridor.from,
  to: props.corridor.to,
  fromFlag: getFlag(props.corridor.from),
  toFlag: getFlag(props.corridor.to),
  bestProvider: 'Wise',
  recipientGets: '₱56,234',
  change24h: '+₱142',
  providers: [
    { name: 'Wise', recipientGets: '₱56,234', fee: '$4.50', speed: 'Minutes–2 days' },
    { name: 'Remitly', recipientGets: '₱56,120', fee: '$3.99', speed: '15 min–2 days' },
    { name: 'XE Money', recipientGets: '₱55,980', fee: '$0', speed: '1–4 days' },
    { name: 'Xoom', recipientGets: '₱55,850', fee: '$4.99', speed: 'Minutes–days' },
  ],
}))

function getFlag(code: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸',
    PH: '🇵🇭',
    MX: '🇲🇽',
    IN: '🇮🇳',
    GB: '🇬🇧',
    CA: '🇨🇦',
    NG: '🇳🇬',
    AU: '🇦🇺',
  }
  return flags[code] || '🌍'
}
</script>
