<template>
  <div class="min-h-screen bg-neutral-50">
    <section class="relative overflow-hidden border-b border-brand-600 bg-brand-600">
      <div class="container py-10 lg:py-14">
        <Breadcrumbs
          :items="breadcrumbItems"
          :dark="true"
        />

        <div class="mt-6">
          <div>
            <h1 class="text-h1 text-white">
              {{ title }}
            </h1>
            <p
              v-if="subtitle"
              class="mt-4 text-body-lg text-white/90"
            >
              {{ subtitle }}
            </p>

            <div class="mt-6 flex flex-wrap gap-3 text-body-sm text-white">
              <div
                v-if="lastUpdatedLabel"
                class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1"
              >
                <span class="font-semibold text-white">Last updated</span>
                <time
                  :datetime="lastUpdatedIso"
                  class="text-white/90"
                >{{ lastUpdatedLabel }}</time>
              </div>
              <slot name="meta" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-10 lg:py-12">
      <div class="container">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article class="rounded-2xl bg-surface p-8 shadow-lg border border-rs-border lg:p-12">
            <slot />
          </article>

          <aside class="space-y-6">
            <div
              v-if="related?.length"
              class="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-neutral-200/70"
            >
              <h2 class="text-body-sm font-semibold uppercase tracking-[0.2em] text-rs-muted">
                Related
              </h2>
              <div class="mt-4 space-y-3">
                <NuxtLink
                  v-for="item in related"
                  :key="item.to"
                  :to="item.to"
                  class="block rounded-xl border border-rs-border p-3 transition hover:border-primary-400 hover:shadow-sm"
                >
                  <div class="text-body-sm font-semibold text-rs-fg">
                    {{ item.title }}
                  </div>
                  <div class="mt-1 text-body-sm text-neutral-600">
                    {{ item.description }}
                  </div>
                </NuxtLink>
              </div>
            </div>

            <slot name="sidebar" />
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'

interface BreadcrumbItem {
  name: string
  path: string
}

interface TocItem {
  id: string
  label: string
}

interface HighlightItem {
  title: string
  body: string
}

interface RelatedItem {
  title: string
  description: string
  to: string
}

defineProps<{
  title: string
  subtitle?: string
  lastUpdatedLabel?: string
  lastUpdatedIso?: string
  badge?: string
  breadcrumbItems: BreadcrumbItem[]
  toc?: TocItem[]
  highlights?: HighlightItem[]
  related?: RelatedItem[]
}>()
</script>
