<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          Keep an eye on exchange rates and set up smart alerts
        </h2>
        <p class="text-lg text-neutral-600 max-w-3xl mx-auto">
          Monitor live exchange rates and get notified when rates hit your target, so you can act fast.
        </p>
        <p class="text-lg font-semibold max-w-3xl mx-auto mt-1 text-brand-600">
          Send more for less.
        </p>
      </div>

      <div class="grid lg:grid-cols-2 gap-8 items-stretch">
        <div class="bg-white rounded-2xl border border-neutral-200 p-6 shadow-lg flex flex-col">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-neutral-900 mb-4">Exchange Rate History</h3>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label for="from-country" class="block text-sm font-semibold text-neutral-700 mb-2">
                  From
                </label>
                <CountrySelect
                  id="from-country"
                  v-model="selectedFromCountry"
                  label="From"
                  placeholder="Select country"
                />
              </div>
              <div>
                <label for="to-country" class="block text-sm font-semibold text-neutral-700 mb-2">
                  To
                </label>
                <CountrySelect
                  id="to-country"
                  v-model="selectedToCountry"
                  label="To"
                  placeholder="Select country"
                />
              </div>
            </div>
          </div>

          <div class="bg-neutral-50 rounded-xl p-4 mb-4">
            <div class="flex items-baseline justify-between mb-2">
              <div>
                <p class="text-sm text-neutral-600">{{ fromCurrencyDisplay }} to {{ toCurrencyDisplay }} Exchange Rate</p>
                <p class="text-xs text-neutral-500 mt-1">Historical mid-market exchange rate data</p>
              </div>
            </div>
            
            <div class="flex items-baseline gap-2 mb-4">
              <span class="text-3xl font-bold text-neutral-900">1 {{ fromCurrencyDisplay }} = {{ currentRate.toFixed(4) }} {{ toCurrencyDisplay }}</span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                LIVE
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs text-neutral-600 mb-4">
              <div>
                <span class="block">Bid: {{ (currentRate - 0.001).toFixed(4) }}</span>
              </div>
              <div>
                <span class="block">Ask: {{ (currentRate + 0.001).toFixed(4) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-neutral-200 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-neutral-700">Exchange Rate History</h4>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 text-xs">
                  <span class="w-3 h-0.5 bg-emerald-500 rounded"></span>
                  <span class="text-neutral-600">{{ fromCurrencyDisplay }}-{{ toCurrencyDisplay }}</span>
                </span>
              </div>
            </div>
            
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:rgba(16, 185, 129, 0.2);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgba(16, 185, 129, 0);stop-opacity:1" />
                </linearGradient>
              </defs>
              
              <path
                :d="areaPath"
                fill="url(#lineGradient)"
              />
              
              <polyline
                :points="linePoints"
                fill="none"
                stroke="rgb(16, 185, 129)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              
              <circle
                v-for="(point, idx) in chartPoints"
                :key="idx"
                :cx="point.x"
                :cy="point.y"
                r="3"
                fill="rgb(16, 185, 129)"
                class="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <title>{{ formatChartTooltip(point.value, point.date) }}</title>
              </circle>
            </svg>

            <div class="flex justify-between text-xs text-neutral-500 mt-2">
              <span>{{ chartDateLabels[0] }}</span>
              <span>{{ chartDateLabels[Math.floor(chartDateLabels.length / 2)] }}</span>
              <span>{{ chartDateLabels[chartDateLabels.length - 1] }}</span>
            </div>
          </div>

          <div class="mt-4 text-xs text-neutral-500">
            <p>Last updated: {{ lastUpdatedText }}</p>
            <p class="mt-1">Source: OANDA</p>
          </div>
        </div>

         <div class="bg-gradient-to-br from-brand-50 to-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-lg flex flex-col">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-2 text-3xl">
              <span>{{ fromCountryFlag }}</span>
               <svg class="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span>{{ toCountryFlag }}</span>
            </div>
          </div>

          <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
            {{ alertTitle }}
          </h2>
          <p class="text-neutral-600 mb-4 leading-relaxed">
            We'll email you when the rate hits your target so you can send more for less.
          </p>
          <p class="text-neutral-500 mb-6 leading-relaxed text-sm">
            Interested in knowing when's the best time to send through this corridor? Set up a rate alert and we'll notify you instantly when rates move in your favor. Track multiple currency pairs and never miss an opportunity to maximize your transfer value.
          </p>

          <div v-if="!submitted">
            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <label for="alert-email" class="block text-sm font-semibold text-neutral-700 mb-2">
                  Email address
                </label>
                <input
                  id="alert-email"
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  class="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  :class="errors.email ? 'border-danger-600' : ''"
                  @blur="validateEmail"
                />
                <p v-if="errors.email" class="mt-1 text-sm text-danger-600">
                  {{ errors.email }}
                </p>
              </div>

              <div>
                <label for="target-rate" class="block text-sm font-semibold text-neutral-700 mb-2">
                  Target rate
                </label>
                <input
                  id="target-rate"
                  v-model="targetRate"
                  type="text"
                  :placeholder="`e.g. ${currentRate.toFixed(4)}`"
                  class="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  :class="errors.targetRate ? 'border-danger-600' : ''"
                  @blur="validateRate"
                />
                <p v-if="errors.targetRate" class="mt-1 text-sm text-danger-600">
                  {{ errors.targetRate }}
                </p>
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                 class="w-full min-h-btn bg-brand-600 text-white font-semibold rounded-btn hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? 'Creating...' : 'Create alert' }}
              </button>
            </form>
          </div>

          <div v-else class="text-center py-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-success-600 rounded-full mb-4">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-2">Alert created ✅</h3>
            <p class="text-neutral-600">{{ successMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  defaultFromCountry?: string;
  defaultToCountry?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultFromCountry: 'US',
  defaultToCountry: 'DE'
});

const { getCountry } = useCountries();

const selectedFromCountry = ref(props.defaultFromCountry);
const selectedToCountry = ref(props.defaultToCountry);

const email = ref('');
const targetRate = ref('');
const submitted = ref(false);
const isSubmitting = ref(false);

const errors = ref({
  email: '',
  targetRate: ''
});

const chartWidth = 800;
const chartHeight = 180;
const chartPadding = 10;

const generateHistoricalData = (days = 30) => {
  const data = [];
  const baseRate = 0.85 + Math.random() * 0.1;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const variation = (Math.sin(i / 5) * 0.02) + (Math.random() * 0.01 - 0.005);
    const rate = Math.max(0.01, baseRate + variation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      rate: rate
    });
  }
  
  return data;
};

const historicalData = ref(generateHistoricalData(30));

const fromCountryData = computed(() => getCountry(selectedFromCountry.value));
const toCountryData = computed(() => getCountry(selectedToCountry.value));

const fromCurrencyDisplay = computed(() => fromCountryData.value?.currency || 'USD');
const toCurrencyDisplay = computed(() => toCountryData.value?.currency || 'EUR');

const fromCountryFlag = computed(() => fromCountryData.value?.flag || '🏳️');
const toCountryFlag = computed(() => toCountryData.value?.flag || '🏳️');

const currentRate = computed(() => {
  if (historicalData.value.length > 0) {
    return historicalData.value[historicalData.value.length - 1].rate;
  }
  return 0.85;
});

const minRate = computed(() => Math.min(...historicalData.value.map(d => d.rate)));
const maxRate = computed(() => Math.max(...historicalData.value.map(d => d.rate)));

const chartPoints = computed(() => {
  return historicalData.value.map((d, idx) => {
    const x = chartPadding + (idx / (historicalData.value.length - 1)) * (chartWidth - 2 * chartPadding);
    const normalizedY = (d.rate - minRate.value) / (maxRate.value - minRate.value);
    const y = chartHeight - chartPadding - (normalizedY * (chartHeight - 2 * chartPadding));
    
    return {
      x,
      y,
      value: d.rate,
      date: d.date
    };
  });
});

const linePoints = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return '';
  
  const points = chartPoints.value;
  let path = `M ${points[0].x},${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }
  
  path += ` L ${points[points.length - 1].x},${chartHeight}`;
  path += ` L ${points[0].x},${chartHeight}`;
  path += ' Z';
  
  return path;
});

const chartDateLabels = computed(() => {
  const data = historicalData.value;
  if (data.length === 0) return [];
  
  return [
    formatDateLabel(data[0].date),
    formatDateLabel(data[Math.floor(data.length / 2)].date),
    formatDateLabel(data[data.length - 1].date)
  ];
});

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatChartTooltip = (rate: number, date: string) => {
  return `${formatDateLabel(date)}: ${rate.toFixed(4)}`;
};

const lastUpdatedText = computed(() => {
  const date = new Date();
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

const alertTitle = computed(() => {
  return `Get ${fromCurrencyDisplay.value}→${toCurrencyDisplay.value} rate alerts`;
});

const successMessage = computed(() => {
  return `We'll email you when the rate reaches ${targetRate.value}. You can unsubscribe anytime.`;
});

const validateEmail = () => {
  if (!email.value) {
    errors.value.email = 'Email is required';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errors.value.email = 'Please enter a valid email';
    return false;
  }
  errors.value.email = '';
  return true;
};

const validateRate = () => {
  if (!targetRate.value) {
    errors.value.targetRate = 'Target rate is required';
    return false;
  }
  const rateValue = parseFloat(targetRate.value.replace(/[^\d.]/g, ''));
  if (isNaN(rateValue) || rateValue <= 0) {
    errors.value.targetRate = 'Please enter a valid rate';
    return false;
  }
  errors.value.targetRate = '';
  return true;
};

const handleSubmit = async () => {
  const emailValid = validateEmail();
  const rateValid = validateRate();

  if (!emailValid || !rateValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    submitted.value = true;
  } catch (error) {
    console.error('Failed to create alert:', error);
  } finally {
    isSubmitting.value = false;
  }
};

watch([selectedFromCountry, selectedToCountry], () => {
  historicalData.value = generateHistoricalData(30);
  submitted.value = false;
  email.value = '';
  targetRate.value = '';
  errors.value = { email: '', targetRate: '' };
});
</script>
