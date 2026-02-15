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
      class="group rounded-xl border border-rs-border bg-surface p-4 hover:shadow-sm hover:border-neutral-300 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-primary-500"
      role="menuitem"
    >
      <div class="flex items-start gap-3">
        <NavIcon
          :name="guide.icon"
          class="text-brand-600 mt-0.5 flex-shrink-0"
        />
        <div class="min-w-0">
          <div class="text-body-sm font-semibold text-rs-fg">{{ guide.title }}</div>
          <div class="text-body-sm text-rs-muted mt-0.5 leading-relaxed">{{ guide.subtitle }}</div>
          <div class="mt-2 text-body-sm font-medium text-brand-600 motion-safe:group-hover:translate-x-0.5 motion-safe:transition inline-block">
            Read →
          </div>
        </div>
      </div>
    </NuxtLink>
  </div>

  <div class="mt-2 px-4 py-2 border-t border-neutral-100">
    <NuxtLink
      to="/learn"
      class="text-body-sm text-rs-muted hover:text-neutral-700 motion-safe:transition focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
      role="menuitem"
    >
      View all guides →
    </NuxtLink>
  </div>
</template>
