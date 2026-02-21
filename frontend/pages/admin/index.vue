<template>
  <div class="min-h-screen bg-neutral-50 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <header class="rounded-2xl bg-surface p-6 shadow-sm">
        <div class="flex flex-col gap-3">
          <p class="text-body-sm text-rs-muted">Internal tools</p>
          <h1 class="text-h3 font-semibold text-rs-fg">
            Admin Console
          </h1>
          <p class="text-body-sm text-rs-muted">
            Manage operations, analytics, compliance, enterprise plans, institutional clients, and ads from one place.
          </p>
        </div>
      </header>

      <div class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Admin surfaces</h2>
        <p class="mt-1 text-body-sm text-rs-muted">
          Use these consoles for platform operations and control.
        </p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="link in adminLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-xl border border-rs-border p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            <div class="text-body-sm font-semibold text-rs-fg">{{ link.label }}</div>
            <div class="mt-2 text-body-sm text-rs-muted">{{ link.description }}</div>
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 class="text-body-lg font-semibold text-rs-fg">Common flows</h2>
        <ul class="mt-3 space-y-2 text-body-sm text-rs-muted">
          <li>
            • Rotate API keys only from the enterprise console if support asks for key expiry or suspected leak.
          </li>
          <li>
            • Review recent admin/audit events to investigate configuration or permission changes.
          </li>
          <li>
            • Keep /admin/observer handy for live operational context during incidents.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setSeo } from '~/composables/useSeo'

definePageMeta({ middleware: ['auth', 'admin'] })

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()

setSeo({
  title: 'Admin Console | Remit-Scout',
  description: 'Admin command center for internal operations, analytics, plans, and ads.',
  canonical: `${siteUrl}${route.path}`,
  noindex: true,
})

const adminLinks = [
  { label: 'Observer Console', description: 'AWS and pipeline operational status at a glance.', to: '/admin/observer' },
  { label: 'Analytics Console', description: 'Usage, conversion, and affiliate trends.', to: '/admin/analytics' },
  { label: 'Enterprise Management', description: 'Grant/revoke plans and enterprise access.', to: '/admin/enterprise' },
  { label: 'Audit Log Console', description: 'Track admin/security and compliance events.', to: '/admin/audit' },
  { label: 'Ad Inventory', description: 'Manage ad placements and placements analytics.', to: '/admin/ads' },
  { label: 'Gold Exports', description: 'Inspect TEER/RCI/RVI snapshot exports.', to: '/admin/gold-exports' },
  { label: 'Institutional Clients', description: 'Manage B2B institutional clients, API keys, and contracts.', to: '/admin/institutional' },
  { label: 'Ops Health', description: 'Consolidated indices, provider, and pipeline health.', to: '/admin/ops-health' },
]
</script>
