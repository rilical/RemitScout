<template>
  <div
    v-if="showPrompt"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    @keydown.esc="dismissPrompt"
  >
    <div
      class="absolute inset-0 bg-black/50"
      aria-label="Close dialog"
      @click="dismissPrompt"
    />
    <div
      ref="modalRef"
      class="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-visit-prompt-title"
      tabindex="-1"
      @keydown.esc="dismissPrompt"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3
            id="provider-visit-prompt-title"
            class="text-body-lg font-semibold text-rs-fg"
          >
            Did you complete your transfer?
          </h3>
          <p class="text-body-sm text-rs-muted">
            Help us verify provider accuracy and improve reliability scores.
          </p>
        </div>
        <button
          class="text-neutral-400 hover:text-neutral-600"
          aria-label="Close dialog"
          @click="dismissPrompt"
        >
          <svg
            class="h-5 w-5"
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

      <div class="mt-4 rounded-xl border border-rs-border bg-neutral-50 p-4">
        <div class="text-body-sm font-semibold text-rs-fg">
          {{ activeVisit.provider_name || activeVisit.provider_id }}
        </div>
        <div
          v-if="activeVisit.corridor_id"
          class="text-body-sm text-rs-muted"
        >
          Corridor: {{ activeVisit.corridor_id }}
        </div>
        <div class="mt-2 flex flex-wrap gap-2 text-body-sm text-neutral-600">
          <span v-if="activeVisit.quoted_rate">Quoted rate: {{ activeVisit.quoted_rate }}</span>
          <span v-if="activeVisit.quoted_fee">Quoted fee: {{ activeVisit.quoted_fee }}</span>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-body-sm font-semibold text-success-700 hover:bg-success-100"
            @click="setCompleted(true)"
          >
            Yes, completed
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border border-rs-border bg-surface px-3 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            @click="setCompleted(false)"
          >
            Not yet
          </button>
        </div>

        <div
          v-if="completedTransfer !== null"
          class="space-y-3"
        >
          <div
            v-if="completedTransfer"
            class="grid grid-cols-2 gap-3"
          >
            <label class="text-body-sm text-neutral-600">
              Transfer amount
              <input
                v-model="transferAmount"
                type="number"
                min="0"
                class="mt-1 w-full rounded-md border border-rs-border px-2 py-1 text-body-sm"
              >
            </label>
            <label class="text-body-sm text-neutral-600">
              Transfer date
              <input
                v-model="transferDate"
                type="date"
                class="mt-1 w-full rounded-md border border-rs-border px-2 py-1 text-body-sm"
              >
            </label>
            <label class="text-body-sm text-neutral-600">
              Actual rate
              <input
                v-model="actualRate"
                type="number"
                min="0"
                step="0.0001"
                class="mt-1 w-full rounded-md border border-rs-border px-2 py-1 text-body-sm"
              >
            </label>
            <label class="text-body-sm text-neutral-600">
              Actual fee
              <input
                v-model="actualFee"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 w-full rounded-md border border-rs-border px-2 py-1 text-body-sm"
              >
            </label>
          </div>

          <label class="text-body-sm text-neutral-600">
            Rating (1-5)
            <input
              v-model="feedbackRating"
              type="number"
              min="1"
              max="5"
              class="mt-1 w-full rounded-md border border-rs-border px-2 py-1 text-body-sm"
            >
          </label>

          <label class="text-body-sm text-neutral-600">
            Notes (optional)
            <textarea
              v-model="feedbackNotes"
              rows="2"
              class="mt-1 w-full rounded-md border border-rs-border px-2 py-1 text-body-sm"
            />
          </label>
        </div>

        <p
          v-if="errorMessage"
          class="text-body-sm text-danger-600"
        >
          {{ errorMessage }}
        </p>
      </div>

      <div class="mt-5 flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-lg border border-rs-border px-3 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          @click="dismissPrompt"
        >
          Not now
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="completedTransfer === null || submitting"
          @click="submit"
        >
          {{ submitting ? 'Saving...' : 'Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useProviderVisits } from '~/composables/useProviderVisits'
import { useAffiliate } from '~/composables/useAffiliate'
import { useAuth } from '~/composables/useAuth'
import { useFocusTrap } from '~/composables/useFocusTrap'

type Props = {
  autoOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoOpen: true,
})

const { isAuthenticated } = useAuth()
const { pendingVisits, fetchPendingFeedback, submitFeedback } = useProviderVisits()
const { trackConversion } = useAffiliate()

const showPrompt = ref(false)
const completedTransfer = ref<boolean | null>(null)
const transferAmount = ref<string>('')
const transferDate = ref<string>('')
const actualRate = ref<string>('')
const actualFee = ref<string>('')
const feedbackRating = ref<string>('')
const feedbackNotes = ref<string>('')
const errorMessage = ref<string | null>(null)
const submitting = ref(false)
const hasFetched = ref(false)

const modalRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalRef)

const activeVisit = computed(() => pendingVisits.value[0])

const getCorridorCurrency = (corridorId?: string | null) => {
  if (!corridorId) return null
  const parts = corridorId.split('-')
  if (parts.length !== 4) return null
  return parts[2] || null
}

const resetForm = () => {
  completedTransfer.value = null
  transferAmount.value = ''
  transferDate.value = ''
  actualRate.value = ''
  actualFee.value = ''
  feedbackRating.value = ''
  feedbackNotes.value = ''
  errorMessage.value = null
}

const dismissPrompt = () => {
  showPrompt.value = false
  resetForm()
}

const open = () => {
  if (pendingVisits.value.length === 0) return
  showPrompt.value = true
}

watch(
  () => showPrompt.value,
  async (open) => {
    if (!open) {
      deactivate()
      return
    }

    await nextTick()
    activate()
  },
)

onBeforeUnmount(() => {
  deactivate()
})

const setCompleted = (value: boolean) => {
  completedTransfer.value = value
}

const submit = async () => {
  if (!activeVisit.value || completedTransfer.value === null) {
    return
  }

  submitting.value = true
  errorMessage.value = null

  try {
    await submitFeedback(activeVisit.value.id, {
      completed_transfer: completedTransfer.value,
      transfer_amount: transferAmount.value ? Number(transferAmount.value) : undefined,
      transfer_date: transferDate.value || undefined,
      actual_rate: actualRate.value ? Number(actualRate.value) : undefined,
      actual_fee: actualFee.value ? Number(actualFee.value) : undefined,
      feedback_rating: feedbackRating.value ? Number(feedbackRating.value) : undefined,
      feedback_notes: feedbackNotes.value || undefined,
    })
    if (completedTransfer.value) {
      const amount = transferAmount.value ? Number(transferAmount.value) : undefined
      const currency = getCorridorCurrency(activeVisit.value.corridor_id)
      void trackConversion({
        providerId: activeVisit.value.provider_id,
        corridorId: activeVisit.value.corridor_id ?? undefined,
        amount,
        currency: currency ?? undefined,
        source: 'provider_visit',
      })
    }
    resetForm()
    showPrompt.value = pendingVisits.value.length > 0
  }
  catch (error: any) {
    errorMessage.value = error?.message || 'Unable to submit feedback.'
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!isAuthenticated.value) return
  await fetchPendingFeedback(3)
  showPrompt.value = props.autoOpen && pendingVisits.value.length > 0
  hasFetched.value = true
})

watch(pendingVisits, (value) => {
  if (value.length === 0) {
    showPrompt.value = false
  }
})

watch(isAuthenticated, async (value) => {
  if (!value) {
    hasFetched.value = false
    pendingVisits.value = []
    showPrompt.value = false
    return
  }
  if (!hasFetched.value) {
    await fetchPendingFeedback(3)
    showPrompt.value = props.autoOpen && pendingVisits.value.length > 0
    hasFetched.value = true
  }
})

defineExpose({
  open,
})
</script>
