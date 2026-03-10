<template>
  <div class="space-y-6">
    <!-- Full-page empty state when no corridor is selected or insufficient data -->
    <EmptyState
      v-if="!corridorSafe"
      :variant="variant"
      mode="page"
      :reason="emptyReason"
      :corridor-label="corridor?.label"
      :days-available="(corridor as any)?.daysAvailable"
    />

    <!-- Enterprise-only layout: always rendered when corridor is safe -->
    <template v-else>
      <!-- ================================================================
           ROW 1: Section header
           ================================================================ -->
      <RsSectionHeader
        title="Indices"
        description="TEER, RCI, and RVI for the selected corridor, all pinned to the same published benchmark profile"
        icon-name="arrow-trending-up"
        :variant="variant"
        class="mb-2"
      />

      <!-- ================================================================
           ROW 2: Three index headline cards
           ================================================================ -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <!-- TEER Card -->
        <div :class="[cardSurface, 'overflow-hidden']">
          <div
            class="flex items-center gap-2 border-b px-5 py-3"
            :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
          >
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              style="background-color: #2563EB;"
              aria-hidden="true"
            />
            <p
              class="text-body-sm font-semibold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              TEER
            </p>
            <span
              class="ml-auto text-xs font-medium uppercase tracking-wide"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              Total Effective Exchange Rate
            </span>
          </div>

          <div class="px-5 py-4">
            <!-- Loading skeleton -->
            <div
              v-if="loadingHeadline"
              class="animate-pulse space-y-2"
            >
              <div
                class="h-7 w-24 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
              <div
                class="h-4 w-32 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
              <div
                class="mt-2 h-3 w-20 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
            </div>

            <template v-else-if="headlineData">
              <!-- Value -->
              <p
                class="text-h3 font-bold tabular-nums"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                {{ formatTeer(headlineData.teer.value) }}
              </p>

              <!-- Delta row -->
              <div class="mt-1 flex flex-wrap items-center gap-3">
                <span
                  class="text-body-sm tabular-nums"
                  :class="teerDeltaClass(headlineData.teer.delta7d)"
                >
                  {{ formatDelta(headlineData.teer.delta7d) }} 7d
                </span>
                <span
                  class="text-body-sm tabular-nums"
                  :class="teerDeltaClass(headlineData.teer.delta30d)"
                >
                  {{ formatDelta(headlineData.teer.delta30d) }} 30d
                </span>
              </div>

              <!-- Confidence badge -->
              <div class="mt-3">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="confidenceBadgeClass(headlineData.teer.confidence)"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="confidenceDotClass(headlineData.teer.confidence)"
                    aria-hidden="true"
                  />
                  {{ headlineData.teer.confidence }} confidence
                </span>
              </div>

              <!-- Sparkline (30 points from series) -->
              <div
                v-if="teerSparkline.length > 1"
                class="mt-3 h-10"
              >
                <svg
                  viewBox="0 0 100 40"
                  class="h-full w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    :points="buildSparklinePath(teerSparkline)"
                    fill="none"
                    stroke="#2563EB"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </template>

            <p
              v-else
              class="text-body-sm"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              No data available
            </p>
          </div>
        </div>

        <!-- RCI Card -->
        <div :class="[cardSurface, 'overflow-hidden']">
          <div
            class="flex items-center gap-2 border-b px-5 py-3"
            :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
          >
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              style="background-color: #0B1F59;"
              aria-hidden="true"
            />
            <p
              class="text-body-sm font-semibold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              RCI
            </p>
            <span
              class="ml-auto text-xs font-medium uppercase tracking-wide"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              Remittance Competition Index
            </span>
          </div>

          <div class="px-5 py-4">
            <div
              v-if="loadingHeadline"
              class="animate-pulse space-y-2"
            >
              <div
                class="h-7 w-24 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
              <div
                class="h-4 w-32 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
              <div
                class="mt-2 h-3 w-40 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
            </div>

            <template v-else-if="headlineData">
              <p
                class="text-h3 font-bold tabular-nums"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                {{ headlineData.rci.value.toFixed(1) }}
              </p>

              <div class="mt-1 flex flex-wrap items-center gap-3">
                <span
                  class="text-body-sm tabular-nums"
                  :class="rciDeltaClass(headlineData.rci.delta7d)"
                >
                  {{ formatDelta(headlineData.rci.delta7d) }} 7d
                </span>
                <span
                  class="text-body-sm tabular-nums"
                  :class="rciDeltaClass(headlineData.rci.delta30d)"
                >
                  {{ formatDelta(headlineData.rci.delta30d) }} 30d
                </span>
              </div>

              <!-- Interpretation text -->
              <p
                class="mt-2 text-body-sm"
                :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
              >
                {{ rciInterpretation(headlineData.rci.value) }}
              </p>

              <!-- Sparkline -->
              <div
                v-if="rciSparkline.length > 1"
                class="mt-3 h-10"
              >
                <svg
                  viewBox="0 0 100 40"
                  class="h-full w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    :points="buildSparklinePath(rciSparkline)"
                    fill="none"
                    stroke="#0B1F59"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </template>

            <p
              v-else
              class="text-body-sm"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              No data available
            </p>
          </div>
        </div>

        <!-- RVI Card -->
        <div :class="[cardSurface, 'overflow-hidden']">
          <div
            class="flex items-center gap-2 border-b px-5 py-3"
            :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
          >
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              style="background-color: #8CB8FF;"
              aria-hidden="true"
            />
            <p
              class="text-body-sm font-semibold"
              :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
            >
              RVI
            </p>
            <span
              class="ml-auto text-xs font-medium uppercase tracking-wide"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              Rate Volatility Index
            </span>
          </div>

          <div class="px-5 py-4">
            <div
              v-if="loadingHeadline"
              class="animate-pulse space-y-2"
            >
              <div
                class="h-7 w-24 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
              <div
                class="h-4 w-32 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
              <div
                class="mt-2 h-3 w-28 rounded"
                :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
              />
            </div>

            <template v-else-if="headlineData">
              <p
                class="text-h3 font-bold tabular-nums"
                :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
              >
                {{ Math.round(headlineData.rvi.value) }}
                <span
                  class="text-body-sm font-normal"
                  :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                >bps</span>
              </p>

              <div class="mt-1 flex flex-wrap items-center gap-3">
                <span
                  class="text-body-sm tabular-nums"
                  :class="rviDeltaClass(headlineData.rvi.delta7d)"
                >
                  {{ formatDelta(headlineData.rvi.delta7d) }} 7d
                </span>
                <span
                  class="text-body-sm tabular-nums"
                  :class="rviDeltaClass(headlineData.rvi.delta30d)"
                >
                  {{ formatDelta(headlineData.rvi.delta30d) }} 30d
                </span>
              </div>

              <!-- Stability badge -->
              <div class="mt-3">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="volatilityBadgeClass(headlineData.rvi.value)"
                >
                  {{ volatilityLabel(headlineData.rvi.value) }}
                </span>
              </div>

              <!-- Sparkline -->
              <div
                v-if="rviSparkline.length > 1"
                class="mt-3 h-10"
              >
                <svg
                  viewBox="0 0 100 40"
                  class="h-full w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    :points="buildSparklinePath(rviSparkline)"
                    fill="none"
                    stroke="#8CB8FF"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </template>

            <p
              v-else
              class="text-body-sm"
              :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
            >
              No data available
            </p>
          </div>
        </div>
      </div>

      <!-- ================================================================
           ROW 3: Interactive multi-line time-series chart (full width)
           ================================================================ -->
      <ChartCard
        :variant="variant"
        title="Index Time Series"
        subtitle="Toggle TEER, RCI, and RVI overlays across the selected timeframe"
        :loading="loadingSeries"
        :error="errorSeries ? { message: errorSeries } : null"
        :data-available="seriesAvailable"
        :empty="!seriesAvailable && !loadingSeries ? { title: 'No index data', message: 'Index series data is not yet available for this corridor.' } : null"
        :updated-at="seriesData?.lastUpdated ?? null"
      >
        <template #actions>
          <!-- Index toggle buttons -->
          <div class="flex items-center gap-1">
            <button
              class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="visibleIndices.teer
                ? 'bg-blue-600 text-white shadow-sm'
                : variant === 'terminal'
                  ? 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'"
              @click="visibleIndices.teer = !visibleIndices.teer"
            >
              TEER
            </button>
            <button
              class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="visibleIndices.rci
                ? 'bg-[#0B1F59] text-white shadow-sm'
                : variant === 'terminal'
                  ? 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'"
              @click="visibleIndices.rci = !visibleIndices.rci"
            >
              RCI
            </button>
            <button
              class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="visibleIndices.rvi
                ? 'bg-[#8CB8FF] text-[#0B1F59] shadow-sm'
                : variant === 'terminal'
                  ? 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'"
              @click="visibleIndices.rvi = !visibleIndices.rvi"
            >
              RVI
            </button>
          </div>

          <!-- Timeframe selector -->
          <div
            class="flex items-center gap-1 border-l pl-3"
            :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-200'"
          >
            <button
              v-for="tf in TIMEFRAME_OPTIONS"
              :key="tf.value"
              class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
              :class="selectedDays === tf.value
                ? variant === 'terminal' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-white'
                : variant === 'terminal'
                  ? 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'"
              @click="handleTimeframeChange(tf.value)"
            >
              {{ tf.label }}
            </button>
          </div>
        </template>

        <template #chart>
          <RsChart
            :option="multiLineChartOption"
            height="tall"
            :theme="echartsTheme"
          />
        </template>
      </ChartCard>

      <!-- ================================================================
           ROW 4: Methodology transparency + interpretation guidance
           ================================================================ -->
      <div class="grid grid-cols-12 gap-4">
        <!-- LEFT: Methodology Transparency Panel -->
        <div class="col-span-12">
          <div :class="[cardSurface, 'overflow-hidden']">
            <!-- Panel header -->
            <div
              class="flex items-center justify-between border-b px-5 py-4"
              :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
            >
              <div>
                <p
                  class="font-semibold"
                  :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                >
                  Methodology Transparency
                </p>
                <p
                  class="mt-0.5 text-body-sm"
                  :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                >
                  How index values are computed for this corridor
                </p>
              </div>
              <button
                class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                :class="variant === 'terminal'
                  ? 'bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
                @click="methodologyExpanded = !methodologyExpanded"
              >
                {{ methodologyExpanded ? 'Collapse' : 'Expand provider table' }}
                <svg
                  class="h-3.5 w-3.5 transition-transform"
                  :class="methodologyExpanded ? 'rotate-180' : ''"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Loading state -->
            <div
              v-if="loadingMethodology"
              class="px-5 py-6"
            >
              <div class="animate-pulse space-y-3">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-5 rounded"
                  :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-100'"
                  :style="`width: ${55 + i * 10}%`"
                />
              </div>
            </div>

            <!-- Error state -->
            <div
              v-else-if="errorMethodology"
              class="px-5 py-6"
            >
              <p
                class="text-body-sm"
                :class="variant === 'terminal' ? 'text-red-400' : 'text-red-600'"
              >
                Failed to load methodology data. {{ errorMethodology }}
              </p>
            </div>

            <!-- Content -->
            <div
              v-else-if="methodologyData"
              class="px-5 py-5"
            >
              <div
                class="mb-4 rounded-2xl border px-4 py-3"
                :class="methodologyConsistency.ok
                  ? 'border-[#D8E5F8] bg-[#F6FAFF]'
                  : 'border-amber-200 bg-amber-50'"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-body-sm font-semibold text-neutral-900">
                      {{ methodologyConsistency.ok ? 'Methodology checks passed' : 'Methodology mismatch detected' }}
                    </p>
                    <p class="mt-1 text-body-sm text-neutral-500">
                      {{ methodologyConsistency.summary }}
                    </p>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="methodologyConsistency.ok
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-amber-100 text-amber-800'"
                  >
                    {{ methodologyConsistency.ok ? 'Verified from payload' : 'Review payload' }}
                  </span>
                </div>
              </div>

              <!-- Stats row: 4 columns -->
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <!-- Contributing providers -->
                <div>
                  <p
                    class="text-label"
                    :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    Contributing
                  </p>
                  <p
                    class="mt-0.5 text-body-sm font-semibold tabular-nums"
                    :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                  >
                    {{ methodologyData.contributingProviders }}
                    <span
                      class="font-normal"
                      :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                    >/ {{ methodologyData.totalProviders }}</span>
                  </p>
                </div>

                <!-- Suppressed count -->
                <div>
                  <p
                    class="text-label"
                    :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    Suppressed
                  </p>
                  <p
                    class="mt-0.5 text-body-sm font-semibold tabular-nums"
                    :class="methodologyData.suppressedProviders > 0
                      ? 'text-amber-500'
                      : variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                  >
                    {{ methodologyData.suppressedProviders }}
                  </p>
                </div>

                <!-- Weight confidence -->
                <div>
                  <p
                    class="text-label"
                    :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    Weight confidence
                  </p>
                  <div class="mt-1.5 flex items-center gap-2">
                    <div
                      class="h-1.5 w-16 overflow-hidden rounded-full"
                      :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
                    >
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="weightConfidenceBarClass(methodologyData.weightConfidence)"
                        :style="`width: ${Math.round(methodologyData.weightConfidence * 100)}%`"
                      />
                    </div>
                    <span
                      class="text-body-sm font-semibold tabular-nums"
                      :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                    >
                      {{ Math.round(methodologyData.weightConfidence * 100) }}%
                    </span>
                  </div>
                  <p
                    class="mt-0.5 text-xs leading-tight"
                    :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    {{ weightConfidenceLabel(methodologyData.weightConfidence) }}
                  </p>
                </div>

                <!-- Weight window -->
                <div>
                  <p
                    class="text-label"
                    :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                  >
                    Weight window
                  </p>
                  <p
                    class="mt-0.5 text-body-sm font-semibold tabular-nums"
                    :class="variant === 'terminal' ? 'text-white' : 'text-neutral-900'"
                  >
                    {{ methodologyData.weightWindowDays }}d
                  </p>
                </div>
              </div>

              <!-- Methodology version tag -->
              <div class="mt-4 flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="variant === 'terminal'
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-blue-50 text-blue-700'"
                >
                  v{{ methodologyData.methodologyVersion }}
                </span>
                <span
                  class="text-xs"
                  :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                >
                  methodology
                </span>
                <span
                  class="text-xs"
                  :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
                >
                  weight sum {{ methodologyConsistency.weightSumLabel }}
                </span>
              </div>

              <!-- Suppression reasons panel (only if there are suppressions) -->
              <div
                v-if="suppressedProviders.length > 0"
                class="mt-4 rounded-lg border px-4 py-3"
                :class="variant === 'terminal'
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-amber-200 bg-amber-50'"
              >
                <p
                  class="mb-2 text-xs font-semibold uppercase tracking-wide"
                  :class="variant === 'terminal' ? 'text-amber-400' : 'text-amber-700'"
                >
                  Suppressed providers ({{ suppressedProviders.length }})
                </p>
                <ul class="space-y-1">
                  <li
                    v-for="p in suppressedProviders"
                    :key="p.name"
                    class="flex items-start gap-2 text-body-sm"
                    :class="variant === 'terminal' ? 'text-amber-300' : 'text-amber-800'"
                  >
                    <svg
                      class="mt-0.5 h-3.5 w-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <span class="font-medium">{{ p.name }}</span>
                      <span
                        v-if="p.suppressionReason"
                        class="ml-1"
                        :class="variant === 'terminal' ? 'text-amber-500' : 'text-amber-600'"
                      >
                        — {{ p.suppressionReason }}
                      </span>
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Expandable provider weight table -->
              <div
                v-if="methodologyExpanded"
                class="mt-5"
              >
                <p
                  class="mb-2 text-label font-semibold uppercase tracking-wide"
                  :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                >
                  Provider weight table
                </p>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-body-sm">
                    <thead>
                      <tr
                        class="border-b text-left"
                        :class="variant === 'terminal' ? 'border-neutral-700' : 'border-neutral-100'"
                      >
                        <th
                          class="pb-2 pr-4 font-semibold"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          Provider
                        </th>
                        <th
                          class="pb-2 pr-4 text-right font-semibold"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          Weight
                        </th>
                        <th
                          class="pb-2 pr-4 text-right font-semibold"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          Quotes
                        </th>
                        <th
                          class="pb-2 pr-4 font-semibold"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          Freshness
                        </th>
                        <th
                          class="pb-2 font-semibold"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="divide-y"
                      :class="variant === 'terminal' ? 'divide-neutral-800' : 'divide-neutral-50'"
                    >
                      <tr
                        v-for="provider in methodologyData.providers"
                        :key="provider.name"
                        :class="provider.suppressed ? 'opacity-50' : ''"
                      >
                        <td
                          class="py-2.5 pr-4 font-medium capitalize"
                          :class="variant === 'terminal' ? 'text-neutral-200' : 'text-neutral-800'"
                        >
                          {{ provider.name }}
                        </td>
                        <td class="py-2.5 pr-4 text-right tabular-nums">
                          <!-- Inline bar + value -->
                          <div class="flex items-center justify-end gap-2">
                            <div
                              class="h-1.5 w-16 overflow-hidden rounded-full"
                              :class="variant === 'terminal' ? 'bg-neutral-700' : 'bg-neutral-200'"
                            >
                              <div
                                class="h-full rounded-full"
                                style="background-color: #2563EB;"
                                :style="`width: ${Math.round(provider.weight * 100)}%`"
                              />
                            </div>
                            <span
                              class="w-10 text-right"
                              :class="variant === 'terminal' ? 'text-neutral-300' : 'text-neutral-700'"
                            >
                              {{ (provider.weight * 100).toFixed(1) }}%
                            </span>
                          </div>
                        </td>
                        <td
                          class="py-2.5 pr-4 text-right tabular-nums"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          {{ provider.quoteCount.toLocaleString() }}
                        </td>
                        <td
                          class="py-2.5 pr-4"
                          :class="variant === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'"
                        >
                          {{ provider.freshness }}
                        </td>
                        <td class="py-2.5">
                          <span
                            class="inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium"
                            :class="provider.suppressed
                              ? 'bg-amber-500/15 text-amber-500'
                              : variant === 'terminal'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-emerald-50 text-emerald-700'"
                          >
                            {{ provider.suppressed ? 'Suppressed' : 'Active' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- No data -->
            <div
              v-else
              class="px-5 py-6"
            >
              <p
                class="text-body-sm"
                :class="variant === 'terminal' ? 'text-neutral-500' : 'text-neutral-400'"
              >
                No methodology data available for this corridor.
              </p>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import type { PulseDensity, PulseFilters, CorridorOption, ChartSeries } from '~/types/pulse'
import { usePulseTheme } from '~/composables/usePulseTheme'
import { usePulseDataSafety } from '~/composables/usePulseDataSafety'
import {
  getIndicesSeries,
  getIndicesMethodology,
  getIndicesHeadline,
} from '~/lib/pulseApi'
import type {
  IndicesSeriesResponse,
  IndicesMethodologyData,
  IndicesHeadlineData,
} from '~/lib/pulseApi'
import { buildIndicesMultiLineOption } from '~/lib/pulseChartBuilders'
import ChartCard from '~/ui/charts/ChartCard.vue'
import RsChart from '~/ui/charts/RsChart.vue'
import RsSectionHeader from '~/ui/layout/RsSectionHeader.vue'
import EmptyState from '~/ui/states/EmptyState.vue'

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  density: PulseDensity
  corridor: CorridorOption | null
  filters: PulseFilters
}

const props = defineProps<Props>()

// ── Composables ────────────────────────────────────────────────────────────────

const { variant, echartsTheme, cardSurface } = usePulseTheme()
const { isCorridorSafe, getEmptyReason } = usePulseDataSafety()

// ── Corridor safety ────────────────────────────────────────────────────────────

const corridorSafe = computed(() => isCorridorSafe(props.corridor))
const emptyReason = computed(() => getEmptyReason(props.corridor))

// ── Constants ──────────────────────────────────────────────────────────────────

const TIMEFRAME_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '6mo', value: 180 },
] as const

type SelectedDays = 7 | 30 | 90 | 180

// ── UI state ───────────────────────────────────────────────────────────────────

const selectedDays = ref<SelectedDays>(30)

// reactive object so toggling one index does not create a new object reference
// (keeps ChartCard re-renders scoped to ECharts only)
const visibleIndices = reactive({ teer: true, rci: true, rvi: true })

const methodologyExpanded = ref(false)

// ── Loading / error refs ───────────────────────────────────────────────────────

const loadingHeadline = ref(false)
const loadingSeries = ref(false)
const loadingMethodology = ref(false)

const errorSeries = ref<string | null>(null)
const errorMethodology = ref<string | null>(null)

// ── Data refs ──────────────────────────────────────────────────────────────────

const headlineData = ref<IndicesHeadlineData | null>(null)
const seriesData = ref<IndicesSeriesResponse | null>(null)
const methodologyData = ref<IndicesMethodologyData | null>(null)

// ── Corridor arg helper ────────────────────────────────────────────────────────

// The three API functions expect a PulseCorridor-shaped object. CorridorOption
// from the shell has compatible fields under slightly different names.
function getCorridorArg() {
  const c = props.corridor
  if (!c) return null
  return {
    from: (c as any).sourceCountry ?? (c as any).fromCode ?? '',
    to: (c as any).destCountry ?? (c as any).toCode ?? '',
    fromCode: (c as any).fromCode ?? '',
    toCode: (c as any).toCode ?? '',
    fromFlag: (c as any).fromFlag ?? '',
    toFlag: (c as any).toFlag ?? '',
    label: c.label ?? '',
    slug: (c as any).slug ?? c.value ?? '',
    corridorId: (c as any).corridorId,
  }
}

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchHeadline() {
  const ca = getCorridorArg()
  if (!ca) return
  loadingHeadline.value = true
  try {
    headlineData.value = await getIndicesHeadline(ca, props.filters.amount)
  }
  catch {
    headlineData.value = null
  }
  finally {
    loadingHeadline.value = false
  }
}

async function fetchSeries() {
  const ca = getCorridorArg()
  if (!ca) return
  loadingSeries.value = true
  errorSeries.value = null
  try {
    seriesData.value = await getIndicesSeries(
      ca,
      selectedDays.value,
      props.filters.amount,
      props.filters.fundingMethod === 'card' ? 'standard_card' : 'standard_bank',
    )
  }
  catch (err: any) {
    errorSeries.value = err?.message ?? 'Failed to load index series'
    seriesData.value = null
  }
  finally {
    loadingSeries.value = false
  }
}

async function fetchMethodology() {
  const ca = getCorridorArg()
  if (!ca) return
  loadingMethodology.value = true
  errorMethodology.value = null
  try {
    methodologyData.value = await getIndicesMethodology(
      ca,
      props.filters.amount,
      props.filters.fundingMethod === 'card' ? 'standard_card' : 'standard_bank',
    )
  }
  catch (err: any) {
    errorMethodology.value = err?.message ?? 'Failed to load methodology data'
    methodologyData.value = null
  }
  finally {
    loadingMethodology.value = false
  }
}

async function fetchAll() {
  if (!corridorSafe.value) return
  await Promise.all([fetchHeadline(), fetchSeries(), fetchMethodology()])
}

// ── Lifecycle + watchers ───────────────────────────────────────────────────────

onMounted(fetchAll)

// Re-fetch everything when corridor or filters change
watch(
  () => [props.corridor, props.filters] as const,
  fetchAll,
  { deep: true },
)

// Re-fetch only series when timeframe changes — headline and methodology are
// timeframe-agnostic and do not need to re-load.
watch(selectedDays, fetchSeries)

// ── Timeframe handler ──────────────────────────────────────────────────────────

function handleTimeframeChange(days: SelectedDays) {
  selectedDays.value = days
}

// ── Chart series ───────────────────────────────────────────────────────────────

function toChartSeries(
  field: 'teer' | 'rci' | 'rvi_bps',
  color: string,
  label: string,
): ChartSeries | null {
  const pts = seriesData.value?.series
  if (!pts || pts.length === 0) return null
  return {
    id: field,
    label,
    color,
    points: pts.map(p => ({ t: new Date(p.date).getTime(), v: p[field] })),
  }
}

const teerChartSeries = computed(() => toChartSeries('teer', '#2563EB', 'TEER'))
const rciChartSeries = computed(() => toChartSeries('rci', '#0B1F59', 'RCI'))
const rviChartSeries = computed(() => toChartSeries('rvi_bps', '#8CB8FF', 'RVI'))

const multiLineChartOption = computed<EChartsOption>(() =>
  buildIndicesMultiLineOption(
    teerChartSeries.value,
    rciChartSeries.value,
    rviChartSeries.value,
    { teer: visibleIndices.teer, rci: visibleIndices.rci, rvi: visibleIndices.rvi },
  ),
)

const seriesAvailable = computed(() =>
  Boolean(seriesData.value && seriesData.value.series.length > 0),
)

// ── Sparklines — last 30 points from the time-series ──────────────────────────

const teerSparkline = computed(() =>
  (seriesData.value?.series ?? []).slice(-30).map(p => p.teer),
)

const rciSparkline = computed(() =>
  (seriesData.value?.series ?? []).slice(-30).map(p => p.rci),
)

const rviSparkline = computed(() =>
  (seriesData.value?.series ?? []).slice(-30).map(p => p.rvi_bps),
)

// ── Suppressed providers ───────────────────────────────────────────────────────

const suppressedProviders = computed(() =>
  (methodologyData.value?.providers ?? []).filter(p => p.suppressed),
)

const methodologyConsistency = computed(() => {
  const methodology = methodologyData.value
  if (!methodology) {
    return {
      ok: true,
      summary: 'No methodology payload available.',
      weightSumLabel: '—',
    }
  }

  const activeProviders = methodology.providers.filter(provider => !provider.suppressed)
  const suppressed = methodology.providers.filter(provider => provider.suppressed)
  const weightSum = methodology.providers.reduce((total, provider) => total + provider.weight, 0)
  const checks = [
    Math.abs(weightSum - 1) <= 0.03,
    activeProviders.length === methodology.contributingProviders,
    suppressed.length === methodology.suppressedProviders,
  ]

  const failures: string[] = []
  if (!checks[0]) failures.push('weights do not sum to 100%')
  if (!checks[1]) failures.push('contributing count does not match active rows')
  if (!checks[2]) failures.push('suppressed count does not match suppressed rows')

  return {
    ok: failures.length === 0,
    summary: failures.length === 0
      ? 'Weights, contributing rows, and suppressed rows all align with the returned payload.'
      : failures.join('; '),
    weightSumLabel: `${(weightSum * 100).toFixed(1)}%`,
  }
})

// ── Formatting helpers ─────────────────────────────────────────────────────────

function formatTeer(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(2)}`
}

// TEER: higher = more expensive → positive delta is bad
function teerDeltaClass(delta: number): string {
  if (delta > 0) return variant.value === 'terminal' ? 'text-red-400' : 'text-red-600'
  if (delta < 0) return variant.value === 'terminal' ? 'text-emerald-400' : 'text-emerald-600'
  return variant.value === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'
}

// RCI: higher = more competitive → positive delta is good
function rciDeltaClass(delta: number): string {
  if (delta > 0) return variant.value === 'terminal' ? 'text-emerald-400' : 'text-emerald-600'
  if (delta < 0) return variant.value === 'terminal' ? 'text-red-400' : 'text-red-600'
  return variant.value === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'
}

// RVI: lower = more stable → positive delta (rising volatility) is bad
function rviDeltaClass(delta: number): string {
  if (delta > 0) return variant.value === 'terminal' ? 'text-red-400' : 'text-red-600'
  if (delta < 0) return variant.value === 'terminal' ? 'text-emerald-400' : 'text-emerald-600'
  return variant.value === 'terminal' ? 'text-neutral-400' : 'text-neutral-500'
}

function rciInterpretation(value: number): string {
  if (value >= 90) return `${value.toFixed(1)} = highly competitive`
  if (value >= 70) return `${value.toFixed(1)} = competitive market`
  return `${value.toFixed(1)} = limited competition`
}

function volatilityLabel(bps: number): string {
  if (bps < 20) return 'LOW volatility'
  if (bps < 50) return 'MODERATE volatility'
  return 'HIGH volatility'
}

function volatilityBadgeClass(bps: number): string {
  if (bps < 20) {
    return variant.value === 'terminal'
      ? 'bg-emerald-500/15 text-emerald-400'
      : 'bg-emerald-50 text-emerald-700'
  }
  if (bps < 50) {
    return variant.value === 'terminal'
      ? 'bg-amber-500/15 text-amber-400'
      : 'bg-amber-50 text-amber-700'
  }
  return variant.value === 'terminal'
    ? 'bg-red-500/15 text-red-400'
    : 'bg-red-50 text-red-700'
}

function confidenceBadgeClass(confidence: string): string {
  switch (confidence?.toLowerCase()) {
    case 'high':
      return variant.value === 'terminal'
        ? 'bg-emerald-500/15 text-emerald-400'
        : 'bg-emerald-50 text-emerald-700'
    case 'medium':
      return variant.value === 'terminal'
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-amber-50 text-amber-700'
    default:
      return variant.value === 'terminal'
        ? 'bg-red-500/15 text-red-400'
        : 'bg-red-50 text-red-700'
  }
}

function confidenceDotClass(confidence: string): string {
  switch (confidence?.toLowerCase()) {
    case 'high': return 'bg-emerald-500'
    case 'medium': return 'bg-amber-500'
    default: return 'bg-red-500'
  }
}

function weightConfidenceBarClass(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500'
  if (score >= 0.5) return 'bg-amber-500'
  return 'bg-red-500'
}

function weightConfidenceLabel(score: number): string {
  if (score >= 0.8) return 'High — sufficient provider coverage'
  if (score >= 0.5) return 'Moderate — some providers suppressed'
  return 'Low — limited provider data'
}

// ── SVG sparkline path ─────────────────────────────────────────────────────────

// Builds a `<polyline points="...">` string normalised to a 100×40 viewBox.
function buildSparklinePath(values: number[]): string {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = 100 / (values.length - 1)
  return values
    .map((v, i) => {
      const x = (i * stepX).toFixed(2)
      // SVG y=0 is top — invert so higher values appear visually higher
      const y = (40 - ((v - min) / range) * 36 - 2).toFixed(2)
      return `${x},${y}`
    })
    .join(' ')
}
</script>
