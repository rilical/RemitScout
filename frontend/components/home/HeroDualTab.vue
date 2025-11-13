<template>
  <section
    class="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-50/20 py-16 sm:py-20 lg:py-24"
  >
    <!-- Decorative Background Elements -->
    <div class="absolute inset-0 opacity-30">
      <div
        class="absolute inset-0"
        style="
          background-image:
            linear-gradient(to right, rgba(37, 99, 235, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
        "
      />
    </div>
    <div
      class="animate-pulse-slow absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"
    />
    <div
      class="animate-pulse-slow absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl"
      style="animation-delay: 1s"
    />
    <!-- Fintech Mesh Gradient Background -->
    <div class="absolute inset-0 overflow-hidden">
      <!-- Mesh gradient overlay -->
      <div
        class="absolute inset-0 opacity-40"
        style="
          background-image:
            radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(37, 99, 235, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 90% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 10% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%);
          background-size: 100% 100%;
        "
      />
      <!-- Subtle grid pattern -->
      <div
        class="absolute inset-0 opacity-15"
        style="
          background-image:
            linear-gradient(to right, rgba(37, 99, 235, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.03) 1px, transparent 1px);
          background-size: 80px 80px;
        "
      />
      <!-- Center glow effect -->
      <div
        class="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 transform rounded-full blur-3xl"
        style="
          background: radial-gradient(
            circle,
            rgba(37, 99, 235, 0.05) 0%,
            rgba(37, 99, 235, 0.02) 40%,
            transparent 70%
          );
        "
      />
    </div>

    <div class="container-custom relative z-10 mx-auto max-w-7xl">
      <!-- Money Transfer Content -->
      <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-12">
        <div class="animate-fade-in-up delay-200 lg:col-span-3">
          <h1
            class="mb-4 text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl lg:text-6xl"
          >
            Send more home,<br /><span class="text-brand-600">pay less</span> in fees.
          </h1>
          <p class="mb-8 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Compare live rates, total fees, and delivery speed from 30+ licensed providers.
            <span class="whitespace-nowrap">Built for expats, by expats.</span>
          </p>

          <div
            class="animate-scale-in relative rounded-3xl border border-neutral-200 bg-white p-8 shadow-lg delay-300"
          >
            <form
              role="search"
              aria-label="Money transfer comparison form"
              @submit.prevent="handleMoneySubmit"
            >
              <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="from-country"
                    class="mb-2 block text-sm font-semibold text-neutral-700"
                  >
                    <span class="mr-2">🛫</span>Sending from
                  </label>
                  <CountrySelect
                    id="from-country"
                    v-model="moneyForm.from"
                    label="Sending from"
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label
                    for="to-country"
                    class="mb-2 block text-sm font-semibold text-neutral-700"
                  >
                    <span class="mr-2">🛬</span>Receiving in
                  </label>
                  <CountrySelect
                    id="to-country"
                    v-model="moneyForm.to"
                    label="Receiving in"
                    placeholder="Type in Country"
                  />
                </div>
              </div>

              <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="from-currency"
                    class="mb-2 block text-sm font-semibold text-neutral-700"
                  >
                    From currency
                  </label>
                  <CurrencySelect
                    id="from-currency"
                    v-model="moneyForm.fromCurrency"
                    :placeholder="
                      moneyForm.to ? 'Choose currency' : 'Select receiving country first'
                    "
                    :currencies="availableFromCurrencies"
                    :disabled="!moneyForm.to"
                  />
                </div>

                <div>
                  <label
                    for="to-currency"
                    class="mb-2 block text-sm font-semibold text-neutral-700"
                  >
                    To currency
                  </label>
                  <CurrencySelect
                    id="to-currency"
                    v-model="moneyForm.toCurrency"
                    :placeholder="
                      moneyForm.to ? 'Choose currency' : 'Select receiving country first'
                    "
                    :currencies="availableToCurrencies"
                    :disabled="!moneyForm.to"
                  />
                </div>
              </div>

              <div class="mb-6">
                <label for="amount" class="mb-2 block text-sm font-semibold text-neutral-700">
                  You send
                </label>
                <input
                  id="amount"
                  v-model.number="moneyForm.amount"
                  type="number"
                  min="1"
                  step="1"
                  class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  placeholder="500"
                />
              </div>

              <button
                type="submit"
                class="group min-h-btn w-full rounded-xl bg-brand-600 font-semibold text-white transition-all duration-200 hover:bg-brand-700"
              >
                <span class="flex items-center justify-center gap-2">
                  Compare 30+ providers
                  <svg
                    class="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
            </form>

            <div class="mt-6 border-t border-neutral-200/50 pt-6">
              <p class="text-xs text-neutral-600 sm:text-sm">
                Typical savings vs bank last month: 3–9%. Estimates include fees + exchange
                margin.
              </p>
            </div>
          </div>
        </div>

        <div class="animate-slide-in-right hidden delay-300 lg:col-span-2 lg:block">
          <div
            class="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-8 shadow-lg"
          >
            <h3 class="mb-6 text-2xl font-bold text-neutral-900">Why Remit-Scout?</h3>

            <div class="flex-1 space-y-6">
              <!-- Money Saved -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-xs text-neutral-600">Total money saved for users</p>
                <p class="text-4xl font-bold text-brand-600">$180M+</p>
                <p class="mt-1 text-xs text-neutral-600">Since 2019</p>
              </div>

              <!-- Providers Compared -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-xs text-neutral-600">Licensed providers compared</p>
                <p class="text-3xl font-bold text-neutral-900">30+</p>
                <p class="mt-1 text-xs text-neutral-600">All fully regulated & trusted</p>
              </div>

              <!-- Countries Covered -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-xs text-neutral-600">Countries & corridors</p>
                <p class="text-3xl font-bold text-neutral-900">150+</p>
                <p class="mt-1 text-xs text-neutral-600">Send money anywhere</p>
              </div>

              <!-- Average Savings -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-xs text-neutral-600">Average savings vs banks</p>
                <p class="text-3xl font-bold text-brand-600">3–9%</p>
                <p class="mt-1 text-xs text-neutral-600">On every transfer</p>
              </div>

              <!-- Speed & Trust -->
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">⚡</span>
                  <div>
                    <p class="text-sm font-semibold text-neutral-900">Fast transfers</p>
                    <p class="text-xs text-neutral-600">Most arrive within 24 hours</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-2xl">🛡️</span>
                  <div>
                    <p class="text-sm font-semibold text-neutral-900">100% independent</p>
                    <p class="text-xs text-neutral-600">No pay-to-rank, unbiased results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO: WebSite structured data with search action -->
    <JsonLdWebSiteSearch />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRemittanceApi } from '~/composables/useRemittanceApi';
import JsonLdWebSiteSearch from '~/components/seo/JsonLdWebSiteSearch.vue';
import CurrencySelect from '~/components/shared/CurrencySelect.vue';

interface MoneyForm {
  from: string;
  to: string;
  amount: number;
  method: string;
  fromCurrency: string;
  toCurrency: string;
}

const currencyFallback = 'USD';

const defaultCurrencyByCountry: Record<string, string> = {
  US: 'USD',
  UK: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  IN: 'INR',
  MX: 'MXN',
  PH: 'PHP',
  NG: 'NGN',
  KE: 'KES',
  UG: 'UGX',
  GH: 'GHS',
  ZA: 'ZAR',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  VN: 'VND',
  TH: 'THB',
  ID: 'IDR',
  MY: 'MYR',
  SG: 'SGD',
  HK: 'HKD',
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  EC: 'USD',
  VE: 'VES',
  EG: 'EGP',
  MA: 'MAD',
  TN: 'TND',
  DZ: 'DZD',
  TR: 'TRY',
  SA: 'SAR',
  AE: 'AED',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  JO: 'JOD',
  LB: 'LBP',
  IL: 'ILS',
  PL: 'PLN',
  RO: 'RON',
  HU: 'HUF',
  CZ: 'CZK',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  CH: 'CHF',
  RU: 'RUB',
  UA: 'UAH',
  BY: 'BYN',
  KZ: 'KZT',
  UZ: 'UZS',
  GE: 'GEL',
  AM: 'AMD',
  AZ: 'AZN',
  ET: 'ETB',
  TZ: 'TZS',
  RW: 'RWF',
  SN: 'XOF',
  CI: 'XOF',
  CM: 'XAF',
  ZM: 'ZMW',
  ZW: 'ZWL',
  MU: 'MUR',
  RE: 'EUR',
  MG: 'MGA',
  GB: 'GBP',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  GR: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  CY: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
};

const resolveCurrency = (countryCode: string): string => {
  return defaultCurrencyByCountry[countryCode] || currencyFallback;
};

const { recordSearch, useRecentSearches } = useRemittanceApi();

// Money Transfer Form
const moneyForm = ref<MoneyForm>({
  from: 'US',
  to: '',
  amount: 500,
  method: 'bank',
  fromCurrency: 'USD',
  toCurrency: '',
});

// Dynamic families helped counter
const familiesHelped = ref(1250);

// Expose for parent component to prefill
defineExpose({
  prefillMoneyForm: (data: Partial<MoneyForm>) => {
    Object.assign(moneyForm.value, data);
  },
});

const { data: recentData } = await useRecentSearches(100);

// Geolocation detection
const detectUserLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.country_code) {
      const countryCode = data.country_code.toUpperCase();
      if (countryCode === 'US') {
        moneyForm.value.from = 'US';
        moneyForm.value.fromCurrency = 'USD';
      } else if (defaultCurrencyByCountry[countryCode]) {
        moneyForm.value.from = countryCode;
        moneyForm.value.fromCurrency = resolveCurrency(countryCode);
      }
    }
  } catch {
    console.log('Could not detect location, defaulting to US');
    moneyForm.value.from = 'US';
    moneyForm.value.fromCurrency = 'USD';
  }
};

// Currency filtering logic
const availableFromCurrencies = computed(() => {
  const fromCountry = moneyForm.value.from;
  const homeCurrency = resolveCurrency(fromCountry);

  const baseCurrencies = ['USD', 'EUR', 'GBP'];
  const currencies = new Set([homeCurrency, ...baseCurrencies]);

  return Array.from(currencies)
    .map(code => ({
      value: code,
      label: code,
    }))
    .sort((a, b) => {
      if (a.value === homeCurrency) return -1;
      if (b.value === homeCurrency) return 1;
      return a.label.localeCompare(b.label);
    });
});

const availableToCurrencies = computed(() => {
  const toCountry = moneyForm.value.to;
  if (!toCountry) return [];

  const homeCurrency = resolveCurrency(toCountry);
  const baseCurrencies = ['USD', 'EUR', 'GBP'];
  const currencies = new Set([homeCurrency, ...baseCurrencies]);

  return Array.from(currencies)
    .map(code => ({
      value: code,
      label: code,
    }))
    .sort((a, b) => {
      if (a.value === homeCurrency) return -1;
      if (b.value === homeCurrency) return 1;
      return a.label.localeCompare(b.label);
    });
});

// Watchers for currency synchronization
watch(
  () => moneyForm.value.from,
  newCountry => {
    if (newCountry) {
      const newCurrency = resolveCurrency(newCountry);
      if (
        !moneyForm.value.fromCurrency ||
        !availableFromCurrencies.value.find(c => c.value === moneyForm.value.fromCurrency)
      ) {
        moneyForm.value.fromCurrency = newCurrency;
      }
    }
  }
);

watch(
  () => moneyForm.value.to,
  newCountry => {
    if (newCountry) {
      const newCurrency = resolveCurrency(newCountry);
      if (
        !moneyForm.value.toCurrency ||
        !availableToCurrencies.value.find(c => c.value === moneyForm.value.toCurrency)
      ) {
        moneyForm.value.toCurrency = newCurrency;
      }
    } else {
      moneyForm.value.toCurrency = '';
    }
  }
);

const handleMoneySubmit = async () => {
  const { from, to, amount, method, fromCurrency, toCurrency } = moneyForm.value;

  if (!from || !to) {
    return;
  }

  try {
    await recordSearch({
      from_country: from,
      to_country: to,
      amount,
      method,
    } as any);
  } catch {
    // Ignore recordSearch errors
  }

  await navigateTo(
    `/compare?from=${from}&to=${to}&amount=${amount}&method=${method}&fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`
  );
};

// Update families helped based on recent searches
const updateFamiliesHelped = () => {
  const data = recentData.value as any;
  if (data?.data && Array.isArray(data.data)) {
    const today = new Date().toDateString();
    const todaySearches = data.data.filter(
      (s: { createdAt: string }) => new Date(s.createdAt).toDateString() === today
    );
    familiesHelped.value = 1250 + todaySearches.length;
  }
};

onMounted(() => {
  detectUserLocation();
  updateFamiliesHelped();

  // Update counter periodically
  const interval = setInterval(() => {
    familiesHelped.value += Math.floor(Math.random() * 3) + 1;
    updateFamiliesHelped();
  }, 30000);

  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
</script>
