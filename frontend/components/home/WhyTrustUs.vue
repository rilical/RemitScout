<template>
  <section class="py-12 sm:py-16 bg-brand-600">
    <div class="container">
      <div class="text-center mb-12">
        <h2 class="text-h2 font-bold text-white mb-4">
          Trust & independence
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="pt-2">
                <p class="font-semibold text-white mb-1">
                  No pay-to-rank
                </p>
                <p class="text-white/70 leading-relaxed">
                  Rankings aren't for sale. Providers cannot pay to rank higher or improve their score. Every position is earned through actual performance on cost, speed, and reliability.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="pt-2">
                <p class="font-semibold text-white mb-1">
                  What you see is what arrives
                </p>
                <p class="text-white/70 leading-relaxed">
                  We show the net amount your recipient receives after all fees and FX markup are accounted for — not the headline rate, not an estimate. The number that actually matters.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="pt-2">
                <p class="font-semibold text-white mb-1">
                  Affiliate transparency
                </p>
                <p class="text-white/70 leading-relaxed">
                  We earn a commission when you complete a transfer through one of our links. This is disclosed upfront and never influences how providers are ranked or scored.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="pt-2">
                <p class="font-semibold text-white mb-1">
                  Algorithmic, not editorial
                </p>
                <p class="text-white/70 leading-relaxed">
                  Every comparison is calculated from live quote data. There is no human judgment in the ranking — only an objective score derived from real transfer economics.
                </p>
              </div>
            </div>
          </div>

          <!-- Methodology Link -->
          <div class="mt-8 pt-8 border-t border-white/20">
            <NuxtLink
              to="/methodology"
              class="inline-flex items-center gap-2 text-white hover:text-white/80 motion-safe:transition-colors group"
            >
              <span class="text-body-sm font-semibold">Read our full methodology</span>
              <svg class="w-4 h-4 group-hover:translate-x-1 motion-safe:transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>

        <div>
          <div class="bg-white/10 rounded-2xl border border-white/20 p-6 sm:p-8">
            <h3 class="text-h4 font-bold text-white mb-6">
              Compliance &amp; Security
            </h3>

            <div class="space-y-3">
              <div class="flex items-center gap-3 p-4 bg-white/10 rounded-xl">
                <div class="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="font-semibold text-white">GDPR compliant</span>
              </div>

              <div class="flex items-center gap-3 p-4 bg-white/10 rounded-xl">
                <div class="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="font-semibold text-white">ISO 27001 controls</span>
              </div>

              <div class="flex items-center gap-3 p-4 bg-white/10 rounded-xl">
                <div class="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="font-semibold text-white">PCI-aware handling</span>
              </div>

              <div class="flex items-center gap-3 p-4 bg-white/10 rounded-xl">
                <div class="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="font-semibold text-white">Regulated providers only</span>
              </div>
            </div>

            <p class="mt-6 text-body-sm text-white/50">
              Regulation applies to providers. We don't handle your money or process transfers.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// This section is now purely presentational with no dynamic data
</script>
