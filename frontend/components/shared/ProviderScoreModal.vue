<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
        aria-label="Close dialog"
        @click.self="close"
        @keydown.esc="close"
      >
        <div
          ref="modalRef"
          class="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full my-8 relative max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-score-title"
          tabindex="-1"
          @click.stop
        >
          <div class="flex-shrink-0 bg-surface border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-16 w-16 items-center justify-center flex-shrink-0">
                <ProviderLogo
                  :slug="providerSlug || ''"
                  :alt="providerName"
                  size="default"
                  class="object-contain max-h-full max-w-full"
                />
              </div>
              <div>
                <h2
                  id="provider-score-title"
                  class="text-h4 font-bold text-neutral-900"
                >
                  {{ providerName }}
                </h2>
                <p class="text-body-sm text-brand-600 font-semibold">
                  Remit-Score: {{ score.toFixed(1) }}
                </p>
              </div>
            </div>
            <button
              class="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close modal"
              @click="close"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="px-6 py-6 space-y-6 overflow-y-auto flex-1">
            <div class="text-center py-6">
              <div
                class="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 bg-surface shadow-lg mb-4"
                :style="{ borderColor: scoreColor }"
              >
                <span
                  :class="scoreTextClass"
                  class="text-h2 font-bold"
                >
                  {{ score.toFixed(1) }}
                </span>
              </div>
              <p class="text-body-lg font-semibold text-neutral-900 mb-1">
                {{ scoreLabel }}
              </p>
              <p class="text-body-sm text-neutral-600">
                Overall rating based on 5 key metrics
              </p>
            </div>

            <div class="space-y-3">
              <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                Score Breakdown
              </h3>
              <div
                v-for="metric in metrics"
                :key="metric.label"
                class="border border-neutral-200 rounded-lg p-4"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-neutral-900">
                    {{ metric.label }}:
                  </span>
                  <span :class="['font-semibold', getRatingTextClass(metric.badgeClass)]">
                    {{ metric.labelText }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-shrink-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between gap-4">
            <button
              class="px-4 py-2 text-body-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              @click="close"
            >
              Close
            </button>
            <NuxtLink
              v-if="providerSlug"
              :to="`/learn/providers/${providerSlug}`"
              class="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
              @click="close"
            >
              Read Full Review →
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
  import { getProviderScore } from '~/lib/providerScores'
  import ProviderLogo from '~/components/shared/ProviderLogo.vue'
  import { normalizeProviderSlug } from '~/composables/useProviderLogo'

interface Props {
  isOpen: boolean
  providerId?: string
  providerName: string
  score: number
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modalRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalRef)

const close = () => {
  emit('update:isOpen', false)
}

watch(
  () => props.isOpen,
  async (open) => {
    if (!open) {
      deactivate()
      return
    }

    await nextTick()
    activate()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  deactivate()
})

const scoreColor = computed(() => {
  const score = props.score || 0
  if (score >= 9.0) return '#10b981'
  if (score >= 8.0) return '#2563eb'
  if (score >= 7.0) return '#eab308'
  return '#6b7280'
})

const scoreTextClass = computed(() => {
  const score = props.score || 0
  if (score >= 9.0) return 'text-success-600'
  if (score >= 8.0) return 'text-brand-600'
  if (score >= 7.0) return 'text-warning-600'
  return 'text-neutral-600'
})

const scoreLabel = computed(() => {
  const score = props.score || 0
  if (score >= 9.0) return 'Excellent'
  if (score >= 8.0) return 'Very Good'
  if (score >= 7.0) return 'Good'
  return 'Fair'
})

const providerScore = computed(() => {
  if (!props.providerId) return null
  return getProviderScore(props.providerId)
})

const getMetricLabel = (
  value: number | undefined,
  kind: 'delivered' | 'reliability' | 'speed' | 'support' | 'trust',
) => {
  if (value === undefined) {
    if (kind === 'delivered') return 'Competitive'
    if (kind === 'speed') return 'Good'
    return 'Strong'
  }

  const score = value * 10

  if (kind === 'speed') {
    return score >= 9.0 ? 'Elite' : score >= 8.5 ? 'Strong' : score >= 7.5 ? 'Good' : 'Fair'
  }

  if (kind === 'delivered') {
    return score >= 8.5 ? 'Competitive' : score >= 7.5 ? 'Good' : 'Fair'
  }

  return score >= 8.5 ? 'Strong' : score >= 7.5 ? 'Good' : 'Fair'
}

const metrics = computed(() => {
  const breakdown = providerScore.value?.scoreBreakdown
  if (!breakdown) {
    return [
      {
        label: 'Delivered Value',
        labelText: 'N/A',
        badgeClass: 'bg-neutral-100 text-neutral-800',
        barClass: 'bg-neutral-300',
        percentage: 0,
        description: 'Effective cost (FX spread + fees) and quote accuracy',
      },
      {
        label: 'Reliability',
        labelText: 'N/A',
        badgeClass: 'bg-neutral-100 text-neutral-800',
        barClass: 'bg-neutral-300',
        percentage: 0,
        description: 'On-time delivery rate and success rate',
      },
      {
        label: 'Speed',
        labelText: 'N/A',
        badgeClass: 'bg-neutral-100 text-neutral-800',
        barClass: 'bg-neutral-300',
        percentage: 0,
        description: 'KYC friction and delivery speed',
      },
      {
        label: 'Support',
        labelText: 'N/A',
        badgeClass: 'bg-neutral-100 text-neutral-800',
        barClass: 'bg-neutral-300',
        percentage: 0,
        description: 'Refund processing and dispute resolution',
      },
      {
        label: 'Trust & Safety',
        labelText: 'N/A',
        badgeClass: 'bg-neutral-100 text-neutral-800',
        barClass: 'bg-neutral-300',
        percentage: 0,
        description: 'Licensing and regulatory compliance',
      },
    ]
  }

  const deliveredValue = breakdown.deliveredValue * 10
  const reliability = breakdown.reliability * 10
  const frictionSpeed = breakdown.frictionSpeed * 10
  const supportRefunds = breakdown.supportRefunds * 10
  const trustSafety = breakdown.trustSafety * 10

  const getBadgeClass = (score: number, label: string) => {
    if (label === 'Elite') {
      return 'bg-success-600 text-success-600'
    }
    if (score >= 8.5) {
      return 'bg-primary-100 text-primary-800'
    }
    if (score >= 7.5) {
      return 'bg-warning-100 text-warning-800'
    }
    return 'bg-neutral-100 text-neutral-800'
  }

  return [
    {
      label: 'Delivered Value',
      labelText: getMetricLabel(breakdown.deliveredValue, 'delivered'),
      badgeClass: getBadgeClass(deliveredValue, getMetricLabel(breakdown.deliveredValue, 'delivered')),
      barClass: deliveredValue >= 8.5 ? 'bg-success-500' : deliveredValue >= 7.5 ? 'bg-brand-600' : 'bg-warning-500',
      percentage: deliveredValue,
      description: `Effective cost (FX spread + fees) and quote accuracy`,
    },
    {
      label: 'Reliability',
      labelText: getMetricLabel(breakdown.reliability, 'reliability'),
      badgeClass: getBadgeClass(reliability, getMetricLabel(breakdown.reliability, 'reliability')),
      barClass: reliability >= 8.5 ? 'bg-success-500' : reliability >= 7.5 ? 'bg-brand-600' : 'bg-warning-500',
      percentage: reliability,
      description: `On-time delivery rate and success rate`,
    },
    {
      label: 'Speed',
      labelText: getMetricLabel(breakdown.frictionSpeed, 'speed'),
      badgeClass: getBadgeClass(frictionSpeed, getMetricLabel(breakdown.frictionSpeed, 'speed')),
      barClass: frictionSpeed >= 8.5 ? 'bg-success-500' : frictionSpeed >= 7.5 ? 'bg-brand-600' : 'bg-warning-500',
      percentage: frictionSpeed,
      description: `KYC friction and delivery speed`,
    },
    {
      label: 'Support',
      labelText: getMetricLabel(breakdown.supportRefunds, 'support'),
      badgeClass: getBadgeClass(supportRefunds, getMetricLabel(breakdown.supportRefunds, 'support')),
      barClass: supportRefunds >= 8.5 ? 'bg-success-500' : supportRefunds >= 7.5 ? 'bg-brand-600' : 'bg-warning-500',
      percentage: supportRefunds,
      description: `Refund processing and dispute resolution`,
    },
    {
      label: 'Trust & Safety',
      labelText: getMetricLabel(breakdown.trustSafety, 'trust'),
      badgeClass: getBadgeClass(trustSafety, getMetricLabel(breakdown.trustSafety, 'trust')),
      barClass: trustSafety >= 8.5 ? 'bg-success-500' : trustSafety >= 7.5 ? 'bg-brand-600' : 'bg-warning-500',
      percentage: trustSafety,
      description: `Licensing and regulatory compliance`,
    },
  ]
})

const providerSlug = computed(() => {
  if (providerScore.value?.slug) return providerScore.value.slug
  if (props.providerId) {
    // Normalize provider ID to slug format
    return props.providerId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
  // Fallback: normalize provider name to slug
  return normalizeProviderSlug(props.providerName)
})

const getRatingTextClass = (badgeClass: string) => {
  if (badgeClass.includes('success')) return 'text-success-600'
  if (badgeClass.includes('primary') || badgeClass.includes('brand')) return 'text-brand-700'
  if (badgeClass.includes('warning')) return 'text-warning-700'
  return 'text-neutral-600'
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-surface,
.modal-leave-active .bg-surface {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-surface,
.modal-leave-to .bg-surface {
  transform: scale(0.95);
}
</style>
