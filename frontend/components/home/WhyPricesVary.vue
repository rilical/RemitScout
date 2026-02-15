<template>
  <section class="py-12 sm:py-16 bg-neutral-50">
    <div class="container">
      <div class="bg-brand-600 rounded-2xl border-2 border-brand-700 overflow-hidden">
        <div class="p-6 sm:p-8 bg-brand-600">
          <div class="flex items-start gap-4 mb-6">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-h4 font-bold text-white mb-2">
                Why your checkout may look different
              </h2>
              <p class="text-body-sm text-white/90">
                Remittance pricing isn't one flat price. Here's what can change:
              </p>
            </div>
          </div>

          <div class="space-y-3 mb-6">
            <p class="text-body-sm text-white/90">
              <strong class="text-white">Payment method:</strong> Card payments often cost 2–3% more than bank transfers.
            </p>
            <p class="text-body-sm text-white/90">
              <strong class="text-white">Timing:</strong> FX rates change minute-to-minute. Provider rates may differ if captured at different times.
            </p>
            <p class="text-body-sm text-white/90">
              <strong class="text-white">Promotions:</strong> First-transfer promotions, fee waivers, or special rates may not be reflected in our quotes.
            </p>
          </div>

          <!-- Safety Notice -->
          <div class="mt-6 pt-6 border-t border-white/20">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p class="text-body-sm text-white/90">
                <strong class="text-white">Safety first:</strong> Remit‑Scout is a comparison and research product. We do not hold, move, or transmit money. When you choose a provider, you complete the transfer on their licensed platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
