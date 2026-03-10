<script setup lang="ts">
import { computed } from 'vue'
import RsBadge from '../badges/RsBadge.vue'
import { Icon } from '../Icon'
import type { IconName } from '../Icon/icons'

type Variant = 'terminal' | 'consumer'
type BadgeVariant = 'brand' | 'neutral' | 'warning' | 'enterprise' | 'plus'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    iconName?: IconName
    iconBg?: string
    iconColor?: string
    variant?: Variant
    badge?: string
    badgeVariant?: BadgeVariant
  }>(),
  {
    description: undefined,
    icon: undefined,
    iconName: undefined,
    iconBg: undefined,
    iconColor: undefined,
    variant: 'terminal',
    badge: undefined,
    badgeVariant: 'neutral',
  },
)

const titleClass = computed(() =>
  props.variant === 'terminal'
    ? 'text-lg font-semibold text-white'
    : 'text-lg font-semibold text-neutral-900',
)

const descriptionClass = computed(() =>
  props.variant === 'terminal'
    ? 'text-sm text-neutral-400'
    : 'text-sm text-neutral-500',
)
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <!-- Left: icon + title + description -->
    <div class="flex items-center gap-3 min-w-0">
      <div
        v-if="icon || iconName"
        class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        :class="iconBg ?? (variant === 'terminal' ? 'bg-neutral-700/60' : 'bg-neutral-100')"
      >
        <Icon
          v-if="iconName"
          :name="iconName"
          :size="16"
          class="shrink-0"
          :class="iconColor ?? (variant === 'terminal' ? 'text-neutral-300' : 'text-brand-600')"
        />
        <span
          v-else
          class="text-sm"
          :class="iconColor ?? (variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-600')"
          aria-hidden="true"
        >{{ icon }}</span>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 :class="titleClass">
            {{ title }}
          </h2>

          <slot name="badge">
            <RsBadge
              v-if="badge"
              :label="badge"
              :variant="badgeVariant"
              size="xs"
            />
          </slot>
        </div>

        <p
          v-if="description"
          :class="descriptionClass"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Right: actions slot -->
    <div
      v-if="$slots.actions"
      class="flex shrink-0 items-center gap-2"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
