<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs :items="breadcrumbItems" />

      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h1 class="mb-4 text-4xl font-bold text-gray-900">
          Send Money to {{ countryName }}
        </h1>
        <p class="mb-6 text-xl text-gray-600">
          Compare money transfer providers for sending money to {{ countryName }}. Find the best
          rates and fastest transfer options.
        </p>

        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="text-center">
            <div class="mb-2 text-3xl font-bold text-primary-600">
              {{ countryInfo?.currency }}
            </div>
            <div class="text-gray-600">
              Currency
            </div>
          </div>
          <div class="text-center">
            <div class="mb-2 text-3xl font-bold text-primary-600">
              {{ countryInfo?.code }}
            </div>
            <div class="text-gray-600">
              Country Code
            </div>
          </div>
          <div class="text-center">
            <div class="mb-2 text-3xl font-bold text-primary-600">
              {{ countryInfo?.providers }}+
            </div>
            <div class="text-gray-600">
              Available Providers
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <div class="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Best Providers for {{ countryName }}
            </h2>
            <div class="space-y-4">
              <ProviderCard
                v-for="provider in topProviders"
                :key="provider.id"
                :provider="provider"
                :compact="true"
              />
            </div>
          </div>

          <div class="rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              Transfer Information
            </h2>
            <div class="space-y-4">
              <div class="flex justify-between border-b py-2">
                <span class="text-gray-600">Average Transfer Time</span>
                <span class="font-medium">{{ countryInfo?.avgTransferTime }}</span>
              </div>
              <div class="flex justify-between border-b py-2">
                <span class="text-gray-600">Banking Hours</span>
                <span class="font-medium">{{ countryInfo?.bankingHours }}</span>
              </div>
              <div class="flex justify-between border-b py-2">
                <span class="text-gray-600">Weekend Processing</span>
                <span class="font-medium">{{ countryInfo?.weekendProcessing }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-lg bg-white p-6 shadow-md">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">
              Quick Transfer
            </h3>
            <CountrySelect
              v-model="fromCountry"
              label="From"
            />
            <CountrySelect
              v-model="toCountry"
              label="To"
            />
            <AmountInput
              v-model="amount"
              label="Amount"
              :from="fromCountry"
              :to="toCountry"
            />
            <NuxtLink
              to="/send-money"
              class="btn-primary mt-4 block w-full text-center"
            >
              Compare Providers
            </NuxtLink>
          </div>

          <div class="rounded-lg bg-white p-6 shadow-md">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">
              Need Help?
            </h3>
            <p class="mb-4 text-sm text-gray-600">
              Not sure which provider is best for {{ countryName }}? Our experts can help.
            </p>
            <NuxtLink
              to="/contact"
              class="btn-secondary block w-full text-center"
            >
              Contact Support
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCountryFromSlug } from '~/utils/country-slugs'

// Data
const route = useRoute()
const countrySlug = computed(() => String(route.params.country || '').toLowerCase())
const countryData = computed(() => getCountryFromSlug(countrySlug.value))
const toCountry = computed(() => countryData.value?.code || '')
const fromCountry = ref('US')
const amount = ref(1000)

// Country data
const { data: countryInfo } = await useCountry(toCountry.value || (route.params.country as string))
const countryName = computed(() => countryInfo.value?.name || countryData.value?.name || route.params.country)

// Meta
useHead({
  title: `Send Money to ${countryName.value} | Remit-Scout`,
  meta: [
    {
      name: 'description',
      content: `Compare money transfer providers for sending money to ${countryName.value}. Get the best rates and fastest transfers.`,
    },
  ],
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: countryName.value, path: route.path },
])

// Top providers
const { data: topProviders } = await useProviders(fromCountry.value, toCountry.value, amount.value, 'bank', {
  key: `country-providers-${fromCountry.value}-${toCountry.value}-${amount.value}`,
})
</script>
