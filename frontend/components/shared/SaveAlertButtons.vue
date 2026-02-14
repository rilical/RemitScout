<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg border border-rs-border bg-surface px-3 py-2 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      @click="handleSave"
    >
      <span aria-hidden="true">⭐</span>
      <span>{{ saved ? 'Saved' : 'Save' }}</span>
    </button>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      @click="handleOpenAlert"
    >
      <span aria-hidden="true">🔔</span>
      <span>Set alert</span>
    </button>
  </div>

  <AuthPromptModal
    v-if="authModalOpen"
    :is-open="authModalOpen"
    :feature="authModalFeature"
    :title="authModalFeature === 'watchlist' ? 'Sign in to save items' : 'Sign in to set alerts'"
    :message="authModalFeature === 'watchlist'
      ? 'Create a free account to save this item to your watchlist and track rate changes.'
      : 'Create a free account to set rate alerts and get notified when rates improve.'"
    @close="authModalOpen = false"
  />

  <LimitReachedModal
    v-if="limitModalOpen"
    :is-open="limitModalOpen"
    :feature="limitModalFeature"
    :limit="limitModalLimit"
    :current-count="limitModalCount"
    :show-upgrade="!isPlus"
    :title="limitModalFeature === 'watchlist' ? 'Watchlist limit reached' : 'Alert limit reached'"
    :message="limitMessage"
    :items="limitModalItems"
    @close="limitModalOpen = false"
    @remove="handleLimitRemove"
  />

  <SuccessToast
    ref="successToastRef"
    :title="toastTitle"
    :message="toastMessage"
    :variant="toastVariant"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { WatchTarget } from '~/types/tracking'
import SuccessToast from '~/components/shared/SuccessToast.vue'

const AuthPromptModal = defineAsyncComponent(() => import('~/components/shared/AuthPromptModal.vue'))
const LimitReachedModal = defineAsyncComponent(() => import('~/components/shared/LimitReachedModal.vue'))

const props = defineProps<{
  target: WatchTarget
  label?: string
  source?: 'compare' | 'exchange_rates' | 'pulse' | 'guide' | 'other'
}>()

const { isAuthenticated } = useAuth()
const { isPlus } = useEntitlements()
const watchlist = useWatchlist()
const alerts = useAlerts()
const modal = useSaveAlertModal()

const saved = computed(() => watchlist.isSaved(props.target))
const targetLabel = computed(() => {
  if (props.label) return props.label
  switch (props.target.type) {
    case 'corridor':
      return `${props.target.from} → ${props.target.to}${props.target.method ? ` • ${props.target.method}` : ''}`
    case 'fxPair':
      return `${props.target.base}/${props.target.quote}`
    case 'pulseChart':
      return `Pulse chart ${props.target.chartId}`
    case 'guide':
      return `Guide: ${props.target.slug}`
    default:
      return 'Saved item'
  }
})

const authModalOpen = ref(false)
const authModalFeature = ref<'watchlist' | 'alert'>('watchlist')
const limitModalOpen = ref(false)
const limitModalFeature = ref<'watchlist' | 'alert'>('watchlist')
const limitModalLimit = ref(3)
const successToastRef = ref<{ show: () => void, hide: () => void } | null>(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastVariant = ref<'success' | 'error'>('success')

const limitModalCount = computed(() => {
  return limitModalFeature.value === 'watchlist'
    ? watchlist.count.value
    : alerts.count.value
})

const limitMessage = computed(() => {
  if (limitModalFeature.value === 'watchlist') {
    if (isPlus.value) {
      return `You've saved ${limitModalCount.value} items, the current Plus limit. Remove one to add another.`
    }
    return `You've saved ${limitModalCount.value} items, the maximum for free accounts.`
  }
  if (isPlus.value) {
    return `You've created ${limitModalCount.value} alerts, the current Plus limit. Remove one to add another.`
  }
  return `You've created ${limitModalCount.value} alerts, the maximum for free accounts.`
})

const metricLabels: Record<string, string> = {
  recipientGets: 'Recipient gets',
  totalCost: 'Total cost',
  fee: 'Fee',
  midMarketRate: 'Mid-market rate',
  rate: 'Rate',
  sendScore: 'Intelligent alert',
  index: 'Index',
}

const comparatorLabels: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
}

const formatAlertValue = (metric: string, value: number) => {
  if (!Number.isFinite(value)) return '—'
  if (metric === 'sendScore') return Math.round(value).toString()
  if (metric === 'rate' || metric === 'midMarketRate') return value.toFixed(4)
  return value.toFixed(2)
}

const limitModalItems = computed(() => {
  const sliceLimit = limitModalLimit.value || 0
  if (limitModalFeature.value === 'alert') {
    const items = alerts.alerts.value.map((alert) => {
      const label = watchlist.findById(alert.watchlistItemId)?.label || 'Alert'
      const metricLabel = metricLabels[alert.rule.metric] || 'Alert'
      const comparatorLabel = comparatorLabels[alert.rule.comparator] || alert.rule.comparator
      const valueLabel = formatAlertValue(alert.rule.metric, alert.rule.value)
      const currencyLabel = alert.rule.currency ? ` ${alert.rule.currency}` : ''
      return {
        id: alert.id,
        label,
        meta: `${metricLabel} ${comparatorLabel} ${valueLabel}${currencyLabel}`.trim(),
      }
    })
    return sliceLimit > 0 ? items.slice(0, sliceLimit) : items
  }

  const items = watchlist.items.value.map(item => ({
    id: item.id,
    label: item.label,
  }))
  return sliceLimit > 0 ? items.slice(0, sliceLimit) : items
})

const handleLimitRemove = async (id: string) => {
  if (limitModalFeature.value === 'watchlist') {
    await watchlist.remove(id)
  }
  else {
    await alerts.remove(id)
  }

  if (limitModalLimit.value > 0 && limitModalCount.value < limitModalLimit.value) {
    limitModalOpen.value = false
  }
}

const handleSave = async () => {
  if (!isAuthenticated.value) {
    authModalFeature.value = 'watchlist'
    authModalOpen.value = true
    return
  }
  const result = await watchlist.save(props.target, props.label ? { label: props.label } : undefined)
  if (result.status === 'saved') {
    toastTitle.value = 'Added to watchlist!'
    toastMessage.value = `${targetLabel.value} saved`
    toastVariant.value = 'success'
    successToastRef.value?.show()
  }
  else if (result.status === 'already_saved') {
    toastTitle.value = 'Already saved'
    toastMessage.value = 'This item is already in your watchlist'
    toastVariant.value = 'success'
    successToastRef.value?.show()
  }
  else if (result.status === 'limit_reached') {
    limitModalFeature.value = 'watchlist'
    limitModalLimit.value = result.limit
    limitModalOpen.value = true
  }
  else if (result.status === 'error') {
    toastTitle.value = 'Unable to save'
    toastMessage.value = result.message
    toastVariant.value = 'error'
    successToastRef.value?.show()
  }
}

const handleOpenAlert = () => {
  if (!isAuthenticated.value) {
    authModalFeature.value = 'alert'
    authModalOpen.value = true
    return
  }
  modal.open({
    target: props.target,
    label: props.label,
    source: props.source,
  })
}
</script>
