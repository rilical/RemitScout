<template>
  <div
    data-testid="corridor-query-surface"
    :data-ready="isInteractionReady ? 'true' : 'false'"
    class="overflow-hidden rounded-2xl border border-rs-border bg-gradient-to-b from-neutral-50 to-white shadow-sm"
  >
    <!-- Main Query Builder -->
    <div class="p-5">
      <div class="flex flex-col justify-center gap-4 lg:flex-row lg:items-center">
        <!-- Country Selectors -->
        <div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <!-- From Country -->
          <div>
            <label
              class="text-body-sm mb-2 block font-semibold uppercase tracking-wider text-rs-muted"
              >From</label
            >
            <div class="relative w-full">
              <CountrySelect
                id="corridor-from-country"
                v-model="localFromCountry"
                label="From"
                :exclude-country="localToCountry"
                placeholder="Sending from"
                :disabled="!isInteractionReady"
                @country-selected="
                  (countryCode, currency) => handleCountrySelection('from', countryCode, currency)
                "
              />
            </div>
          </div>
          <!-- To Country -->
          <div>
            <label
              class="text-body-sm mb-2 block font-semibold uppercase tracking-wider text-rs-muted"
              >To</label
            >
            <div class="relative w-full">
              <CountrySelect
                id="corridor-to-country"
                v-model="localToCountry"
                label="To"
                :exclude-country="localFromCountry"
                placeholder="Receiving in"
                :disabled="!isInteractionReady"
                @country-selected="
                  (countryCode, currency) => handleCountrySelection('to', countryCode, currency)
                "
              />
            </div>
          </div>
        </div>

        <!-- Amount & Currency -->
        <div class="flex items-center gap-6">
          <div class="w-32">
            <label
              class="text-body-sm mb-2 block font-semibold uppercase tracking-wider text-rs-muted"
              >You send</label
            >
            <div class="relative">
              <input
                id="amount-input"
                v-model.number="localAmount"
                type="number"
                :min="inputMin"
                :max="inputMax"
                step="0.01"
                class="h-12 w-full rounded-lg border border-neutral-300 bg-surface px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                :disabled="!isInteractionReady"
                @blur="handleAmountBlur"
                @input="sanitizeAmountInput"
                @keydown="preventNegative"
              />
            </div>
          </div>

          <!-- From Currency -->
          <div class="w-24 sm:w-28">
            <label
              class="text-body-sm mb-2 block font-semibold uppercase tracking-wider text-rs-muted"
              >Currency</label
            >
            <CurrencySelect
              id="corridor-from-currency"
              v-model="localFromCurrency"
              :currencies="availableFromCurrenciesArray"
              :country-code="localFromCountry"
              placeholder="USD"
              code-only
              :disabled="!isInteractionReady"
              @currency-selected="emitUpdate"
            />
          </div>

          <!-- To Currency -->
          <div class="w-24 sm:w-28">
            <label
              class="text-body-sm mb-2 block font-semibold uppercase tracking-wider text-rs-muted"
              >Receive</label
            >
            <CurrencySelect
              id="corridor-to-currency"
              v-model="localToCurrency"
              :currencies="availableToCurrenciesArray"
              :country-code="localToCountry"
              placeholder="USD"
              code-only
              :disabled="!isInteractionReady"
              @currency-selected="emitUpdate"
            />
          </div>

          <!-- Compare Button -->
          <div class="flex-shrink-0">
            <label
              class="text-body-sm mb-2 block font-semibold uppercase tracking-wider text-rs-muted"
              >Action</label
            >
            <button
              type="button"
              :disabled="!isInteractionReady || isSearching"
              data-testid="corridor-query-compare-button"
              class="text-body-sm flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-600 px-6 font-semibold text-white transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleSearch"
            >
              <svg v-if="isSearching" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span v-if="isSearching">Updating...</span>
              <span v-else>Compare providers</span>
              <svg
                v-if="!isSearching"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Bar — only visible when results are available -->
    <div
      v-if="isInteractionReady && props.hasResults"
      class="border-t border-rs-border bg-neutral-50/50 px-6 py-5"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Payout Methods -->
        <div class="flex items-center gap-3">
          <span class="text-body-sm mr-1 font-semibold uppercase tracking-wider text-rs-muted"
            >Delivery</span
          >
          <!-- Loading state -->
          <div
            v-if="props.methodsLoading"
            class="inline-flex items-center gap-2 rounded-xl border border-rs-border bg-surface px-4 py-3 shadow-sm"
          >
            <svg class="h-4 w-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span class="text-body-sm text-rs-muted">Loading options...</span>
          </div>
          <!-- No methods available -->
          <div v-else-if="payoutMethods.length === 0" class="text-body-sm text-rs-muted">
            All delivery methods
          </div>
          <!-- Actual method buttons -->
          <div
            v-else
            class="flex flex-wrap items-stretch gap-2 rounded-xl border border-rs-border bg-surface p-2.5 shadow-sm"
          >
            <button
              v-for="method in payoutMethods"
              :key="method.value"
              type="button"
              :class="[
                'inline-flex min-h-[58px] items-center gap-2.5 rounded-lg px-4 py-3 text-[0.95rem] font-semibold leading-tight transition-all disabled:cursor-not-allowed disabled:opacity-50',
                localPayoutMethod === method.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50',
              ]"
              :disabled="!isInteractionReady"
              @click="selectMethod(method.value)"
            >
              <component :is="method.icon" class="h-4 w-4 flex-shrink-0" />
              {{ method.label }}
            </button>
          </div>
        </div>

        <!-- Sort & Action Buttons -->
        <div class="flex items-center gap-3">
          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-body-sm font-semibold uppercase tracking-wider text-rs-muted"
              >Sort</span
            >
            <div class="w-[200px] flex-shrink-0">
              <UniversalDropdown
                :model-value="localSortBy"
                :options="sortOptions"
                :disabled="!isInteractionReady"
                button-class="h-12 rounded-lg border border-neutral-300 bg-surface px-4 pr-10 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                @update:model-value="
                  value => {
                    localSortBy = value as string;
                    $emit('sort', localSortBy);
                  }
                "
              />
            </div>
          </div>

          <!-- Divider -->
          <div class="h-6 w-px bg-neutral-200" />

          <!-- Action Icons -->
          <div class="flex items-center gap-1">
            <button
              type="button"
              :class="[
                'rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                props.watchlistActive
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100'
                  : 'text-rs-muted hover:bg-brand-50 hover:text-brand-600',
              ]"
              title="Add to watchlist"
              aria-label="Add to watchlist"
              :disabled="!isInteractionReady"
              :aria-pressed="props.watchlistActive"
              data-testid="corridor-sticky-watchlist-button"
              @click="emit('save')"
            >
              <svg
                class="h-5 w-5"
                :fill="props.watchlistActive ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-testid="corridor-sticky-watchlist-icon"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
            <button
              type="button"
              :class="[
                'rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                props.alertActive
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100'
                  : 'text-rs-muted hover:bg-brand-50 hover:text-brand-600',
              ]"
              title="Set rate alert"
              aria-label="Set rate alert"
              :disabled="!isInteractionReady"
              :aria-pressed="props.alertActive"
              data-testid="corridor-sticky-alert-button"
              @click="emit('alert')"
            >
              <svg
                class="h-5 w-5"
                :fill="props.alertActive ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-testid="corridor-sticky-alert-icon"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-rs-muted transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Share"
              aria-label="Share"
              :disabled="!isInteractionReady"
              @click="emit('share')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Inline loading indicator -->
    <div v-if="props.loading" data-testid="corridor-refresh-gate" class="border-t border-rs-border">
      <div class="flex items-center justify-center gap-3 px-5 py-5">
        <div
          class="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        />
        <span class="text-body-sm font-medium text-rs-muted">Checking live provider quotes…</span>
      </div>
      <div class="relative h-1 w-full overflow-hidden bg-brand-100">
        <div class="loading-bar-slide absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand-500" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, nextTick, onMounted } from 'vue';
import CountrySelect from '~/components/shared/CountrySelect.vue';
import CurrencySelect from '~/components/shared/CurrencySelect.vue';
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue';
import { COUNTRIES, getCountryByCode } from '~/utils/countries-currencies';
import { sanitizeAmount, getMinAmount, getMaxAmount } from '~/utils/currency-limits';

const BankIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    }),
  ]);
const CashIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    }),
  ]);
const WalletIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    }),
  ]);
const AirtimeIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M8 21h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v13a2 2 0 002 2zM12 17h.01M7 5h10',
    }),
  ]);
const CardIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    }),
  ]);
const HomeIcon = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z',
    }),
  ]);

const props = withDefaults(
  defineProps<{
    amount: number;
    payoutMethod: string;
    sortBy: string;
    currency?: string;
    fromCurrency?: string;
    fromCountry?: string;
    toCountry?: string;
    availableToCurrencies?: string | string[];
    availableFromCurrencies?: string | string[];
    availableMethods?: string | string[];
    methodsLoading?: boolean;
    loading?: boolean;
    hasResults?: boolean;
    watchlistActive?: boolean;
    alertActive?: boolean;
  }>(),
  {
    currency: 'USD',
    fromCurrency: 'USD',
    fromCountry: 'US',
    toCountry: 'MX',
    availableToCurrencies: () => [],
    availableFromCurrencies: () => [],
    availableMethods: () => [],
    methodsLoading: false,
    loading: false,
    hasResults: false,
    watchlistActive: false,
    alertActive: false,
  }
);

const emit = defineEmits<{
  update: [
    {
      amount: number;
      payoutMethod: string;
      currency: string;
      fromCurrency: string;
      fromCountry?: string;
      toCountry?: string;
    },
  ];
  sort: [sortBy: string];
  save: [];
  alert: [];
  share: [];
  'new-query': [
    {
      fromCountry: string;
      toCountry: string;
      amount: number;
      currency: string;
      fromCurrency: string;
      payoutMethod: string;
    },
  ];
}>();

const localAmount = ref(props.amount);
const localPayoutMethod = ref(props.payoutMethod || 'bank');
const localSortBy = ref(props.sortBy || 'recipient');
const localToCurrency = ref(props.currency || 'USD');
const localFromCurrency = ref(props.fromCurrency || 'USD');
const localFromCountry = ref(props.fromCountry || 'US');
const localToCountry = ref(props.toCountry || 'MX');
const isSearching = ref(false);
const mounted = ref(false);
const isInteractionReady = computed(() => mounted.value && !props.loading);

onMounted(() => {
  mounted.value = true;
});

const availableToCurrenciesArray = computed(() => {
  if (Array.isArray(props.availableToCurrencies)) return props.availableToCurrencies;
  if (typeof props.availableToCurrencies === 'string' && props.availableToCurrencies) {
    return props.availableToCurrencies
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }
  return ['USD', 'EUR'];
});

const availableFromCurrenciesArray = computed(() => {
  if (Array.isArray(props.availableFromCurrencies)) return props.availableFromCurrencies;
  if (typeof props.availableFromCurrencies === 'string' && props.availableFromCurrencies) {
    return props.availableFromCurrencies
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }
  return ['USD', 'EUR', 'GBP'];
});

const availableMethodsArray = computed(() => {
  if (Array.isArray(props.availableMethods)) return props.availableMethods;
  if (typeof props.availableMethods === 'string' && props.availableMethods) {
    return props.availableMethods
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);
  }
  return [];
});

const methodConfig: Record<string, { label: string; value: string; icon: ReturnType<typeof h> }> = {
  bank: { label: 'Bank deposit', value: 'bank', icon: BankIcon() },
  cash: { label: 'Cash Pickup', value: 'cash', icon: CashIcon() },
  wallet: { label: 'Mobile Wallet', value: 'wallet', icon: WalletIcon() },
  airtime: { label: 'Airtime', value: 'airtime', icon: AirtimeIcon() },
  home: { label: 'Home Delivery', value: 'home', icon: HomeIcon() },
  card: { label: 'Card', value: 'card', icon: CardIcon() },
};

const payoutMethods = computed(() => {
  const available = availableMethodsArray.value;
  if (props.methodsLoading || !available.length) return [];
  return available
    .map(m => methodConfig[m])
    .filter((m): m is (typeof methodConfig)[string] => Boolean(m));
});

const sortOptions = [
  { label: 'Recipient Gets', value: 'recipient' },
  { label: 'Total Cost', value: 'cost' },
  { label: 'Lowest Fees', value: 'fees' },
  { label: 'Remit-Score', value: 'remit-score' },
];

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  MXN: '$',
  BRL: 'R$',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  NZD: 'NZ$',
  ZAR: 'R',
  RUB: '₽',
  TRY: '₺',
  PLN: 'zł',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  AED: 'د.إ',
  SAR: '﷼',
  EGP: 'E£',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  PKR: 'Rs',
  BDT: '৳',
  LKR: 'Rs',
};

const fromCurrencySymbol = computed(
  () => currencySymbols[localFromCurrency.value] || localFromCurrency.value
);

const minAmount = computed(() => getMinAmount(localFromCurrency.value));
const maxAmount = computed(() => getMaxAmount(localFromCurrency.value));
const inputMin = computed(() => minAmount.value);
const inputMax = computed(() => maxAmount.value);

const amountLimits = computed(() => ({
  minAmount: minAmount.value,
  maxAmount: maxAmount.value,
  strict: true,
}));

const preventNegative = (event: KeyboardEvent) => {
  if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
    event.preventDefault();
  }
};

const sanitizeAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value = target.value;

  // Remove any non-numeric characters except decimal point
  value = value.replace(/[^\d.]/g, '');

  // Ensure only one decimal point
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }

  // Update the input value
  if (target.value !== value) {
    target.value = value;
  }

  // Update the model value (but don't clamp on input, only on blur)
  const numValue = Number.parseFloat(value);
  if (!isNaN(numValue) && numValue >= 0) {
    localAmount.value = numValue;
  } else if (value === '' || value === '.') {
    localAmount.value = 0;
  }
};

const handleAmountBlur = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const currency = localFromCurrency.value || 'USD';

  const numValue = Number.parseFloat(target.value) || 0;
  const sanitized = sanitizeAmount(numValue, currency, amountLimits.value);
  localAmount.value = sanitized;
  target.value = String(sanitized);
  // Don't emit update on blur - user must click Compare button to refresh quotes
};

watch(
  () => props.amount,
  val => {
    // Only sync from props if the user hasn't actively changed the input
    // This prevents the input from being overwritten when the user is typing
    // Allow small tolerance to avoid rounding issues (within 0.01)
    if (val && val > 0 && Math.abs(localAmount.value - val) > 0.01) {
      // Only update if the difference is significant (user likely changed it from outside)
      // But don't override if user just typed a different value
      const inputElement = document.getElementById('amount-input') as HTMLInputElement;
      if (!inputElement || document.activeElement !== inputElement) {
        localAmount.value = val;
      }
    }
  }
);
watch(
  () => props.payoutMethod,
  val => {
    if (val) localPayoutMethod.value = val;
  }
);
watch(
  () => props.sortBy,
  val => {
    if (val) localSortBy.value = val;
  }
);
watch(
  () => props.currency,
  val => {
    if (val) localToCurrency.value = val;
  }
);
watch(
  () => props.fromCurrency,
  val => {
    if (val) localFromCurrency.value = val;
  }
);
watch(
  () => props.fromCountry,
  val => {
    if (val) {
      localFromCountry.value = val;
      // Trigger currency update when country prop changes
      const country = getCountryByCode(val);
      if (country?.currency) {
        const defaultCurrency = country.currency.toUpperCase();
        if (localFromCurrency.value !== defaultCurrency) {
          localFromCurrency.value = defaultCurrency;
        }
      }
    }
  }
);
watch(
  () => props.toCountry,
  val => {
    if (val) {
      localToCountry.value = val;
      // Trigger currency update when country prop changes
      const country = getCountryByCode(val);
      if (country?.currency) {
        const defaultCurrency = country.currency.toUpperCase();
        if (localToCurrency.value !== defaultCurrency) {
          localToCurrency.value = defaultCurrency;
        }
      }
    }
  }
);

watch(localFromCurrency, value => {
  if (!value) return;
  const sanitized = sanitizeAmount(localAmount.value, value, amountLimits.value);
  if (sanitized !== localAmount.value) {
    localAmount.value = sanitized;
  }
});

// Auto-update currencies when countries change
watch(
  localFromCountry,
  newCountry => {
    if (!newCountry) {
      localFromCurrency.value = '';
      return;
    }

    const country = getCountryByCode(newCountry);
    if (!country?.currency) return;

    const defaultCurrency = country.currency.toUpperCase();

    // Always set to country's default currency when country changes
    // The available currencies watcher will adjust if needed when the list loads
    if (localFromCurrency.value !== defaultCurrency) {
      localFromCurrency.value = defaultCurrency;
      emitUpdate();
    }
  },
  { immediate: true }
);

watch(
  localToCountry,
  newCountry => {
    if (!newCountry) {
      localToCurrency.value = '';
      return;
    }

    const country = getCountryByCode(newCountry);
    if (!country?.currency) return;

    const defaultCurrency = country.currency.toUpperCase();

    // Always set to country's default currency when country changes
    // The available currencies watcher will adjust if needed when the list loads
    if (localToCurrency.value !== defaultCurrency) {
      localToCurrency.value = defaultCurrency;
      emitUpdate();
    }
  },
  { immediate: true }
);

// Watch available currencies and update if current currency is not available
watch(availableFromCurrenciesArray, available => {
  if (!localFromCountry.value) return;

  const country = getCountryByCode(localFromCountry.value);
  if (!country?.currency) return;

  const defaultCurrency = country.currency.toUpperCase();

  // If available currencies list is empty, keep the default currency
  if (available.length === 0) {
    if (!localFromCurrency.value || localFromCurrency.value !== defaultCurrency) {
      localFromCurrency.value = defaultCurrency;
      emitUpdate();
    }
    return;
  }

  // Update to default currency if it's available and current currency is invalid
  if (available.includes(defaultCurrency)) {
    if (!localFromCurrency.value || !available.includes(localFromCurrency.value)) {
      localFromCurrency.value = defaultCurrency;
      emitUpdate();
    }
  } else if (!localFromCurrency.value || !available.includes(localFromCurrency.value)) {
    // Default currency not available, use first available
    localFromCurrency.value = available[0];
    emitUpdate();
  }
});

watch(availableToCurrenciesArray, available => {
  if (!localToCountry.value) return;

  const country = getCountryByCode(localToCountry.value);
  if (!country?.currency) return;

  const defaultCurrency = country.currency.toUpperCase();

  // If available currencies list is empty, keep the default currency
  if (available.length === 0) {
    if (!localToCurrency.value || localToCurrency.value !== defaultCurrency) {
      localToCurrency.value = defaultCurrency;
      emitUpdate();
    }
    return;
  }

  // Update to default currency if it's available and current currency is invalid
  if (available.includes(defaultCurrency)) {
    if (!localToCurrency.value || !available.includes(localToCurrency.value)) {
      localToCurrency.value = defaultCurrency;
      emitUpdate();
    }
  } else if (!localToCurrency.value || !available.includes(localToCurrency.value)) {
    // Default currency not available, use first available
    localToCurrency.value = available[0];
    emitUpdate();
  }
});

// Don't automatically update when amount changes - user must click Compare button

watch(
  () => props.methodsLoading,
  loading => {
    if (!loading && isSearching.value) {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        isSearching.value = false;
      }, 500);
    } else if (loading && !isSearching.value) {
      // If loading starts again (e.g., after navigation), set searching state
      isSearching.value = true;
    }
  },
  { immediate: true }
);

watch(
  () => availableMethodsArray.value,
  available => {
    if (available.length && !available.includes(localPayoutMethod.value)) {
      localPayoutMethod.value = available[0];
      emitUpdate();
    }
  },
  { immediate: true }
);

function selectMethod(method: string) {
  if (localPayoutMethod.value !== method) {
    localPayoutMethod.value = method;
    emitUpdate();
  }
}

function emitUpdate() {
  const currency = localFromCurrency.value || 'USD';
  const sanitized = sanitizeAmount(
    localAmount.value && localAmount.value > 0 ? localAmount.value : props.amount,
    currency,
    amountLimits.value
  );
  if (sanitized !== localAmount.value) {
    localAmount.value = sanitized;
  }
  emit('update', {
    amount: sanitized,
    payoutMethod: localPayoutMethod.value,
    currency: localToCurrency.value,
    fromCurrency: localFromCurrency.value,
    fromCountry: localFromCountry.value,
    toCountry: localToCountry.value,
  });
}

function handleCountrySelection(direction: 'from' | 'to', countryCode: string, currency: string) {
  const normalizedCurrency = currency?.toUpperCase?.() || '';
  if (direction === 'from') {
    localFromCountry.value = countryCode;
    if (normalizedCurrency) {
      localFromCurrency.value = normalizedCurrency;
    }
  } else {
    localToCountry.value = countryCode;
    if (normalizedCurrency) {
      localToCurrency.value = normalizedCurrency;
    }
  }

  emitUpdate();
}

function resolveCountryCodeFromInput(inputId: string, fallback: string) {
  if (!import.meta.client) return fallback;
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const rawValue = input?.value?.trim().toLowerCase() || '';
  if (!rawValue) return fallback;

  const matchedCountry = COUNTRIES.find(country => {
    const name = country.name.trim().toLowerCase();
    const code = country.code.trim().toLowerCase();
    return rawValue === name || rawValue === code;
  });

  return matchedCountry?.code || fallback;
}

async function handleSearch() {
  // Let any in-flight v-model updates from the country selectors settle
  // before we snapshot the corridor for navigation.
  await nextTick();

  const resolvedFromCountry = resolveCountryCodeFromInput(
    'corridor-from-country',
    localFromCountry.value
  );
  const resolvedToCountry = resolveCountryCodeFromInput(
    'corridor-to-country',
    localToCountry.value
  );
  if (!resolvedFromCountry || !resolvedToCountry) return;

  localFromCountry.value = resolvedFromCountry;
  localToCountry.value = resolvedToCountry;

  isSearching.value = true;
  const currency = localFromCurrency.value || 'USD';
  const sanitized = sanitizeAmount(localAmount.value || props.amount, currency, amountLimits.value);
  if (sanitized !== localAmount.value) {
    localAmount.value = sanitized;
  }
  emit('new-query', {
    fromCountry: resolvedFromCountry,
    toCountry: resolvedToCountry,
    amount: sanitized,
    currency: localToCurrency.value,
    fromCurrency: localFromCurrency.value,
    payoutMethod: localPayoutMethod.value,
  });
}
</script>
