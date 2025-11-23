<template>
  <section
    id="hero-dual-tab"
    class="relative bg-white py-16 sm:py-20 lg:py-24 min-h-[700px]"
  >
    <!-- World Map Background with Animated Transfer Arrows -->
    <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <!-- World Map - More Visible -->
      <img
        src="/world.svg"
        alt="World map"
        class="absolute inset-0 w-full h-full object-cover opacity-50"
        style="filter: brightness(0.95) contrast(1.1);"
      />
    </div>
    
    <!-- Animated Transfer Lines - Curved arrows flying around like country-to-country transfers -->
    <div class="pointer-events-none absolute inset-0 z-[1] overflow-hidden bg-transparent">
      <svg
        class="absolute inset-0 w-full h-full"
        viewBox="0 0 2000 857"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style="background: transparent;"
      >
        <!-- 7 Curved Arrows in Different Sizes - Within content width -->
        <!-- 1. Left to Right - Top area (Blue, thick) -->
        <path
          d="M400,200 Q1000,80 1600,220"
          stroke="#2563EB"
          stroke-width="4"
          fill="none"
          class="transfer-arrow transfer-arrow-large"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 8s ease-in-out infinite;"
        />
        
        <!-- 2. Right to Left - Middle area (Green, medium) -->
        <path
          d="M1520,200 Q1000,150 450,250"
          stroke="#10b981"
          stroke-width="2.8"
          fill="none"
          class="transfer-arrow transfer-arrow-medium"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 7s ease-in-out infinite 4s;"
        />
        
        <!-- 3. Left to Right - Middle (Blue, medium) -->
        <path
          d="M500,350 Q1050,280 1550,420"
          stroke="#2563EB"
          stroke-width="2.8"
          fill="none"
          class="transfer-arrow transfer-arrow-medium"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 9s ease-in-out infinite 5s;"
        />
        
        <!-- 4. Right to Left - Extended Downward and More Left (Blue, small) -->
        <path
          d="M1300,250 Q1050,340 500,400"
          stroke="#2563EB"
          stroke-width="2.4"
          fill="none"
          class="transfer-arrow transfer-arrow-small"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 10s ease-in-out infinite 3.5s;"
        />
        
        <!-- 5. Left to Right - Lower area (Green, thick) -->
        <path
          d="M420,500 Q1000,420 1600,550"
          stroke="#10b981"
          stroke-width="4"
          fill="none"
          class="transfer-arrow transfer-arrow-large"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 10s ease-in-out infinite 1.5s;"
        />
        
        <!-- 6. Right to Left - Bottom area (Green, small) -->
        <path
          d="M1570,600 Q1150,680 680,650"
          stroke="#10b981"
          stroke-width="2"
          fill="none"
          class="transfer-arrow transfer-arrow-small"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 7.5s ease-in-out infinite 2.5s;"
        />
        
        <!-- 7. Left to Right - Mid-lower (Blue, small) -->
        <path
          d="M480,450 Q1000,520 1520,480"
          stroke="#2563EB"
          stroke-width="2.4"
          fill="none"
          class="transfer-arrow transfer-arrow-small"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 10s ease-in-out infinite 3s;"
        />
        
        <!-- 8. Argentina to Australia - Long distance (Green, medium) -->
        <path
          d="M450,650 Q1000,200 1650,680"
          stroke="#10b981"
          stroke-width="2.8"
          fill="none"
          class="transfer-arrow transfer-arrow-medium"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 11s ease-in-out infinite 6s;"
        />
        
        <!-- 9. US to Bangladesh - North America to South Asia (Blue, medium) -->
        <path
          d="M440,250 Q1000,180 1500,420"
          stroke="#2563EB"
          stroke-width="2.8"
          fill="none"
          class="transfer-arrow transfer-arrow-medium"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 9.5s ease-in-out infinite 7s;"
        />
        
        <!-- 10. US to Vietnam - North America to Southeast Asia (Green, small) -->
        <path
          d="M460,320 Q1080,240 1640,480"
          stroke="#10b981"
          stroke-width="2"
          fill="none"
          class="transfer-arrow transfer-arrow-small"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 8.5s ease-in-out infinite 1.2s;"
        />
        
        <!-- 11. Canada to India - North America to South Asia (Blue, thick) -->
        <path
          d="M420,200 Q920,120 1470,380"
          stroke="#2563EB"
          stroke-width="4"
          fill="none"
          class="transfer-arrow transfer-arrow-large"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 10.5s ease-in-out infinite 2.3s;"
        />
        
        <!-- 12. US to China - North America to East Asia (Green, medium) -->
        <path
          d="M480,290 Q1120,160 1700,360"
          stroke="#10b981"
          stroke-width="2.8"
          fill="none"
          class="transfer-arrow transfer-arrow-medium"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 9.8s ease-in-out infinite 3.8s;"
        />
        
        <!-- 13. US to Nigeria - North America to West Africa (Blue, small) -->
        <path
          d="M450,480 Q920,560 950,600"
          stroke="#2563EB"
          stroke-width="2"
          fill="none"
          class="transfer-arrow transfer-arrow-small"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 7.8s ease-in-out infinite 4.5s;"
        />
        
        <!-- 14. US to Brazil - North America to South America (Green, small) -->
        <path
          d="M470,550 Q500,680 520,720"
          stroke="#10b981"
          stroke-width="2"
          fill="none"
          class="transfer-arrow transfer-arrow-small"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 7.2s ease-in-out infinite 5.2s;"
        />
        
        <!-- 15. US to Pakistan - North America to South Asia (Blue, medium) -->
        <path
          d="M440,390 Q1020,280 1420,410"
          stroke="#2563EB"
          stroke-width="2.8"
          fill="none"
          class="transfer-arrow transfer-arrow-medium"
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawPath 9.2s ease-in-out infinite 6.5s;"
        />
      </svg>
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
            class="animate-scale-in relative rounded-3xl border border-neutral-200 bg-white p-4 sm:p-8 shadow-lg delay-300"
          >
            <form
              role="search"
              aria-label="Money transfer comparison form"
              @submit.prevent="handleMoneySubmit"
            >
              <!-- Mobile Stepper (visible on mobile only) -->
              <div class="mb-4 flex items-center justify-center gap-2 sm:hidden">
                <div 
                  v-for="step in 3" 
                  :key="step"
                  class="flex items-center"
                >
                  <div 
                    :class="[
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                      currentMobileStep >= step 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-neutral-200 text-neutral-600'
                    ]"
                  >
                    {{ step }}
                  </div>
                  <div 
                    v-if="step < 3"
                    :class="[
                      'mx-1 h-0.5 w-8 transition-all',
                      currentMobileStep > step ? 'bg-brand-600' : 'bg-neutral-200'
                    ]"
                  />
                </div>
              </div>

              <!-- Step 1: Countries (always visible on desktop, conditional on mobile) -->
              <div 
                class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
                :class="{ 'hidden sm:grid': currentMobileStep !== 1 }"
              >
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

                <!-- Mobile Next Button for Step 1 -->
                <div class="sm:hidden">
                  <button
                    type="button"
                    @click="currentMobileStep = 2"
                    :disabled="!moneyForm.from || !moneyForm.to"
                    class="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <!-- Step 2: Currencies (always visible on desktop, conditional on mobile) -->
              <div 
                class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
                :class="{ 'hidden sm:grid': currentMobileStep !== 2 }"
              >
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
                        :country-code="moneyForm.from"
                        placeholder="Choose currency"
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
                        :country-code="moneyForm.to"
                        :placeholder="
                          moneyForm.to ? 'Choose currency' : 'Select receiving country first'
                        "
                        :disabled="!moneyForm.to"
                      />
                    </div>

                <!-- Mobile Navigation for Step 2 -->
                <div class="flex gap-2 sm:hidden">
                  <button
                    type="button"
                    @click="currentMobileStep = 1"
                    class="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    @click="currentMobileStep = 3"
                    :disabled="!moneyForm.fromCurrency || !moneyForm.toCurrency"
                    class="flex-1 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <!-- Step 3: Amount (always visible on desktop, conditional on mobile) -->
              <div 
                class="mb-6"
                :class="{ 'hidden sm:block': currentMobileStep !== 3 }"
              >
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

                <!-- Mobile Back Button for Step 3 -->
                <div class="mt-4 sm:hidden">
                  <button
                    type="button"
                    @click="currentMobileStep = 2"
                    class="w-full rounded-lg border border-neutral-300 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <!-- Error/Success Messages -->
              <div
                v-if="formError || formSuccess"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                class="mb-4"
              >
                <div
                  v-if="formError"
                  class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800"
                >
                  <div class="flex items-start gap-2">
                    <svg class="h-5 w-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ formError }}</span>
                  </div>
                </div>
                <div
                  v-if="formSuccess"
                  class="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800"
                >
                  <div class="flex items-start gap-2">
                    <svg class="h-5 w-5 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ formSuccess }}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                class="group min-h-btn w-full rounded-xl bg-brand-600 font-semibold text-white transition-all duration-200 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 flex items-center justify-center gap-2"
                :class="{ 'hidden sm:flex': currentMobileStep !== 3 }"
                aria-describedby="form-errors"
              >
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
                <p class="text-4xl font-bold text-brand-600">{{ SITE_STATS.totalSaved.display }}</p>
                <p class="mt-1 text-xs text-neutral-600">Since 2024</p>
              </div>

              <!-- Providers Compared -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-xs text-neutral-600">Licensed providers compared</p>
                <p class="text-3xl font-bold text-neutral-900">{{ SITE_STATS.providers.display }}</p>
                <p class="mt-1 text-xs text-neutral-600">{{ SITE_STATS.licensedProviders.label }}</p>
              </div>

              <!-- Countries Covered -->
              <div class="border-b border-neutral-200 pb-6">
                <p class="mb-1 text-xs text-neutral-600">Countries & corridors</p>
                <p class="text-3xl font-bold text-neutral-900">{{ SITE_STATS.corridors.display }}</p>
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

    <!-- Gradient at the Bottom -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-600/10 via-brand-500/5 to-transparent"></div>

    <!-- SEO: WebSite structured data with search action -->
    <JsonLdWebSiteSearch />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRemittanceApi } from '~/composables/useRemittanceApi';
import { useCompareForm } from '~/composables/useCompareForm';
import JsonLdWebSiteSearch from '~/components/seo/JsonLdWebSiteSearch.vue';
import CurrencySelect from '~/components/shared/CurrencySelect.vue';
import { SITE_STATS } from '~/config/stats';
import { getCountryByCode, getAvailableCurrencies } from '~/utils/countries-currencies';

const { form: moneyForm, validationError, submit: submitForm, DELIVERY_METHODS } = useCompareForm();

const formError = validationError
const formSuccess = ref<string>('')

const currentMobileStep = ref(1)

const { recordSearch, useRecentSearches } = useRemittanceApi();

const familiesHelped = ref(1250);

defineExpose({
  prefillMoneyForm: (data: any) => {
    Object.assign(moneyForm.value, data);
  },
});

const { data: recentData } = await useRecentSearches(100);

const countryCoordinates: Record<string, { lat: number; lon: number }> = {
  US: { lat: 37.1, lon: -95.7 },
  CA: { lat: 56.1, lon: -106.3 },
  MX: { lat: 23.6, lon: -102.5 },
  GB: { lat: 55.3, lon: -3.4 },
  IE: { lat: 53.3, lon: -8 },
  FR: { lat: 46.2, lon: 2.2 },
  DE: { lat: 51.2, lon: 10.4 },
  ES: { lat: 40.4, lon: -3.7 },
  PT: { lat: 39.4, lon: -8 },
  IT: { lat: 41.9, lon: 12.5 },
  PL: { lat: 51.9, lon: 19.1 },
  NL: { lat: 52.1, lon: 5.3 },
  BE: { lat: 50.5, lon: 4.7 },
  CH: { lat: 46.8, lon: 8.2 },
  IN: { lat: 20.6, lon: 78.9 },
  PK: { lat: 30.4, lon: 69.3 },
  BD: { lat: 23.7, lon: 90.4 },
  LK: { lat: 7.9, lon: 80.7 },
  NP: { lat: 28.4, lon: 84.1 },
  PH: { lat: 12.9, lon: 122.6 },
  MY: { lat: 4.2, lon: 101.9 },
  VN: { lat: 14.1, lon: 108.3 },
  TH: { lat: 15.8, lon: 101 },
  KH: { lat: 12.6, lon: 104.9 },
  ID: { lat: -0.8, lon: 113.9 },
  SG: { lat: 1.35, lon: 103.8 },
  CN: { lat: 35.8, lon: 104.2 },
  HK: { lat: 22.3, lon: 114.2 },
  JP: { lat: 36.2, lon: 138.3 },
  KR: { lat: 35.9, lon: 127.8 },
  TW: { lat: 23.7, lon: 121 },
  AE: { lat: 23.4, lon: 53.8 },
  SA: { lat: 23.9, lon: 45.1 },
  QA: { lat: 25.3, lon: 51.2 },
  KW: { lat: 29.3, lon: 47.5 },
  BH: { lat: 26.1, lon: 50.6 },
  OM: { lat: 21, lon: 55 },
  NG: { lat: 9.1, lon: 8.7 },
  GH: { lat: 7.9, lon: -1 },
  KE: { lat: -0.02, lon: 37.9 },
  TZ: { lat: -6.4, lon: 35 },
  ZA: { lat: -30.6, lon: 22.9 },
  MA: { lat: 31.8, lon: -7.1 },
  EG: { lat: 26.8, lon: 30.8 },
  SN: { lat: 14.5, lon: -14.5 },
  BR: { lat: -14.2, lon: -51.9 },
  AR: { lat: -38.4, lon: -63.6 },
  CL: { lat: -35.7, lon: -71.5 },
  CO: { lat: 4.6, lon: -74.3 },
  PE: { lat: -9.2, lon: -75 },
  VE: { lat: 6.4, lon: -66.6 },
  AU: { lat: -25.3, lon: 133.8 },
  NZ: { lat: -40.9, lon: 174.9 },
};

const projectCoord = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * 2000,
  y: ((90 - lat) / 180) * 857,
});

const buildArrowPath = (fromCode: string, toCode: string) => {
  const from = countryCoordinates[fromCode];
  const to = countryCoordinates[toCode];
  if (!from || !to) return null;

  const start = projectCoord(from.lat, from.lon);
  const end = projectCoord(to.lat, to.lon);

  const midX = (start.x + end.x) / 2;
  const lift = Math.min(
    220,
    Math.max(80, Math.abs(end.x - start.x) * 0.15 + Math.abs(end.y - start.y) * 0.05)
  );
  const controlY = Math.min(start.y, end.y) - lift;

  return {
    d: `M ${start.x.toFixed(1)},${start.y.toFixed(1)} Q ${midX.toFixed(1)},${controlY.toFixed(
      1
    )} ${end.x.toFixed(1)},${end.y.toFixed(1)}`,
    start,
    end,
  };
};

const defaultArrow = buildArrowPath('US', 'PH');

const arrowPath = computed(() => {
  const fromCode = moneyForm.value.from?.toUpperCase();
  const toCode = moneyForm.value.to?.toUpperCase();

  if (fromCode && toCode) {
    const path = buildArrowPath(fromCode, toCode);
    if (path) return path;
  }

  return defaultArrow;
});

// Geolocation detection
const detectUserLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.country_code) {
      const countryCode = data.country_code.toUpperCase();
      const country = getCountryByCode(countryCode);
      
      if (country) {
        moneyForm.value.from = country.code;
        moneyForm.value.fromCurrency = country.currency;
      } else {
        moneyForm.value.from = 'US';
        moneyForm.value.fromCurrency = 'USD';
      }
    }
  } catch {
    console.log('Could not detect location, defaulting to US');
    moneyForm.value.from = 'US';
    moneyForm.value.fromCurrency = 'USD';
  }
};

// Currency filtering logic - now using universal system
const availableFromCurrencies = computed(() => {
  return getAvailableCurrencies(moneyForm.value.from);
});

const availableToCurrencies = computed(() => {
  if (!moneyForm.value.to) return [];
  return getAvailableCurrencies(moneyForm.value.to);
});

// Watchers for currency synchronization
watch(
  () => moneyForm.value.from,
  newCountry => {
    if (newCountry) {
      const country = getCountryByCode(newCountry);
      if (!country) return;
      
      const available = getAvailableCurrencies(newCountry);
      if (!moneyForm.value.fromCurrency || !available.includes(moneyForm.value.fromCurrency)) {
        moneyForm.value.fromCurrency = country.currency;
      }
    }
  }
);

watch(
  () => moneyForm.value.to,
  newCountry => {
    if (newCountry) {
      const country = getCountryByCode(newCountry);
      if (!country) return;
      
      const available = getAvailableCurrencies(newCountry);
      if (!moneyForm.value.toCurrency || !available.includes(moneyForm.value.toCurrency)) {
        moneyForm.value.toCurrency = country.currency;
      }
    } else {
      moneyForm.value.toCurrency = '';
    }
  }
);

const handleMoneySubmit = async () => {
  const { from, to, amount, method } = moneyForm.value;

  formSuccess.value = ''

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

  await submitForm();
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

<style scoped>
.transfer-arrow {
  stroke-linecap: round;
}

/* Different opacity levels for depth perception */
.transfer-arrow-large {
  opacity: 0.20;
}

.transfer-arrow-medium {
  opacity: 0.144;
}

.transfer-arrow-small {
  opacity: 0.096;
}
</style>
