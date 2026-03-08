<script setup lang="ts">
import type { AdminSurfaceOverviewModel, AdminSurfaceTone } from '~/utils/adminSurfaceStatus'
import { getAdminSurfaceToneClasses } from '~/utils/adminSurfaceStatus'

const props = defineProps<{
  model: AdminSurfaceOverviewModel
}>()

const toneClasses = (tone: AdminSurfaceTone) => getAdminSurfaceToneClasses(tone)
</script>

<template>
  <section class="rounded-3xl border border-rs-border bg-rs-surface p-6 shadow-sm">
    <div class="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-2xl border border-rs-border bg-rs-bg/70 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Runtime status</div>
            <div class="mt-3 flex items-center gap-3">
              <span
                class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                :class="toneClasses(props.model.runtimeTone).badge"
              >
                <span
class="h-2 w-2 rounded-full"
:class="toneClasses(props.model.runtimeTone).dot"
/>
                {{ props.model.runtimeLabel }}
              </span>
            </div>
            <p
v-if="props.model.runtimeDetail"
class="mt-3 text-body-sm text-rs-muted"
>
              {{ props.model.runtimeDetail }}
            </p>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-bg/70 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Data freshness</div>
            <div class="mt-3 flex items-center gap-3">
              <span
                class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                :class="toneClasses(props.model.freshnessTone).badge"
              >
                <span
class="h-2 w-2 rounded-full"
:class="toneClasses(props.model.freshnessTone).dot"
/>
                {{ props.model.freshnessLabel }}
              </span>
            </div>
            <p
v-if="props.model.freshnessDetail"
class="mt-3 text-body-sm text-rs-muted"
>
              {{ props.model.freshnessDetail }}
            </p>
          </article>

          <article class="rounded-2xl border border-rs-border bg-rs-bg/70 p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Last successful job</div>
            <div class="mt-3 text-body-lg font-semibold text-rs-fg">{{ props.model.lastJobLabel }}</div>
            <p
v-if="props.model.lastJobDetail"
class="mt-2 text-body-sm text-rs-muted"
>
              {{ props.model.lastJobDetail }}
            </p>
          </article>
        </div>

        <div
v-if="props.model.stats?.length"
class="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
>
          <article
            v-for="stat in props.model.stats"
            :key="stat.label"
            class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4"
          >
            <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">{{ stat.label }}</div>
            <div class="mt-2 text-body-lg font-semibold text-rs-fg">{{ stat.value }}</div>
            <p
v-if="stat.detail"
class="mt-2 text-body-sm text-rs-muted"
>
{{ stat.detail }}
</p>
          </article>
        </div>
      </div>

      <div class="grid gap-4">
        <article class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4">
          <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Dependency health</div>
          <div class="mt-3 grid gap-2">
            <div
              v-for="dependency in props.model.dependencies"
              :key="dependency.label"
              class="rounded-xl border border-rs-border bg-rs-surface px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-body-sm font-semibold text-rs-fg">{{ dependency.label }}</div>
                <span
                  class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  :class="toneClasses(dependency.status).badge"
                >
                  <span
class="h-2 w-2 rounded-full"
:class="toneClasses(dependency.status).dot"
/>
                  {{ dependency.status }}
                </span>
              </div>
              <p class="mt-2 text-body-sm text-rs-muted">{{ dependency.detail }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-rs-border bg-rs-bg/40 p-4">
          <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Next operator actions</div>
          <div class="mt-3 grid gap-2">
            <div
              v-for="action in props.model.nextActions"
              :key="action.label"
              class="rounded-xl border border-dashed border-rs-border bg-rs-surface px-3 py-3"
            >
              <div class="text-body-sm font-semibold text-rs-fg">{{ action.label }}</div>
              <p
v-if="action.detail"
class="mt-1 text-body-sm text-rs-muted"
>
{{ action.detail }}
</p>
            </div>
          </div>
        </article>

        <article
          v-if="props.model.emptyState"
          class="rounded-2xl border border-dashed border-rs-border bg-rs-bg/20 p-4"
        >
          <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rs-muted">Empty-state guidance</div>
          <div class="mt-3 text-body-sm font-semibold text-rs-fg">{{ props.model.emptyState.title }}</div>
          <p class="mt-1 text-body-sm text-rs-muted">{{ props.model.emptyState.body }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
