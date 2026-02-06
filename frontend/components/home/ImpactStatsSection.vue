<template>
  <component
    :is="wrap ? 'section' : 'div'"
    :class="wrap ? sectionClass : undefined"
  >
    <div
      v-if="withContainer"
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div
        v-if="showHeading"
        :class="['text-center', variant === 'compact' ? 'mb-6' : 'mb-12']"
      >
        <div
          v-if="showHeaderIcon"
          class="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"
        >
          <component
            :is="IMPACT_COPY.headerIcon"
            class="h-6 w-6"
            :class="isDarkBg ? 'text-white' : 'text-brand-600'"
          />
        </div>

        <h2 :class="['text-3xl sm:text-4xl font-bold mb-4', isDarkBg ? 'text-white' : 'text-neutral-900']">
          {{ title }}
        </h2>
        <p
          v-if="lead"
          :class="['text-lg max-w-3xl mx-auto leading-relaxed', isDarkBg ? 'text-white/90' : 'text-neutral-700']"
        >
          {{ lead }}
        </p>
      </div>

      <div
        v-if="variant === 'strip'"
        class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
      >
        <div
          v-for="item in statItems"
          :key="item.statKey"
          class="text-center"
        >
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <component
              :is="item.icon"
              class="w-8 h-8 text-blue-600"
            />
          </div>
          <div :class="['text-5xl font-bold mb-2', isDarkBg ? 'text-white' : 'text-neutral-900']">
            {{ item.display }}
          </div>
          <div :class="['text-sm', isDarkBg ? 'text-white/90' : 'text-neutral-600']">
            {{ item.label }}
          </div>
        </div>
      </div>

      <div
        v-else-if="variant === 'cards'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="item in statItems"
          :key="item.statKey"
          class="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <component
                :is="item.icon"
                class="w-6 h-6 text-brand-600"
              />
            </div>
            <div>
              <div class="text-2xl font-bold text-neutral-900">
                {{ item.display }}
              </div>
              <div class="text-sm text-neutral-600">
                {{ item.label }}
              </div>
            </div>
          </div>
          <p class="text-sm text-neutral-600">
            {{ item.description }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="flex flex-wrap gap-4"
      >
        <div
          v-for="item in statItems"
          :key="item.statKey"
          class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-2 text-2xl font-bold text-brand-600">
            <component
              :is="item.icon"
              class="w-7 h-7"
            />
            <span>{{ item.display }}</span>
          </div>
          <div class="text-sm text-neutral-600">
            {{ item.label }}
          </div>
        </div>
      </div>

      <div
        v-if="showCta && ctaTo && ctaLabel"
        class="mt-12 text-center"
      >
        <NuxtLink
          :to="ctaTo"
          :class="['inline-flex items-center gap-2 transition-colors group', isDarkBg ? 'text-white hover:text-white/80' : 'text-brand-600 hover:text-brand-700']"
        >
          <span class="text-sm font-semibold">{{ ctaLabel }}</span>
          <svg
            class="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <div
        v-if="showHeading"
        :class="['text-center', variant === 'compact' ? 'mb-6' : 'mb-12']"
      >
        <div
          v-if="showHeaderIcon"
          class="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"
        >
          <component
            :is="IMPACT_COPY.headerIcon"
            class="h-6 w-6"
            :class="isDarkBg ? 'text-white' : 'text-brand-600'"
          />
        </div>

        <h2 :class="['text-3xl sm:text-4xl font-bold mb-4', isDarkBg ? 'text-white' : 'text-neutral-900']">
          {{ title }}
        </h2>
        <p
          v-if="lead"
          :class="['text-lg max-w-3xl mx-auto leading-relaxed', isDarkBg ? 'text-white/90' : 'text-neutral-700']"
        >
          {{ lead }}
        </p>
      </div>

      <div
        v-if="variant === 'strip'"
        class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
      >
        <div
          v-for="item in statItems"
          :key="item.statKey"
          class="text-center"
        >
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <component
              :is="item.icon"
              class="w-8 h-8 text-blue-600"
            />
          </div>
          <div :class="['text-5xl font-bold mb-2', isDarkBg ? 'text-white' : 'text-neutral-900']">
            {{ item.display }}
          </div>
          <div :class="['text-sm', isDarkBg ? 'text-white/90' : 'text-neutral-600']">
            {{ item.label }}
          </div>
        </div>
      </div>

      <div
        v-else-if="variant === 'cards'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="item in statItems"
          :key="item.statKey"
          class="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <component
                :is="item.icon"
                class="w-6 h-6 text-brand-600"
              />
            </div>
            <div>
              <div class="text-2xl font-bold text-neutral-900">
                {{ item.display }}
              </div>
              <div class="text-sm text-neutral-600">
                {{ item.label }}
              </div>
            </div>
          </div>
          <p class="text-sm text-neutral-600">
            {{ item.description }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="flex flex-wrap gap-4"
      >
        <div
          v-for="item in statItems"
          :key="item.statKey"
          class="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-2 text-2xl font-bold text-brand-600">
            <component
              :is="item.icon"
              class="w-7 h-7"
            />
            <span>{{ item.display }}</span>
          </div>
          <div class="text-sm text-neutral-600">
            {{ item.label }}
          </div>
        </div>
      </div>

      <div
        v-if="showCta && ctaTo && ctaLabel"
        class="mt-12 text-center"
      >
        <NuxtLink
          :to="ctaTo"
          :class="['inline-flex items-center gap-2 transition-colors group', isDarkBg ? 'text-white hover:text-white/80' : 'text-brand-600 hover:text-brand-700']"
        >
          <span class="text-sm font-semibold">{{ ctaLabel }}</span>
          <svg
            class="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SITE_STATS } from '~/config/stats'
import { IMPACT_COPY, IMPACT_STATS } from '~/lib/marketing/impact'

type Variant = 'strip' | 'cards' | 'compact'

interface Props {
  variant?: Variant
  bgClass?: string
  wrap?: boolean
  withContainer?: boolean
  showHeading?: boolean
  showHeaderIcon?: boolean
  showCta?: boolean
  title?: string
  lead?: string
  ctaLabel?: string
  ctaTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'strip',
  bgClass: 'bg-brand-600',
  wrap: true,
  withContainer: true,
  showHeading: true,
  showHeaderIcon: false,
  showCta: true,
  title: IMPACT_COPY.title,
  lead: IMPACT_COPY.lead,
  ctaLabel: IMPACT_COPY.ctaLabel,
  ctaTo: IMPACT_COPY.ctaTo,
})

const sectionClass = computed(() => {
  if (props.variant === 'cards') return 'py-16 sm:py-20 bg-white'
  if (props.variant === 'compact') return 'py-12 bg-transparent'
  return ['py-12 sm:py-16', props.bgClass].join(' ')
})

const isDarkBg = computed(() => {
  const bg = props.bgClass || ''
  return (
    bg === 'bg-brand-600'
    || bg === 'bg-blue-600'
    || bg === 'bg-slate-900'
    || bg.includes('slate-900')
    || bg.includes('gray-900')
    || bg.includes('brand-600')
    || bg.includes('blue-600')
  )
})

const statItems = computed(() => {
  return IMPACT_STATS.map((item) => {
    const stat = SITE_STATS[item.statKey]
    return {
      ...item,
      display: stat.display,
      label: stat.label,
    }
  })
})
</script>
