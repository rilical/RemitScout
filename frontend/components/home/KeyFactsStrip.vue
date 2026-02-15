<template>
  <section class="py-16 sm:py-20 bg-surface">
    <div class="container">
      <div class="mb-12">
        <h2 class="text-h2 font-bold text-neutral-900 mb-4">
          Why You Can Trust <span class="text-brand-600">Remit-Scout</span>
        </h2>

        <div class="grid md:grid-cols-[1.2fr_1fr] gap-12 items-start">
          <div>
            <div class="prose prose-lg max-w-none">
              <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                Banks count on people <span class="text-brand-600 font-semibold">not comparing</span>. They hide fees in exchange rate markups, charge on both ends, and hope you don't do the math. For someone sending money regularly, those "small fees" add up to <span class="text-brand-600 font-semibold">hundreds or even thousands of dollars a year</span>.
              </p>

              <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                <span class="text-brand-600 font-semibold">Remit-Scout</span> was built by our founder, <span class="text-brand-600 font-semibold">Omar Ghabayen</span>, who got tired of watching money disappear to bank fees. He experienced it firsthand as a student at Carnegie Mellon, and that frustration led to building a <span class="text-brand-600 font-semibold">completely transparent comparison platform</span>.
              </p>

              <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                When Omar moved from Jordan to study at Carnegie Mellon, his parents would send him <span class="text-brand-600 font-semibold">$300 monthly</span> for expenses. But every single time, only $270 showed up in his account. $15 vanished at the sending bank in Jordan, another $15 disappeared at his receiving bank in the US. That's <span class="text-brand-600 font-semibold">$30 gone</span>, enough for two Chipotle burritos, or a week of groceries if you shop smart. When you're a broke student, that <span class="text-brand-600 font-semibold">10% loss</span> actually matters.
              </p>

              <p class="text-body-lg text-neutral-700 leading-relaxed mb-4">
                We compare real-time quotes across <span class="text-brand-600 font-semibold">{{ SITE_STATS.providers.display }} providers</span> and <span class="text-brand-600 font-semibold">{{ SITE_STATS.corridors.display }} global corridors</span>. <span class="text-brand-600 font-semibold">Providers cannot pay to rank higher</span>. We rank by what your recipient gets.
              </p>

              <p class="text-body-lg text-neutral-700 leading-relaxed mb-6">
                <span class="text-brand-600 font-semibold">{{ SITE_STATS.users.display }} comparisons</span> have been executed on Remit-Scout, and users have saved an estimated <span class="text-brand-600 font-semibold">{{ SITE_STATS.totalSaved.display }}</span>. Whether it's $10 or $1,000, your money should go to the people you're sending it to, not disappear into bank profits.
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Stats -->
            <div class="bg-gradient-to-br from-brand-50 to-white rounded-xl p-6 border-2 border-brand-200 shadow-lg text-center">
              <div class="text-h1 font-bold text-brand-600 mb-2">
                {{ SITE_STATS.users.display }}
              </div>
              <div class="text-body-sm font-semibold text-neutral-700">
                {{ SITE_STATS.users.label }}
              </div>
            </div>

            <div class="bg-gradient-to-br from-success-600 to-white rounded-xl p-6 border-2 border-success-600 shadow-lg text-center">
              <div class="text-h1 font-bold text-success-600 mb-2">
                {{ SITE_STATS.totalSaved.display }}
              </div>
              <div class="text-body-sm font-semibold text-neutral-700">
                {{ SITE_STATS.totalSaved.label }}
              </div>
            </div>

            <div class="bg-gradient-to-br from-accent-600 to-white rounded-xl p-6 border-2 border-accent-600 shadow-lg text-center">
              <div class="text-h1 font-bold text-accent-600 mb-2">
                {{ SITE_STATS.providers.display }}
              </div>
              <div class="text-body-sm font-semibold text-neutral-700">
                {{ SITE_STATS.providers.label }}
              </div>
            </div>

            <div class="bg-gradient-to-br from-primary-50 to-white rounded-xl p-6 border-2 border-primary-200 shadow-lg text-center">
              <div class="text-h1 font-bold text-primary-600 mb-2">
                {{ SITE_STATS.corridors.display }}
              </div>
              <div class="text-body-sm font-semibold text-neutral-700">
                {{ SITE_STATS.corridors.label }}
              </div>
            </div>

            <div class="bg-gradient-to-br from-warning-600 to-white rounded-xl p-6 border-2 border-warning-600 shadow-lg text-center">
              <div class="text-h1 font-bold text-warning-600 mb-2">
                3–9%
              </div>
              <div class="text-body-sm font-semibold text-neutral-700">
                Average savings vs banks
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SITE_STATS } from '~/config/stats'
</script>
