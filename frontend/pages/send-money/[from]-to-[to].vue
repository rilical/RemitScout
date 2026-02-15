<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- Corridor Decision Header -->
    <section class="bg-neutral-900 text-white relative overflow-hidden">
      <div class="container relative py-8">
        <!-- Breadcrumb -->
        <nav class="mb-6 text-body-sm">
          <ol class="flex flex-wrap items-center gap-2">
            <li>
              <NuxtLink
                to="/"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors"
              >Home</NuxtLink>
            </li>
            <li class="text-neutral-600">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </li>
            <li>
              <NuxtLink
                to="/send-money"
                class="text-neutral-400 hover:text-white motion-safe:transition-colors"
              >Send Money</NuxtLink>
            </li>
            <li class="text-neutral-600">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </li>
            <li class="text-white font-medium" aria-current="page">
              {{ content.from }} to {{ content.to }}
            </li>
          </ol>
        </nav>

        <div class="grid gap-8 lg:grid-cols-2 lg:items-center">
          <!-- Left: Corridor Info -->
          <div>
            <!-- SR-only H1 for SEO -->
            <h1 class="sr-only">Send money from {{ content.from }} to {{ content.to }}</h1>
            
            <!-- Corridor Header -->
            <div class="flex items-center gap-6 mb-4">
              <div class="flex items-center gap-3">
                <span class="text-h1 leading-none">{{ flagFrom }}</span>
                <div>
                  <p class="text-body-sm text-white/70 mb-0.5">
                    Sending from
                  </p>
                  <span class="text-body-lg font-semibold">{{ content.from }}</span>
                </div>
              </div>
              <svg
                class="h-6 w-6 text-white/60"
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
              <div class="flex items-center gap-3">
                <span class="text-h1 leading-none">{{ flagTo }}</span>
                <div>
                  <p class="text-body-sm text-white/70 mb-0.5">
                    Receiving in
                  </p>
                  <span class="text-body-lg font-semibold">{{ content.to }}</span>
                </div>
              </div>
            </div>

            <!-- Recipient Gets -->
            <div class="mb-6 p-5 bg-brand-600 rounded-2xl border border-brand-600/20">
              <p class="text-body-sm text-white/80 font-semibold uppercase tracking-wider mb-2">
                Recipient gets (on {{ formatMoney(displayAmount, fromCurrencyCode) }})
              </p>
              <p class="text-h1 font-black tracking-tight mb-2 text-white">
                <template v-if="!hasRecipientQuotes">
                  -- <span class="text-h3 text-white/90 font-bold">{{ content.toCode.toUpperCase() }}</span>
                </template>
                <template v-else-if="isExactRecipientAmount">
                  {{ recipientRange.min }} <span class="text-h3 text-white/90 font-bold">{{ content.toCode.toUpperCase() }}</span>
                </template>
                <template v-else>
                  {{ recipientRange.min }} – {{ recipientRange.max }} <span class="text-h3 text-white/90 font-bold">{{ content.toCode.toUpperCase() }}</span>
                </template>
              </p>
              <p
                v-if="hasRecipientQuotes && !isExactRecipientAmount"
                class="text-body-sm text-white/80 leading-relaxed"
              >
                The spread shows how provider rates differ. Find the best deal below.
              </p>
            </div>

            <!-- Quick Actions -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-surface/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-surface/20 motion-safe:transition-all"
                @click="handleSave"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                Add to watchlist
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-surface/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-surface/20 motion-safe:transition-all"
                @click="handleAlert"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Set rate alert
              </button>
            </div>
          </div>

          <!-- Right: Rate Widget & Chart -->
          <div class="bg-surface rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            <!-- Rate Header -->
            <div class="p-5 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[10px] font-bold text-rs-muted uppercase tracking-wider mb-1">
                    Mid-Market Rate
                  </p>
                  <p class="text-h2 font-black text-brand-600 tracking-tight">
                    {{ content.rateWidget.midMarket }}
                  </p>
                  <p class="text-body-sm text-rs-muted mt-1">
                    The real exchange rate — anything worse costs you
                  </p>
                </div>
              </div>
            </div>

            <!-- Chart -->
            <div class="p-5">
              <div class="h-48 relative bg-gradient-to-b from-neutral-50 to-white rounded-xl border border-neutral-100 overflow-hidden">
                <!-- Chart SVG -->
                <svg
                  class="absolute inset-0 w-full h-full"
                  :viewBox="`0 0 ${chartWidth} ${chartHeight + 20}`"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient
                      id="heroChartGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stop-color="#2563eb"
                        stop-opacity="0.2"
                      />
                      <stop
                        offset="100%"
                        stop-color="#2563eb"
                        stop-opacity="0.02"
                      />
                    </linearGradient>
                    <filter
                      id="glow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur
                        stdDeviation="2"
                        result="coloredBlur"
                      />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <!-- Horizontal grid lines -->
                  <g opacity="0.5">
                    <line
                      x1="50"
                      y1="25"
                      x2="395"
                      y2="25"
                      stroke="#e2e8f0"
                      stroke-width="1"
                      stroke-dasharray="4 4"
                    />
                    <line
                      x1="50"
                      y1="55"
                      x2="395"
                      y2="55"
                      stroke="#e2e8f0"
                      stroke-width="1"
                      stroke-dasharray="4 4"
                    />
                    <line
                      x1="50"
                      y1="85"
                      x2="395"
                      y2="85"
                      stroke="#e2e8f0"
                      stroke-width="1"
                      stroke-dasharray="4 4"
                    />
                  </g>

                  <!-- Y-axis labels -->
                  <g
                    v-if="chartStats"
                    font-family="Inter, system-ui, sans-serif"
                  >
                    <!-- When data has variance, show min/avg/max -->
                    <template v-if="!chartStats?.isFlat">
                      <text
                        x="45"
                        y="28"
                        text-anchor="end"
                        fill="#64748b"
                        font-size="9"
                        font-weight="600"
                      >
                        {{ chartStats?.maxRate?.toFixed(2) ?? '' }}
                      </text>
                      <text
                        x="45"
                        y="58"
                        text-anchor="end"
                        fill="#64748b"
                        font-size="9"
                        font-weight="600"
                      >
                        {{ chartStats?.avgRate?.toFixed(2) ?? '' }}
                      </text>
                      <text
                        x="45"
                        y="88"
                        text-anchor="end"
                        fill="#64748b"
                        font-size="9"
                        font-weight="600"
                      >
                        {{ chartStats?.minRate?.toFixed(2) ?? '' }}
                      </text>
                    </template>
                    <!-- When data is flat, show padded range with current rate in middle -->
                    <template v-else>
                      <text
                        x="45"
                        y="28"
                        text-anchor="end"
                        fill="#94a3b8"
                        font-size="8"
                        font-weight="500"
                      >
                        {{ chartStats?.displayMaxRate?.toFixed(2) ?? '' }}
                      </text>
                      <text
                        x="45"
                        y="58"
                        text-anchor="end"
                        fill="#2563eb"
                        font-size="9"
                        font-weight="700"
                      >
                        {{ chartStats?.avgRate?.toFixed(2) ?? '' }}
                      </text>
                      <text
                        x="45"
                        y="88"
                        text-anchor="end"
                        fill="#94a3b8"
                        font-size="8"
                        font-weight="500"
                      >
                        {{ chartStats?.displayMinRate?.toFixed(2) ?? '' }}
                      </text>
                    </template>
                  </g>

                  <!-- Area fill -->
                  <path
                    v-if="chartAreaPath"
                    :d="chartAreaPath"
                    fill="url(#heroChartGradient)"
                  />

                  <!-- Main line -->
                  <path
                    v-if="chartLinePath"
                    :d="chartLinePath"
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    filter="url(#glow)"
                  />

                  <!-- Data points -->
                  <g v-if="chartPoints.length > 1">
                    <circle
                      v-for="(point, idx) in chartPoints.filter((_, i) => i === 0 || i === chartPoints.length - 1 || i % Math.ceil(chartPoints.length / 5) === 0)"
                      :key="`point-${idx}`"
                      :cx="point.x"
                      :cy="point.y"
                      r="3"
                      fill="white"
                      stroke="#2563eb"
                      stroke-width="2"
                    />
                  </g>

                  <!-- End point (highlighted) -->
                  <g v-if="chartEndPoint">
                    <circle
                      :cx="chartEndPoint.x"
                      :cy="chartEndPoint.y"
                      r="8"
                      fill="#2563eb"
                      opacity="0.15"
                    />
                    <circle
                      :cx="chartEndPoint.x"
                      :cy="chartEndPoint.y"
                      r="5"
                      fill="#2563eb"
                      stroke="white"
                      stroke-width="2"
                    />
                  </g>
                </svg>

                <!-- Loading/Error State -->
                <div
                  v-if="chartStatusLabel && !isSameCurrency"
                  class="absolute inset-0 flex items-center justify-center bg-neutral-50/80 backdrop-blur-sm"
                >
                  <div class="flex flex-col items-center gap-2">
                    <svg
                      v-if="rateHistoryPending"
                      class="w-6 h-6 text-neutral-400 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span class="text-body-sm text-rs-muted font-medium">{{ chartStatusLabel }}</span>
                  </div>
                </div>

                <!-- X-axis labels -->
                <div class="absolute bottom-2 left-14 right-2 flex justify-between text-[10px] text-neutral-400 font-semibold">
                  <template
                    v-for="(label, index) in chartLabels"
                    :key="index"
                  >
                    <span :class="{ 'text-neutral-600': index === chartLabels.length - 1 }">{{ label }}</span>
                  </template>
                </div>
              </div>

              <!-- Stable rate indicator -->
              <div
                v-if="chartStats?.isFlat && !isSameCurrency"
                class="mt-3 flex items-center justify-center gap-2 text-body-sm text-success-600 bg-success-600 rounded-lg py-2 px-3"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="font-medium">Rate has been stable over the past 7 days</span>
              </div>

              <!-- Chart Stats Row -->
              <div
                v-if="chartStats"
                class="mt-4 grid grid-cols-3 gap-3"
              >
                <div class="text-center p-3 bg-neutral-50 rounded-lg">
                  <p class="text-[10px] font-semibold text-rs-muted uppercase tracking-wider mb-0.5">
                    7D Low
                  </p>
                  <p class="text-body-sm font-bold text-rs-fg">
                    {{ chartStats.minRate.toFixed(4) }}
                  </p>
                </div>
                <div class="text-center p-3 bg-brand-50 rounded-lg border border-brand-100">
                  <p class="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-0.5">
                    Current
                  </p>
                  <p class="text-body-sm font-bold text-brand-700">
                    {{ (isSameCurrency ? 1.0 : latestHistoryRate)?.toFixed(4) || '—' }}
                  </p>
                </div>
                <div class="text-center p-3 bg-neutral-50 rounded-lg">
                  <p class="text-[10px] font-semibold text-rs-muted uppercase tracking-wider mb-0.5">
                    7D High
                  </p>
                  <p class="text-body-sm font-bold text-rs-fg">
                    {{ chartStats.maxRate.toFixed(4) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
              <div class="flex items-center justify-between text-body-sm">
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-600 opacity-75" />
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-success-600" />
                  </span>
                  <span class="text-neutral-600 font-medium">{{ content.rateWidget.asOf }}</span>
                </div>
                <span class="text-neutral-400">
                  Source: <span class="font-semibold text-neutral-600">{{ content.rateWidget.source }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Anchor Mini Nav -->
    <CorridorMiniNav :last-updated="mostRecentUpdateLabel" />

    <!-- ZONE A: Compare -->
    <section
      id="compare"
      class="bg-surface scroll-mt-20"
    >
      <div class="container py-8">
        <!-- Query Builder Card -->
        <div class="mb-8">
          <CorridorStickyBar
            :amount="displayAmount"
            :payout-method="payoutMethod"
            :sort-by="sortBy"
            :currency="displayCurrency"
            :from-currency="fromCurrencyCode"
            :from-country="fromCountryCode"
            :to-country="toCountryCode"
            :available-to-currencies="availableToCurrencies"
            :available-from-currencies="availableFromCurrencies"
            :available-methods="availableMethods"
            :methods-loading="isRefreshQueued && !lastKnownMethods.length"
            @update="handleBarUpdate"
            @sort="handleSort"
            @save="handleSave"
            @alert="handleAlert"
            @share="handleShare"
            @new-query="handleNewQuery"
          />
        </div>

        <!-- Refresh Gate -->
        <div
          v-if="showRefreshGate"
          class="mb-8 rounded-2xl border border-rs-border bg-surface p-8 shadow-sm"
        >
          <div class="flex flex-col items-center justify-center gap-6 text-center mx-auto">
            <div class="flex flex-col items-center justify-center mx-auto w-full max-w-2xl">
              <span class="inline-flex items-center justify-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-body-sm font-semibold text-brand-700">
                <span class="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                Live refresh
              </span>
              <h2 class="mt-4 text-h3 font-black text-rs-fg text-center">
                Collecting live quotes
              </h2>
              <div class="mt-4 w-full">
                <div class="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-brand-600 rounded-full loading-bar-animate"
                  />
                </div>
              </div>
              <p class="mt-4 text-body-sm text-neutral-600 max-w-2xl text-center mx-auto">
                We query every available provider for this corridor. Results appear together once all providers respond
                or after {{ refreshTimeoutSeconds }} seconds.
              </p>
            </div>
          </div>
        </div>

        <template v-else>
          <!-- Section Header -->
          <div
            v-if="hasApiQuotes"
            class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"
          >
            <div>
              <h2 class="text-h2 font-black text-rs-fg tracking-tight mb-2">
                Compare <span class="text-brand-600">{{ providerCount }}</span> {{ providerCount === 1 ? 'Provider' : 'Providers' }}
              </h2>
              <p class="text-body-sm text-neutral-600 max-w-xl break-words">
                Independent rankings based on total cost vs. mid-market rates, not just fees.
              </p>
            </div>
            <div
              v-if="hasApiQuotes"
              class="flex items-center gap-4"
            >
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-body-sm font-medium text-neutral-600">
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Sorted by {{ sortLabels[sortBy] }}
              </span>
              <NuxtLink
                to="/legal/how-we-make-money"
                class="text-body-sm font-semibold text-rs-muted hover:text-brand-600 motion-safe:transition-colors underline underline-offset-2"
              >
                How we rank
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="corridorUnsupported"
            class="rounded-xl border-2 border-danger-600 bg-danger-600 p-4 text-body-sm text-danger-600"
          >
            Unsupported corridor. Please try another combination.
          </div>

          <div
            v-else-if="corridorUnavailable"
            class="rounded-xl border-2 border-danger-600 bg-danger-600 p-4 text-body-sm text-danger-600"
          >
            This corridor is unavailable right now. Please try another combination.
          </div>

          <div
            v-else-if="quotesUnavailable"
            class="rounded-xl border-2 border-rs-border bg-neutral-50 p-4 text-body-sm text-neutral-700"
          >
            We’re collecting live quotes for this corridor. Hang tight or press Compare to try again.
          </div>

          <div
            v-else-if="hasApiError"
            class="rounded-xl border-2 border-warning-600 bg-warning-600 p-4 text-body-sm text-warning-600"
          >
            Live quotes are unavailable right now. Please try again shortly.
          </div>

          <div
            v-else-if="refreshTimedOut && !hasApiQuotes"
          >
            class="rounded-xl border border-rs-border bg-surface p-8"
          >
            <EmptyState
              mode="inline"
              title="This corridor looks empty right now"
              :message="`We didn't receive live quotes within ${refreshTimeoutSeconds} seconds. Try another combination of countries, amount, or method.`"
            >
              <template #actions>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 motion-safe:transition-colors disabled:opacity-60"
                  :disabled="quotesPending || quoteRefreshPending"
                  @click="handleRefreshQuotes"
                >
                  Refresh quotes
                </button>
              </template>
            </EmptyState>
          </div>

          <div
            v-else-if="content.table.rows.length"
            class="space-y-4"
            role="region"
            aria-label="Quote results"
            aria-live="polite"
            :aria-busy="(quotesPending || quoteRefreshPending) ? 'true' : 'false'"
          >
            <template
              v-for="(row, index) in enrichedProviders"
              :key="row.provider"
            >
              <div
                :id="`provider-${row.provider.toLowerCase().replace(/\s+/g, '-')}`"
                class="rounded-xl border-2 p-5 motion-safe:transition-all hover:shadow-lg"
                :class="index === 0
                  ? 'bg-brand-600 border-brand-600/20 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-white'"
              >
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <!-- Square logo container with border similar to TrueCostCard -->
                    <div class="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center flex-shrink-0 rounded-xl border border-white/20 bg-surface p-3">
                      <ProviderLogo
                        :slug="row._slug || ''"
                        :alt="row.provider"
                        size="small"
                        class="object-contain"
                      />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-1 flex-wrap">
                        <p class="text-body-lg font-bold">
                          {{ row.provider }}
                        </p>
                        <ScoreBadge
                          :score="Number.parseFloat(row.score)"
                          :clickable="true"
                          size="large"
                          @click="openScoreModal(row)"
                        />
                        <!-- Best Deal Badge (only for top option) -->
                        <span
                          v-if="index === 0"
                          class="rounded px-2 py-0.5 text-body-sm font-bold bg-surface text-brand-600"
                        >
                          Best Deal
                        </span>
                        <span
                          v-if="row.warning"
                          class="rounded bg-danger-600 px-2 py-0.5 text-body-sm font-bold text-white"
                        >
                          {{ row.warning }}
                        </span>
                      </div>
                      <div class="flex items-center gap-3">
                        <p class="text-body-sm text-white/70">
                          {{ row.speed }} · {{ row.speedNote }}
                        </p>
                        <NuxtLink
                          v-if="getProviderSlug(row)"
                          :to="`/learn/providers/${getProviderSlug(row)}`"
                          class="text-body-sm font-semibold text-white hover:text-white/80 motion-safe:transition-colors"
                        >
                          Read Review →
                        </NuxtLink>
                      </div>
                      <!-- Promotional Info -->
                      <div
                        v-if="row.hasPromo && row.promoInfo"
                        class="mt-2 flex items-center gap-2 rounded-lg bg-surface border-2 border-brand-200 px-3 py-1.5 w-full"
                      >
                        <svg
                          class="h-4 w-4 text-brand-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1013.5 8H12m-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                          />
                        </svg>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-body-sm font-semibold text-brand-700">
                            Promotional Offer
                          </span>
                          <span class="text-body-sm text-neutral-700">
                            {{ row.promoInfo.newCustomersOnly ? 'New customers only' : 'Special rate' }} ·
                            Fee: {{ formatMoney(row.promoInfo.fee, fromCurrencyCode) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="text-right">
                    <p class="text-body-sm font-medium text-white/70 mb-1">
                      Recipient gets
                    </p>
                    <p class="text-h3 font-bold">
                      {{ row.recipientGets }}
                    </p>
                    <div
                      v-if="row.fxRate && midMarketRate && Number.isFinite(row.fxRate)"
                      class="mt-4 space-y-2"
                    >
                      <div class="text-body-sm">
                        <span class="text-white/80">Exchange rate: </span>
                        <span class="font-bold text-white text-body">{{ formatRate(row.fxRate, fromCurrencyCode, toCurrencyCode) }}</span>
                      </div>
                      <div class="text-body-sm">
                        <span
                          :class="[
                            'font-bold px-3 py-1.5 rounded-md bg-surface text-body-sm',
                            getRateComparison(row.fxRate).isBetter
                              ? index === 0 ? 'text-success-600' : 'text-success-600'
                              : getRateComparison(row.fxRate).isWorse
                                ? index === 0 ? 'text-danger-600' : 'text-danger-600'
                                : 'text-neutral-700',
                          ]"
                        >
                          {{ row._rateComparison.text }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t"
                  :class="index === 0 ? 'border-white/20' : 'border-white/10'"
                >
                  <div class="lg:col-span-3">
                    <TrueCostCard
                      :upfront-fee="row._trueCost.upfrontFee"
                      :hidden-markup="row._trueCost.hiddenMarkup"
                      :total-cost="row._trueCost.totalCost"
                      :total-cost-percent="row._trueCost.totalCostPercent"
                      :spread-bps="row._trueCost.spreadBps"
                      :hidden-markup-percent="row._trueCost.hiddenMarkupPercent"
                      :amount="displayAmount"
                      :provider-rate="row.fxRate"
                      :mid-market-rate="midMarketRate"
                      :is-best="index === 0"
                      :average-cost="averageCost"
                      :worst-cost="worstCost"
                      :best-cost="bestTotalCost"
                      :currency-code="fromCurrencyCode"
                      :has-promo="row.hasPromo"
                      :promo-info="row.promoInfo"
                      :dark-background="true"
                      compact
                    />
                  </div>
                  <div class="lg:col-span-2 flex flex-col justify-between">
                    <div class="mb-3">
                      <div
                        v-if="row.methods && row.methods.length > 0"
                        class="mb-3"
                      >
                        <p class="text-body-sm font-semibold text-white/70 mb-1.5">
                          Supported:
                        </p>
                        <div class="flex flex-wrap gap-1.5">
                          <span
                            v-if="row.methods.includes('bank') || row.methods.includes('bank_deposit')"
                            class="inline-flex items-center gap-1 rounded bg-surface/20 border border-white/30 px-2 py-0.5 text-body-sm text-white"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                            /></svg>
                            Bank Deposit
                          </span>
                          <span
                            v-if="row.methods.includes('cash') || row.methods.includes('cash_pickup')"
                            class="inline-flex items-center gap-1 rounded bg-surface/20 border border-white/30 px-2 py-0.5 text-body-sm text-white"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            /></svg>
                            Cash Pickup
                          </span>
                          <span
                            v-if="row.methods.includes('wallet') || row.methods.includes('mobile_wallet')"
                            class="inline-flex items-center gap-1 rounded bg-surface/20 border border-white/30 px-2 py-0.5 text-body-sm text-white"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            /></svg>
                            Mobile Wallet
                          </span>
                          <span
                            v-if="row.methods.includes('airtime')"
                            class="inline-flex items-center gap-1 rounded bg-surface/20 border border-white/30 px-2 py-0.5 text-body-sm text-white"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8 21h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v13a2 2 0 002 2zM12 17h.01M7 5h10"
                            /></svg>
                            Airtime
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <button
                        type="button"
                        class="w-full rounded-lg px-4 py-2.5 text-body-sm font-bold motion-safe:transition-all bg-surface text-neutral-900 hover:bg-neutral-100"
                        @click="handleProviderOutbound(row)"
                      >
                        Go to {{ row.provider.split(' ')[0] }} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <AdPlacement
                v-if="!isPlus && (index + 1) % 2 === 0 && index < sortedProviders.length - 1"
                placement="compare_inline"
                :corridor-id="corridorId"
                :slot-index="Math.floor(index / 2)"
                wrapper-class="rounded-xl"
                min-height="120px"
              />
            </template>
          </div>

          <div
            v-else-if="!hasApiQuotes && !isRefreshQueued"
            class="rounded-xl border border-rs-border bg-surface p-8"
          >
            <EmptyState
              mode="inline"
              title="No live quotes yet"
              message="We're pulling fresh quotes from providers for this corridor. Please try again shortly."
            >
              <template #actions>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 motion-safe:transition-colors disabled:opacity-60"
                  :disabled="quotesPending || quoteRefreshPending"
                  @click="handleRefreshQuotes"
                >
                  Refresh quotes
                </button>
              </template>
            </EmptyState>
          </div>

          <p
            v-if="hasApiQuotes"
            class="mt-4 text-body-sm text-neutral-500"
          >
            Last updated {{ content.lastUpdated }}. We source data from providers and cannot guarantee accuracy.
            <span v-if="quotesData?.approximate && quotesData?.bucketUsed">
              Using the nearest available amount bucket: ${{ Number(quotesData.bucketUsed).toLocaleString() }}.
            </span>
          </p>
        </template>
      </div>
    </section>

    <!-- ZONE B: Insights -->
    <section
      v-if="hasApiQuotes && !shouldBlockResults"
      id="insights"
      class="bg-surface border-b border-rs-border scroll-mt-20"
    >
      <div class="container py-10">
        <div class="mb-8">
          <h2 class="text-h2 font-bold text-brand-600 mb-3">
            Corridor Insights
          </h2>
          <p class="text-body-lg text-neutral-700 max-w-3xl">
            Live data from <strong class="text-brand-600">{{ providerCount }}</strong> providers showing current market conditions.
          </p>
        </div>

        <div
          v-if="corridorIndices"
          class="mb-10"
        >
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <!-- TEER Card -->
            <div class="rounded-2xl border-2 border-neutral-800 bg-neutral-900 p-6 shadow-sm flex flex-col">
              <div class="mb-4">
                <p class="text-body-sm font-bold uppercase tracking-wider text-brand-600 mb-1">
                  TEER
                </p>
                <p class="text-body-sm font-medium text-neutral-300">
                  Total Effective Exchange Rate
                </p>
              </div>
              <p class="text-h2 font-bold text-white mb-2">
                {{ teerDisplay }}
              </p>
              <p class="text-body-sm text-neutral-400 mb-4">
                {{ indexRateUnit }}
              </p>
              <p class="text-body-sm text-neutral-300 mb-4 flex-grow">
                Real exchange rate after all fees and hidden costs. Higher is better.
              </p>
              <details class="group mt-auto">
                <summary class="cursor-pointer text-body-sm font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1">
                  <span>Learn more about TEER</span>
                  <svg
                    class="h-3 w-3 motion-safe:transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="mt-3 pt-3 border-t border-neutral-800 text-body-sm text-neutral-400 space-y-2 min-h-[77px]">
                  <p>TEER shows the effective rate you'll receive after fees and FX markups. Closer to mid-market means lower hidden costs.</p>
                  <NuxtLink
                    to="/indices-methodology#teer"
                    class="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-500"
                  >
                    Read full methodology →
                  </NuxtLink>
                </div>
              </details>
            </div>

            <!-- RVI Card -->
            <div class="rounded-2xl border-2 border-neutral-800 bg-neutral-900 p-6 shadow-sm flex flex-col">
              <div class="mb-4">
                <p class="text-body-sm font-bold uppercase tracking-wider text-brand-600 mb-1">
                  RVI (bps)
                </p>
                <p class="text-body-sm font-medium text-neutral-300">
                  Rate Volatility Index
                </p>
              </div>
              <p class="text-h2 font-bold text-white mb-2">
                {{ rviDisplay }}
              </p>
              <p class="text-body-sm text-neutral-400 mb-4">
                basis points
              </p>
              <p class="text-body-sm text-neutral-300 mb-4 flex-grow">
                How much provider rates vary. Lower means similar deals. Higher means comparing saves money.
              </p>
              <details class="group mt-auto">
                <summary class="cursor-pointer text-body-sm font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1">
                  <span>Learn more about RVI</span>
                  <svg
                    class="h-3 w-3 motion-safe:transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="mt-3 pt-3 border-t border-neutral-800 text-body-sm text-neutral-400 space-y-2 min-h-[77px]">
                  <p>RVI (bps) measures rate dispersion across providers. Low RVI means similar value, so speed or convenience may matter more. High RVI means comparison shopping matters.</p>
                  <NuxtLink
                    to="/indices-methodology#rvi"
                    class="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-500"
                  >
                    Read full methodology →
                  </NuxtLink>
                </div>
              </details>
            </div>

            <!-- RCI Card -->
            <div class="rounded-2xl border-2 border-neutral-800 bg-neutral-900 p-6 shadow-sm flex flex-col">
              <div class="mb-4">
                <p class="text-body-sm font-bold uppercase tracking-wider text-brand-600 mb-1">
                  RCI
                </p>
                <p class="text-body-sm font-medium text-neutral-300">
                  Remittance Cost Index
                </p>
              </div>
              <p class="text-h2 font-bold text-white mb-2">
                {{ rciDisplay }}
              </p>
              <p class="text-body-sm text-neutral-400 mb-4">
                of amount sent
              </p>
              <p class="text-body-sm text-neutral-300 mb-4 flex-grow">
                Average total cost including fees and hidden markups. Lower is better. Industry average is 2 to 5%.
              </p>
              <details class="group mt-auto">
                <summary class="cursor-pointer text-body-sm font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1">
                  <span>Learn more about RCI</span>
                  <svg
                    class="h-3 w-3 motion-safe:transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div class="mt-3 pt-3 border-t border-neutral-800 text-body-sm text-neutral-400 space-y-2 min-h-[77px]">
                  <p>RCI includes upfront fees and hidden FX markups. Providers can advertise $0 fees but still charge 3% through exchange rate markups.</p>
                  <NuxtLink
                    to="/indices-methodology#rci"
                    class="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-500"
                  >
                    Read full methodology →
                  </NuxtLink>
                </div>
              </details>
            </div>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-2 text-body-sm text-neutral-600">
            <span>Gold indices · $500 bank bucket · updated daily.</span>
            <span>These indices power enterprise reports and data partnerships.</span>
            <NuxtLink
              to="/partnerships"
              class="font-semibold text-brand-600 hover:text-brand-500 underline"
            >
              See partnerships →
            </NuxtLink>
          </div>
        </div>
        <div
          v-else
          class="mb-10 rounded-2xl border border-rs-border bg-neutral-50 p-5 text-body-sm text-neutral-600"
        >
          {{ indicesUnavailableMessage }}
        </div>

        <!-- Live Insights Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div class="rounded-xl border border-rs-border bg-surface p-5">
            <p class="text-body-sm font-medium text-rs-muted mb-1">
              Best Deal
            </p>
            <p class="text-body-lg font-bold text-brand-600 truncate">
              {{ content.table.rows[0]?.recipientGets || '—' }}
            </p>
            <p class="text-body-sm text-rs-muted mt-1">
              Highest recipient amount
            </p>
          </div>
          <div class="rounded-xl border border-rs-border bg-surface p-5">
            <p class="text-body-sm font-medium text-rs-muted mb-1">
              Cost Spread
            </p>
            <p class="text-h3 font-bold text-brand-600">
              {{ recipientDeltaDisplay }}
            </p>
            <p class="text-body-sm text-rs-muted mt-1">
              Best vs worst difference
            </p>
          </div>
          <div class="rounded-xl border border-rs-border bg-surface p-5">
            <p class="text-body-sm font-medium text-rs-muted mb-1">
              Fastest Speed
            </p>
            <p class="text-body-lg font-bold text-brand-600 truncate">
              {{ fastestSpeedDisplay }}
            </p>
            <p class="text-body-sm text-rs-muted mt-1">
              Quickest delivery time
            </p>
          </div>
        </div>

        <!-- Provider Comparison -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="rounded-xl border border-rs-border bg-surface p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-body font-semibold text-rs-fg">
                Upfront Fees
              </h3>
              <span class="text-body-sm text-rs-muted">Per transfer</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="row in content.table.rows.slice(0, 5)"
                :key="row.provider"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-body-sm font-medium text-neutral-700 truncate">{{ row.provider }}</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="row.hasPromo && row.promoInfo"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-body-sm font-medium bg-success-100 text-success-700"
                  >
                    Promo
                  </span>
                  <span class="text-body-sm font-semibold text-brand-600">{{ row.fee }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-rs-border bg-surface p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-body font-semibold text-rs-fg">
                Payout Methods Available
              </h3>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-body-sm">
                <span class="text-neutral-600">Bank Transfer</span>
                <span class="font-semibold text-brand-600">{{
                  currentRows.filter(r => {
                    const methods = r.methods || []
                    const payOut = (r.payOut || '').toLowerCase()
                    return methods.includes('bank')
                      || methods.includes('bank_deposit')
                      || payOut.includes('bank')
                      || payOut.includes('account')
                  }).length
                }} providers</span>
              </div>
              <div class="flex items-center justify-between text-body-sm">
                <span class="text-neutral-600">Cash Pickup</span>
                <span class="font-semibold text-brand-600">{{
                  currentRows.filter(r => {
                    const methods = r.methods || []
                    const payOut = (r.payOut || '').toLowerCase()
                    return methods.includes('cash')
                      || methods.includes('cash_pickup')
                      || payOut.includes('cash')
                  }).length
                }} providers</span>
              </div>
              <div class="flex items-center justify-between text-body-sm">
                <span class="text-neutral-600">Mobile Wallet</span>
                <span class="font-semibold text-brand-600">{{
                  currentRows.filter(r => {
                    const methods = r.methods || []
                    const payOut = (r.payOut || '').toLowerCase()
                    return methods.includes('wallet')
                      || methods.includes('mobile_wallet')
                      || payOut.includes('wallet')
                      || payOut.includes('mobile')
                  }).length
                }} providers</span>
              </div>
              <div class="flex items-center justify-between text-body-sm">
                <span class="text-neutral-600">Airtime</span>
                <span class="font-semibold text-brand-600">{{
                  currentRows.filter(r => {
                    const methods = r.methods || []
                    const payOut = (r.payOut || '').toLowerCase()
                    return methods.includes('airtime')
                      || payOut.includes('airtime')
                  }).length
                }} providers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ZONE C: Recommendations -->
    <section
      id="how-to-send"
      class="bg-neutral-50"
    >
      <div class="container py-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div>
              <h2 class="text-h2 font-bold text-neutral-900 mb-4 break-words">
                Best Money Transfer Providers<br>
                from <span class="text-brand-600">{{ content.from }}</span> to <span class="text-brand-600">{{ content.to }}</span>
              </h2>

              <p class="text-body text-neutral-700 leading-relaxed mb-6">
                Finding the best way to send money from {{ content.from }} to {{ content.to }} requires comparing exchange rates, fees, transfer speeds, and payout methods across multiple providers.
                The cheapest option today might not be the best choice tomorrow, as rates fluctuate constantly and promotional offers change regularly.
                Our recommendations below are based on live quotes from {{ providerCount }} money transfer providers, helping you find the best-rated, cheapest, and fastest options for your specific needs.
                Whether you need instant transfers or bank deposits, compare all options to ensure your recipient gets the maximum amount possible.
              </p>

              <div
                v-if="recommendations.length > 0"
                class="mb-8"
              >
                <div class="space-y-3">
                  <div
                    v-for="rec in recommendations"
                    :key="rec.label"
                    class="group flex items-start gap-4 p-5 rounded-xl border border-rs-border bg-surface hover:border-brand-400 hover:shadow-md motion-safe:transition-all cursor-pointer"
                    @click="scrollToProvider(rec.provider)"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <!-- Star icon for "best rated" (general) -->
                      <svg
                        v-if="rec.label.toLowerCase().includes('best rated') && !rec.label.toLowerCase().includes('bank')"
                        class="w-6 h-6 text-brand-600 group-hover:text-brand-700 motion-safe:transition-colors"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <!-- Credit card icon for "best rated (transfer to a bank account)" -->
                      <svg
                        v-else-if="rec.label.toLowerCase().includes('best rated') && rec.label.toLowerCase().includes('bank')"
                        class="w-6 h-6 text-brand-600 group-hover:text-brand-700 motion-safe:transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <!-- Currency/Dollar icon for "cheapest" -->
                      <svg
                        v-else-if="rec.label.toLowerCase().includes('cheapest')"
                        class="w-6 h-6 text-brand-600 group-hover:text-brand-700 motion-safe:transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <!-- Lightning bolt icon for "fastest" -->
                      <svg
                        v-else-if="rec.label.toLowerCase().includes('fastest')"
                        class="w-6 h-6 text-brand-600 group-hover:text-brand-700 motion-safe:transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <!-- Bank building icon for other bank-related -->
                      <svg
                        v-else-if="rec.label.toLowerCase().includes('bank')"
                        class="w-6 h-6 text-brand-600 group-hover:text-brand-700 motion-safe:transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <!-- Default star icon for any other case -->
                      <svg
                        v-else
                        class="w-6 h-6 text-brand-600 group-hover:text-brand-700 motion-safe:transition-colors"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-baseline gap-2 flex-wrap mb-1.5">
                        <span class="font-semibold text-neutral-900">{{ rec.label }}:</span>
                        <span class="font-bold text-brand-600 text-body-lg">{{ rec.provider }}</span>
                        <span
                          v-if="rec.score"
                          class="text-body-sm text-neutral-600 font-medium"
                        >({{ rec.score }}/10)</span>
                      </div>
                      <p
                        v-if="rec.note"
                        class="text-body-sm text-neutral-600 leading-relaxed mb-1"
                      >
                        {{ rec.note }}
                      </p>
                      <p
                        v-if="rec.speed"
                        class="text-body-sm text-neutral-500 font-medium"
                      >
                        Transfer speed: {{ rec.speed }}
                      </p>
                    </div>
                    <div class="flex-shrink-0">
                      <svg
                        class="w-5 h-5 text-neutral-400 group-hover:text-brand-600 motion-safe:transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else-if="!hasApiQuotes"
                class="mb-8"
              >
                <div class="rounded-xl border-2 border-brand-600 bg-brand-600 p-6">
                  <h4 class="text-body-lg font-bold text-white leading-relaxed mb-3">
                    Recommendations will appear here once we have live quotes from providers for this corridor.
                  </h4>
                  <p class="text-body-sm text-white leading-relaxed">
                    Please check back soon or try comparing providers in the table above.
                  </p>
                </div>
              </div>

              <!-- Related Guides Section -->
              <div class="mt-10 pt-8 border-t border-rs-border">
                <h3 class="text-h4 font-bold text-neutral-900 mb-4">
                  Learn More About Money Transfers
                </h3>
                <p class="text-body-sm text-neutral-600 mb-5 leading-relaxed">
                  Master the fundamentals of international money transfers to save more on every transaction.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NuxtLink
                    to="/learn/why-compare-before-every-transfer"
                    class="group flex items-start gap-4 p-4 rounded-xl border border-rs-border bg-surface hover:border-brand-400 hover:shadow-md motion-safe:transition-all"
                  >
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-neutral-900 mb-1.5 group-hover:text-brand-600 motion-safe:transition-colors">
                        Why You Must Compare Before Every Transfer
                      </h4>
                      <p class="text-body-sm text-neutral-600 leading-relaxed">
                        Even on the same transfer, the difference between providers can be hundreds of dollars.
                      </p>
                    </div>
                  </NuxtLink>

                  <NuxtLink
                    to="/learn/hidden-exchange-rate-fees-explained"
                    class="group flex items-start gap-4 p-4 rounded-xl border border-rs-border bg-surface hover:border-brand-400 hover:shadow-md motion-safe:transition-all"
                  >
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-neutral-900 mb-1.5 group-hover:text-brand-600 motion-safe:transition-colors">
                        Hidden Fees Explained (FX Markup vs Fee)
                      </h4>
                      <p class="text-body-sm text-neutral-600 leading-relaxed">
                        Learn the difference between FX markup and transfer fees, and why "no fee" doesn't mean no cost.
                      </p>
                    </div>
                  </NuxtLink>

                  <NuxtLink
                    to="/learn/how-to-read-remittance-quote"
                    class="group flex items-start gap-4 p-4 rounded-xl border border-rs-border bg-surface hover:border-brand-400 hover:shadow-md motion-safe:transition-all"
                  >
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-neutral-900 mb-1.5 group-hover:text-brand-600 motion-safe:transition-colors">
                        How to Read a Quote ("Recipient Gets")
                      </h4>
                      <p class="text-body-sm text-neutral-600 leading-relaxed">
                        Understand what "Recipient Gets" really means and how to compare quotes effectively.
                      </p>
                    </div>
                  </NuxtLink>

                  <NuxtLink
                    to="/learn/best-time-to-send-money"
                    class="group flex items-start gap-4 p-4 rounded-xl border border-rs-border bg-surface hover:border-brand-400 hover:shadow-md motion-safe:transition-all"
                  >
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-neutral-900 mb-1.5 group-hover:text-brand-600 motion-safe:transition-colors">
                        Best Time to Send Money
                      </h4>
                      <p class="text-body-sm text-neutral-600 leading-relaxed">
                        Practical guidance on when to send money, without over-optimizing for rate movements.
                      </p>
                    </div>
                  </NuxtLink>
                </div>
                <div class="mt-6 text-center">
                  <NuxtLink
                    to="/learn/money-transfer"
                    class="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 motion-safe:transition-colors"
                  >
                    View all guides
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div
              v-if="content.steps.length"
              class="mt-8"
            >
              <h3 class="text-body-lg font-bold text-neutral-900 mb-4">
                How to Send Money to {{ content.to }}
              </h3>
              <ol class="space-y-3">
                <li
                  v-for="(step, index) in content.steps"
                  :key="step"
                  class="flex gap-4"
                >
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-body-sm font-bold text-white flex-shrink-0">
                    {{ index + 1 }}
                  </span>
                  <p class="text-body-sm text-neutral-700 pt-0.5">
                    {{ step }}
                  </p>
                </li>
              </ol>
            </div>
          </div>

          <div class="space-y-6">
            <div class="rounded-xl border-2 border-brand-600 bg-brand-600 p-5">
              <h3 class="font-bold text-white text-body mb-3">
                Save to Watchlist
              </h3>
              <p class="text-body-sm text-white mb-4 leading-relaxed">
                Track this corridor and get notified when rates change.
              </p>
              <div class="space-y-3">
                <button
                  type="button"
                  class="w-full rounded-lg bg-surface px-4 py-3 text-body font-bold text-brand-700 hover:bg-brand-50 motion-safe:transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  @click="handleSave"
                >
                  <svg
                    class="w-5 h-5"
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
                  Add to Watchlist
                </button>
                <button
                  type="button"
                  class="w-full rounded-lg border-2 border-white bg-transparent px-4 py-3 text-body font-bold text-white hover:bg-surface hover:text-brand-700 motion-safe:transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  @click="handleAlert"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Add Alert
                </button>
              </div>
              <p class="text-body-sm text-center text-white mt-4">
                <span v-if="isPlus">
                  Plus: {{ limits.watchlistItems === 'unlimited' ? '∞' : limits.watchlistItems }} watchlist corridors · {{ limits.alerts === 'unlimited' ? '∞' : limits.alerts }} alerts
                </span>
                <span v-else>Free: {{ limits.watchlistItems }} watchlist corridors · {{ limits.alerts }} alerts</span>
              </p>
            </div>

            <AdPlacement
              v-if="!isPlus"
              placement="compare_sidebar"
              :corridor-id="corridorId"
              wrapper-class="rounded-xl"
              min-height="220px"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- FAQs -->
    <FaqSection
      id="faqs"
      title="Frequently Asked Questions"
      :subtitle="`Common questions about sending money from ${content.from} to ${content.to}.`"
      :faqs="corridorFaqsAccordion"
      section-class="bg-neutral-900"
      title-class="text-white"
      subtitle-class="text-white/80"
      hide-faq-label
      cta-class="border-2 border-white/30 bg-white text-brand-600 hover:bg-white/90 hover:border-white/50 font-semibold"
      cta-label="View all FAQs"
    />

    <!-- Ad: Interstitial -->
    <div
      v-if="!isPlus"
      class="container py-6"
    >
      <AdPlacement
        placement="corridor_interstitial"
        :corridor-id="corridorId"
        wrapper-class="rounded-xl"
        min-height="120px"
      />
    </div>

    <!-- Learn More About Transfers -->
    <section class="bg-brand-600 text-white py-16 lg:py-20">
      <div class="container">
        <div class="mx-auto max-w-4xl text-center mb-10">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-body-sm font-semibold mb-4">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Guides
          </span>
          <h2 class="text-h2 font-bold mb-3">
            Learn More About Transfers
          </h2>
          <p class="text-body-lg text-white/80 max-w-2xl mx-auto">
            Master the fundamentals of international money transfers to save more on every transaction.
          </p>
        </div>
        <div class="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink
            to="/learn/why-compare-before-every-transfer"
            class="group flex items-start gap-4 p-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 motion-safe:transition-all"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white mb-1.5">
                Why You Must Compare Before Every Transfer
              </h3>
              <p class="text-body-sm text-white/70 leading-relaxed">
                Even on the same transfer, the difference between providers can be hundreds of dollars.
              </p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/learn/hidden-exchange-rate-fees-explained"
            class="group flex items-start gap-4 p-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 motion-safe:transition-all"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white mb-1.5">
                Hidden Fees Explained (FX Markup vs Fee)
              </h3>
              <p class="text-body-sm text-white/70 leading-relaxed">
                Learn the difference between FX markup and transfer fees, and why "no fee" doesn't mean no cost.
              </p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/learn/how-to-read-remittance-quote"
            class="group flex items-start gap-4 p-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 motion-safe:transition-all"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white mb-1.5">
                How to Read a Quote ("Recipient Gets")
              </h3>
              <p class="text-body-sm text-white/70 leading-relaxed">
                Understand what "Recipient Gets" really means and how to compare quotes effectively.
              </p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/learn/best-time-to-send-money"
            class="group flex items-start gap-4 p-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 motion-safe:transition-all"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white mb-1.5">
                Best Time to Send Money
              </h3>
              <p class="text-body-sm text-white/70 leading-relaxed">
                Practical guidance on when to send money, without over-optimizing for rate movements.
              </p>
            </div>
          </NuxtLink>
        </div>
        <div class="mt-8 text-center">
          <NuxtLink
            to="/learn/money-transfer"
            class="inline-flex items-center gap-2 text-white font-semibold hover:text-white/80 motion-safe:transition-colors"
          >
            View all guides
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Ad: Below FAQ -->
    <div
      v-if="!isPlus"
      class="container py-6"
    >
      <AdPlacement
        placement="corridor_below_faq"
        :corridor-id="corridorId"
        wrapper-class="rounded-xl"
        min-height="120px"
      />
    </div>

    <!-- Provider Reviews -->
    <section
      id="providers"
      class="scroll-mt-20"
    >
      <FeaturedProvidersDynamic />
    </section>

    <!-- Ad: Footer -->
    <div
      v-if="!isPlus"
      class="container py-6"
    >
      <AdPlacement
        placement="corridor_footer"
        :corridor-id="corridorId"
        wrapper-class="rounded-xl"
        min-height="120px"
      />
    </div>

    <!-- Popular Corridors -->
    <CorridorsGridDynamic dark />

    <!-- Related Guides -->
    <section
      v-if="content.miniGuides && content.miniGuides.length"
      class="bg-surface border-t border-rs-border"
    >
      <div class="container py-10">
        <h2 class="text-h3 font-bold text-neutral-900 mb-6 text-center">
          Related Guides
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="guide in content.miniGuides"
            :key="guide.title"
            :to="guide.link"
            class="group rounded-xl border border-rs-border bg-neutral-50 p-5 hover:border-brand-300 hover:shadow-md motion-safe:transition-all"
          >
            <h3 class="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 motion-safe:transition-colors">
              {{ guide.title }}
            </h3>
            <p class="text-body-sm text-neutral-600 leading-relaxed">
              {{ guide.excerpt }}
            </p>
            <span class="inline-flex items-center gap-1 mt-3 text-body-sm font-semibold text-brand-600">
              Read guide
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Our Impact -->
    <TrustMetricsStrip bg-class="bg-brand-600" />

    <!-- Methodology Footer -->
    <section class="bg-neutral-900 text-white">
      <div class="container py-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p class="text-body-sm text-neutral-300">
              See an issue with this data? <a
                href="mailto:support@remit-scout.com"
                class="text-white hover:underline"
              >Let us know</a>
            </p>
          </div>
          <div class="flex items-center gap-6">
            <NuxtLink
              to="/methodology"
              class="text-body-sm font-semibold text-white hover:text-neutral-300 motion-safe:transition-colors"
            >
              Read our methodology →
            </NuxtLink>
            <NuxtLink
              to="/legal/how-we-make-money"
              class="text-body-sm text-neutral-400 hover:text-white motion-safe:transition-colors"
            >
              How we make money
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Provider Score Modal -->
    <ProviderScoreModal
      v-if="selectedProvider"
      v-model:is-open="scoreModalOpen"
      :provider-id="selectedProvider.providerId"
      :provider-name="selectedProvider.providerName"
      :score="selectedProvider.score"
    />

    <!-- Auth Prompt Modal -->
    <AuthPromptModal
      v-if="authModalOpen"
      :is-open="authModalOpen"
      :feature="authModalFeature"
      :title="authModalFeature === 'watchlist' ? 'Sign in to save corridors' : 'Sign in to set alerts'"
      :message="authModalFeature === 'watchlist'
        ? 'Create a free account to save this corridor to your watchlist and track rate changes.'
        : 'Create a free account to set rate alerts and get notified when rates improve.'"
      @close="authModalOpen = false"
    />

    <!-- Limit Reached Modal -->
    <LimitReachedModal
      v-if="limitModalOpen"
      :is-open="limitModalOpen"
      :feature="limitModalFeature"
      :limit="limitModalLimit"
      :current-count="limitModalCount"
      :show-upgrade="!isPlus"
      :title="limitModalFeature === 'watchlist' ? 'Watchlist limit reached' : 'Alert limit reached'"
      :message="limitMessage"
      :items="limitModalItems"
      @close="limitModalOpen = false"
      @remove="handleLimitRemove"
    />

    <!-- Share Modal -->
    <ShareModal
      v-if="shareModalOpen"
      :is-open="shareModalOpen"
      :from-country="content.from"
      :to-country="content.to"
      :amount="displayAmount"
      :currency="fromCurrencyCode"
      @close="shareModalOpen = false"
    />

    <!-- Success Toast -->
    <SuccessToast
      ref="successToastRef"
      :title="toastTitle"
      :message="toastMessage"
      :variant="toastVariant"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, watchEffect, defineAsyncComponent } from 'vue'
import { jsonLdBreadcrumb, jsonLdFaq, setSeo } from '~/composables/useSeo'
import { useStructuredData } from '~/composables/useStructuredData'
import { useRemittanceApi } from '~/composables/useRemittanceApi'
import { useApi } from '~/composables/useApi'
import AdPlacement from '~/components/ads/AdPlacement.vue'
import TrueCostCard from '~/components/shared/TrueCostCard.vue'
import ProviderDeltaBadge from '~/components/shared/ProviderDeltaBadge.vue'
import ScoreBadge from '~/components/shared/ScoreBadge.vue'
import SuccessToast from '~/components/shared/SuccessToast.vue'
import ProviderLogo from '~/components/shared/ProviderLogo.vue'
import { normalizeProviderSlug } from '~/composables/useProviderLogo'
import CorridorMiniNav from '~/components/corridor/CorridorMiniNav.vue'
import CorridorStickyBar from '~/components/corridor/CorridorStickyBar.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import CorridorsGridDynamic from '~/components/home/CorridorsGridDynamic.vue'
import FeaturedProvidersDynamic from '~/components/home/FeaturedProvidersDynamic.vue'
import FaqSection from '~/components/shared/FaqSection.vue'
import { buildTrueCostBreakdown } from '~/lib/trueCostCalculator'
import type { ProviderQuote, TrueCostBreakdown, Method } from '~/types/remit'
import { useEntitlements } from '~/composables/useEntitlements'
import { useTelemetry } from '~/composables/useTelemetry'
import { buildOutboundUrl, extractUtmParams } from '~/lib/outbound'
import { useCorridorCurrencies } from '~/composables/useCorridorCurrencies'
import { BASE_CURRENCIES } from '~/utils/countries-currencies'
import { getCorridorUrl,
  getCanonicalSlug,
  getCodeFromSlug,
  getCountryFromSlug,
  getCanonicalCorridorUrl,
  needsCanonicalRedirect } from '~/utils/country-slugs'
import { getMaxAmount, getMinAmount, sanitizeAmount } from '~/utils/currency-limits'
import { useWatchlist } from '~/composables/useWatchlist'
import { useAlerts } from '~/composables/useAlerts'
import { useAuth } from '~/composables/useAuth'
import { useMarketingAnalytics } from '~/composables/useMarketingAnalytics'
import { useSaveAlertModal } from '~/composables/useSaveAlertModal'
import { EmptyState } from '~/ui/states'

const ProviderScoreModal = defineAsyncComponent(() => import('~/components/shared/ProviderScoreModal.vue'))
const AuthPromptModal = defineAsyncComponent(() => import('~/components/shared/AuthPromptModal.vue'))
const LimitReachedModal = defineAsyncComponent(() => import('~/components/shared/LimitReachedModal.vue'))
const ShareModal = defineAsyncComponent(() => import('~/components/shared/ShareModal.vue'))

const { isPlus, limits } = useEntitlements()
const { isAuthenticated } = useAuth()
const watchlist = useWatchlist()
const alerts = useAlerts()
const saveAlertModal = useSaveAlertModal()
const { request } = useApi()
const { attachRatings, formatMoney, formatRate, getRelativeTime, useProviders } = useRemittanceApi()
const { trackClick } = useTelemetry()
const { trackSendMoneyView } = useMarketingAnalytics()
const currentRoute = useRoute()
const sendMoneyTracked = ref(false)

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
  isAffiliate?: boolean
  providerId?: string
  outboundUrl?: string | null
  affiliateUrl?: string | null
  fxRate?: number
  feeAmount?: number
  hasPromo?: boolean
  methods?: string[]
  promoInfo?: {
    fee: number
    rate: number
    headline: string
    details: string[]
    newCustomersOnly: boolean
  } | null
}

type Insight = {
  label: string
  value: string
  helper: string
}

type CorridorIndices = {
  teer: number | null
  rvi_bps: number | null
  rci: number | null
  providerCount: number
  amount: number
  midMarketRate: number | null
  weights: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  source?: 'gold'
  updatedAt?: string | null
  indicesBucket?: number
  methodProfile?: string
  suppressionFlag?: boolean
  suppressionReason?: string | null
}

type Guide = {
  title: string
  excerpt: string
  link: string
}

type RateHistoryPoint = {
  date: string
  rate: number
  bid?: number | null
  ask?: number | null
  source?: string | null
}

type RateHistoryResponse = {
  base: string
  quote: string
  history: RateHistoryPoint[]
  lastUpdated?: string | null
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
  stats?: { providerCount?: string }
}

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig?.public?.siteUrl || 'https://Remit-Scout.com'
const normalizedSiteUrl = siteUrl && typeof siteUrl === 'string' && siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : (siteUrl || 'https://Remit-Scout.com')

const normalizeSlug = (value: string | string[] | undefined) => String(value || '').toLowerCase()
const normalizeCurrencyParam = (value: string | string[] | null | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return ''
  const upper = String(raw).trim().toUpperCase()
  return /^[A-Z]{3}$/.test(upper) ? upper : ''
}

const isAllowedCurrency = (slug: string, currency: string) => {
  const country = getCountryFromSlug(slug)
  const allowed = new Set(
    [...BASE_CURRENCIES, country?.currency]
      .filter((code): code is string => Boolean(code))
      .map(code => code.toUpperCase()),
  )
  return allowed.has(currency)
}

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

const fromSlug = computed(() => normalizeSlug(currentRoute.params.from))
const toSlug = computed(() => normalizeSlug(currentRoute.params.to))
const canonicalFrom = computed(() => getCanonicalSlug(fromSlug.value))
const canonicalTo = computed(() => getCanonicalSlug(toSlug.value))
const amountParam = computed(() => (
  Array.isArray(currentRoute.query.amount) ? currentRoute.query.amount[0] : currentRoute.query.amount
))
const methodParam = computed(() => (
  Array.isArray(currentRoute.query.method) ? currentRoute.query.method[0] : currentRoute.query.method
))
const fromCurrencyParam = computed(() => (
  Array.isArray(currentRoute.query.fromCurrency)
    ? currentRoute.query.fromCurrency[0]
    : currentRoute.query.fromCurrency
))
const toCurrencyParam = computed(() => (
  Array.isArray(currentRoute.query.toCurrency)
    ? currentRoute.query.toCurrency[0]
    : currentRoute.query.toCurrency
))
const fromCurrencyOverride = computed(() => {
  const candidate = normalizeCurrencyParam(fromCurrencyParam.value)
  if (!candidate) return ''
  return isAllowedCurrency(canonicalFrom.value, candidate) ? candidate : ''
})
const toCurrencyOverride = computed(() => {
  const candidate = normalizeCurrencyParam(toCurrencyParam.value)
  if (!candidate) return ''
  return isAllowedCurrency(canonicalTo.value, candidate) ? candidate : ''
})
const fromCurrencyCode = computed(() => {
  if (fromCurrencyOverride.value) return fromCurrencyOverride.value
  const fallback = resolveCurrency(canonicalFrom.value) || 'USD'
  return fallback.toUpperCase()
})
const toCurrencyCode = computed(() => {
  if (toCurrencyOverride.value) return toCurrencyOverride.value
  const fallback = resolveCurrency(canonicalTo.value) || 'XXX'
  return fallback.toUpperCase()
})
const initialAmount = computed(() => Number(amountParam.value) || 1000)
const supportedMethods: Method[] = ['bank', 'cash', 'wallet', 'airtime']
const normalizeMethod = (value?: string | null): Method | null => {
  if (!value || typeof value !== 'string') return null
  const token = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (token === 'bank' || token === 'bank_deposit') return 'bank'
  if (token === 'cash' || token === 'cash_pickup') return 'cash'
  if (token === 'wallet' || token === 'mobile_wallet') return 'wallet'
  if (token === 'airtime') return 'airtime'
  return null
}
const initialMethod = computed(() => {
  const normalized = normalizeMethod(methodParam.value)
  return normalized && supportedMethods.includes(normalized) ? normalized : 'bank'
})
const displayAmount = ref(initialAmount.value)
const amountLimits = computed(() => ({
  minAmount: getMinAmount(fromCurrencyCode.value),
  maxAmount: getMaxAmount(fromCurrencyCode.value),
  strict: true,
}))
const payoutMethod = ref<Method>(initialMethod.value)
watch(amountParam, (value) => {
  const parsed = Number(value)
  const fallback = Number.isFinite(parsed) && parsed > 0 ? parsed : 1000
  const sanitized = sanitizeAmount(fallback, fromCurrencyCode.value, amountLimits.value)
  if (sanitized !== displayAmount.value) {
    displayAmount.value = sanitized
  }
}, { immediate: true })

watch(methodParam, (value) => {
  const normalized = normalizeMethod(value)
  const nextMethod = normalized && supportedMethods.includes(normalized) ? normalized : 'bank'
  if (nextMethod !== payoutMethod.value) {
    payoutMethod.value = nextMethod
  }
}, { immediate: true })
const searchInitiated = ref(false)
const quoteRefreshPending = ref(false)
const providersLive = ref(false)
const lastRefreshKey = ref<string | null>(null)
const refreshPollTimer = ref<number | null>(null)
const refreshAttempts = ref(0)
const refreshStatusPollTimer = ref<number | null>(null)
const refreshCompletion = ref<{ done: boolean, pending: number, total: number } | null>(null)
let refreshPollController: AbortController | null = null
let refreshStatusController: AbortController | null = null
const refreshTimedOut = ref(false)
const refreshFinalizing = ref(false)
const refreshGateStartedAt = ref<number | null>(null)
const refreshGateTimer = ref<number | null>(null)
const refreshElapsedSeconds = ref(0)
const refreshStatus = ref<{
  enqueued: boolean
  requestId: string | null
  requestIds: string[]
  providers: string[]
  requestedAt: string
} | null>(null)
const backgroundRefreshKeys = new Set<string>()
const refreshGateActive = computed(() => {
  if (refreshTimedOut.value) return false
  if (corridorUnavailable.value || corridorUnsupported.value || hasApiError.value) return false
  if (!refreshStatus.value?.enqueued) return false
  if (!refreshStatus.value.requestIds?.length) return false
  if (refreshCompletion.value?.done) return false
  return true
})
const shouldBlockResults = computed(() => {
  if (refreshTimedOut.value) return false
  if (corridorUnavailable.value || corridorUnsupported.value || hasApiError.value) return false

  const hasRefresh = Boolean(refreshStatus.value?.enqueued)
  if (hasRefresh) {
    if (refreshCompletion.value && !refreshCompletion.value.done) return true
    if (!refreshCompletion.value && !hasApiQuotes.value) return true
    if (refreshFinalizing.value) return true
    if (quotesPending.value) return true
    if (!hasApiQuotes.value) return true
  }

  if (quoteRefreshPending.value) return true
  if (providersLive.value) return true
  if (quotesPending.value && !hasApiQuotes.value) return true
  if (searchInitiated.value && !hasApiQuotes.value) return true
  return false
})
const fromCountryCode = computed(() => getCodeFromSlug(canonicalFrom.value) || canonicalFrom.value.toUpperCase())
const toCountryCode = computed(() => getCodeFromSlug(canonicalTo.value) || canonicalTo.value.toUpperCase())
const corridorKey = computed(() => `${canonicalFrom.value}-${canonicalTo.value}`)
const canonicalPath = computed(() => `/send-money/${canonicalFrom.value}-to-${canonicalTo.value}`)
const flagFrom = computed(() => resolveFlag(canonicalFrom.value))
const flagTo = computed(() => resolveFlag(canonicalTo.value))

const clampDisplayAmount = (value: number) => (
  sanitizeAmount(value, fromCurrencyCode.value, amountLimits.value)
)

watch([fromCurrencyCode, displayAmount], () => {
  const sanitized = clampDisplayAmount(displayAmount.value)
  if (sanitized !== displayAmount.value) {
    displayAmount.value = sanitized
  }
}, { immediate: true })

if (import.meta.client && needsCanonicalRedirect(fromSlug.value, toSlug.value)) {
  navigateTo(getCanonicalCorridorUrl(fromSlug.value, toSlug.value), { redirectCode: 301 })
}

const providersRequestSignal = ref<AbortSignal | undefined>(undefined)

const { data: quotesData, pending: quotesPending, error: quotesError, refresh: refreshQuotes } = await useProviders(
  fromCountryCode,
  toCountryCode,
  displayAmount,
  payoutMethod,
  {
    key: currentRoute.fullPath,
    watch: [fromCountryCode, toCountryCode, displayAmount, providersLive],
    server: true,
    lazy: false,
    fromCurrency: fromCurrencyCode,
    toCurrency: toCurrencyCode,
    live: providersLive,
    signal: providersRequestSignal,
  },
)

const toPositiveMs = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
const REFRESH_POLL_MS = toPositiveMs(runtimeConfig?.public?.b2cRefreshPollMs, 1500)
const REFRESH_STATUS_POLL_MS = toPositiveMs(runtimeConfig?.public?.b2cRefreshStatusPollMs, 750)
const REFRESH_STATUS_TIMEOUT_MS = 60000
const MAX_REFRESH_ATTEMPTS = Math.max(1, Math.ceil(REFRESH_STATUS_TIMEOUT_MS / REFRESH_POLL_MS))
const refreshTimeoutSeconds = Math.round(REFRESH_STATUS_TIMEOUT_MS / 1000)
const MAX_B2C_STALE_MS = 4 * 60 * 60 * 1000
const refreshRingRadius = 28
const refreshRingCircumference = 2 * Math.PI * refreshRingRadius
const refreshProgress = computed(() => {
  if (!shouldBlockResults.value || refreshTimeoutSeconds <= 0) return 0
  const raw = Math.round((refreshElapsedSeconds.value / refreshTimeoutSeconds) * 100)
  return Math.min(100, Math.max(0, raw))
})
const refreshRingOffset = computed(() => (
  refreshRingCircumference - (refreshRingCircumference * refreshProgress.value) / 100
))
const refreshSecondsRemaining = computed(() => (
  Math.max(0, refreshTimeoutSeconds - refreshElapsedSeconds.value)
))
const refreshQueueLabel = computed(() => {
  const pending = refreshCompletion.value?.pending
  const total = refreshCompletion.value?.total
  if (pending === undefined || total === undefined || total === 0) {
    return 'Waiting for providers to respond...'
  }
  if (pending === 0) {
    return 'Finalizing results...'
  }
  return `${pending} of ${total} providers still responding`
})

const clearRefreshPoll = () => {
  if (!import.meta.client) return
  refreshPollController?.abort()
  refreshPollController = null
  if (refreshPollTimer.value !== null) {
    window.clearTimeout(refreshPollTimer.value)
    refreshPollTimer.value = null
  }
}

const clearRefreshGateTimer = () => {
  if (!import.meta.client) return
  if (refreshGateTimer.value !== null) {
    window.clearInterval(refreshGateTimer.value)
    refreshGateTimer.value = null
  }
}

const updateRefreshElapsed = () => {
  if (!import.meta.client) return
  const startedAt = refreshStatus.value?.requestedAt
    ? Date.parse(refreshStatus.value.requestedAt)
    : refreshGateStartedAt.value
  if (!startedAt || !Number.isFinite(startedAt)) {
    refreshElapsedSeconds.value = 0
    return
  }
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  refreshElapsedSeconds.value = Math.min(refreshTimeoutSeconds, Math.max(0, elapsed))
}

const startRefreshGateTimer = () => {
  updateRefreshElapsed()
  if (refreshGateTimer.value !== null) return
  refreshGateTimer.value = window.setInterval(updateRefreshElapsed, 1000)
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
      chips: [],
    },
    statsBar: [
      { label: 'Providers', value: '10', helper: 'USD → JOD' },
      { label: 'Most often cheapest', value: 'Remitly', helper: 'Past 30 days' },
      { label: 'Pay-in options', value: 'Card, Bank, ACH', helper: 'Multiple methods' },
      { label: 'Most transferred', value: '$1,000 USD', helper: 'Common amount' },
    ],
    providerHighlights: [
      { label: 'Best rated', provider: 'Wise', score: '9.4', rate: '1 USD = 0.7105 JOD', fee: '$5.49', speed: '1-2 days', note: 'Transparent pricing', ctaLabel: 'Go to Wise' },
      { label: 'Cheapest', provider: 'Remitly', score: '9.0', rate: '1 USD = 0.7090 JOD', fee: '$0 promo', speed: 'Same day', note: 'Best for bank deposits', ctaLabel: 'Go to Remitly' },
    ],
    rateWidget: {
      midMarket: '1 USD = 0.7100 JOD',
      asOf: 'Updated 3 minutes ago',
      source: 'OANDA',
      changes: [{ label: '7D', value: '+0.05%' }, { label: '30D', value: '+0.10%' }, { label: '60D', value: '-0.12%' }],
    },
    table: {
      title: 'Compare providers',
      amountExample: '$1,000 USD',
      rows: [
        { provider: 'Remitly', score: '9.0', recipientGets: '709 JOD', delta: '0.4% off mid-market', fee: '$0 (promo)', rate: '1 USD = 0.7090 JOD', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'ACH, debit card', payOut: 'Bank account', notes: 'Cheapest in most checks', badge: 'Best Deal', isAffiliate: true },
        { provider: 'Wise', score: '9.4', recipientGets: '708 JOD', delta: '0.5% off mid-market', fee: '$5.49', rate: '1 USD = 0.7105 JOD', speed: '1-2 days', speedNote: 'Bank deposit', payIn: 'Bank transfer', payOut: 'Bank account', notes: 'Best transparency', badge: 'Top Rated', isAffiliate: true },
        { provider: 'XE', score: '8.7', recipientGets: '703 JOD', delta: '1.1% off mid-market', fee: '$0', rate: '1 USD = 0.7040 JOD', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'Bank, card', payOut: 'Bank account', notes: 'Good for large amounts', isAffiliate: true },
        { provider: 'Major US Bank', score: '6.0', recipientGets: '670 JOD', delta: '5.6% off mid-market', fee: '$30+', rate: '1 USD = 0.6700 JOD', speed: '2-5 days', speedNote: 'SWIFT', payIn: 'Bank account', payOut: 'Bank account', notes: 'High fees, slow', warning: 'Not recommended', isAffiliate: false },
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
      { q: 'What is the best way to send USD to Jordan?', a: 'Online money transfer services are typically cheaper than banks. Remitly and Wise lead for bank deposits; Xoom and Western Union are fastest for cash pickup.' },
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup versus mid-market rate. We benchmark every quote against the OANDA mid-market rate.' },
      { q: 'How long does a USD → JOD transfer take?', a: 'Cash pickup: minutes. Bank deposits: same-day to 1 business day. SWIFT: 2-5 days.' },
      { q: 'Are these providers licensed?', a: 'Yes. All providers listed are licensed in their operating regions. We exclude unlicensed services.' },
    ],
    miniGuides: [
      { title: 'Understanding USD/JOD Exchange Rates', excerpt: 'Learn how the mid-market rate works, what FX markup means, and how to spot hidden fees when sending USD to Jordan.', link: '/learn/how-exchange-rates-work' },
      { title: 'Choose the Right Delivery Method', excerpt: 'Bank deposit is usually cheapest. Cash pickup is fastest. Learn when mobile money wins, and how to pick the right payout method.', link: '/learn/choose-right-delivery-method' },
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
      chips: [],
    },
    statsBar: [
      { label: 'Providers', value: '9', helper: 'USD → BND' },
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
      source: 'OANDA',
      changes: [{ label: '7D', value: '+0.12%' }, { label: '30D', value: '+0.35%' }, { label: '60D', value: '-0.28%' }],
    },
    table: {
      title: 'Compare providers',
      amountExample: '$1,000 USD',
      rows: [
        { provider: 'Remitly', score: '9.1', recipientGets: '1,355 BND', delta: '0.4% off mid-market', fee: '$0 (promo)', rate: '1 USD = 1.3550 BND', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'ACH, debit card', payOut: 'Bank account', notes: 'Cheapest in most checks', badge: 'Best Deal', isAffiliate: true },
        { provider: 'Wise', score: '9.5', recipientGets: '1,351 BND', delta: '0.7% off mid-market', fee: '$4.99', rate: '1 USD = 1.3592 BND', speed: '1-2 days', speedNote: 'Bank deposit', payIn: 'Bank transfer', payOut: 'Bank account', notes: 'Best transparency', badge: 'Top Rated', isAffiliate: true },
        { provider: 'WorldRemit', score: '8.9', recipientGets: '1,342 BND', delta: '1.3% off mid-market', fee: '$3.99', rate: '1 USD = 1.3470 BND', speed: 'Minutes', speedNote: 'Cash pickup', payIn: 'Debit, credit card', payOut: 'Cash pickup', notes: 'Fastest for cash', isAffiliate: true },
        { provider: 'XE', score: '8.7', recipientGets: '1,340 BND', delta: '1.5% off mid-market', fee: '$0', rate: '1 USD = 1.3490 BND', speed: 'Same day', speedNote: 'Bank deposit', payIn: 'Bank, card', payOut: 'Bank account', notes: 'Good for large amounts', isAffiliate: true },
        { provider: 'Major US Bank', score: '6.0', recipientGets: '1,270 BND', delta: '6.6% off mid-market', fee: '$30+', rate: '1 USD = 1.3100 BND', speed: '2-5 days', speedNote: 'SWIFT', payIn: 'Bank account', payOut: 'Bank account', notes: 'High fees, slow', warning: 'Not recommended', isAffiliate: false },
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
      { q: 'How are fees calculated?', a: 'Total cost = transfer fee + FX markup vs mid-market. We benchmark against OANDA.' },
      { q: 'How long does a USD → BND transfer take?', a: 'Cash pickup: minutes. Bank deposits: same-day to 1 day. SWIFT: 2-5 days.' },
      { q: 'Are these providers licensed?', a: 'Yes. All listed providers are licensed. We exclude unlicensed services.' },
    ],
    miniGuides: [
      { title: 'Understanding USD/BND Exchange Rates', excerpt: 'Learn how the Brunei Dollar rate works and how to calculate true total cost.', link: '/learn/how-exchange-rates-work' },
      { title: 'Choose the Right Delivery Method', excerpt: 'Compare bank deposits, cash pickup, and mobile money to choose the best payout method for your recipient.', link: '/learn/choose-right-delivery-method' },
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
    subhead: 'Compare exchange rates vs. mid-market to see how much your recipient actually receives—not just the visible fees.',
    chips: [],
  },
  statsBar: [],
  providerHighlights: [],
  rateWidget: { midMarket: '', asOf: '', source: '', changes: [] },
  table: { title: 'Live provider comparisons', amountExample: '', rows: [] },
  insights: [],
  recommendations: [],
  steps: [],
  faqs: [],
  disclosures: { advert: 'Affiliate disclosures will appear with live data.', data: 'Live rates will populate here.' },
}

const baseContent = computed(() => corridorContent[corridorKey.value] || fallbackContent)
const providerMethodsMap = ref<Map<string, Set<Method>>>(new Map())

const lastKnownMethods = ref<Method[]>([])

watch([fromCountryCode, toCountryCode], () => {
  providerMethodsMap.value = new Map()
  lastKnownMethods.value = []
})

const availableMethods = computed<Method[]>(() => {
  const responseMethods = Array.isArray((quotesData.value as { availableMethods?: string[] } | null)?.availableMethods)
    ? (quotesData.value as { availableMethods?: string[] }).availableMethods ?? []
    : []
  const quoteMethods = (quotesData.value?.data || [])
    .flatMap(quote => (Array.isArray(quote.methods) ? quote.methods : []))
    .filter((method): method is Method => typeof method === 'string')

  const combined = new Set<Method>()
  const addMethod = (method: string) => {
    const normalized = normalizeMethod(method)
    if (normalized) combined.add(normalized)
  }
  responseMethods.forEach(addMethod)
  quoteMethods.forEach(addMethod)

  if (combined.size === 0) {
    if (lastKnownMethods.value.length) return lastKnownMethods.value
    return quotesPending.value ? [] : ['bank']
  }

  const ordered = supportedMethods.filter(method => combined.has(method))
  return ordered.length ? ordered : Array.from(combined)
})

// Update lastKnownMethods when availableMethods changes
watch(availableMethods, (methods) => {
  if (methods.length > 0) {
    lastKnownMethods.value = methods
  }
})

const providerQuotes = computed(() => {
  if (refreshGateActive.value) {
    return []
  }

  const allQuotes = (quotesData.value?.data || []) as ProviderQuote[]

  // Filter by selected payout method - only show providers that support this method
  const selectedMethod = normalizeMethod(payoutMethod.value) ?? payoutMethod.value
  const filtered = allQuotes.filter((quote) => {
    const methods = Array.isArray(quote.methods) ? quote.methods : []
    if (!methods.length) return true
    return methods.some(method => normalizeMethod(method) === selectedMethod)
  })
  return filtered.length ? filtered : allQuotes
})

// Update provider methods map when quotes change
watch(() => quotesData.value?.data, (data) => {
  const allQuotes = (data || []) as ProviderQuote[]
  
  // Update provider methods map with methods from current quotes
  // This ensures we capture all methods even if discovery hasn't completed
  allQuotes.forEach((quote) => {
    if (!quote.id) return
    if (!providerMethodsMap.value.has(quote.id)) {
      providerMethodsMap.value.set(quote.id, new Set())
    }
    // Add all methods from this quote
    if (Array.isArray(quote.methods)) {
      quote.methods.forEach((method) => {
        const normalized = normalizeMethod(method)
        if (normalized) providerMethodsMap.value.get(quote.id)!.add(normalized)
      })
    }
  })
}, { immediate: true })
const ratedQuotes = computed(() => attachRatings(providerQuotes.value) as Array<ProviderQuote & { score?: number }>)
const apiUpdatedAt = computed(() => quotesData.value?.updatedAt)
const apiUpdatedAtMs = computed(() => {
  if (!apiUpdatedAt.value) return null
  const ts = new Date(apiUpdatedAt.value).getTime()
  return Number.isFinite(ts) ? ts : null
})
const isQuoteStale = computed(() => {
  if (!apiUpdatedAtMs.value) return false
  return Date.now() - apiUpdatedAtMs.value > MAX_B2C_STALE_MS
})
const apiUpdatedLabel = computed(() => (apiUpdatedAt.value ? getRelativeTime(apiUpdatedAt.value) : ''))
type ProviderError = { code: string, message?: string }
const normalizeProviderError = (value: unknown, fallbackMessage?: string): ProviderError | null => {
  if (!value) return null
  if (typeof value === 'string') {
    return { code: value, message: fallbackMessage }
  }
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { code?: string, message?: string }
    if (typeof maybe.code === 'string') {
      return { code: maybe.code, message: maybe.message ?? fallbackMessage }
    }
  }
  return null
}
const providerError = computed<ProviderError | null>(() => {
  const payload = quotesData.value as { error?: unknown, message?: string } | null
  const inline = normalizeProviderError(payload?.error, payload?.message)
  if (inline) return inline
  const requestError = quotesError.value as { data?: { error?: string, message?: string }, message?: string } | null
  return normalizeProviderError(requestError?.data?.error, requestError?.data?.message ?? requestError?.message)
})
const corridorUnsupported = computed(() => providerError.value?.code === 'corridor_unsupported')
const corridorUnavailable = computed(() => {
  const code = providerError.value?.code
  return code === 'corridor_unavailable' || code === 'rate_unavailable' || code === 'fx_unavailable'
})
const quotesUnavailable = computed(() => providerError.value?.code === 'quotes_unavailable')
const hasApiError = computed(() => {
  if (!quotesError.value && !providerError.value) return false
  if (corridorUnavailable.value || corridorUnsupported.value || quotesUnavailable.value) return false
  return true
})
const corridorId = computed(() => `${fromCountryCode.value}-${toCountryCode.value}-${fromCurrencyCode.value}-${toCurrencyCode.value}`)
const quoteRefreshKey = computed(() => `${corridorId.value}:${displayAmount.value}:${payoutMethod.value}`)

onMounted(() => {
  if (!import.meta.client) return
  if (hasApiQuotes.value || quotesPending.value) return
  if (hasApiError.value || corridorUnavailable.value || corridorUnsupported.value || quotesUnavailable.value) return
  void refreshQuotes()
})

onUnmounted(() => {
  clearRefreshPoll()
  clearRefreshStatusPoll()
  clearRefreshGateTimer()
  providersRequestSignal.value = undefined
})

watch(availableMethods, (methods) => {
  if (quotesPending.value) return
  if (!methods.length) return
  if (!methods.includes(payoutMethod.value)) {
    payoutMethod.value = methods[0]
  }
})

watch([corridorId, displayAmount], () => {
  backgroundRefreshKeys.clear()
}, { immediate: true })

useAbortableWatch(
  [availableMethods, payoutMethod, corridorId, displayAmount],
  async ([methods, selectedMethod]: [string[], string, unknown, unknown], signal) => {
    if (!import.meta.client) return
    if (!methods.length) return
    await Promise.all(
      methods
        .filter(method => method !== selectedMethod)
        .map(method => enqueueBackgroundRefresh(method as Method, signal)),
    )
  },
  { immediate: true },
)

watch(
  corridorId,
  (value) => {
    if (!value || sendMoneyTracked.value) return
    sendMoneyTracked.value = true
    void trackSendMoneyView({ corridorId: value, pagePath: currentRoute.fullPath })
  },
  { immediate: true },
)
const historyRangeDays = 7
const shouldFetchHistory = computed(() => {
  if (fromCurrencyCode.value === toCurrencyCode.value) {
    return false
  }
  return (
    fromCurrencyCode.value.length === 3
    && toCurrencyCode.value.length === 3
    && fromCurrencyCode.value !== 'XXX'
    && toCurrencyCode.value !== 'XXX'
  )
})

const { data: rateHistoryData, pending: rateHistoryPending, error: rateHistoryError } = await useAsyncData(
  () => `rate-history-${fromCurrencyCode.value}-${toCurrencyCode.value}-${historyRangeDays}`,
  async () => {
    if (!shouldFetchHistory.value) {
      return { base: fromCurrencyCode.value, quote: toCurrencyCode.value, history: [], lastUpdated: null }
    }

    try {
      return await request<RateHistoryResponse>('/rates/history', {
        query: { base: fromCurrencyCode.value, quote: toCurrencyCode.value, days: historyRangeDays },
      })
    }
    catch (error: any) {
      useLogger('send-money').error('rate history unavailable', {
        error,
        statusCode: error?.statusCode,
        data: error?.data,
        base: fromCurrencyCode.value,
        quote: toCurrencyCode.value,
      })
      return { base: fromCurrencyCode.value, quote: toCurrencyCode.value, history: [], lastUpdated: null }
    }
  },
  { watch: [fromCurrencyCode, toCurrencyCode] },
)

const rateHistory = computed(() => {
  const history = rateHistoryData.value?.history || []
  return history
    .map(point => ({ ...point, rate: Number(point.rate) }))
    .filter(point => Number.isFinite(point.rate))
})
const rateHistoryLastUpdated = computed(() => rateHistoryData.value?.lastUpdated || null)
const rateHistorySource = computed(() => rateHistory.value[rateHistory.value.length - 1]?.source || null)
const latestHistoryRate = computed(() => {
  const last = rateHistory.value[rateHistory.value.length - 1]
  return typeof last?.rate === 'number' && Number.isFinite(last.rate) ? last.rate : null
})

const isSameCurrency = computed(() => fromCurrencyCode.value === toCurrencyCode.value)

const midMarketRate = computed(() => {
  if (isSameCurrency.value) {
    return 1.0
  }
  const rate = quotesData.value?.midMarketRate
  return typeof rate === 'number' && Number.isFinite(rate) ? rate : latestHistoryRate.value
})
const midMarketSource = computed(() => {
  if (isSameCurrency.value) {
    return 'Same currency'
  }
  return quotesData.value?.midMarketSource || rateHistorySource.value || 'OANDA'
})
const midMarketUpdatedAt = computed(() => (
  quotesData.value?.midMarketUpdatedAt
  || rateHistoryLastUpdated.value
  || quotesData.value?.updatedAt
  || null
))
const midMarketLabel = computed(() => {
  if (isSameCurrency.value) {
    return `1 ${fromCurrencyCode.value} = 1.00 ${toCurrencyCode.value}`
  }
  if (!midMarketRate.value) {
    return `1 ${fromCurrencyCode.value} = -- ${toCurrencyCode.value}`
  }
  return `1 ${fromCurrencyCode.value} = ${midMarketRate.value.toFixed(2)} ${toCurrencyCode.value}`
})
const midMarketAsOf = computed(() => {
  if (!midMarketUpdatedAt.value) return ''
  return `Updated ${getRelativeTime(midMarketUpdatedAt.value)}`
})

const mostRecentUpdate = computed(() => {
  const timestamps = [
    quotesData.value?.updatedAt,
    quotesData.value?.midMarketUpdatedAt,
    rateHistoryLastUpdated.value,
  ].filter(Boolean) as string[]

  if (timestamps.length === 0) return null

  return timestamps.reduce((latest, current) => {
    const latestTime = new Date(latest).getTime()
    const currentTime = new Date(current).getTime()
    return currentTime > latestTime ? current : latest
  })
})

const mostRecentUpdateLabel = computed(() => {
  if (!mostRecentUpdate.value) return 'just now'
  return getRelativeTime(mostRecentUpdate.value)
})

const chartWidth = 400
const chartHeight = 120
const chartPadding = 10
const chartLeftPadding = 60
const chartTopPadding = 15
const chartBottomPadding = 25

const chartPoints = computed(() => {
  if (isSameCurrency.value) {
    const points = Array.from({ length: 30 }, (_, idx) => {
      const x = chartLeftPadding + (idx / 29) * (chartWidth - chartLeftPadding - chartPadding)
      const y = chartTopPadding + 0.5 * (chartHeight - chartTopPadding - chartBottomPadding)
      return {
        x,
        y,
        rate: 1.0,
        date: new Date(Date.now() - (29 - idx) * 24 * 60 * 60 * 1000).toISOString(),
      }
    })
    return points
  }

  const history = rateHistory.value
  if (!history.length) return []
  const rates = history.map(point => point.rate)
  const minRate = Math.min(...rates)
  const maxRate = Math.max(...rates)
  const range = maxRate - minRate
  const span = history.length > 1 ? history.length - 1 : 1

  return history.map((point, idx) => {
    const normalized = range > 0 ? (point.rate - minRate) / range : 0.5
    const x = chartLeftPadding + (idx / span) * (chartWidth - chartLeftPadding - chartPadding)
    const y = chartTopPadding + (1 - normalized) * (chartHeight - chartTopPadding - chartBottomPadding)
    return {
      x,
      y,
      rate: point.rate,
      date: point.date,
    }
  })
})

// Create smooth bezier curve path
const chartLinePath = computed(() => {
  if (!chartPoints.value.length) return ''
  if (chartPoints.value.length === 1) {
    return `M ${chartPoints.value[0].x},${chartPoints.value[0].y}`
  }

  const points = chartPoints.value
  let path = `M ${points[0].x},${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const controlPoint1X = current.x + (next.x - current.x) / 3
    const controlPoint1Y = current.y
    const controlPoint2X = current.x + (next.x - current.x) * 2 / 3
    const controlPoint2Y = next.y

    path += ` C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${next.x},${next.y}`
  }

  return path
})

const chartAreaPath = computed(() => {
  if (!chartPoints.value.length) return ''
  const bottomY = chartTopPadding + (chartHeight - chartTopPadding - chartBottomPadding)

  if (chartPoints.value.length === 1) {
    const point = chartPoints.value[0]
    return `M ${point.x},${point.y} L ${point.x},${bottomY} L ${point.x},${bottomY} Z`
  }

  const points = chartPoints.value
  const first = points[0]
  const last = points[points.length - 1]

  // Use the same smooth curve path for the area
  let path = `M ${first.x},${first.y}`

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const controlPoint1X = current.x + (next.x - current.x) / 3
    const controlPoint1Y = current.y
    const controlPoint2X = current.x + (next.x - current.x) * 2 / 3
    const controlPoint2Y = next.y

    path += ` C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${next.x},${next.y}`
  }

  // Close the area
  path += ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`
  return path
})

const chartEndPoint = computed(() => {
  if (!chartPoints.value.length) return null
  return chartPoints.value[chartPoints.value.length - 1]
})

const chartStats = computed(() => {
  if (isSameCurrency.value) {
    return {
      minRate: 1.0,
      maxRate: 1.0,
      avgRate: 1.0,
      volatilityPct: 0,
      displayMinRate: 0.99,
      displayMaxRate: 1.01,
      isFlat: true,
    }
  }
  if (!rateHistory.value.length) return null

  // Only use last 7 days of data
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentHistory = rateHistory.value.filter((point) => {
    const pointDate = new Date(point.date)
    return pointDate >= sevenDaysAgo
  })

  const rates = recentHistory.length > 0
    ? recentHistory.map(point => point.rate)
    : rateHistory.value.map(point => point.rate)

  const minRate = Math.min(...rates)
  const maxRate = Math.max(...rates)
  const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / rates.length
  const stdev = Math.sqrt(variance)
  const volatilityPct = avgRate > 0 ? (stdev / avgRate) * 100 : null

  // When data is flat (no variance), add padding to Y-axis for better visualization
  const range = maxRate - minRate
  const isFlat = range < avgRate * 0.001 // Less than 0.1% variance = flat
  let displayMinRate = minRate
  let displayMaxRate = maxRate

  if (isFlat && avgRate > 0) {
    // Add ~1% padding above and below the flat line
    const padding = avgRate * 0.01
    displayMinRate = avgRate - padding
    displayMaxRate = avgRate + padding
  }

  return {
    minRate,
    maxRate,
    avgRate,
    volatilityPct,
    displayMinRate,
    displayMaxRate,
    isFlat,
  }
})

const formatChartDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const chartLabels = computed(() => {
  if (isSameCurrency.value) {
    return [`${historyRangeDays}D`, 'Now']
  }
  if (!rateHistory.value.length) {
    return [`${historyRangeDays}D`, 'Now']
  }

  // Show more intermediate dates - show start, middle points, and end
  const historyLength = rateHistory.value.length
  if (historyLength <= 2) {
    const start = formatChartDate(rateHistory.value[0].date)
    const end = formatChartDate(rateHistory.value[historyLength - 1].date)
    return [start || `${historyRangeDays}D`, end || 'Now']
  }

  // Calculate indices for evenly spaced labels
  const indices: number[] = []
  if (historyLength <= 4) {
    // For short histories, show all points
    for (let i = 0; i < historyLength; i++) {
      indices.push(i)
    }
  }
  else {
    // Show start, 1/3, 2/3, and end
    indices.push(0)
    indices.push(Math.floor(historyLength / 3))
    indices.push(Math.floor((historyLength * 2) / 3))
    indices.push(historyLength - 1)
  }

  return indices.map(i => formatChartDate(rateHistory.value[i].date))
})

const chartStatusLabel = computed(() => {
  if (isSameCurrency.value) {
    return 'Same currency — rate is always 1:1'
  }
  if (corridorUnsupported.value) {
    return 'Unsupported corridor'
  }
  if (corridorUnavailable.value) {
    return 'Unavailable corridor'
  }
  if (rateHistoryPending.value && !chartPoints.value.length) {
    return `Loading ${historyRangeDays}D history...`
  }
  if (!rateHistoryPending.value && !chartPoints.value.length) {
    const error = rateHistoryError.value as any
    if (error?.statusCode === 404 || error?.data?.error === 'rate_unavailable') {
      return 'Rate history not available (OANDA sync may be pending)'
    }
    if (error?.statusCode === 500 || error?.data?.error === 'internal_error') {
      return 'Rate history service error'
    }
    return 'No rate history yet'
  }
  return ''
})

const getRateForDaysAgo = (daysAgo: number) => {
  if (!rateHistory.value.length) return null
  const latestDate = new Date(rateHistory.value[rateHistory.value.length - 1].date)
  if (Number.isNaN(latestDate.getTime())) return null
  const targetDate = new Date(latestDate)
  targetDate.setDate(targetDate.getDate() - daysAgo)

  for (let i = rateHistory.value.length - 1; i >= 0; i -= 1) {
    const pointDate = new Date(rateHistory.value[i].date)
    if (!Number.isNaN(pointDate.getTime()) && pointDate <= targetDate) {
      return rateHistory.value[i].rate
    }
  }
  return null
}

const formatPercentChange = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const rateChanges = computed(() => {
  const latest = latestHistoryRate.value
  if (latest === null || !Number.isFinite(latest)) return []

  const changes: Array<{ label: string, value: string }> = []
  const weekRate = getRateForDaysAgo(7)
  if (Number.isFinite(weekRate ?? Number.NaN)) {
    const pct = ((latest - Number(weekRate)) / Number(weekRate)) * 100
    if (Number.isFinite(pct)) {
      changes.push({ label: '7D', value: formatPercentChange(pct) })
    }
  }
  const monthRate = getRateForDaysAgo(30)
  if (Number.isFinite(monthRate ?? Number.NaN)) {
    const pct = ((latest - Number(monthRate)) / Number(monthRate)) * 100
    if (Number.isFinite(pct)) {
      changes.push({ label: '30D', value: formatPercentChange(pct) })
    }
  }

  return changes
})

const methodLabelMap: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash pickup',
  wallet: 'Mobile wallet',
  airtime: 'Airtime',
  card: 'Card',
}

const formatMethodLabels = (methods: string[]) => methods.map(method => methodLabelMap[method] || method).join(', ')

const getRateComparison = (providerRate: number) => {
  if (!midMarketRate.value || !Number.isFinite(providerRate)) {
    return { text: '', isBetter: false, isWorse: false }
  }

  const midMarket = midMarketRate.value
  const difference = ((providerRate - midMarket) / midMarket) * 100

  if (Math.abs(difference) < 0.01) {
    return { text: 'At mid-market rate', isBetter: false, isWorse: false }
  }

  if (difference > 0) {
    return {
      text: `${difference.toFixed(2)}% better than mid-market`,
      isBetter: true,
      isWorse: false,
    }
  }
  else {
    return {
      text: `${Math.abs(difference).toFixed(2)}% worse than mid-market`,
      isBetter: false,
      isWorse: true,
    }
  }
}

const getProviderSlug = (row: TableRow): string | null => {
  if (!row.providerId && !row.provider) return null
  return normalizeProviderSlug(row.providerId || row.provider)
}

const formatDeliveryTime = (delivery: string): string => {
  if (!delivery) return 'Standard delivery'

  const lower = delivery.toLowerCase()

  if (lower.includes('minute') || lower.includes('min')) {
    const match = delivery.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:min|minute)/i)
    if (match) {
      const min = Number.parseInt(match[1])
      const max = Number.parseInt(match[2])
      if (max < 60) return `${min}–${max} min`
      if (max < 120) return `${min} min–${Math.floor(max / 60)} hr`
      return `${Math.floor(min / 60)}–${Math.floor(max / 60)} hr`
    }
    const singleMatch = delivery.match(/(\d+)\s*(?:min|minute)/i)
    if (singleMatch) {
      const val = Number.parseInt(singleMatch[1])
      if (val < 60) return `${val} min`
      return `${Math.floor(val / 60)} hr`
    }
    return 'Minutes'
  }

  if (lower.includes('hour') || lower.includes('hr')) {
    const match = delivery.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:hour|hr)/i)
    if (match) {
      const min = Number.parseInt(match[1])
      const max = Number.parseInt(match[2])
      if (max < 24) return `${min}–${max} hr`
      if (max < 48) return `${min} hr–1 day`
      return `${Math.floor(min / 24)}–${Math.floor(max / 24)} days`
    }
    const singleMatch = delivery.match(/(\d+)\s*(?:hour|hr)/i)
    if (singleMatch) {
      const val = Number.parseInt(singleMatch[1])
      if (val < 24) return `${val} hr`
      if (val < 48) return '1 day'
      return `${Math.floor(val / 24)} days`
    }
    return 'Hours'
  }

  if (lower.includes('day')) {
    const match = delivery.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*day/i)
    if (match) {
      return `${match[1]}–${match[2]} days`
    }
    const singleMatch = delivery.match(/(\d+)\s*day/i)
    if (singleMatch) {
      const val = Number.parseInt(singleMatch[1])
      return val === 1 ? '1 day' : `${val} days`
    }
    if (lower.includes('same day') || lower.includes('same-day')) return 'Same day'
    return delivery
  }

  if (lower.includes('instant') || lower.includes('immediate')) return 'Instant'
  if (lower.includes('same day') || lower.includes('same-day')) return 'Same day'

  return delivery
}

const apiRows = computed<TableRow[]>(() => {
  if (!ratedQuotes.value.length) return []

  return ratedQuotes.value.map((quote, index) => {
    const score = Number.isFinite(quote.score) ? Number(quote.score).toFixed(1) : '0.0'

    // Get all methods for this provider from the map, fallback to quote methods
    const allProviderMethods = providerMethodsMap.value.get(quote.id)
    const methodsArray = (allProviderMethods
      ? Array.from(allProviderMethods)
      : (quote.methods as string[] || []))
      .map(method => normalizeMethod(method))
      .filter((method): method is Method => Boolean(method))
    const methodsLabel = formatMethodLabels(methodsArray)

    return {
      provider: quote.name,
      providerId: quote.id,
      score,
      recipientGets: `${quote.recipientGets.toLocaleString()} ${toCurrencyCode.value}`,
      delta: `${quote.marginPct.toFixed(2)}% off mid-market`,
      fee: formatMoney(quote.fee, fromCurrencyCode.value),
      rate: formatRate(quote.fxRate, fromCurrencyCode.value, toCurrencyCode.value),
      speed: formatDeliveryTime(quote.delivery),
      speedNote: quote.bestFor || 'Standard delivery',
      payIn: methodsLabel,
      payOut: methodsLabel,
      notes: quote.whyThisRanking || quote.bestFor || '',
      badge: index === 0 ? 'Best Deal' : undefined,
      isAffiliate: quote.isAffiliate ?? Boolean(quote.affiliateUrl),
      affiliateUrl: quote.affiliateUrl ?? null,
      outboundUrl: quote.outboundUrl ?? quote.affiliateUrl ?? null,
      fxRate: quote.fxRate,
      feeAmount: quote.fee,
      hasPromo: quote.hasPromo ?? false,
      methods: methodsArray,
      promoInfo: quote.promoInfo ?? null,
    }
  })
})

const hasApiQuotes = computed(() => apiRows.value.length > 0 && !quotesError.value)

const currentRows = computed(() => hasApiQuotes.value ? apiRows.value : content.value.table.rows)

const rawIndices = computed(() => {
  return (quotesData.value as { indices?: CorridorIndices } | null)?.indices ?? null
})

const corridorIndices = computed(() => {
  const indices = rawIndices.value
  if (!indices) return null
  if (indices.suppressionFlag) return null
  return indices
})

const indicesReason = computed(() => {
  return (quotesData.value as { indicesReason?: string | null } | null)?.indicesReason ?? null
})

const indicesUnavailableMessage = computed(() => {
  if (corridorIndices.value) return ''
  const goldCount = rawIndices.value?.providerCount ?? null
  switch (indicesReason.value) {
    case 'unsupported_method':
      return 'Indices are available for bank transfers only.'
    case 'bucket_mismatch':
      return 'Indices are available for $500 bank transfers only.'
    case 'gold_indices_unavailable':
      return 'Indices are not yet available for this corridor. The Gold indices job may not have run yet.'
    case 'suppressed':
    case 'insufficient_coverage':
      return 'Indices are temporarily unavailable due to insufficient coverage.'
    case 'insufficient_providers':
      return goldCount !== null
        ? `Gold indices found ${goldCount} eligible B2B provider(s) for this corridor — at least 3 are required. The page may show more providers because indices use B2B quotes at the $500 bank bucket only.`
        : 'Indices require at least 3 eligible B2B providers for this corridor at the $500 bank bucket.'
    case 'quotes_unavailable':
      return 'Indices are not yet available for this corridor.'
    default:
      return 'Indices are not available for this corridor.'
  }
})

const formatIndexRate = (value: number | null) => {
  if (!Number.isFinite(value ?? Number.NaN)) return '—'
  return Number(value).toFixed(2)
}

const formatIndexPercent = (value: number | null) => {
  if (!Number.isFinite(value ?? Number.NaN)) return '—'
  return `${(Number(value) * 100).toFixed(2)}%`
}

const indexRateUnit = computed(() => {
  if (!fromCurrencyCode.value || !toCurrencyCode.value) return ''
  return `${toCurrencyCode.value} per ${fromCurrencyCode.value}`
})

const teerDisplay = computed(() => formatIndexRate(corridorIndices.value?.teer ?? null))
const formatIndexBps = (value: number | null) => {
  if (!Number.isFinite(value ?? Number.NaN)) return '—'
  return `${Math.round(Number(value))}`
}

const rviDisplay = computed(() => formatIndexBps(corridorIndices.value?.rvi_bps ?? null))
const rciDisplay = computed(() => formatIndexPercent(corridorIndices.value?.rci ?? null))

const content = computed(() => {
  const base = baseContent.value
  const merged = {
    ...base,
    fromCode: fromCurrencyCode.value || base.fromCode,
    toCode: toCurrencyCode.value || base.toCode,
  }
  const rateWidget = {
    ...merged.rateWidget,
    midMarket: midMarketLabel.value || merged.rateWidget.midMarket,
    asOf: mostRecentUpdate.value ? `Updated ${mostRecentUpdateLabel.value}` : (midMarketAsOf.value || apiUpdatedLabel.value || merged.rateWidget.asOf),
    source: midMarketSource.value || merged.rateWidget.source || 'OANDA',
    changes: rateChanges.value.length ? rateChanges.value : merged.rateWidget.changes,
  }
  const tableRows = hasApiQuotes.value ? apiRows.value : []
  return {
    ...merged,
    lastUpdated: mostRecentUpdateLabel.value || apiUpdatedLabel.value || merged.lastUpdated,
    table: {
      ...merged.table,
      rows: tableRows,
    },
    stats: {
      ...merged.stats,
      providerCount: String(tableRows.length),
    },
    rateWidget,
  }
})

const escapeHtml = (value: string) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const defaultCorridorFaqs = computed<Array<{ q: string, a: string }>>(() => ([
  {
    q: `What is the best way to send money from ${content.value.from} to ${content.value.to}?`,
    a: `Online money transfer services like Wise, Remitly, and WorldRemit usually cost less than banks when sending money from ${content.value.from} to ${content.value.to}. They often have better exchange rates, lower fees, and faster delivery. Use our comparison tool above to find the best option for your transfer amount.`,
  },
  {
    q: `How long does a transfer from ${content.value.from} to ${content.value.to} take?`,
    a: 'Delivery time depends on the provider and how your recipient gets the money. Cash pickup can be available within minutes or hours. Bank deposits often take 1 to 3 business days. Traditional bank transfers through SWIFT can take 3 to 5 business days. Check the comparison table above for provider-specific delivery times.',
  },
  {
    q: `What fees will I pay to send money to ${content.value.to}?`,
    a: 'The total cost has two parts: the upfront transfer fee, plus the exchange rate markup hidden in the rate. We calculate total cost by comparing each provider\'s rate to the mid-market rate, so you can see what you actually pay.',
  },
  {
    q: 'Is it safe to use online money transfer services?',
    a: 'Generally yes, as long as you use a licensed provider. We list providers that hold licenses from financial regulators in the markets they operate in, and we exclude unlicensed services. Always verify the provider details before sending.',
  },
  {
    q: 'How do you rank the providers?',
    a: 'We rank providers based on total cost (fees plus exchange-rate markup), then show transfer speed and other details to help you decide. Providers cannot pay to rank higher. Rankings are based on the data we collect and our methodology.',
  },
]))

const corridorFaqsRaw = computed<Array<{ q: string, a: string }>>(() => {
  const contentFaqs = content.value.faqs || []
  return contentFaqs.length ? contentFaqs : defaultCorridorFaqs.value
})

const corridorFaqsAccordion = computed(() => (
  corridorFaqsRaw.value.map(item => ({
    question: item.q,
    answer: `<p>${escapeHtml(item.a)}</p>`,
  }))
))

const breadcrumbItems = computed(() => [
  { name: 'Home', path: '/' },
  { name: 'Money Transfer Comparison', path: '/send-money' },
  { name: `From ${content.value.from} to ${content.value.to}`, path: canonicalPath.value },
])

const providerCount = computed(() => content.value.table.rows.length || 0)
const bestQuote = computed(() => {
  if (!providerQuotes.value.length) return null
  return [...providerQuotes.value].sort((a, b) => b.recipientGets - a.recipientGets)[0]
})
const topProviders = computed(() => {
  if (providerQuotes.value.length) {
    return providerQuotes.value.slice(0, 2).map(p => p.name).join(' and ')
  }
  return content.value.table.rows.slice(0, 2).map(p => p.provider).join(' and ')
})
const bestRateLabel = computed(() => {
  if (!bestQuote.value) return ''
  const fxRate = Number(bestQuote.value.fxRate)
  if (!Number.isFinite(fxRate)) return ''
  return `1 ${fromCurrencyCode.value} = ${fxRate.toFixed(4)} ${toCurrencyCode.value}`
})
const seoUpdatedLabel = computed(() => apiUpdatedLabel.value || 'today')
const seoTitle = computed(() => `Today's Best ${fromCurrencyCode.value} to ${toCurrencyCode.value} Rates | Remit-Scout`)
const seoDescription = computed(() => {
  const providerLine = topProviders.value ? ` including ${topProviders.value}` : ''
  const rateLine = bestRateLabel.value ? ` Best rate: ${bestRateLabel.value}.` : ''
  return `Compare ${providerCount.value} providers${providerLine}.${rateLine} Updated ${seoUpdatedLabel.value}.`
})

defineOgImage({
  component: 'OgImageCorridor',
  props: {
    from: computed(() => content.value.from),
    to: computed(() => content.value.to),
    providerCount,
    bestRate: computed(() => bestRateLabel.value || '—'),
  },
})

type Recommendation = {
  label: string
  provider: string
  score?: string
  note?: string
  speed?: string
}

function parseSpeedToHours(speed: string): number {
  const lower = speed.toLowerCase()
  if (lower.includes('instant') || lower.includes('immediate')) return 0
  if (lower.includes('minute')) {
    const match = speed.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*min/i)
    if (match) return (Number.parseInt(match[1]) + Number.parseInt(match[2])) / 120
    const singleMatch = speed.match(/(\d+)\s*min/i)
    if (singleMatch) return Number.parseInt(singleMatch[1]) / 60
    return 0.5
  }
  if (lower.includes('hour') || lower.includes('hr')) {
    const match = speed.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:hour|hr)/i)
    if (match) return (Number.parseInt(match[1]) + Number.parseInt(match[2])) / 2
    const singleMatch = speed.match(/(\d+)\s*(?:hour|hr)/i)
    if (singleMatch) return Number.parseInt(singleMatch[1])
    return 1
  }
  if (lower.includes('same day') || lower.includes('same-day')) return 8
  if (lower.includes('day')) {
    const match = speed.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*day/i)
    if (match) return (Number.parseInt(match[1]) + Number.parseInt(match[2])) * 12
    const singleMatch = speed.match(/(\d+)\s*day/i)
    if (singleMatch) return Number.parseInt(singleMatch[1]) * 24
    return 24
  }
  return 999
}

const recommendations = computed<Recommendation[]>(() => {
  const rows = hasApiQuotes.value ? apiRows.value : content.value.table.rows
  if (!rows.length) return []

  const results: Recommendation[] = []

  const allRows = rows as Array<TableRow & { methods?: Method[] }>

  const bestRated = [...allRows].sort((a, b) => {
    const scoreA = Number.parseFloat(a.score || '0')
    const scoreB = Number.parseFloat(b.score || '0')
    return scoreB - scoreA
  })[0]

  if (bestRated && bestRated.score) {
    results.push({
      label: 'The best rated',
      provider: bestRated.provider,
      score: bestRated.score,
      note: bestRated.notes || bestRated.speedNote,
    })
  }

  const cheapest = [...allRows].filter(row => row.recipientGets).sort((a, b) => {
    const amountA = Number.parseFloat(a.recipientGets.replace(/[^\d.]/g, '')) || 0
    const amountB = Number.parseFloat(b.recipientGets.replace(/[^\d.]/g, '')) || 0
    return amountB - amountA
  })[0]

  if (cheapest) {
    results.push({
      label: 'The cheapest',
      provider: cheapest.provider,
      score: cheapest.score,
      note: cheapest.notes || cheapest.speedNote,
    })
  }

  const fastest = [...allRows].sort((a, b) => {
    const hoursA = parseSpeedToHours(a.speed)
    const hoursB = parseSpeedToHours(b.speed)
    return hoursA - hoursB
  })[0]

  if (fastest) {
    results.push({
      label: 'The fastest',
      provider: fastest.provider,
      speed: fastest.speed,
      note: fastest.notes || fastest.speedNote,
    })
  }

  const bankRows = allRows.filter((row) => {
    if (row.methods && Array.isArray(row.methods)) {
      return row.methods.includes('bank')
    }
    const payOutLower = (row.payOut || '').toLowerCase()
    return payOutLower.includes('bank') || payOutLower.includes('account')
  })

  if (bankRows.length > 0) {
    const bestRatedBank = [...bankRows].sort((a, b) => {
      const scoreA = Number.parseFloat(a.score || '0')
      const scoreB = Number.parseFloat(b.score || '0')
      return scoreB - scoreA
    })[0]

    if (bestRatedBank && bestRatedBank.score) {
      results.push({
        label: 'The best rated (transfer to a bank account)',
        provider: bestRatedBank.provider,
        score: bestRatedBank.score,
        note: bestRatedBank.notes || bestRatedBank.speedNote,
      })
    }

    const cheapestBank = [...bankRows].filter(row => row.recipientGets).sort((a, b) => {
      const amountA = Number.parseFloat(a.recipientGets.replace(/[^\d.]/g, '')) || 0
      const amountB = Number.parseFloat(b.recipientGets.replace(/[^\d.]/g, '')) || 0
      return amountB - amountA
    })[0]

    if (cheapestBank) {
      results.push({
        label: 'The cheapest (transfer to a bank account)',
        provider: cheapestBank.provider,
        score: cheapestBank.score,
        note: cheapestBank.notes || cheapestBank.speedNote,
      })
    }
  }

  return results
})

const scrollToProvider = (providerName: string) => {
  if (typeof window === 'undefined') return
  
  // Try to scroll to the specific provider element
  const providerSlug = providerName.toLowerCase().replace(/\s+/g, '-')
  const providerElement = document.getElementById(`provider-${providerSlug}`)
  
  if (providerElement) {
    const offset = 120
    const top = providerElement.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
    return
  }
  
  // Fallback to compare section
  const compareSection = document.getElementById('compare')
  if (compareSection) {
    const offset = 120
    const top = compareSection.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const handleProviderOutbound = async (row: TableRow) => {
  const targetUrl = row.outboundUrl ?? row.affiliateUrl
  if (!targetUrl || typeof window === 'undefined') return

  if (row.providerId) {
    void trackClick({
      provider_id: row.providerId,
      corridor_id: quotesData.value?.corridor || corridorKey.value,
      target_url: targetUrl,
      quoted_rate: row.fxRate,
      quoted_fee: row.feeAmount,
      is_affiliate: row.isAffiliate ?? false,
    })
  }

  const providerId = row.providerId || row.provider
  const { payin, payout } = getQuoteRefreshMethods(payoutMethod.value)
  const outboundUrl = buildOutboundUrl({
    providerId,
    targetUrl,
    corridorId: quotesData.value?.corridor || corridorKey.value,
    amount: displayAmount.value,
    payin,
    payout,
    quotedRate: row.fxRate,
    quotedFee: row.feeAmount,
    isAffiliate: row.isAffiliate ?? Boolean(row.affiliateUrl),
    from: fromCountryCode.value,
    to: toCountryCode.value,
    fromCurrency: fromCurrencyCode.value,
    toCurrency: toCurrencyCode.value,
    source: 'send-money-compare',
    utm: extractUtmParams(currentRoute.query as Record<string, unknown>),
  })

  window.open(outboundUrl, '_blank', 'noopener,noreferrer')
}

const corridorSchemaProviders = computed(() => {
  const rows = content.value.table.rows || []
  const seen = new Set<string>()
  const providers: Array<{ name: string, slug: string }> = []

  for (const row of rows) {
    const name = row.provider
    if (!name || seen.has(name)) continue
    seen.add(name)
    providers.push({ name, slug: normalizeProviderSlug(name) })
  }

  return providers
})

defineOgImage({
  component: 'OgImageCorridor',
  props: {
    from: fromCountryCode,
    to: toCountryCode,
    providerCount,
    bestRate: bestRateLabel,
  },
})

useServerSeoMeta({
  title: seoTitle,
  description: seoDescription,
})

setSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  canonical: `${normalizedSiteUrl}${canonicalPath.value}`,
  ogImage: false,
})

jsonLdBreadcrumb(breadcrumbItems.value.map(item => ({ name: item.name, url: `${normalizedSiteUrl}${item.path}` })))

if (corridorFaqsRaw.value.length) {
  jsonLdFaq(corridorFaqsRaw.value)
}

// Add FinancialProduct schema for the best quote
const { addFinancialProductSchema, addRemittanceCorridorSchema } = useStructuredData()

watchEffect(() => {
  if (!providerCount.value) return
  if (!bestRateLabel.value) return

  addRemittanceCorridorSchema({
    from: content.value.from,
    to: content.value.to,
    providers: corridorSchemaProviders.value,
    bestRate: bestRateLabel.value,
  })
})

if (bestQuote.value && hasApiQuotes.value) {
  const quote = bestQuote.value
  addFinancialProductSchema({
    name: `Money Transfer from ${content.value.from} to ${content.value.to}`,
    description: `Send ${displayAmount.value} ${fromCurrencyCode.value} to ${content.value.to} with ${quote.name}. Get ${quote.recipientGets.toFixed(2)} ${toCurrencyCode.value} in return.`,
    url: `${normalizedSiteUrl}${canonicalPath.value}`,
    provider: quote.name,
    exchangeRate: bestRateLabel.value,
    fees: quote.feeAmount ? `${formatMoney(quote.feeAmount, fromCurrencyCode.value)}` : undefined,
    deliveryTime: quote.speed || undefined,
    currency: fromCurrencyCode.value,
    amount: String(displayAmount.value),
  })
}

const displayCurrency = ref(toCurrencyCode.value)

watch(toCurrencyCode, (value) => {
  if (value && value !== displayCurrency.value) {
    displayCurrency.value = value
  }
})
const sortBy = ref('recipient')

const sortLabels: Record<string, string> = {
  'recipient': 'recipient gets',
  'cost': 'total cost',
  'fees': 'lowest fees',
  'remit-score': 'remit-score',
}

const isQuotesLoading = computed(() => quotesPending.value && !hasApiQuotes.value)

const sortedProviders = computed(() => {
  const rows = [...content.value.table.rows]
  if (sortBy.value === 'cost') {
    return rows.sort((a, b) => getProviderTrueCost(a, 0).totalCost - getProviderTrueCost(b, 0).totalCost)
  }
  if (sortBy.value === 'fees') {
    return rows.sort((a, b) => {
      const feeA = getProviderTrueCost(a, 0).upfrontFee
      const feeB = getProviderTrueCost(b, 0).upfrontFee
      return feeA - feeB
    })
  }
  if (sortBy.value === 'remit-score') {
    return rows.sort((a, b) => Number.parseFloat(b.score) - Number.parseFloat(a.score))
  }
  return rows
})

// Pre-compute expensive row data to avoid repeated calculations in template
type EnrichedTableRow = TableRow & {
  _trueCost: TrueCostBreakdown
  _rateComparison: { text: string, isBetter: boolean, isWorse: boolean }
  _slug: string | null
}

const enrichedProviders = computed<EnrichedTableRow[]>(() => {
  return sortedProviders.value.map((row, index) => ({
    ...row,
    _trueCost: getProviderTrueCost(row, index),
    _rateComparison: getRateComparison(row.fxRate ?? 0),
    _slug: getProviderSlug(row),
  }))
})

const recipientRange = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length) return { min: '0', max: '0', minNum: 0, maxNum: 0 }
  const amounts = rows
    .map((r) => {
      if (!r.recipientGets) return null
      const num = Number.parseFloat(r.recipientGets.replace(/[^0-9.]/g, ''))
      return Number.isFinite(num) && num > 0 ? num : null
    })
    .filter((num): num is number => num !== null)

  if (!amounts.length) return { min: '0', max: '0', minNum: 0, maxNum: 0 }

  const minNum = Math.min(...amounts)
  const maxNum = Math.max(...amounts)
  return {
    min: minNum.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    max: maxNum.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    minNum,
    maxNum,
  }
})

const hasRecipientQuotes = computed(() => content.value.table.rows.length > 0)

const isExactRecipientAmount = computed(() => {
  return hasRecipientQuotes.value && recipientRange.value.minNum === recipientRange.value.maxNum
})

const corridorWatchTarget = computed(() => ({
  type: 'corridor' as const,
  from: fromCountryCode.value,
  to: toCountryCode.value,
  method: payoutMethod.value,
}))

const corridorWatchLabel = computed(() => `${content.value.from}→${content.value.to} • ${payoutMethod.value}`)

const bestTotalCost = computed(() => {
  const midMarket = midMarketRate.value
  if (!midMarket) return 0
  const costs = content.value.table.rows
    .map((row) => {
      // Use promo fee/rate if available, otherwise use regular fee/rate (same logic as getProviderTrueCost)
      const promo = row.promoInfo ?? null
      const hasPromo = Boolean(row.hasPromo && promo)
      const providerRate = hasPromo && Number.isFinite(promo?.rate)
        ? Number(promo?.rate)
        : Number.isFinite(row.fxRate ?? Number.NaN) ? Number(row.fxRate) : 0
      const upfrontFee = hasPromo && Number.isFinite(promo?.fee)
        ? Number(promo?.fee)
        : Number.isFinite(row.feeAmount ?? Number.NaN) ? Number(row.feeAmount) : 0

      if (!Number.isFinite(providerRate) || providerRate === 0) return null

      return buildTrueCostBreakdown(
        displayAmount.value,
        upfrontFee,
        midMarket,
        providerRate,
        0, // Don't pass bestTotalCost here to avoid circular dependency
      ).totalCost
    })
    .filter((value): value is number => value !== null)

  return costs.length ? Math.min(...costs) : 0
})

// Calculate average and worst costs for relative comparison
const providerCosts = computed(() => {
  return sortedProviders.value.map(row => getProviderTrueCost(row, 0).totalCost)
})

const averageCost = computed(() => {
  const costs = providerCosts.value
  if (costs.length === 0) return 0
  const sum = costs.reduce((a, b) => a + b, 0)
  return sum / costs.length
})

const worstCost = computed(() => {
  const costs = providerCosts.value
  if (costs.length === 0) return 0
  return Math.max(...costs)
})

const costSpread = computed(() => {
  if (providerCosts.value.length === 0) return '—'
  const best = Math.min(...providerCosts.value)
  const worst = Math.max(...providerCosts.value)
  const spread = worst - best
  if (spread === 0) return '$0'
  return `$${spread.toFixed(2)}`
})

const averageCostPercent = computed(() => {
  if (!corridorIndices.value?.rci) {
    if (providerCosts.value.length === 0) return '—'
    const avg = averageCost.value / displayAmount.value * 100
    return `${avg.toFixed(2)}%`
  }
  return rciDisplay.value
})

const bestProviderName = computed(() => {
  if (sortedProviders.value.length === 0) return '—'
  return sortedProviders.value[0]?.provider || '—'
})

const providerConsistency = computed(() => {
  const rviBps = corridorIndices.value?.rvi_bps
  if (!rviBps || !Number.isFinite(rviBps)) return 'unknown'
  const rviValue = Number(rviBps)
  if (rviValue < 50) return 'high'
  return 'low'
})

const costSavingsPotential = computed(() => {
  if (providerCosts.value.length < 2) return '$0'
  const best = Math.min(...providerCosts.value)
  const worst = Math.max(...providerCosts.value)
  const savings = worst - best
  if (savings <= 0) return '$0'
  return `$${savings.toFixed(2)}`
})

const recipientDeltaDisplay = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length || !hasRecipientQuotes.value || !recipientRange.value) return '—'
  const delta = recipientRange.value.maxNum - recipientRange.value.minNum
  if (delta <= 0 || !Number.isFinite(delta) || isNaN(delta)) return '—'
  const currencyCode = toCurrencyCode.value?.toUpperCase() || content.value.toCode?.toUpperCase() || ''
  if (!currencyCode) return '—'
  return `${currencyCode} ${Math.round(delta).toLocaleString('en-US')}`
})

const fastestSpeedDisplay = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length) return '—'
  const fastest = [...rows].sort((a, b) => {
    const hoursA = parseSpeedToHours(a.speed)
    const hoursB = parseSpeedToHours(b.speed)
    return hoursA - hoursB
  })[0]
  return fastest?.speed || '—'
})

const calculatedAverageCost = computed(() => {
  if (corridorIndices.value?.rci && Number.isFinite(corridorIndices.value.rci)) {
    return formatIndexPercent(corridorIndices.value.rci)
  }
  if (providerCosts.value.length === 0) return '—'
  const avg = averageCost.value / displayAmount.value * 100
  if (!Number.isFinite(avg)) return '—'
  return `${avg.toFixed(2)}%`
})

const getTeerVsMidMarket = computed(() => {
  if (!corridorIndices.value?.teer || !corridorIndices.value?.midMarketRate) return ''
  const teer = corridorIndices.value.teer
  const midMarket = corridorIndices.value.midMarketRate
  if (!Number.isFinite(teer) || !Number.isFinite(midMarket) || midMarket === 0) return ''
  const diff = ((teer - midMarket) / midMarket) * 100
  const diffAbs = Math.abs(diff)
  if (diffAbs < 0.01) return 'very close to'
  if (diff > 0) return `${diff.toFixed(2)}% better than`
  return `${diffAbs.toFixed(2)}% below`
})

function getProviderTrueCost(row: TableRow, _index: number): TrueCostBreakdown {
  // Use promo fee/rate if available, otherwise use regular fee/rate
  const promo = row.promoInfo ?? null
  const hasPromo = Boolean(row.hasPromo && promo)
  const providerRate = hasPromo && Number.isFinite(promo?.rate)
    ? Number(promo?.rate)
    : Number.isFinite(row.fxRate ?? Number.NaN) ? Number(row.fxRate) : 0
  const upfrontFee = hasPromo && Number.isFinite(promo?.fee)
    ? Number(promo?.fee)
    : Number.isFinite(row.feeAmount ?? Number.NaN) ? Number(row.feeAmount) : 0

  return buildTrueCostBreakdown(
    displayAmount.value,
    upfrontFee,
    midMarketRate.value || 0,
    providerRate,
    bestTotalCost.value || 0,
  )
}

const getQuoteRefreshMethods = (method: Method) => {
  if (method === 'cash') {
    return { payin: 'bank_transfer', payout: 'cash_pickup' }
  }
  if (method === 'wallet') {
    return { payin: 'bank_transfer', payout: 'mobile_wallet' }
  }
  if (method === 'airtime') {
    return { payin: 'bank_transfer', payout: 'airtime' }
  }
  return { payin: 'bank_transfer', payout: 'bank_deposit' }
}

const getBackgroundRefreshKey = (method: Method) => (
  `${corridorId.value}:${displayAmount.value}:${method}`
)

const enqueueBackgroundRefresh = async (method: Method, signal?: AbortSignal) => {
  if (!import.meta.client || displayAmount.value <= 0) return
  if (corridorUnavailable.value || corridorUnsupported.value || hasApiError.value) return
  const refreshKey = getBackgroundRefreshKey(method)
  if (backgroundRefreshKeys.has(refreshKey)) return
  backgroundRefreshKeys.add(refreshKey)

  try {
    const { payin, payout } = getQuoteRefreshMethods(method)
    await request('/quotes/current', {
      query: {
        corridor_id: corridorId.value,
        amount: displayAmount.value,
        payin,
        payout,
        live: true,
      },
      retries: 0,
      signal,
    })
  }
  catch (error) {
    if ((error as any)?.name === 'AbortError') return
    useLogger('send-money').warn('background quote refresh unavailable', error)
  }
}

type QuoteRefreshResponse = {
  refresh?: {
    attempted?: boolean
    enqueued?: boolean
    request_id?: string | null
    request_ids?: string[]
    providers?: string[]
  }
}

const scheduleRefreshPoll = () => {
  if (!import.meta.client) return
  if (refreshAttempts.value >= MAX_REFRESH_ATTEMPTS) return

  clearRefreshPoll()
  refreshPollController = new AbortController()
  const { signal } = refreshPollController
  providersRequestSignal.value = signal
  refreshPollTimer.value = window.setTimeout(async () => {
    if (signal.aborted) return
    refreshAttempts.value += 1
    try {
      await refreshQuotes()
    }
    catch (error: any) {
      if (error?.name === 'AbortError') return
      useLogger('send-money').warn('refresh poll failed', error)
    }
    const timedOut = refreshAttempts.value >= MAX_REFRESH_ATTEMPTS
    if (timedOut && !hasApiQuotes.value && !refreshTimedOut.value) {
      refreshTimedOut.value = true
      searchInitiated.value = false
      providersLive.value = false
      refreshStatus.value = null
      refreshFinalizing.value = false
      lastRefreshKey.value = null
      clearRefreshStatusPoll()
    }

    const shouldContinue = !timedOut
      && !hasApiError.value
      && !corridorUnavailable.value
      && !corridorUnsupported.value
      && !hasApiQuotes.value
      && !refreshTimedOut.value
    if (shouldContinue) {
      scheduleRefreshPoll()
      return
    }
    clearRefreshPoll()
  }, REFRESH_POLL_MS)
}

const clearRefreshStatusPoll = () => {
  refreshStatusController?.abort()
  refreshStatusController = null
  if (refreshStatusPollTimer.value !== null) {
    window.clearTimeout(refreshStatusPollTimer.value)
    refreshStatusPollTimer.value = null
  }
  refreshCompletion.value = null
  refreshFinalizing.value = false
}

const startRefreshStatusPoll = (requestIds: string[]) => {
  if (!import.meta.client || !requestIds.length) return
  clearRefreshStatusPoll()
  refreshStatusController = new AbortController()
  const { signal } = refreshStatusController
  refreshTimedOut.value = false
  const startedAt = Date.now()
  refreshCompletion.value = {
    done: false,
    pending: requestIds.length,
    total: requestIds.length,
  }

  const poll = async () => {
    if (signal.aborted) return
    const elapsed = Date.now() - startedAt
    if (elapsed >= REFRESH_STATUS_TIMEOUT_MS) {
      refreshTimedOut.value = true
      searchInitiated.value = false
      refreshCompletion.value = {
        done: true,
        pending: 0,
        total: requestIds.length,
      }
      refreshFinalizing.value = false
      return
    }

    try {
      const status = await request<{
        done?: boolean
        pending?: number
        processing?: number
        missing?: number
        total?: number
      }>('/quotes/refresh-status', {
        query: { request_ids: requestIds.join(',') },
        retries: 0,
        timeoutMs: 5000,
        signal,
      })
      const pending = Number(status?.pending ?? 0) + Number(status?.processing ?? 0)
      const missing = Number(status?.missing ?? 0)
      const remaining = pending + missing
      refreshCompletion.value = {
        done: status?.done || remaining === 0,
        pending: remaining,
        total: Number(status?.total ?? requestIds.length),
      }
      if (refreshCompletion.value.done) {
        refreshFinalizing.value = true
      }
      if (!refreshCompletion.value.done) {
        if (!signal.aborted) refreshStatusPollTimer.value = window.setTimeout(poll, REFRESH_STATUS_POLL_MS)
        return
      }
    }
    catch (error: any) {
      if (error?.name === 'AbortError' || signal.aborted) return
      refreshStatusPollTimer.value = window.setTimeout(poll, REFRESH_STATUS_POLL_MS)
      return
    }
  }

  refreshStatusPollTimer.value = window.setTimeout(poll, 0)
}

const requestQuoteRefresh = async (source: 'auto' | 'manual', signal?: AbortSignal) => {
  if (!import.meta.client || displayAmount.value <= 0) return
  if (corridorUnavailable.value || corridorUnsupported.value) return
  const refreshKey = quoteRefreshKey.value
  if (source === 'auto') {
    if (refreshTimedOut.value) return
    if (quoteRefreshPending.value || refreshGateActive.value) return
    if (lastRefreshKey.value === refreshKey) return
  }
  refreshTimedOut.value = false
  quoteRefreshPending.value = true
  refreshAttempts.value = 0
  refreshFinalizing.value = false

  try {
    const { payin, payout } = getQuoteRefreshMethods(payoutMethod.value)
    const response = await request<QuoteRefreshResponse>('/quotes/current', {
      query: {
        corridor_id: corridorId.value,
        amount: displayAmount.value,
        payin,
        payout,
        live: true,
      },
      retries: 0,
      signal,
    })
    if (response?.refresh?.enqueued) {
      const requestIds = Array.isArray(response.refresh.request_ids)
        ? response.refresh.request_ids
        : []
      if (requestIds.length) {
        lastRefreshKey.value = refreshKey
        providersLive.value = true
      }
      refreshStatus.value = {
        enqueued: true,
        requestId: response.refresh.request_id ?? null,
        requestIds,
        providers: response.refresh.providers ?? [],
        requestedAt: new Date().toISOString(),
      }
      if (requestIds.length) {
        startRefreshStatusPoll(requestIds)
      }
      scheduleRefreshPoll()
    }
  }
  catch (error) {
    if ((error as any)?.name === 'AbortError') return
    useLogger('send-money').warn('quote refresh unavailable', error)
  }
  finally {
    quoteRefreshPending.value = false
  }
}

const handleRefreshQuotes = async () => {
  await requestQuoteRefresh('manual')
  await refreshQuotes()
}

const isRefreshQueued = computed(() => {
  if (corridorUnavailable.value || corridorUnsupported.value) return false
  if (refreshTimedOut.value) return false
  if (shouldBlockResults.value) return true
  if (quoteRefreshPending.value) return true
  if (!hasApiQuotes.value && quotesPending.value) return true
  return false
})

watch(shouldBlockResults, (active) => {
  if (!import.meta.client) return
  if (active) {
    if (!refreshGateStartedAt.value) {
      refreshGateStartedAt.value = Date.now()
    }
    startRefreshGateTimer()
    return
  }
  clearRefreshGateTimer()
  refreshGateStartedAt.value = null
  refreshElapsedSeconds.value = 0
}, { immediate: true })

watch(refreshStatus, () => {
  if (!shouldBlockResults.value) return
  updateRefreshElapsed()
})

watch(quotesPending, (pending) => {
  if (!pending && searchInitiated.value) {
    searchInitiated.value = false
  }
}, { immediate: true })

useAbortableWatch(
  [quoteRefreshKey, quotesPending, hasApiQuotes, hasApiError, corridorUnavailable, corridorUnsupported, isQuoteStale, refreshTimedOut],
  async ([, pending, hasQuotes, hasError, unavailable, unsupported, stale, timedOut], signal) => {
    if (!import.meta.client || pending || hasError || unavailable || unsupported || timedOut) {
      return
    }
    if (hasQuotes && !stale) {
      return
    }
    await requestQuoteRefresh('auto', signal)
  },
  { immediate: true },
)

watch(
  [corridorUnavailable, corridorUnsupported, hasApiError],
  ([unavailable, unsupported, hasError]) => {
    if (!unavailable && !unsupported && !hasError) {
      return
    }
    refreshTimedOut.value = false
    refreshFinalizing.value = false
    lastRefreshKey.value = null
    providersLive.value = false
    refreshStatus.value = null
    refreshAttempts.value = 0
    clearRefreshPoll()
    clearRefreshStatusPoll()
    clearRefreshGateTimer()
    refreshGateStartedAt.value = null
    refreshElapsedSeconds.value = 0
  },
)

useAbortableWatch(
  refreshCompletion,
  async (completion, signal) => {
    if (!completion?.done) return
    refreshFinalizing.value = true
    providersRequestSignal.value = signal
    try {
      await refreshQuotes()
    }
    catch {
      // Ignore refresh errors; we'll surface API errors in the UI.
    }
    finally {
      refreshFinalizing.value = false
    }
    if (hasApiQuotes.value || refreshTimedOut.value) {
      providersLive.value = false
      refreshStatus.value = null
      refreshFinalizing.value = false
      lastRefreshKey.value = null
      refreshAttempts.value = 0
      clearRefreshPoll()
      clearRefreshStatusPoll()
      clearRefreshGateTimer()
      refreshGateStartedAt.value = null
      refreshElapsedSeconds.value = 0
    }
  },
)

watch(hasApiQuotes, (hasQuotes) => {
  if (!hasQuotes) return
  refreshTimedOut.value = false
  if (!refreshStatus.value?.enqueued) return
  if (refreshCompletion.value) return
  providersLive.value = false
  refreshStatus.value = null
  refreshFinalizing.value = false
  lastRefreshKey.value = null
  refreshAttempts.value = 0
  clearRefreshPoll()
  clearRefreshStatusPoll()
  clearRefreshGateTimer()
  refreshGateStartedAt.value = null
  refreshElapsedSeconds.value = 0
})

watch(quoteRefreshKey, () => {
  refreshAttempts.value = 0
  refreshTimedOut.value = false
  refreshFinalizing.value = false
  lastRefreshKey.value = null
  providersLive.value = false
  refreshStatus.value = null
  clearRefreshPoll()
  clearRefreshStatusPoll()
  clearRefreshGateTimer()
  refreshGateStartedAt.value = null
  refreshElapsedSeconds.value = 0
})

useAbortableWatch(payoutMethod, async (_, signal) => {
  refreshTimedOut.value = false
  refreshStatus.value = null
  refreshAttempts.value = 0
  refreshFinalizing.value = false
  clearRefreshPoll()
  clearRefreshStatusPoll()
  clearRefreshGateTimer()
  refreshGateStartedAt.value = null
  refreshElapsedSeconds.value = 0
  providersRequestSignal.value = signal
  try {
    await refreshQuotes()
  }
  catch {
    // Ignore refresh errors; the auto refresh queue handles retries.
  }
  if ((!hasApiQuotes.value || isQuoteStale.value) && !hasApiError.value && !corridorUnavailable.value && !corridorUnsupported.value) {
    await requestQuoteRefresh('auto', signal)
  }
})

const { availableToCurrencies, availableFromCurrencies } = useCorridorCurrencies(
  fromCountryCode,
  toCountryCode,
  computed(() => fromCurrencyCode.value),
  computed(() => toCurrencyCode.value),
)

function handleBarUpdate(data: { amount: number, payoutMethod: string, currency: string, fromCurrency: string, fromCountry?: string, toCountry?: string }) {
  const currency = data.fromCurrency || fromCurrencyCode.value
  displayAmount.value = sanitizeAmount(data.amount, currency, {
    minAmount: getMinAmount(currency),
    maxAmount: getMaxAmount(currency),
    strict: true,
  })
  payoutMethod.value = data.payoutMethod as Method
  displayCurrency.value = data.currency
}

async function handleNewQuery(data: { fromCountry: string, toCountry: string, amount: number, currency: string, fromCurrency: string, payoutMethod: string }) {
  searchInitiated.value = true
  const newUrl = getCorridorUrl(data.fromCountry, data.toCountry)
  const sanitizedAmount = sanitizeAmount(data.amount, data.fromCurrency || fromCurrencyCode.value, {
    minAmount: getMinAmount(data.fromCurrency || fromCurrencyCode.value),
    maxAmount: getMaxAmount(data.fromCurrency || fromCurrencyCode.value),
    strict: true,
  })
  const params = new URLSearchParams()
  if (sanitizedAmount !== 1000) params.set('amount', String(sanitizedAmount))
  if (data.payoutMethod !== 'bank') params.set('method', data.payoutMethod)
  if (data.fromCurrency) params.set('fromCurrency', data.fromCurrency)
  if (data.currency && data.currency !== toCurrencyCode.value) params.set('toCurrency', data.currency)
  const queryString = params.toString()
  const fullUrl = `${newUrl}${queryString ? `?${queryString}` : ''}`

  // Navigate immediately - no waiting for quotes
  await navigateTo(fullUrl)
}

function handleSort(newSort: string) {
  sortBy.value = newSort
}

async function handleSave() {
  if (!isAuthenticated.value) {
    authModalFeature.value = 'watchlist'
    authModalOpen.value = true
    return
  }
  const result = await watchlist.save({
    type: 'corridor',
    from: fromCountryCode.value,
    to: toCountryCode.value,
    method: payoutMethod.value,
  })
  if (result.status === 'saved') {
    toastTitle.value = 'Added to watchlist!'
    toastMessage.value = `${content.value.from} → ${content.value.to} saved`
    toastVariant.value = 'success'
    successToastRef.value?.show()
  }
  else if (result.status === 'already_saved') {
    toastTitle.value = 'Already saved'
    toastMessage.value = 'This corridor is already in your watchlist'
    toastVariant.value = 'success'
    successToastRef.value?.show()
  }
  else if (result.status === 'limit_reached') {
    limitModalFeature.value = 'watchlist'
    limitModalLimit.value = result.limit
    limitModalOpen.value = true
  }
  else if (result.status === 'error') {
    toastTitle.value = 'Unable to save'
    toastMessage.value = result.message
    toastVariant.value = 'error'
    successToastRef.value?.show()
  }
}

async function handleAlert() {
  if (!isAuthenticated.value) {
    authModalFeature.value = 'alert'
    authModalOpen.value = true
    return
  }
  saveAlertModal.open({
    target: corridorWatchTarget.value,
    label: corridorWatchLabel.value,
    source: 'compare',
  })
}

function handleShare() {
  shareModalOpen.value = true
}

const scoreModalOpen = ref(false)
const selectedProvider = ref<{ providerId?: string, providerName: string, score: number } | null>(null)

const authModalOpen = ref(false)
const authModalFeature = ref<'watchlist' | 'alert'>('watchlist')
const limitModalOpen = ref(false)
const limitModalFeature = ref<'watchlist' | 'alert'>('watchlist')
const limitModalLimit = ref(3)
const shareModalOpen = ref(false)
const successToastRef = ref<{ show: () => void, hide: () => void } | null>(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastVariant = ref<'success' | 'error'>('success')

const limitModalCount = computed(() => {
  return limitModalFeature.value === 'watchlist'
    ? watchlist.count.value
    : alerts.count.value
})

const limitMessage = computed(() => {
  if (limitModalFeature.value === 'watchlist') {
    if (isPlus.value) {
      return `You've saved ${limitModalCount.value} corridors, the current Plus limit. Remove one to add another.`
    }
    return `You've saved ${limitModalCount.value} corridors, the maximum for free accounts.`
  }
  if (isPlus.value) {
    return `You've created ${limitModalCount.value} alerts, the current Plus limit. Remove one to add another.`
  }
  return `You've created ${limitModalCount.value} alerts, the maximum for free accounts.`
})

const metricLabels: Record<string, string> = {
  recipientGets: 'Recipient gets',
  totalCost: 'Total cost',
  fee: 'Fee',
  midMarketRate: 'Mid-market rate',
  rate: 'Rate',
  sendScore: 'Intelligent alert',
  index: 'Index',
}

const comparatorLabels: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
}

const formatAlertValue = (metric: string, value: number) => {
  if (!Number.isFinite(value)) return '—'
  if (metric === 'sendScore') return Math.round(value).toString()
  if (metric === 'rate' || metric === 'midMarketRate') return value.toFixed(4)
  return value.toFixed(2)
}

const limitModalItems = computed(() => {
  const sliceLimit = limitModalLimit.value || 0
  if (limitModalFeature.value === 'alert') {
    const items = alerts.alerts.value.map((alert) => {
      const label = watchlist.findById(alert.watchlistItemId)?.label || 'Alert'
      const metricLabel = metricLabels[alert.rule.metric] || 'Alert'
      const comparatorLabel = comparatorLabels[alert.rule.comparator] || alert.rule.comparator
      const valueLabel = formatAlertValue(alert.rule.metric, alert.rule.value)
      const currencyLabel = alert.rule.currency ? ` ${alert.rule.currency}` : ''
      return {
        id: alert.id,
        label,
        meta: `${metricLabel} ${comparatorLabel} ${valueLabel}${currencyLabel}`.trim(),
      }
    })
    return sliceLimit > 0 ? items.slice(0, sliceLimit) : items
  }

  const items = watchlist.items.value.map(item => ({
    id: item.id,
    label: item.label,
  }))
  return sliceLimit > 0 ? items.slice(0, sliceLimit) : items
})

const handleLimitRemove = async (id: string) => {
  if (limitModalFeature.value === 'watchlist') {
    await watchlist.remove(id)
  }
  else {
    await alerts.remove(id)
  }

  if (limitModalLimit.value > 0 && limitModalCount.value < limitModalLimit.value) {
    limitModalOpen.value = false
  }
}

function openScoreModal(row: TableRow | EnrichedTableRow) {
  const slug = '_slug' in row ? row._slug : getProviderSlug(row)
  selectedProvider.value = {
    providerId: row.providerId || slug || undefined,
    providerName: row.provider,
    score: Number.parseFloat(row.score),
  }
  scoreModalOpen.value = true
}
</script>

<style scoped>
@keyframes loading-bar {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(400%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.loading-bar-animate {
  width: 30%;
  animation: loading-bar 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
}
</style>
