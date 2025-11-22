<template>
  <section
    class="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
  >
    <!-- World Map/Globe with Animated Arrows - Desktop Only -->
    <div class="hidden md:block absolute inset-0 overflow-hidden pointer-events-none z-0">
      <!-- Subtle gradient background -->
      <div class="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-blue-300/15 to-transparent rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-400/20 via-emerald-300/15 to-transparent rounded-full blur-3xl"></div>
      
      <!-- World Map/Globe SVG with animated arrows -->
      <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-25" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Arrow markers -->
          <marker id="globe-arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
            <polygon points="0 0, 12 3, 0 6" fill="#3b82f6" opacity="0.8" />
          </marker>
          <marker id="globe-arrow-emerald" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
            <polygon points="0 0, 12 3, 0 6" fill="#10b981" opacity="0.8" />
          </marker>
          <marker id="globe-arrow-purple" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto">
            <polygon points="0 0, 12 3, 0 6" fill="#a855f7" opacity="0.8" />
          </marker>
          <!-- Gradient for arrows -->
          <linearGradient id="arrow-gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.3" />
          </linearGradient>
          <linearGradient id="arrow-gradient-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.3" />
          </linearGradient>
        </defs>
        
        <!-- Simplified World Map Outline -->
        <g opacity="0.2">
          <!-- Continents simplified - better representation -->
          <!-- North America -->
          <path d="M120,180 Q150,160 200,170 Q240,175 260,200 Q270,220 260,250 Q250,270 230,280 Q200,285 170,280 Q140,275 130,250 Q125,220 120,180" fill="#3b82f6" stroke="#3b82f6" stroke-width="1.5"/>
          <!-- South America -->
          <path d="M200,300 Q210,320 220,350 Q225,380 230,420 Q225,450 210,460 Q195,455 185,430 Q180,400 185,370 Q190,340 200,300" fill="#3b82f6" stroke="#3b82f6" stroke-width="1.5"/>
          <!-- Europe -->
          <path d="M360,160 Q390,150 420,165 Q440,175 450,195 Q445,215 425,220 Q400,218 380,210 Q365,195 360,160" fill="#10b981" stroke="#10b981" stroke-width="1.5"/>
          <!-- Africa -->
          <path d="M380,240 Q390,260 400,300 Q405,340 410,390 Q405,430 390,440 Q375,435 370,400 Q365,360 370,320 Q375,280 380,240" fill="#10b981" stroke="#10b981" stroke-width="1.5"/>
          <!-- Asia -->
          <path d="M460,160 Q520,150 580,170 Q620,185 650,210 Q640,240 610,250 Q570,245 530,235 Q490,220 460,160" fill="#a855f7" stroke="#a855f7" stroke-width="1.5"/>
          <!-- Australia -->
          <path d="M560,360 Q580,350 600,365 Q610,380 605,395 Q595,405 580,400 Q565,395 560,380 Q555,370 560,360" fill="#a855f7" stroke="#a855f7" stroke-width="1.5"/>
        </g>
        
        <!-- Animated Arrows flowing around the globe -->
        <!-- Arrow 1: US to India (curved path) -->
        <path 
          d="M200,250 Q300,200 450,220 Q500,230 550,240" 
          stroke="url(#arrow-gradient-blue)" 
          stroke-width="4" 
          fill="none"
          marker-end="url(#globe-arrow-blue)"
          style="stroke-dasharray: 800; stroke-dashoffset: 800; animation: drawPath 10s ease-in-out infinite;"
        />
        
        <!-- Arrow 2: Europe to Asia -->
        <path 
          d="M400,200 Q450,250 500,230 Q520,220 550,240" 
          stroke="url(#arrow-gradient-emerald)" 
          stroke-width="4" 
          fill="none"
          marker-end="url(#globe-arrow-emerald)"
          style="stroke-dasharray: 600; stroke-dashoffset: 600; animation: drawPath 8s ease-in-out infinite 1s;"
        />
        
        <!-- Arrow 3: US to Philippines -->
        <path 
          d="M220,240 Q350,300 500,350 Q550,360 580,380" 
          stroke="url(#arrow-gradient-blue)" 
          stroke-width="3.5" 
          fill="none"
          marker-end="url(#globe-arrow-blue)"
          style="stroke-dasharray: 900; stroke-dashoffset: 900; animation: drawPath 12s ease-in-out infinite 0.5s;"
        />
        
        <!-- Arrow 4: Europe to Africa -->
        <path 
          d="M390,220 Q400,280 400,320 Q400,360 400,400" 
          stroke="url(#arrow-gradient-emerald)" 
          stroke-width="3.5" 
          fill="none"
          marker-end="url(#globe-arrow-emerald)"
          style="stroke-dasharray: 500; stroke-dashoffset: 500; animation: drawPath 7s ease-in-out infinite 1.5s;"
        />
        
        <!-- Arrow 5: Asia to Australia -->
        <path 
          d="M550,250 Q560,300 570,350 Q580,370 590,390" 
          stroke="url(#arrow-gradient-purple)" 
          stroke-width="3" 
          fill="none"
          marker-end="url(#globe-arrow-purple)"
          style="stroke-dasharray: 400; stroke-dashoffset: 400; animation: drawPath 6s ease-in-out infinite 2s;"
        />
        
        <!-- Arrow 6: US to Europe -->
        <path 
          d="M280,220 Q320,200 360,190 Q380,185 400,200" 
          stroke="url(#arrow-gradient-blue)" 
          stroke-width="3.5" 
          fill="none"
          marker-end="url(#globe-arrow-blue)"
          style="stroke-dasharray: 350; stroke-dashoffset: 350; animation: drawPath 9s ease-in-out infinite 0.25s;"
        />
        
        <!-- Arrow 7: Asia to Europe (long route) -->
        <path 
          d="M600,240 Q550,200 500,180 Q450,170 400,190" 
          stroke="url(#arrow-gradient-purple)" 
          stroke-width="3" 
          fill="none"
          marker-end="url(#globe-arrow-purple)"
          style="stroke-dasharray: 700; stroke-dashoffset: 700; animation: drawPath 11s ease-in-out infinite 1.25s;"
        />
        
        <!-- Arrow 8: South America to Europe -->
        <path 
          d="M230,400 Q300,350 350,300 Q370,280 400,250" 
          stroke="url(#arrow-gradient-emerald)" 
          stroke-width="3.5" 
          fill="none"
          marker-end="url(#globe-arrow-emerald)"
          style="stroke-dasharray: 600; stroke-dashoffset: 600; animation: drawPath 10s ease-in-out infinite 2.5s;"
        />
        
        <!-- Arrow 9: Africa to Asia -->
        <path 
          d="M410,400 Q450,350 500,300 Q530,270 550,250" 
          stroke="url(#arrow-gradient-emerald)" 
          stroke-width="3" 
          fill="none"
          marker-end="url(#globe-arrow-emerald)"
          style="stroke-dasharray: 550; stroke-dashoffset: 550; animation: drawPath 9s ease-in-out infinite 3s;"
        />
        
        <!-- Arrow 10: Circular flow around globe -->
        <path 
          d="M400,150 Q500,200 600,250 Q600,400 500,450 Q400,500 300,450 Q200,400 200,250 Q250,200 300,150 Q350,150 400,150" 
          stroke="url(#arrow-gradient-blue)" 
          stroke-width="2.5" 
          fill="none"
          marker-end="url(#globe-arrow-blue)"
          style="stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: drawPath 15s ease-in-out infinite; opacity: 0.5;"
        />
      </svg>
      
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>

    <div class="container-custom relative z-30 mx-auto max-w-7xl">
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
