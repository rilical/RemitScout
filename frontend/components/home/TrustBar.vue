<template>
  <section
    class="bg-surface py-4"
    aria-label="Trust and transparency badge bar"
  >
    <div class="container mx-auto flex flex-col gap-3 px-4">
      <div class="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200/80 bg-surface/50 px-4 py-3 shadow-sm backdrop-blur md:flex-row md:justify-between md:gap-4">
        <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-body-sm text-neutral-600">
          <span class="flex items-center gap-2">
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-600 text-success-600">✔</span>
            Third-party provider checks
          </span>
          <span
            class="hidden h-4 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <span class="flex items-center gap-2">
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-primary-500">⏱</span>
            Pricing refreshed every hour
          </span>
          <span
            class="hidden h-4 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <span class="flex items-center gap-2">
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-50 text-rs-muted">🛡</span>
            Encryption on every comparison
          </span>
          <span
            class="hidden h-4 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <NuxtLink
            to="/legal/disclosure"
            class="flex items-center gap-2 text-body-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
          >
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning-600 text-warning-600">💡</span>
            How we earn a fee
          </NuxtLink>
          <span
            class="hidden h-4 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <NuxtLink
            to="/methodology#data-freshness"
            class="flex items-center gap-2 text-body-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
          >
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-primary-500">📈</span>
            Methodology & data cadence
          </NuxtLink>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3 text-body-sm text-neutral-500 md:justify-end">
          <span class="flex items-center gap-1">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">©</span>
            {{ currentYear }} Remit-Scout
          </span>
          <span
            class="hidden h-3 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <span>Regulated partners only</span>
          <span
            class="hidden h-3 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <span>GDPR ready</span>
          <span
            class="hidden h-3 w-px bg-neutral-200 md:block"
            aria-hidden="true"
          />
          <span>ISO 27001 controls</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Import shared components
import { NuxtLink } from '#components'

// Trust bar component with transparency links
const currentYear = new Date().getFullYear()
</script>
