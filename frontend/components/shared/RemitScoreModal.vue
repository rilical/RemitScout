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
          class="bg-surface rounded-2xl shadow-2xl max-w-4xl w-full my-8 relative max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remit-score-title"
          tabindex="-1"
          @click.stop
        >
          <div class="flex-shrink-0 bg-surface border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
            <h2
              id="remit-score-title"
              class="text-h3 font-bold text-neutral-900"
            >
              Remit-Scout In-House Rating (Remit-Score)
            </h2>
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

          <div class="px-6 py-6 space-y-8 overflow-y-auto flex-1">
            <div>
              <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                Understanding Your Remit-Score
              </h3>
              <p class="text-body text-neutral-700 leading-relaxed">
                Remit-Score is our proprietary rating system that evaluates money transfer providers on a scale of <strong>0-10</strong>.
                Scores like <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-body-sm mx-1">9.5</span>,
                <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-body-sm mx-1">8.4</span>, or
                <span class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-brand-500 text-brand-600 font-bold text-body-sm mx-1">7.2</span>
                represent the overall quality and value you can expect from each provider for your specific transfer.
              </p>
            </div>

            <div class="bg-brand-50 border-l-4 border-brand-600 p-4 rounded-r-lg">
              <h4 class="font-bold text-neutral-900 mb-2">
                What Makes Remit-Score Different
              </h4>
              <ul class="space-y-2 text-body-sm text-neutral-700">
                <li class="flex items-start">
                  <svg
                    class="w-5 h-5 text-brand-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong>Scenario-specific:</strong> Scores computed per corridor, payout method, and amount. Not one generic number</span>
                </li>
                <li class="flex items-start">
                  <svg
                    class="w-5 h-5 text-brand-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong>Outcome-based:</strong> Based on real executed transfers and live quotes, not just reviews</span>
                </li>
                <li class="flex items-start">
                  <svg
                    class="w-5 h-5 text-brand-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong>Explainable:</strong> Every score shows what drove it with confidence bands based on data volume and recency</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                Rating Categories & Weights
              </h3>
              <div class="space-y-4">
                <div class="border border-neutral-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Delivered Value
                    </h4>
                    <span class="text-brand-600 font-bold text-body-lg">40%</span>
                  </div>
                  <p class="text-body-sm text-neutral-600">
                    Effective cost (FX spread + fees), how often provider is cheapest, and quote vs. actual delivery accuracy
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 40%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Reliability & Success
                    </h4>
                    <span class="text-brand-600 font-bold text-body-lg">20%</span>
                  </div>
                  <p class="text-body-sm text-neutral-600">
                    On-time delivery rate, failure rate, API uptime, and corridor coverage consistency
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 20%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Friction & Speed
                    </h4>
                    <span class="text-brand-600 font-bold text-body-lg">15%</span>
                  </div>
                  <p class="text-body-sm text-neutral-600">
                    KYC friction, time to first send, and delivery speed (P50/P95) for your scenario
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 15%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Support & Refunds
                    </h4>
                    <span class="text-brand-600 font-bold text-body-lg">15%</span>
                  </div>
                  <p class="text-body-sm text-neutral-600">
                    Refund processing time, dispute resolution SLA, post-resolution satisfaction, and chargeback rate
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 15%"
                    />
                  </div>
                </div>

                <div class="border border-neutral-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-neutral-900">
                      Trust & Safety
                    </h4>
                    <span class="text-brand-600 font-bold text-body-lg">10%</span>
                  </div>
                  <p class="text-body-sm text-neutral-600">
                    Licensing verification, regulatory compliance, complaint rate, security certifications (SOC2/PCI)
                  </p>
                  <div class="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-brand-600 rounded-full"
                      style="width: 10%"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-neutral-50 rounded-lg p-6">
              <h3 class="text-body-lg font-bold text-neutral-900 mb-3">
                How to Read the Numbers
              </h3>
              <div class="grid sm:grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-success-500 bg-surface shadow-md mb-2">
                    <span class="text-h4 font-bold text-success-600">9.0+</span>
                  </div>
                  <p class="text-body-sm font-semibold text-neutral-900">
                    Excellent
                  </p>
                  <p class="text-body-sm text-neutral-600">
                    Top-tier provider
                  </p>
                </div>
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-primary-500 bg-surface shadow-md mb-2">
                    <span class="text-body-lg font-bold text-brand-600">8.0+</span>
                  </div>
                  <p class="text-body-sm font-semibold text-neutral-900">
                    Very Good
                  </p>
                  <p class="text-body-sm text-neutral-600">
                    Strong performer
                  </p>
                </div>
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-warning-500 bg-surface shadow-md mb-2">
                    <span class="text-body-lg font-bold text-warning-600">7.0+</span>
                  </div>
                  <p class="text-body-sm font-semibold text-neutral-900">
                    Good
                  </p>
                  <p class="text-body-sm text-neutral-600">
                    Solid choice
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-shrink-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4">
            <button
              class="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
              @click="close"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useFocusTrap } from '~/composables/useFocusTrap'

interface Props {
  isOpen: boolean
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
  async (isOpen) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : ''
    }

    if (!isOpen) {
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
