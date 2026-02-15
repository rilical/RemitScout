<template>
  <section class="py-8 bg-surface">
    <div class="container">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="tile in TRANSPARENCY_TILES"
          :key="tile.id"
          class="flex items-start gap-3 bg-neutral-900 rounded-xl p-4 border border-neutral-800 shadow-sm"
        >
          <div class="flex-shrink-0">
            <component
              :is="tile.icon"
              class="w-6 h-6 text-primary-50"
            />
          </div>
          <div class="min-w-0">
            <h3 class="text-body-sm font-bold text-white mb-1">
              {{ tile.title }}
            </h3>
            <p class="text-body-sm text-neutral-300 leading-relaxed">
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
