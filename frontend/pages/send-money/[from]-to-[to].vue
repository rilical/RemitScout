<template>
  <div class="min-h-screen bg-white">
    <!-- Sticky Compare Bar -->
    <div class="sticky top-16 z-40 border-b border-neutral-200 bg-white shadow-sm">
      <div class="mx-auto max-w-6xl px-4 py-3">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <!-- Countries -->
          <div class="flex items-center gap-3">
            <span class="text-2xl leading-none">{{ flagFrom }}</span>
            <span class="font-semibold text-neutral-900 text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{{ content.from }}</span>
            <div class="flex items-center justify-center h-6 w-6">
              <svg class="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <span class="text-2xl leading-none">{{ flagTo }}</span>
            <span class="font-semibold text-neutral-900 text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{{ content.to }}</span>
          </div>
          <!-- Amount & Currency (Form inputs - changes don't affect hero until Compare clicked) -->
          <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div class="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex-1 sm:flex-initial">
              <span class="text-xs sm:text-sm text-neutral-500 px-3 hidden sm:inline">You send</span>
              <input
                v-model="formAmount"
                type="number"
                class="w-16 sm:w-20 border-none bg-transparent text-sm font-bold text-neutral-900 focus:outline-none py-2"
                min="200"
                placeholder="200"
              >
              <div class="relative">
                <select
                  v-model="formSendCurrency"
                  class="h-full bg-brand-600 text-white text-xs sm:text-sm font-bold pl-3 pr-8 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none"
                >
                  <option
                    v-for="curr in availableSendCurrencies"
                    :key="curr"
                    :value="curr"
                    class="bg-white text-neutral-900"
                  >
                    {{ curr }}
                  </option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div class="flex items-center justify-center h-6 w-6">
              <span class="text-neutral-400">→</span>
            </div>
            <div class="relative">
              <select
                v-model="formReceiveCurrency"
                class="bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs sm:text-sm font-bold pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none"
              >
                <option
                  v-for="curr in availableReceiveCurrencies"
                  :key="curr"
                  :value="curr"
                >
                  {{ curr }}
                </option>
              </select>
              <svg class="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
              @click="handleCompare"
            >
              Compare
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Full-Width Hero Section with Chart -->
    <section class="bg-gradient-to-b from-brand-600 to-brand-700 text-white">
      <div class="mx-auto max-w-6xl px-4 py-8">
        <!-- Breadcrumbs (light) -->
        <nav class="mb-6 text-sm">
          <ol class="flex flex-wrap items-center gap-2">
            <li>
              <NuxtLink to="/" class="text-white/70 hover:text-white">Home</NuxtLink>
            </li>
            <li class="text-white/50">›</li>
            <li>
              <NuxtLink to="/send-money" class="text-white/70 hover:text-white">Send Money</NuxtLink>
            </li>
            <li class="text-white/50">›</li>
            <li class="text-white">{{ content.from }} to {{ content.to }}</li>
          </ol>
        </nav>

        <div class="grid gap-8 lg:grid-cols-2 lg:items-center">
          <!-- Left: Title & Info -->
          <div>
            <p class="text-sm font-medium text-white/80 mb-2 uppercase tracking-wide">
              Money Transfer Details 💸
            </p>
            <div class="flex items-center gap-6 mb-4">
              <div class="flex items-center gap-3">
                <span class="text-4xl leading-none">{{ flagFrom }}</span>
                <div>
                  <p class="text-xs text-white/70 mb-0.5">Sending from</p>
                  <span class="text-lg font-semibold">{{ content.from }}</span>
                </div>
              </div>
              <div class="flex items-center justify-center h-10 w-10">
                <svg class="h-6 w-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-4xl leading-none">{{ flagTo }}</span>
                <div>
                  <p class="text-xs text-white/70 mb-0.5">Receiving in</p>
                  <span class="text-lg font-semibold">{{ content.to }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-baseline gap-4 mb-6">
              <div>
                <p class="text-4xl font-bold">{{ amount.toLocaleString() }}.00 {{ content.fromCode.toUpperCase() }}</p>
              </div>
              <svg class="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div>
                <p class="text-4xl font-bold">{{ estimatedReceive }} {{ content.toCode.toUpperCase() }}</p>
              </div>
            </div>

            <!-- Trust Chips -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="chip in content.hero.chips"
                :key="chip"
                class="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium text-white"
              >
                <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ chip }}
              </span>
            </div>
          </div>

          <!-- Right: Rate Chart -->
          <div class="rounded-2xl bg-white p-5 shadow-xl">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Current Mid-Market Rate</p>
                <p class="text-2xl font-bold text-brand-600">{{ content.rateWidget.midMarket }}</p>
              </div>
              <div class="flex gap-1">
                <span
                  v-for="change in content.rateWidget.changes"
                  :key="change.label"
                  :class="[
                    'inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold',
                    change.value.startsWith('-') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  ]"
                >
                  {{ change.value }} SINCE {{ change.label.toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Simple Chart Visualization -->
            <div class="h-32 relative mb-4">
              <svg class="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <!-- Grid lines -->
                <line x1="0" y1="25" x2="400" y2="25" stroke="#e5e7eb" stroke-width="1" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#e5e7eb" stroke-width="1" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#e5e7eb" stroke-width="1" />

                <!-- Rate line (sample data visualization) -->
                <path
                  d="M0,60 Q50,55 100,58 T200,45 T300,50 T400,40"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="2"
                />
                <!-- Area fill -->
                <path
                  d="M0,60 Q50,55 100,58 T200,45 T300,50 T400,40 L400,100 L0,100 Z"
                  fill="url(#chartGradient)"
                />
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <!-- Current point -->
                <circle cx="400" cy="40" r="4" fill="#2563eb" />
              </svg>

              <!-- X-axis labels -->
              <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-neutral-400">
                <span>60D</span>
                <span>45D</span>
                <span>30D</span>
                <span>15D</span>
                <span>Now</span>
              </div>
            </div>

            <div class="border-t border-neutral-200 pt-4">
              <p class="text-xs text-neutral-500 mb-2">
                <strong class="text-neutral-700">About this rate:</strong>
                This is the mid-market exchange rate between {{ content.fromCode.toUpperCase() }} and {{ content.toCode.toUpperCase() }} over the past 30 days. The mid-market rate is the rate banks trade at between themselves.
              </p>
              <p class="text-[10px] text-neutral-400">
                Last updated: {{ content.rateWidget.asOf }} · Source: {{ content.rateWidget.source }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Section - Single Column Focus -->
    <div class="mx-auto max-w-5xl px-4 py-8">
      <!-- Intro Text -->
      <section class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 leading-tight mb-4">
          Send money from {{ content.from }} to {{ content.to }}
        </h1>
        <p class="text-lg text-neutral-600 leading-relaxed mb-4">
          {{ content.hero.subhead }}
        </p>
        <NuxtLink
          to="/how-we-make-money"
          class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-600 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Advertiser disclosure
        </NuxtLink>
      </section>

      <!-- Best Ways Summary (Monito-style green card) -->
      <section v-if="content.providerHighlights.length" class="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-6 mb-8">
        <div class="flex items-start gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white flex-shrink-0">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-neutral-900 mb-3">
              Best Ways to Send Money from {{ content.from }} to {{ content.to }}
            </h2>
            <ul class="space-y-2 text-sm text-neutral-700">
              <li v-for="highlight in content.providerHighlights" :key="highlight.label" class="flex items-center gap-2">
                <span class="font-medium text-neutral-500">{{ highlight.label }}:</span>
                <span class="font-bold text-brand-600">{{ highlight.provider }}</span>
                <span class="text-neutral-400">({{ highlight.score }}/10)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Coming Soon Placeholder (when no providers) -->
      <section v-else class="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-blue-50 border border-brand-200 p-8 lg:p-12 mb-8">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-8">
            <span class="text-5xl mb-4 block">🚀</span>
            <h2 class="text-2xl font-bold text-neutral-900 mb-3">
              {{ content.from }} to {{ content.to }} Comparison Coming Soon
            </h2>
            <p class="text-lg text-neutral-600 mb-4">
              We're currently gathering real-time data from licensed money transfer providers for this corridor.
            </p>
          </div>

          <!-- EEAT Content -->
          <div class="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
            <h3 class="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <span>📊</span> What to Expect When We Launch
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex gap-3">
                <span class="text-xl">💰</span>
                <div>
                  <p class="font-semibold text-neutral-900">Live Exchange Rates</p>
                  <p class="text-sm text-neutral-600">Real-time mid-market rates compared against each provider's offered rate, showing you exactly how much markup they add.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl">🏆</span>
                <div>
                  <p class="font-semibold text-neutral-900">Provider Rankings</p>
                  <p class="text-sm text-neutral-600">Unbiased rankings based on total cost (fees + FX markup), transfer speed, and user reviews. Providers cannot pay for placement.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl">⚡</span>
                <div>
                  <p class="font-semibold text-neutral-900">Speed Comparisons</p>
                  <p class="text-sm text-neutral-600">See which providers offer instant transfers, same-day delivery, or bank deposit options for {{ content.to }}.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl">🛡️</span>
                <div>
                  <p class="font-semibold text-neutral-900">Licensed Providers Only</p>
                  <p class="text-sm text-neutral-600">Every provider we list is regulated by financial authorities (FCA, FinCEN, ASIC) for your protection.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Why We're Different -->
          <div class="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 class="font-bold text-neutral-900 mb-3">Why Remit-Scout?</h3>
            <p class="text-neutral-600 mb-4">
              Founded by expats who were tired of losing money to hidden bank fees, Remit-Scout is an independent comparison platform. We test transfers ourselves, verify licensing, and never let providers pay for better rankings. Our goal is simple: help you keep more money in your pocket.
            </p>
            <div class="flex flex-wrap gap-4 text-sm">
              <span class="flex items-center gap-1.5 text-neutral-700">
                <span class="text-green-600">✓</span> 30+ providers compared
              </span>
              <span class="flex items-center gap-1.5 text-neutral-700">
                <span class="text-green-600">✓</span> 150+ countries covered
              </span>
              <span class="flex items-center gap-1.5 text-neutral-700">
                <span class="text-green-600">✓</span> Updated every 5 minutes
              </span>
            </div>
          </div>

          <!-- Email Signup -->
          <div class="text-center">
            <p class="text-neutral-700 font-medium mb-4">
              Get notified when {{ content.from }} → {{ content.to }} comparisons go live:
            </p>
            <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                class="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
              <button
                type="button"
                class="rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
              >
                🔔 Notify Me
              </button>
            </div>
            <p class="text-xs text-neutral-500 mt-4">
              In the meantime, explore our <NuxtLink to="/send-money" class="text-brand-600 hover:underline font-medium">comparison tool</NuxtLink> for other popular corridors, or read our <NuxtLink to="/learn" class="text-brand-600 hover:underline font-medium">money transfer guides</NuxtLink>.
            </p>
          </div>
        </div>
      </section>

      <!-- Mid-Market Rate Card -->
      <section v-if="content.rateWidget.midMarket" class="rounded-xl border border-neutral-200 bg-white p-6 mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <p class="text-sm font-medium text-neutral-500 mb-1">Mid-market exchange rate</p>
            <p class="text-2xl font-bold text-neutral-900">{{ content.rateWidget.midMarket }}</p>
            <p class="text-xs text-neutral-500 mt-1">{{ content.rateWidget.asOf }} · Source: {{ content.rateWidget.source }}</p>
          </div>
          <div class="flex gap-2">
            <span
              v-for="change in content.rateWidget.changes"
              :key="change.label"
              class="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1.5 text-xs font-medium"
            >
              <span class="text-neutral-500">{{ change.label }}</span>
              <span :class="change.value.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'">
                {{ change.value }}
              </span>
            </span>
          </div>
        </div>
        <p class="text-sm text-neutral-600 leading-relaxed">
          To calculate the total cost of your transfer, we compare the exchange rate every provider applies to your transactions with the latest mid-market rate data from
          <span class="font-semibold">{{ content.rateWidget.source }}</span>.
        </p>
      </section>

      <!-- Compare Providers Section -->
      <section v-if="content.table.rows.length" class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-neutral-900">
              Compare {{ content.table.rows.length }} providers
            </h2>
            <p class="text-sm text-neutral-500">
              Sorted by amount received
            </p>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/how-we-make-money"
              class="text-xs text-neutral-500 hover:text-brand-600"
            >
              Advertiser disclosure
            </NuxtLink>
            <span class="text-neutral-300">|</span>
            <button type="button" class="text-xs text-neutral-500 hover:text-brand-600">
              Report a problem
            </button>
          </div>
        </div>

        <!-- Provider Cards -->
        <div class="space-y-4">
          <div
            v-for="(row, index) in content.table.rows"
            :key="row.provider"
            :class="[
              'rounded-xl border-2 p-5 transition-all hover:shadow-md',
              index === 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-neutral-200 bg-white hover:border-brand-200'
            ]"
          >
            <!-- Badge Row -->
            <div v-if="row.badge || row.warning" class="mb-3">
              <span
                v-if="row.badge"
                :class="[
                  'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold',
                  index === 0 ? 'bg-emerald-500 text-white' : 'bg-brand-100 text-brand-700'
                ]"
              >
                {{ row.badge }}
              </span>
              <span v-if="row.warning" class="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                ⚠️ {{ row.warning }}
              </span>
            </div>

            <div class="flex flex-col lg:flex-row lg:items-center gap-4">
              <!-- Provider Info -->
              <div class="flex items-center gap-4 lg:w-48 flex-shrink-0">
                <div class="relative">
                  <div class="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-600">
                    {{ row.provider.charAt(0) }}
                  </div>
                  <div class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {{ row.score }}
                  </div>
                </div>
                <div>
                  <p class="font-bold text-neutral-900">{{ row.provider }}</p>
                  <p class="text-xs text-neutral-500">Our score</p>
                </div>
              </div>

              <!-- Transfer Details -->
              <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Transfer time</p>
                  <p class="font-semibold text-neutral-900">{{ row.speed }}</p>
                  <p class="text-xs text-neutral-500">{{ row.speedNote }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Fee & rates</p>
                  <p class="font-semibold text-neutral-900">Fee {{ row.fee }}</p>
                  <p class="text-xs text-neutral-500">{{ row.rate }}</p>
                  <p :class="['text-xs', row.delta.includes('0.') ? 'text-emerald-600' : 'text-amber-600']">
                    {{ row.delta }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 mb-0.5">Recipient gets</p>
                  <p class="text-xl font-bold text-neutral-900">{{ row.recipientGets }}</p>
                </div>
                <div class="flex items-center">
                  <button
                    type="button"
                    :class="[
                      'w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-colors',
                      index === 0
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50'
                    ]"
                  >
                    Go to {{ row.provider.split(' ')[0] }} →
                  </button>
                </div>
              </div>
            </div>

            <!-- Extra Info -->
            <div v-if="row.notes" class="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-4 text-xs text-neutral-500">
              <span>💳 Pay-in: {{ row.payIn }}</span>
              <span>💵 Payout: {{ row.payOut }}</span>
              <span class="text-neutral-400">·</span>
              <span>{{ row.notes }}</span>
            </div>
          </div>
        </div>

        <p class="mt-4 text-xs text-neutral-500 leading-relaxed">
          We source transfer fees, rates and other data from money transfer providers in different ways. We constantly monitor the quality of our comparison data, but we cannot guarantee its accuracy. Last updated {{ content.lastUpdated }}.
        </p>
      </section>

      <!-- AD SLOT 1: In-content (between sections) -->
      <section class="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 mb-8">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200 px-2 py-0.5 rounded">Ad</span>
        </div>
        <div class="text-center py-6 text-sm text-amber-700">
          <p class="mb-2">Advertisement placeholder</p>
          <code class="text-[10px] bg-amber-100 px-2 py-1 rounded">ins.adsbygoogle data-ad-slot="XXXX"</code>
        </div>
      </section>

      <!-- About This Corridor -->
      <section class="mb-8">
        <h2 class="text-xl font-bold text-neutral-900 mb-4">
          About Money Transfers from {{ content.from }} to {{ content.to }}
        </h2>
        <div class="prose prose-neutral prose-sm max-w-none">
          <p class="text-neutral-600 leading-relaxed mb-4">
            When it comes to sending money from {{ content.from }} to {{ content.to }}, there are several options to consider. Comparing your options carefully can save you a significant amount, and our experts at Remit-Scout are here to help.
          </p>

          <!-- Stats Grid -->
          <div v-if="content.statsBar.length" class="grid grid-cols-2 gap-4 my-6 not-prose">
            <div
              v-for="stat in content.statsBar"
              :key="stat.label"
              class="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <p class="text-xs font-medium text-neutral-500 mb-1">{{ stat.label }}</p>
              <p class="text-lg font-bold text-neutral-900">{{ stat.value }}</p>
              <p class="text-xs text-neutral-500">{{ stat.helper }}</p>
            </div>
          </div>

          <p class="text-neutral-600 leading-relaxed mb-4">
            You'll need to consider which option best meets your needs, whether that's via traditional bank transfers, cash pickups, or online money transfers. In general, money transfer services are the best way to send money abroad—not only because they're the cheapest, but also because they're usually the fastest and easiest to use.
          </p>
        </div>
      </section>

      <!-- How to Send Section -->
      <section v-if="content.steps.length" class="mb-8">
        <h2 class="text-xl font-bold text-neutral-900 mb-4">
          How to Send Money to {{ content.to }} From {{ content.from }}
        </h2>
        <ol class="space-y-3">
          <li
            v-for="(step, index) in content.steps"
            :key="step"
            class="flex gap-4"
          >
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white flex-shrink-0">
              {{ index + 1 }}
            </span>
            <p class="text-sm text-neutral-700 pt-0.5">{{ step }}</p>
          </li>
        </ol>
      </section>

      <!-- Insights Grid -->
      <section v-if="content.insights.length" class="mb-8">
        <h2 class="text-xl font-bold text-neutral-900 mb-4">
          Corridor Insights
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div
            v-for="insight in content.insights"
            :key="insight.label"
            class="rounded-lg border border-neutral-200 p-4"
          >
            <p class="text-xs font-medium text-neutral-500 mb-1">{{ insight.label }}</p>
            <p class="text-lg font-bold text-neutral-900">{{ insight.value }}</p>
            <p class="text-xs text-neutral-500">{{ insight.helper }}</p>
          </div>
        </div>
      </section>

      <!-- Mini Guides -->
      <section v-if="content.miniGuides && content.miniGuides.length" class="mb-8">
        <h2 class="text-xl font-bold text-neutral-900 mb-4">
          In-Depth Money Transfer Guides
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <NuxtLink
            v-for="guide in content.miniGuides"
            :key="guide.title"
            :to="guide.link"
            class="group rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <h3 class="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
              {{ guide.title }}
            </h3>
            <p class="text-sm text-neutral-600 leading-relaxed mb-3">
              {{ guide.excerpt }}
            </p>
            <span class="text-sm font-semibold text-brand-600 group-hover:underline">
              Read more →
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- FAQ Section -->
      <section v-if="content.faqs.length" class="mb-8">
        <h2 class="text-xl font-bold text-neutral-900 mb-4">
          FAQ About Sending Money From {{ content.from }} to {{ content.to }}
        </h2>
        <div class="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
          <details
            v-for="item in content.faqs"
            :key="item.q"
            class="group bg-white"
          >
            <summary class="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-neutral-900 hover:bg-neutral-50">
              {{ item.q }}
              <svg class="h-5 w-5 text-neutral-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
              {{ item.a }}
            </div>
          </details>
        </div>
      </section>

      <!-- Rate Alert Section - Inline (only show if currencies are different) -->
      <section
        v-if="displaySendCurrency !== displayReceiveCurrency"
        class="rounded-xl border border-amber-200 bg-amber-50 p-6 mb-8"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p class="font-bold text-neutral-900">🔔 Get Rate Alerts</p>
              <p class="text-sm text-neutral-600">We'll notify you when {{ displaySendCurrency }}/{{ displayReceiveCurrency }} rates improve</p>
            </div>
          </div>
          <div class="flex gap-2 sm:flex-shrink-0">
            <input
              type="email"
              placeholder="you@example.com"
              class="flex-1 sm:w-64 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
            >
              Create Alert
            </button>
          </div>
        </div>
      </section>

      <!-- AD SLOT: Inline Banner -->
      <section class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 mb-8">
        <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded mb-2 inline-block">Advertisement</span>
        <div class="text-center py-6 text-sm text-neutral-500">
          Inline ad banner (728×90 or responsive)
        </div>
      </section>

      <!-- Best Rated Providers Section (Full Width) -->
      <section class="py-12 border-t border-neutral-200 mt-12">
        <h2 class="text-2xl font-bold text-neutral-900 text-center mb-8">
          Best Rated Providers to Send Money from {{ content.from }} to {{ content.to }}
        </h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="highlight in content.providerHighlights"
            :key="highlight.provider"
            class="rounded-xl border border-neutral-200 bg-white p-5 text-center hover:shadow-lg transition-shadow"
          >
            <!-- Score Badge -->
            <div class="relative inline-block mb-4">
              <div class="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center mx-auto">
                <span class="text-xl font-bold text-emerald-600">{{ highlight.score }}</span>
              </div>
            </div>

            <!-- Provider Logo Placeholder -->
            <div class="h-12 w-24 mx-auto mb-4 bg-neutral-100 rounded flex items-center justify-center text-lg font-bold text-neutral-400">
              {{ highlight.provider.substring(0, 2).toUpperCase() }}
            </div>

            <!-- Score Breakdown -->
            <div class="space-y-2 text-left mb-4">
              <div class="flex items-center justify-between text-xs">
                <span class="text-neutral-500">Trust & Credibility</span>
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 bg-neutral-200 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: 95%;" />
                  </div>
                  <span class="font-semibold text-neutral-700">9.5</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-neutral-500">Service & Quality</span>
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 bg-neutral-200 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: 87%;" />
                  </div>
                  <span class="font-semibold text-neutral-700">8.7</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-neutral-500">Fees & Rates</span>
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 bg-neutral-200 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: 92%;" />
                  </div>
                  <span class="font-semibold text-neutral-700">9.2</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors"
            >
              Go to {{ highlight.provider }}
            </button>
            <NuxtLink to="#" class="block mt-2 text-xs text-brand-600 hover:underline">
              Read the full review
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- AD SLOT 3: Before Footer (Full Width) -->
      <section class="py-8 border-t border-neutral-200">
        <div class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center">
          <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded mb-2 inline-block">Advertisement</span>
          <div class="py-8 text-sm text-neutral-500">
            Full-width ad banner (728×90 or responsive)
          </div>
        </div>
      </section>

      <!-- EEAT / Methodology Section -->
      <section class="py-12 border-t border-neutral-200">
        <div class="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 class="text-2xl font-bold text-neutral-900 mb-4">
              Everyone wins, except expensive solutions
            </h2>
            <div class="prose prose-neutral prose-sm max-w-none">
              <p class="text-neutral-600 leading-relaxed">
                With our model, the only losers are the expensive banks or providers you'll stop using!
              </p>
              <p class="text-neutral-600 leading-relaxed">
                To ensure our independence, we always use <strong>transparent, objective and verifiable</strong> criteria in our comparison. No provider can buy their way to the top of our results.
              </p>
              <p class="text-neutral-600 leading-relaxed">
                We include as many providers as possible in our comparison and have partnerships with almost all major and innovative providers.
              </p>
            </div>
            <NuxtLink
              to="/methodology"
              class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors"
            >
              Learn more about Remit-Scout
            </NuxtLink>
          </div>
          <div class="space-y-4">
            <div class="flex items-start gap-4 rounded-xl border border-neutral-200 p-4">
              <div class="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-sm text-neutral-600">
                You save money on your transfer by selecting the cheapest provider.
              </p>
            </div>
            <div class="flex items-start gap-4 rounded-xl border border-neutral-200 p-4">
              <div class="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p class="text-sm text-neutral-600">
                The best providers earn new customers without expensive marketing, helping keep their costs (and prices) low.
              </p>
            </div>
            <div class="flex items-start gap-4 rounded-xl border border-neutral-200 p-4">
              <div class="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p class="text-sm text-neutral-600">
                Remit-Scout receives a referral fee from the provider you selected. This enables us to offer our service to you for free.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Disclosures -->
      <section class="py-8 border-t border-neutral-200">
        <div class="text-xs text-neutral-500 space-y-2">
          <p><strong>Affiliate disclosure:</strong> {{ content.disclosures.advert }}</p>
          <p><strong>Data accuracy:</strong> {{ content.disclosures.data }}</p>
        </div>
      </section>
    </div>

    <!-- Trust Metrics Strip (Reused Component Style) -->
    <section class="py-12 sm:py-16 bg-brand-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">Our Impact So Far 🚀</h2>
          <p class="text-white/80 max-w-2xl mx-auto">
            Built by an expat who got tired of watching money disappear to bank fees. We track 30+ providers across 150+ countries in real time. Providers cannot pay to rank higher, we just show you the truth.
          </p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center">
            <span class="text-3xl mb-2 block">🌍</span>
            <p class="text-3xl font-bold text-white">250K+</p>
            <p class="text-sm text-white/70">Users helped</p>
          </div>
          <div class="text-center">
            <span class="text-3xl mb-2 block">🔬</span>
            <p class="text-3xl font-bold text-white">30+</p>
            <p class="text-sm text-white/70">Providers compared</p>
          </div>
          <div class="text-center">
            <span class="text-3xl mb-2 block">🗺️</span>
            <p class="text-3xl font-bold text-white">150+</p>
            <p class="text-sm text-white/70">Countries covered</p>
          </div>
          <div class="text-center">
            <span class="text-3xl mb-2 block">💰</span>
            <p class="text-3xl font-bold text-white">$2.5M+</p>
            <p class="text-sm text-white/70">Saved in fees</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Understanding Hidden Costs (Reused Section) -->
    <section class="py-12 sm:py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-br from-neutral-50 to-white rounded-3xl border-2 border-neutral-200 p-10 sm:p-12">
          <h2 class="text-2xl font-bold text-neutral-900 mb-6">Understanding the hidden costs</h2>
          <p class="text-neutral-600 mb-8">
            Banks don't just charge fees, they make most of their money through the exchange rate markup. Here's what you need to know.
          </p>
          <div class="grid gap-6 md:grid-cols-3">
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">🕵️</span>
              </div>
              <div>
                <h3 class="font-bold text-neutral-900 mb-1">The Hidden Markup</h3>
                <p class="text-sm text-neutral-600">Traditional banks add 3-5% to exchange rates. On $1,000, that's $30-50 lost before fees.</p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">📊</span>
              </div>
              <div>
                <h3 class="font-bold text-neutral-900 mb-1">Mid-Market Rate</h3>
                <p class="text-sm text-neutral-600">We compare every provider against the real mid-market rate from XE—the rate banks use between themselves.</p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">💡</span>
              </div>
              <div>
                <h3 class="font-bold text-neutral-900 mb-1">Total Cost Matters</h3>
                <p class="text-sm text-neutral-600">Low fees mean nothing if the rate is bad. We show total cost: fee + FX markup combined.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Read Our Guides (Corridor-Specific) -->
    <section class="py-12 sm:py-16 bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-neutral-900 mb-2">📚 Read Our Guides</h2>
          <p class="text-neutral-600">Everything you need to know about international money transfers</p>
        </div>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="guide in corridorGuides"
            :key="guide.title"
            :to="guide.link"
            class="group rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-lg hover:border-brand-300 transition-all flex flex-col h-full"
          >
            <span class="text-3xl mb-3 block">{{ guide.emoji }}</span>
            <h3 class="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
              {{ guide.title }}
            </h3>
            <p class="text-sm text-neutral-600 mb-4 flex-1">{{ guide.excerpt }}</p>
            <span class="text-sm font-semibold text-brand-600 group-hover:underline mt-auto">Read →</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Corridor-Specific FAQ -->
    <section class="py-12 sm:py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-neutral-900 mb-2">Frequently Asked Questions</h2>
          <p class="text-neutral-600">Common questions about {{ content.from }} to {{ content.to }} transfers</p>
        </div>
        <div class="max-w-3xl mx-auto divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
          <details
            v-for="faq in corridorFaqs"
            :key="faq.q"
            class="group bg-white"
          >
            <summary class="flex items-center justify-between cursor-pointer px-6 py-5 text-base font-semibold text-neutral-900 hover:bg-neutral-50">
              {{ faq.q }}
              <svg class="h-5 w-5 text-neutral-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-6 pb-5 text-neutral-600 leading-relaxed">
              {{ faq.a }}
            </div>
          </details>
        </div>
        <div class="text-center mt-6">
          <NuxtLink to="/faq" class="text-sm font-semibold text-brand-600 hover:underline">
            View all FAQs →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Trust & Independence (Reused Section) -->
    <section class="py-12 sm:py-16 bg-brand-600">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">Trust & independence</h2>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="bg-white/10 backdrop-blur rounded-xl p-6">
            <span class="text-3xl mb-3 block">🎯</span>
            <h3 class="font-bold text-white mb-2">100% independent rankings</h3>
            <p class="text-sm text-white/80">Providers can't pay for better placement. We rank purely on total cost, speed, and reliability, so you see what's genuinely best for your transfer.</p>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-xl p-6">
            <span class="text-3xl mb-3 block">🔬</span>
            <h3 class="font-bold text-white mb-2">Real transfer testing</h3>
            <p class="text-sm text-white/80">We don't just scrape data—we test transfers ourselves to verify fees, speeds, and actual recipient amounts across corridors.</p>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-xl p-6">
            <span class="text-3xl mb-3 block">✅</span>
            <h3 class="font-bold text-white mb-2">Licensed providers only</h3>
            <p class="text-sm text-white/80">Every provider we list is licensed and regulated (FCA, FinCEN, ASIC). We exclude unlicensed services for your protection.</p>
          </div>
        </div>
        <div class="text-center mt-8">
          <NuxtLink
            to="/methodology"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-brand-600 hover:bg-neutral-100 transition-colors"
          >
            Learn how we compare →
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { jsonLdBreadcrumb, jsonLdFaq, setSeo } from '~/composables/useSeo'

type ProviderHighlight = {
  label: string
  provider: string
  score: string
  rate: string
  fee: string
  speed: string
  note: string
  ctaLabel: string
}

type TableRow = {
  provider: string
  score: string
  recipientGets: string
  delta: string
  fee: string
  rate: string
  speed: string
  speedNote: string
  payIn: string
  payOut: string
  notes: string
  badge?: string
  warning?: string
}

type Insight = {
  label: string
  value: string
  helper: string
}

type Guide = {
  title: string
  excerpt: string
  link: string
}

type CorridorContent = {
  from: string
  to: string
  fromCode: string
  toCode: string
  currencyPair: string
  lastUpdated: string
  hero: {
    kicker: string
    title: string
    subhead: string
    chips: string[]
  }
  statsBar: Array<{ label: string, value: string, helper: string }>
  providerHighlights: ProviderHighlight[]
  rateWidget: {
    midMarket: string
    asOf: string
    source: string
    changes: Array<{ label: string, value: string }>
  }
  table: {
    title: string
    amountExample: string
    rows: TableRow[]
  }
  insights: Insight[]
  recommendations: string[]
  steps: string[]
  faqs: Array<{ q: string, a: string }>
  miniGuides?: Guide[]
  disclosures: {
    advert: string
    data: string
  }
}

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()
const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl

import {
  getCanonicalSlug,
  getCountryFromSlug,
  getCanonicalCorridorUrl,
  needsCanonicalRedirect,
} from '~/utils/country-slugs'

const normalizeSlug = (value: string | string[] | undefined) => String(value || '').toLowerCase()

const resolveCountryName = (slug: string) => {
  const country = getCountryFromSlug(slug)
  return country?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const resolveCurrency = (slug: string) => {
  const country = getCountryFromSlug(slug)
  return country?.currency || ''
}

const resolveFlag = (slug: string) => {
  const country = getCountryFromSlug(slug)
  return country?.flag || '🌐'
}

const fromSlug = computed(() => normalizeSlug(route.params.from))
const toSlug = computed(() => normalizeSlug(route.params.to))
const canonicalFrom = computed(() => getCanonicalSlug(fromSlug.value))
const canonicalTo = computed(() => getCanonicalSlug(toSlug.value))
const corridorKey = computed(() => `${canonicalFrom.value}-${canonicalTo.value}`)
const canonicalPath = computed(() => `/send-money/${canonicalFrom.value}-to-${canonicalTo.value}`)
const flagFrom = computed(() => resolveFlag(canonicalFrom.value))
const flagTo = computed(() => resolveFlag(canonicalTo.value))

// Redirect to canonical URL if needed (e.g., /us-to-jo -> /united-states-to-jordan)
if (import.meta.client && needsCanonicalRedirect(fromSlug.value, toSlug.value)) {
  navigateTo(getCanonicalCorridorUrl(fromSlug.value, toSlug.value), { redirectCode: 301 })
}

const corridorContent: Record<string, CorridorContent> = {
  'united-states-jordan': {
    from: 'United States',
    to: 'Jordan',
    fromCode: 'usd',
    toCode: 'jod',
    currencyPair: 'USD/JOD',
    lastUpdated: '2024-11-30',
    hero: {
      kicker: 'Corridor Guide',
      title: 'Send money from the United States to Jordan',
      subhead: 'Today\'s cheapest money transfer service might not be the cheapest tomorrow. Find the one that\'s best-suited to your needs by comparing the best performers on Remit-Scout\'s comparison engine over the past 30 days for transfers from the US to Jordan.',
      chips: ['Fact-checked', 'Neutral rankings', 'Licensed providers only'],
    },
    statsBar: [
      { label: 'Number of providers', value: '10', helper: 'USD → JOD coverage' },
      { label: 'Most often cheapest', value: 'Remitly', helper: 'Past 30 days' },
      { label: 'Pay-in options', value: 'Card, Bank, ACH', helper: 'Multiple methods' },
      { label: 'Most transferred', value: '$1,000 USD', helper: 'Common amount' },
    ],
    providerHighlights: [
      { label: 'Best rated', provider: 'Wise', score: '9.4', rate: '1 USD = 0.7105 JOD', fee: '$5.49', speed: '1-2 days', note: 'Transparent pricing', ctaLabel: 'Go to Wise' },
      { label: 'Cheapest', provider: 'Remitly', score: '9.0', rate: '1 USD = 0.7090 JOD', fee: '$0 promo', speed: 'Same day', note: 'Best for bank deposits', ctaLabel: 'Go to Remitly' },
      { label: 'Fastest', provider: 'MoneyGram', score: '8.6', rate: '1 USD = 0.7030 JOD', fee: '$4.99', speed: 'Minutes', note: 'Cash pickup', ctaLabel: 'Go to MoneyGram' },
    ],
    rateWidget: {
      midMarket: '1 USD = 0.7100 JOD',
      asOf: 'Updated 3 minutes ago',
      source: 'XE',
      changes: [{ label: '7D', value: '+0.05%' }, { label: '30D', value: '+0.10%' }, { label: '60D', value: '-0.12%' }],
    },
    table: {
      title: 'Compare providers',
      amountExample: '$1,000 USD',
      rows: [
        { provider: 'Remitly', score: '9.0', recipientGets: '709 JOD', delta: '0.4% off mid-market', fee: '$0 (promo)', rate: '1 USD = 0.7090 JOD', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'ACH, debit card', payOut: 'Bank account', notes: 'Cheapest in most checks', badge: 'Best Deal' },
        { provider: 'Wise', score: '9.4', recipientGets: '708 JOD', delta: '0.5% off mid-market', fee: '$5.49', rate: '1 USD = 0.7105 JOD', speed: '1-2 days', speedNote: 'Bank deposit', payIn: 'Bank transfer', payOut: 'Bank account', notes: 'Best transparency', badge: 'Top Rated' },
        { provider: 'MoneyGram', score: '8.6', recipientGets: '704 JOD', delta: '0.9% off mid-market', fee: '$4.99', rate: '1 USD = 0.7030 JOD', speed: 'Minutes', speedNote: 'Cash pickup', payIn: 'Debit, credit card', payOut: 'Cash pickup', notes: 'Fastest for cash' },
        { provider: 'XE', score: '8.7', recipientGets: '703 JOD', delta: '1.1% off mid-market', fee: '$0', rate: '1 USD = 0.7040 JOD', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'Bank, card', payOut: 'Bank account', notes: 'Good for large amounts' },
        { provider: 'Major US Bank', score: '6.0', recipientGets: '670 JOD', delta: '5.6% off mid-market', fee: '$30+', rate: '1 USD = 0.6700 JOD', speed: '2-5 days', speedNote: 'SWIFT', payIn: 'Bank account', payOut: 'Bank account', notes: 'High fees, slow', warning: 'Not recommended' },
      ],
    },
    insights: [
      { label: 'Providers checked', value: '10', helper: 'USD → JOD' },
      { label: 'Avg lowest cost', value: '0.5%', helper: 'On $1,000' },
      { label: 'Highest cost', value: '5.6%', helper: 'Banks' },
      { label: 'Fastest route', value: 'Minutes', helper: 'Cash pickup' },
      { label: 'Best for >$10k', value: 'XE/OFX', helper: 'Negotiated rates' },
    ],
    recommendations: [],
    steps: [
      'Compare live quotes for USD → JOD and select the cheapest total cost.',
      'Choose payout method: bank deposit (cheapest) or cash pickup (fastest).',
      'Verify your ID if requested; Jordan requires standard KYC.',
      'Fund via ACH or bank transfer for lowest fees; card if urgent.',
      'Track delivery and confirm JOD arrived.',
    ],
    faqs: [
      { q: 'What is the best way to send USD to Jordan?', a: 'Online money transfer services are typically cheaper than banks. Remitly and Wise lead for bank deposits; MoneyGram is fastest for cash pickup.' },
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup versus mid-market rate. We benchmark every quote against XE mid-market rate.' },
      { q: 'How long does a USD → JOD transfer take?', a: 'Cash pickup: minutes. Bank deposits: same-day to 1 business day. SWIFT: 2-5 days.' },
      { q: 'Are these providers licensed?', a: 'Yes. All providers listed are licensed in their operating regions. We exclude unlicensed services.' },
    ],
    miniGuides: [
      { title: 'Understanding USD/JOD Exchange Rates', excerpt: 'Learn how the mid-market rate works, what FX markup means, and how to spot hidden fees when sending USD to Jordan.', link: '/learn/how-exchange-rates-work' },
      { title: 'Bank Deposit vs Cash Pickup in Jordan', excerpt: 'Bank deposits are usually cheapest. Cash pickup is fastest but costs more. Compare total costs for both methods.', link: '/learn/cash-pickup-vs-bank-deposit' },
      { title: 'Best Time to Send Money to Jordan', excerpt: 'JOD is pegged to USD, but provider rates vary. Learn about cut-off times and how to use rate alerts.', link: '/learn/best-time-to-send-money' },
      { title: 'Avoiding Hidden Fees: US to Jordan', excerpt: 'Many banks apply 3-5% FX markup. We show you how to calculate true total cost and choose transparent services.', link: '/learn/hidden-fees-money-transfers' },
    ],
    disclosures: {
      advert: 'Some links are affiliate links. Our rankings stay neutral: cheapest total cost ranks first, even without an affiliate payout.',
      data: 'Rates shown are illustrative. Live data will show exact fees, FX markup, and timestamps per provider.',
    },
  },
  'united-states-brunei': {
    from: 'United States',
    to: 'Brunei',
    fromCode: 'usd',
    toCode: 'bnd',
    currencyPair: 'USD/BND',
    lastUpdated: '2024-11-30',
    hero: {
      kicker: 'Corridor Guide',
      title: 'Send money from the United States to Brunei',
      subhead: 'Today\'s cheapest money transfer service might not be the cheapest tomorrow. Find the one that\'s best-suited to your needs by comparing the best performers on Remit-Scout\'s comparison engine.',
      chips: ['Fact-checked', 'Neutral rankings', 'Licensed providers only'],
    },
    statsBar: [
      { label: 'Providers checked', value: '9', helper: 'USD → BND' },
      { label: 'Most often cheapest', value: 'Remitly', helper: 'Past 30 days' },
      { label: 'Popular payout', value: 'Bank deposit', helper: 'Low cost' },
      { label: 'Fastest', value: 'Minutes', helper: 'Cash pickup' },
    ],
    providerHighlights: [
      { label: 'Best rated', provider: 'Wise', score: '9.5', rate: '1 USD = 1.3592 BND', fee: '$4.99', speed: '1-2 days', note: 'Transparent pricing', ctaLabel: 'Go to Wise' },
      { label: 'Cheapest', provider: 'Remitly', score: '9.1', rate: '1 USD = 1.3550 BND', fee: '$0 promo', speed: 'Same day', note: 'Best for bank deposits', ctaLabel: 'Go to Remitly' },
      { label: 'Fastest', provider: 'WorldRemit', score: '8.9', rate: '1 USD = 1.3470 BND', fee: '$3.99', speed: 'Minutes', note: 'Cash pickup', ctaLabel: 'Go to WorldRemit' },
    ],
    rateWidget: {
      midMarket: '1 USD = 1.3600 BND',
      asOf: 'Updated 2 minutes ago',
      source: 'XE',
      changes: [{ label: '7D', value: '+0.12%' }, { label: '30D', value: '+0.35%' }, { label: '60D', value: '-0.28%' }],
    },
    table: {
      title: 'Compare providers',
      amountExample: '$1,000 USD',
      rows: [
        { provider: 'Remitly', score: '9.1', recipientGets: '1,355 BND', delta: '0.4% off mid-market', fee: '$0 (promo)', rate: '1 USD = 1.3550 BND', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'ACH, debit card', payOut: 'Bank account', notes: 'Cheapest in most checks', badge: 'Best Deal' },
        { provider: 'Wise', score: '9.5', recipientGets: '1,351 BND', delta: '0.7% off mid-market', fee: '$4.99', rate: '1 USD = 1.3592 BND', speed: '1-2 days', speedNote: 'Bank deposit', payIn: 'Bank transfer', payOut: 'Bank account', notes: 'Best transparency', badge: 'Top Rated' },
        { provider: 'WorldRemit', score: '8.9', recipientGets: '1,342 BND', delta: '1.3% off mid-market', fee: '$3.99', rate: '1 USD = 1.3470 BND', speed: 'Minutes', speedNote: 'Cash pickup', payIn: 'Debit, credit card', payOut: 'Cash pickup', notes: 'Fastest for cash' },
        { provider: 'XE', score: '8.7', recipientGets: '1,340 BND', delta: '1.5% off mid-market', fee: '$0', rate: '1 USD = 1.3490 BND', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'Bank, card', payOut: 'Bank account', notes: 'Good for large amounts' },
        { provider: 'Major US Bank', score: '6.0', recipientGets: '1,270 BND', delta: '6.6% off mid-market', fee: '$30+', rate: '1 USD = 1.3100 BND', speed: '2-5 days', speedNote: 'SWIFT', payIn: 'Bank account', payOut: 'Bank account', notes: 'High fees, slow', warning: 'Not recommended' },
      ],
    },
    insights: [
      { label: 'Providers checked', value: '9', helper: 'USD → BND' },
      { label: 'Avg lowest cost', value: '0.4%', helper: 'On $1,000' },
      { label: 'Highest cost', value: '4.5%', helper: 'Banks' },
      { label: 'Fastest route', value: 'Minutes', helper: 'Cash pickup' },
      { label: 'Best for >$10k', value: 'XE/OFX', helper: 'Negotiated rates' },
    ],
    recommendations: [],
    steps: [
      'Compare live quotes for USD → BND and pick the cheapest total cost.',
      'Choose payout: bank deposit (cheapest) or cash pickup (fastest).',
      'Verify ID if requested; Brunei requires standard KYC.',
      'Fund via ACH for lowest fee; card if urgent.',
      'Track delivery; confirm BND arrived.',
    ],
    faqs: [
      { q: 'What is the best way to send USD to Brunei?', a: 'Online transfer services are cheaper than banks. Remitly and Wise lead for bank deposits; WorldRemit is fastest for cash.' },
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup vs mid-market. We benchmark against XE.' },
      { q: 'How long does a USD → BND transfer take?', a: 'Cash pickup: minutes. Bank deposits: same-day to 1 day. SWIFT: 2-5 days.' },
      { q: 'Are these providers licensed?', a: 'Yes. All listed providers are licensed. We exclude unlicensed services.' },
    ],
    miniGuides: [
      { title: 'Understanding USD/BND Exchange Rates', excerpt: 'Learn how the Brunei Dollar rate works and how to calculate true total cost.', link: '/learn/how-exchange-rates-work' },
      { title: 'Bank Deposit vs Cash Pickup in Brunei', excerpt: 'Compare costs, speed, and convenience for both payout methods.', link: '/learn/cash-pickup-vs-bank-deposit' },
    ],
    disclosures: {
      advert: 'Some links are affiliate links. Rankings stay neutral: cheapest total cost ranks first.',
      data: 'Rates shown are illustrative. Live data will show exact fees and timestamps.',
    },
  },
}

const fallbackContent: CorridorContent = {
  from: resolveCountryName(canonicalFrom.value || 'from'),
  to: resolveCountryName(canonicalTo.value || 'to'),
  fromCode: resolveCurrency(canonicalFrom.value || '') || 'usd',
  toCode: resolveCurrency(canonicalTo.value || '') || 'xxx',
  currencyPair: [resolveCurrency(canonicalFrom.value || ''), resolveCurrency(canonicalTo.value || '')].filter(Boolean).join('/'),
  lastUpdated: new Date().toISOString().slice(0, 10),
  hero: {
    kicker: 'Corridor Guide',
    title: `Send money from ${resolveCountryName(canonicalFrom.value || 'from')} to ${resolveCountryName(canonicalTo.value || 'to')}`,
    subhead: 'We are setting up live comparisons for this corridor. Check back soon for detailed provider rankings and expert guides.',
    chips: ['Coming soon'],
  },
  statsBar: [],
  providerHighlights: [],
  rateWidget: { midMarket: '', asOf: '', source: '', changes: [] },
  table: { title: 'Coming soon', amountExample: '', rows: [] },
  insights: [],
  recommendations: [],
  steps: [],
  faqs: [],
  disclosures: { advert: 'Affiliate disclosures will appear with live data.', data: 'Live rates will populate here.' },
}

const content = computed(() => corridorContent[corridorKey.value] || fallbackContent)

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Money Transfer Comparison', path: '/send-money' },
  { name: `to ${content.value.to}`, path: `/send-money/to-${canonicalTo.value}` },
  { name: `from ${content.value.from}`, path: canonicalPath.value },
])

setSeo({
  title: `Send Money from ${content.value.from} to ${content.value.to} (${content.value.currencyPair}) | Remit-Scout`,
  description: `Compare fees, FX spreads, and delivery speed for sending money from ${content.value.from} to ${content.value.to}. ${content.value.currencyPair} corridor comparison.`,
  canonical: `${normalizedSiteUrl}${canonicalPath.value}`,
})

jsonLdBreadcrumb(breadcrumbItems.value.map(item => ({ name: item.name, url: `${normalizedSiteUrl}${item.path}` })))

if (content.value.faqs.length) {
  jsonLdFaq(content.value.faqs)
}

// ========================================
// FORM STATE (user input - changes as they type)
// ========================================
const formAmount = ref(200) // Default $200 equivalent
const formSendCurrency = ref(content.value.fromCode.toUpperCase())
const formReceiveCurrency = ref(content.value.toCode.toUpperCase())

// ========================================
// DISPLAY STATE (only updates when Compare is clicked)
// ========================================
const displayAmount = ref(200)
const displaySendCurrency = ref(content.value.fromCode.toUpperCase())
const displayReceiveCurrency = ref(content.value.toCode.toUpperCase())

// Aliases for backward compatibility in template
const amount = displayAmount
const sendCurrency = displaySendCurrency
const receiveCurrency = displayReceiveCurrency

// Available currencies based on corridor countries
const availableSendCurrencies = computed(() => {
  const fromCountry = getCountryFromSlug(canonicalFrom.value)
  const currencies = ['USD', 'EUR', 'GBP']
  if (fromCountry?.currency && !currencies.includes(fromCountry.currency)) {
    currencies.unshift(fromCountry.currency)
  }
  return currencies
})

const availableReceiveCurrencies = computed(() => {
  const toCountry = getCountryFromSlug(canonicalTo.value)
  const currencies = ['USD', 'EUR', 'GBP']
  if (toCountry?.currency && !currencies.includes(toCountry.currency)) {
    currencies.unshift(toCountry.currency)
  }
  return currencies
})

// Sample exchange rates (will come from API)
const exchangeRates: Record<string, Record<string, number>> = {
  USD: { JOD: 0.71, BND: 1.36, EUR: 0.92, GBP: 0.79, USD: 1 },
  EUR: { JOD: 0.77, BND: 1.48, USD: 1.09, GBP: 0.86, EUR: 1 },
  GBP: { JOD: 0.90, BND: 1.72, USD: 1.27, EUR: 1.16, GBP: 1 },
}

// Calculate estimated receive amount based on DISPLAY currencies (not form)
const estimatedReceive = computed(() => {
  const fromCurr = displaySendCurrency.value
  const toCurr = displayReceiveCurrency.value
  const rate = exchangeRates[fromCurr]?.[toCurr] || 1
  return (displayAmount.value * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

// Form estimated receive (for sidebar preview)
const formEstimatedReceive = computed(() => {
  const fromCurr = formSendCurrency.value
  const toCurr = formReceiveCurrency.value
  const rate = exchangeRates[fromCurr]?.[toCurr] || 1
  return (formAmount.value * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

// Handle Compare button click - updates display values
const handleCompare = () => {
  displayAmount.value = formAmount.value
  displaySendCurrency.value = formSendCurrency.value
  displayReceiveCurrency.value = formReceiveCurrency.value
}

// Corridor-specific guides - only show one main guide about the corridor
const corridorGuides = computed(() => [
  {
    emoji: flagTo.value,
    title: `Best ways to send money to ${content.value.to}`,
    excerpt: `Compare fees, exchange rates and delivery speed for ${content.value.from} to ${content.value.to} transfers.`,
    link: '/learn/best-money-transfer-services',
  },
  {
    emoji: '💰',
    title: 'Understanding hidden fees',
    excerpt: 'Banks and some providers hide costs in the exchange rate. Learn how to spot them.',
    link: '/learn/hidden-fees-money-transfers',
  },
  {
    emoji: '📊',
    title: 'How we compare providers',
    excerpt: 'Our methodology for ranking and testing money transfer services.',
    link: '/methodology',
  },
  {
    emoji: '❓',
    title: 'Common questions answered',
    excerpt: 'Everything you need to know about international money transfers.',
    link: '/faq',
  },
])

// Corridor-specific FAQs (generic answers that work for any corridor)
const corridorFaqs = computed(() => [
  {
    q: `What is the best way to send money from ${content.value.from} to ${content.value.to}?`,
    a: `Online money transfer services like Wise, Remitly, and WorldRemit are typically cheaper than banks for sending money from ${content.value.from} to ${content.value.to}. They offer better exchange rates, lower fees, and faster delivery times. We compare all options above so you can find the best deal for your specific transfer amount.`,
  },
  {
    q: `How long does a transfer from ${content.value.from} to ${content.value.to} take?`,
    a: `Transfer times vary by provider and payout method. Cash pickup is usually fastest (minutes to hours). Bank deposits typically take 1-3 business days. Traditional bank SWIFT transfers can take 3-5 business days. The comparison above shows exact delivery times for each provider.`,
  },
  {
    q: `What fees will I pay to send money to ${content.value.to}?`,
    a: `Fees consist of two parts: the transfer fee (shown upfront) and the exchange rate markup (hidden in the rate). We calculate total cost by comparing each provider's rate against the mid-market rate from XE. This shows you the true cost, not just the advertised fee.`,
  },
  {
    q: `Is it safe to use online money transfer services?`,
    a: `Yes, all providers we list are licensed and regulated by financial authorities (FinCEN in the US, FCA in the UK, ASIC in Australia). We exclude unlicensed services. Look for the licensing badges on each provider card above.`,
  },
  {
    q: `Can I send money to a bank account or for cash pickup?`,
    a: `Most providers offer both options. Bank deposits are usually cheaper but slower. Cash pickup is faster but may cost more. Some providers also offer mobile wallet deposits. Use the filters above to see options for your preferred payout method.`,
  },
  {
    q: `How do you rank the providers?`,
    a: `We rank by total cost (fee + FX markup) so the cheapest option appears first. Providers cannot pay for better placement—our rankings are 100% independent. We also show speed, reliability scores, and user ratings to help you choose.`,
  },
])
</script>
