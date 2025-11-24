<script setup lang="ts">
import NavIcon from '../NavIcon.vue'
import { NAV } from '~/config/nav'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-2">
    <NuxtLink
      v-for="playbook in NAV.expatPlaybooks"
      :key="playbook.href"
      :to="playbook.href"
      class="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm hover:border-slate-300 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      role="menuitem"
    >
      <div class="flex items-start gap-3">
        <NavIcon
          :name="playbook.icon"
          class="text-blue-600 mt-0.5 flex-shrink-0"
        />
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-900">{{ playbook.title }}</div>
          <div class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ playbook.subtitle }}</div>
          <div class="mt-2 text-xs font-medium text-blue-600 motion-safe:group-hover:translate-x-0.5 motion-safe:transition inline-block">
            Explore →
          </div>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>
