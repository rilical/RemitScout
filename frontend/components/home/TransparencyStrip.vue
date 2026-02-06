<template>
  <section class="py-8 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="tile in TRANSPARENCY_TILES"
          :key="tile.id"
          class="flex items-start gap-3 bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm"
        >
          <div class="flex-shrink-0">
            <component
              :is="tile.icon"
              class="w-6 h-6 text-blue-50"
            />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-white mb-1">
              {{ tile.title }}
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              {{ tile.body }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TRANSPARENCY_TILES } from '~/lib/marketing/trust'
</script>
