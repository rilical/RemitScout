<template>
  <div>
    <div class="mb-6 rounded-lg bg-gradient-to-br from-primary-600 to-blue-600 p-8 text-white">
      <h1 class="mb-2 text-3xl font-bold">
        Remit‑Scout Plus
      </h1>
      <p class="mb-6 text-lg text-primary-100">
        Upgrade your market monitoring with professional tools
      </p>
      <div class="flex gap-3">
        <button class="rounded-lg bg-white px-6 py-3 font-semibold text-primary-600 hover:bg-gray-100">
          Start 14-day free trial
        </button>
        <button class="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
          Learn more
        </button>
      </div>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
          <svg
            class="h-6 w-6 text-green-600"
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
        </div>
        <h3 class="mb-2 font-bold text-gray-900">
          Rate Alerts
        </h3>
        <p class="text-sm text-gray-600">
          Get notified via email or SMS when rates hit your target. Set multiple alerts for different corridors.
        </p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <svg
            class="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 class="mb-2 font-bold text-gray-900">
          Watchlist
        </h3>
        <p class="text-sm text-gray-600">
          Save your most-used corridors and see live updates in one place. Quick access to trends and changes.
        </p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
          <svg
            class="h-6 w-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 class="mb-2 font-bold text-gray-900">
          Extended History
        </h3>
        <p class="text-sm text-gray-600">
          Access up to 1 year of historical rate data. Export CSV for your own analysis and record-keeping.
        </p>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-8">
      <h2 class="mb-6 text-2xl font-bold text-gray-900">
        Pricing
      </h2>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="rounded-lg border-2 border-gray-200 p-6">
          <div class="mb-4">
            <h3 class="mb-1 text-lg font-bold text-gray-900">
              Free
            </h3>
            <div class="text-3xl font-bold text-gray-900">
              $0
            </div>
          </div>
          <ul class="mb-6 space-y-3 text-sm text-gray-600">
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Live market data</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Provider comparisons</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>7-day history</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Market insights</span>
            </li>
          </ul>
          <button class="w-full rounded-lg border-2 border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50">
            Current plan
          </button>
        </div>

        <div class="rounded-lg border-2 border-primary-600 bg-primary-50 p-6">
          <div class="mb-2 inline-block rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white">
            POPULAR
          </div>
          <div class="mb-4">
            <h3 class="mb-1 text-lg font-bold text-gray-900">
              Plus
            </h3>
            <div class="flex items-baseline gap-2">
              <div class="text-3xl font-bold text-gray-900">
                $9
              </div>
              <div class="text-gray-600">
                /month
              </div>
            </div>
          </div>
          <ul class="mb-6 space-y-3 text-sm text-gray-900">
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Everything in Free</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Rate alerts (email + SMS)</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Watchlist (save corridors)</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>1-year history + CSV export</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Ad-free experience</span>
            </li>
          </ul>
          <button class="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white hover:bg-primary-700">
            Start 14-day free trial
          </button>
          <p class="mt-3 text-center text-xs text-gray-600">
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      <div class="mt-8 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
        <strong>Important:</strong> Plus unlocks tools only. Rankings and provider ordering remain identical for all users—we never bias results based on subscription status.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>




