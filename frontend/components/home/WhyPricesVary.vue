<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="bg-amber-50 rounded-2xl border-2 border-amber-200 overflow-hidden">
        <div class="p-6 sm:p-8">
          <div class="flex items-start gap-4 mb-6">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                Why your checkout may look different
              </h2>
              <p class="text-sm text-neutral-600">
                Remittance pricing isn't one flat price. Here's what can change:
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900">
                  Payment method
                </h3>
                <p class="text-xs text-neutral-600 mt-0.5">
                  Bank vs card vs wallet
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900">
                  Promotions
                </h3>
                <p class="text-xs text-neutral-600 mt-0.5">
                  Temporary boosts or fee waivers
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900">
                  KYC status
                </h3>
                <p class="text-xs text-neutral-600 mt-0.5">
                  New vs verified users
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900">
                  Payout method
                </h3>
                <p class="text-xs text-neutral-600 mt-0.5">
                  Bank deposit vs cash pickup
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900">
                  Timing
                </h3>
                <p class="text-xs text-neutral-600 mt-0.5">
                  Rates move throughout the day
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-neutral-900">
                  Local rules
                </h3>
                <p class="text-xs text-neutral-600 mt-0.5">
                  Regional banking requirements
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 p-5 rounded-lg border border-amber-200">
            <p class="text-sm text-neutral-700 leading-relaxed mb-3">
              <strong class="text-neutral-900">Our approach:</strong> We capture quotes at specific timestamps and refresh frequently to give you the most accurate comparison. However, the provider's checkout is always the final source of truth.
            </p>
            <p class="text-sm text-neutral-700 leading-relaxed">
              <strong class="text-neutral-900">Why this matters:</strong> Understanding these variables helps you compare quotes more effectively. We show you the best deal at the time of capture, but always verify the final amount before completing your transfer. This transparency is part of our commitment to helping you make informed decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>




