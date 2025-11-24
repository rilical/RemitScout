<script setup lang="ts">
import NavIcon from '../NavIcon.vue'
import { NAV } from '~/config/nav'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-2">
    <NuxtLink
      v-for="guide in NAV.guides"
      :key="guide.href"
      :to="guide.href"
      class="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm hover:border-slate-300 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      role="menuitem"
    >
      <div class="flex items-start gap-3">
        <NavIcon
          :name="guide.icon"
          class="text-blue-600 mt-0.5 flex-shrink-0"
        />
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-900">{{ guide.title }}</div>
          <div class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ guide.subtitle }}</div>
          <div class="mt-2 text-xs font-medium text-blue-600 motion-safe:group-hover:translate-x-0.5 motion-safe:transition inline-block">
            Read →
          </div>
        </div>
      </div>
    </NuxtLink>
  </div>

  <div class="mt-2 px-4 py-2 border-t border-slate-100">
    <NuxtLink
      to="/guides"
      class="text-xs text-slate-500 hover:text-slate-700 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
      role="menuitem"
    >
      View all guides →
    </NuxtLink>
  </div>
</template>
