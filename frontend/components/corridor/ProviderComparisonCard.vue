<template>
  <article
    class="overflow-hidden rounded-[28px] border bg-surface shadow-sm hover:-translate-y-0.5 hover:shadow-lg motion-safe:transition-all motion-safe:duration-200"
    :class="cardClasses"
  >
    <div
      v-if="isTopRanked && highlightLabel"
      class="text-body-sm flex items-center gap-2 px-5 py-3 font-semibold text-white sm:px-6"
      :class="topRibbonClasses"
    >
      <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>{{ highlightLabel }}</span>
    </div>

    <div class="p-5 sm:p-6 lg:p-7">
      <div class="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)] xl:items-center">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            class="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-rs-border bg-neutral-50 p-3.5 shadow-sm sm:h-32 sm:w-32 sm:p-4"
          >
            <ProviderLogo
              :slug="row._slug || ''"
              :alt="row.provider"
              size="large"
              fit
              class="h-full w-full object-contain object-center"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-h3 font-bold tracking-tight text-rs-fg">
                {{ row.provider }}
              </h3>
              <ScoreBadge
                :score="Number.parseFloat(row.score)"
                :clickable="true"
                size="large"
                @click="$emit('openScore')"
              />
              <span
                v-if="row.isStale"
                class="text-body-sm inline-flex items-center rounded-full bg-warning-100 px-3 py-1 font-semibold text-warning-900"
              >
                Refreshing
              </span>
              <span
                v-if="row.warning"
                class="text-body-sm inline-flex items-center rounded-full bg-danger-50 px-3 py-1 font-semibold text-danger-700"
              >
                {{ row.warning }}
              </span>
            </div>

            <div
              class="text-body-sm mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-rs-muted"
            >
              <span class="inline-flex items-center gap-1.5">
                <svg
                  class="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{{ row.speed }} · {{ row.speedNote }}</span>
              </span>
              <span v-if="row.isStale && row._staleLabel">{{ row._staleLabel }}</span>
              <NuxtLink
                v-if="row._slug"
                :to="`/learn/providers/${row._slug}`"
                class="font-semibold text-brand-600 underline-offset-2 hover:text-brand-500 hover:underline motion-safe:transition-colors"
              >
                Read review
              </NuxtLink>
            </div>

            <p
              v-if="row.notes && row.notes !== row.speedNote"
              class="text-body-sm mt-3 max-w-2xl leading-relaxed text-rs-muted"
            >
              {{ row.notes }}
            </p>

            <div
              v-if="row.hasPromo && row.promoInfo"
              class="text-body-sm mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-brand-700"
            >
              <svg
                class="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span class="font-semibold">
                {{ row.promoInfo.newCustomersOnly ? 'New customer promo' : 'Promo rate' }}
              </span>
              <span>Fee: {{ formatMoney(row.promoInfo.fee, fromCurrencyCode) }}</span>
            </div>
          </div>
        </div>

        <div
          class="flex w-full items-center justify-center self-start overflow-hidden rounded-[24px] border px-7 py-5 sm:h-32 sm:px-8 xl:justify-self-end"
          :class="recipientPanelClasses"
        >
          <div
            class="flex h-full w-fit max-w-full flex-col items-center justify-center gap-2.5 text-center"
          >
            <p
              class="text-[0.74rem] font-semibold uppercase leading-none tracking-[0.18em] !text-white"
            >
              Recipient gets
            </p>
            <p
              class="max-w-full whitespace-nowrap font-bold tabular-nums leading-none tracking-tight text-white"
              :class="recipientAmountClasses"
            >
              {{ row.recipientGets }}
            </p>
            <p class="text-[1.02rem] font-semibold leading-snug !text-white">
              {{ recipientDeltaLabel }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <section class="rounded-2xl border border-rs-border bg-neutral-50 p-4">
          <p class="text-body-sm font-medium text-rs-muted">Exchange rate</p>
          <p class="text-body-lg mt-2 font-bold text-rs-fg">
            {{ row.rate }}
          </p>
          <p class="text-body-sm mt-3 font-medium" :class="rateComparisonClasses">
            {{ rateComparisonText }}
          </p>
        </section>

        <section class="rounded-2xl border border-rs-border bg-neutral-50 p-4">
          <p class="text-body-sm font-medium text-rs-muted">Total cost</p>
          <p class="text-h3 mt-2 font-bold tracking-tight text-rs-fg">
            {{ totalCostDisplay }}
          </p>
          <p class="text-body-sm mt-3 leading-relaxed text-rs-muted">
            {{ totalCostHelper }}
          </p>
        </section>

        <section class="rounded-2xl border border-rs-border bg-neutral-50 p-5">
          <p class="text-body-sm font-medium text-rs-muted">Pay via</p>
          <ul
            v-if="methodItems.length"
            class="mt-4 grid gap-x-4 gap-y-3"
            :class="methodItems.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <li
              v-for="(method, index) in methodItems"
              :key="`${method.label}-${index}`"
              class="min-w-0"
            >
              <div class="flex min-w-0 items-start gap-3 rounded-xl px-1 py-1 text-rs-fg">
                <span
                  class="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.85)]"
                >
                  <svg
                    class="h-[18px] w-[18px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      :d="getMethodIconPath(method.icon)"
                    />
                  </svg>
                </span>
                <span class="min-w-0 pt-1 text-[0.96rem] font-medium leading-5 text-rs-fg">
                  {{ method.label }}
                </span>
              </div>
            </li>
          </ul>
          <p v-else class="text-body-sm mt-3 leading-relaxed text-rs-muted">
            Check provider checkout for available payout methods.
          </p>
        </section>
      </div>

      <button
        type="button"
        class="text-body mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-semibold text-white motion-safe:transition-colors"
        :class="ctaClasses"
        @click="$emit('outbound')"
      >
        <span>Go to {{ row.provider }}</span>
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ScoreBadge from '~/components/shared/ScoreBadge.vue';
import ProviderLogo from '~/components/shared/ProviderLogo.vue';
import type { TrueCostBreakdown } from '~/types/remit';

type PromoInfo = {
  fee: number;
  rate: number;
  headline: string;
  details: string[];
  newCustomersOnly: boolean;
};

type MethodIconName = 'bank' | 'cash' | 'wallet' | 'airtime' | 'home' | 'card' | 'generic';

type ProviderComparisonCardRow = {
  provider: string;
  score: string;
  recipientGets: string;
  rate: string;
  fee: string;
  speed: string;
  speedNote: string;
  payIn: string;
  notes: string;
  warning?: string;
  isStale?: boolean;
  hasPromo?: boolean;
  methods?: string[];
  promoInfo?: PromoInfo | null;
  _slug: string | null;
  _trueCost: TrueCostBreakdown;
  _rateComparison: { text: string; isBetter: boolean; isWorse: boolean };
  _recipientGapToBest: number;
  _staleLabel: string;
  _methodLabels: string[];
};

interface Props {
  row: ProviderComparisonCardRow;
  isTopRanked?: boolean;
  highlightLabel?: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  midMarketRate?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  isTopRanked: false,
  highlightLabel: '',
  midMarketRate: null,
});

defineEmits<{
  openScore: [];
  outbound: [];
}>();

const { formatMoney } = useRemittanceApi();

const hasMidMarketComparison = computed(() =>
  Boolean(props.midMarketRate && Number.isFinite(props.row._trueCost.providerRate))
);

const cardClasses = computed(() =>
  props.isTopRanked ? 'border-brand-200 ring-1 ring-brand-100' : 'border-rs-border'
);

const topRibbonClasses = computed(() => (props.isTopRanked ? 'bg-brand-600' : 'bg-neutral-900'));

const recipientPanelClasses = computed(() =>
  props.isTopRanked
    ? 'border-brand-500 bg-brand-600 shadow-[0_18px_36px_-24px_rgba(37,99,235,0.9)]'
    : 'border-neutral-900 bg-neutral-900 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.9)]'
);

const recipientDeltaState = computed<'high' | 'same' | 'low'>(() => {
  if (props.row._recipientGapToBest <= 0.009) return 'high';
  if (props.row._recipientGapToBest < 1) return 'same';
  return 'low';
});

const recipientDeltaLabel = computed(() => {
  if (recipientDeltaState.value === 'high') return 'Highest recipient outcome';
  if (recipientDeltaState.value === 'same') return 'In line with the best result';
  return `${formatRecipientAmount(props.row._recipientGapToBest)} less than best`;
});

const recipientAmountClasses = computed(() => {
  const length = props.row.recipientGets.length;
  if (length >= 18) return 'text-[clamp(1.6rem,2vw,1.9rem)]';
  if (length >= 15) return 'text-[clamp(1.8rem,2.25vw,2.1rem)]';
  return 'text-[clamp(1.95rem,2.6vw,2.3rem)]';
});

const rateComparisonText = computed(() => {
  if (props.row._rateComparison.text) return props.row._rateComparison.text;
  return hasMidMarketComparison.value
    ? 'Rate comparison unavailable'
    : 'Mid-market comparison unavailable';
});

const rateComparisonClasses = computed(() => {
  if (props.row._rateComparison.isBetter) return 'text-success-700';
  if (props.row._rateComparison.isWorse) return 'text-danger-700';
  return 'text-rs-muted';
});

const totalCostDisplay = computed(() => {
  if (!hasMidMarketComparison.value) return props.row.fee;
  return formatMoney(props.row._trueCost.totalCost, props.fromCurrencyCode);
});

const totalCostHelper = computed(() => {
  if (!hasMidMarketComparison.value) {
    return 'Transfer fee only. Mid-market markup is unavailable for this quote.';
  }

  return `${formatMoney(props.row._trueCost.upfrontFee, props.fromCurrencyCode)} fee · ${formatMoney(props.row._trueCost.hiddenMarkup, props.fromCurrencyCode)} FX markup`;
});

const methodLabels = computed(() => {
  if (props.row._methodLabels.length) return props.row._methodLabels;
  return props.row.payIn ? [props.row.payIn] : [];
});

const methodItems = computed(() =>
  methodLabels.value.map(label => ({
    label,
    icon: getMethodIconName(label),
  }))
);

const ctaClasses = computed(() =>
  props.isTopRanked ? 'bg-brand-600 hover:bg-brand-700' : 'bg-neutral-900 hover:bg-neutral-800'
);

function formatRecipientAmount(value: number) {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)} ${props.toCurrencyCode}`;
}

function getMethodIconName(label: string): MethodIconName {
  const normalized = label.toLowerCase();

  if (normalized.includes('bank')) return 'bank';
  if (normalized.includes('cash')) return 'cash';
  if (normalized.includes('wallet') || normalized.includes('mobile')) return 'wallet';
  if (normalized.includes('airtime')) return 'airtime';
  if (normalized.includes('home')) return 'home';
  if (normalized.includes('card')) return 'card';
  return 'generic';
}

function getMethodIconPath(icon: MethodIconName) {
  if (icon === 'bank') {
    return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
  }
  if (icon === 'cash') {
    return 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z';
  }
  if (icon === 'wallet') {
    return 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z';
  }
  if (icon === 'airtime') {
    return 'M8 21h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v13a2 2 0 002 2zM12 17h.01M7 5h10';
  }
  if (icon === 'home') {
    return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z';
  }
  if (icon === 'card') {
    return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
  }
  return 'M12 4v16m8-8H4';
}
</script>
