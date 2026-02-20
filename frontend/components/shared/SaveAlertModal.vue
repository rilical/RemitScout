<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && context"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-alert-title"
        aria-label="Close dialog"
        @click.self="close"
      >
        <div
          ref="modalContent"
          class="relative w-full max-w-4xl bg-surface rounded-2xl shadow-2xl p-6 sm:p-8"
          tabindex="-1"
          @keydown.esc="close"
        >
          <button
            class="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
            aria-label="Close modal"
            @click="close"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h2
            id="save-alert-title"
            class="text-h3 font-bold text-neutral-900"
          >
            {{ isEditing ? 'Edit alert' : 'Set an alert' }}
          </h2>
          <p class="mt-2 text-body-sm text-brand-600">
            This also saves the item to your watchlist.
          </p>

          <div class="mt-6 space-y-4">
            <!-- Corridor Selector -->
            <div v-if="showCorridorSelector">
              <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                Corridor
              </label>
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <CountrySelect
                    id="corridor-from"
                    v-model="corridorFrom"
                    label="From country"
                    :exclude-country="corridorTo"
                    placeholder="Type to search..."
                  />
                </div>
                <div class="flex items-center text-neutral-400">
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <CountrySelect
                    id="corridor-to"
                    v-model="corridorTo"
                    label="To country"
                    :exclude-country="corridorFrom"
                    placeholder="Type to search..."
                  />
                </div>
              </div>
              <!-- Current Rate Preview -->
              <div
                v-if="ratePairAvailable"
                class="mt-2 flex items-center justify-between text-body-sm"
              >
                <span class="text-brand-600">Current rate:</span>
                <span class="font-medium text-brand-700">1 {{ ratePairBase }} = {{ currentRateLabel }} {{ ratePairQuote }}</span>
              </div>
              <!-- Corridor Coverage Indicator -->
              <div
                v-if="corridorEligibility && !eligibilityLoading"
                class="mt-2"
              >
                <div
                  v-if="corridorEligibility.isMacroCorridor"
                  class="flex items-center gap-1.5 text-body-sm text-success-600"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="font-medium">Popular corridor</span>
                  <span class="text-success-600">— rates updated frequently</span>
                </div>
                <div
                  v-else
                  class="flex items-center gap-1.5 text-body-sm text-rs-muted"
                >
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Less common corridor</span>
                  <span class="text-neutral-400">— rates refreshed on demand</span>
                </div>
              </div>
              <div
                v-else-if="eligibilityLoading"
                class="mt-2"
              >
                <div class="flex items-center gap-1.5 text-body-sm text-neutral-400">
                  <svg
                    class="w-3.5 h-3.5 animate-spin"
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
                  <span>Checking corridor data...</span>
                </div>
              </div>
            </div>

            <div v-else>
              <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                Target
              </label>
              <div class="rounded-xl border border-rs-border bg-neutral-50 px-4 py-3">
                <div class="text-body-sm font-semibold text-rs-fg">
                  {{ targetLabel }}
                </div>
                <div
                  v-if="ratePairAvailable"
                  class="mt-1 text-body-sm text-neutral-600"
                >
                  1 {{ ratePairBase }} = {{ currentRateLabel }} {{ ratePairQuote }}
                </div>
              </div>
            </div>

            <div>
              <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                Metric
              </label>
              <UniversalDropdown
                v-model="metric"
                :options="metricOptions"
                placeholder="Select metric"
                button-class="h-11"
              >
                <template #selected="{ option }">
                  <div
                    v-if="option?.value === 'sendScore'"
                    class="flex items-center gap-2 w-full"
                  >
                    <svg
                      class="w-4 h-4 text-accent-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <span class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-brand-600">
                      {{ option?.label }}
                    </span>
                    <span
                      v-if="option?.locked"
                      class="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-1.5 py-0.5 text-body-sm font-semibold text-neutral-600 ml-auto"
                    >
                      <svg
                        class="w-3 h-3"
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
                      Plus only
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-600 to-primary-500 px-1.5 py-0.5 text-body-sm font-bold text-white ml-auto"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Plus
                    </span>
                  </div>
                  <span v-else>{{ option?.label || 'Select metric' }}</span>
                </template>
                <template #option="{ option }">
                  <div
                    v-if="option.value === 'sendScore'"
                    class="w-full relative"
                  >
                    <!-- Locked state: two-line layout -->
                    <template v-if="option.locked">
                      <div class="absolute inset-0 rounded bg-neutral-50/80 backdrop-blur-[1px] pointer-events-none" />
                      <div class="relative flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <svg
                            class="w-4 h-4 flex-shrink-0 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          <span class="text-neutral-400">{{ option.label }}</span>
                        </div>
                        <svg
                          class="w-3.5 h-3.5 text-neutral-300 flex-shrink-0"
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
                      <div class="relative flex items-center gap-3 mt-1 ml-6">
                        <NuxtLink
                          to="/plus"
                          class="text-body-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors relative z-10"
                          @mousedown.stop
                          @click.stop="close"
                        >
                          Upgrade to Plus
                        </NuxtLink>
                        <span class="text-neutral-300">·</span>
                        <button
                          type="button"
                          class="text-body-sm text-neutral-500 hover:text-brand-700 transition-colors relative z-10"
                          @mousedown.stop
                          @click.stop="showSmartExplainer = !showSmartExplainer"
                        >
                          What's this?
                        </button>
                      </div>
                    </template>
                    <!-- Unavailable state -->
                    <div
                      v-else-if="option.unavailable"
                      class="flex items-center justify-between"
                    >
                      <div class="flex items-center gap-2">
                        <svg
                          class="w-4 h-4 flex-shrink-0 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <span class="text-neutral-400">{{ option.label }}</span>
                      </div>
                      <span
                        class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-body-sm font-medium text-warning-700 flex-shrink-0"
                        :title="option.unavailableReason"
                      >
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        {{ option.unavailableLabel || 'No data' }}
                      </span>
                    </div>
                    <!-- Available (Plus user) -->
                    <div
                      v-else
                      class="flex items-center justify-between"
                    >
                      <div class="flex items-center gap-2">
                        <svg
                          class="w-4 h-4 flex-shrink-0 text-brand-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <span class="font-semibold text-brand-800">{{ option.label }}</span>
                      </div>
                      <span class="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-body-sm font-bold text-white flex-shrink-0">
                        <svg
                          class="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Plus
                      </span>
                    </div>
                  </div>
                  <span v-else>{{ option.label }}</span>
                </template>
              </UniversalDropdown>

              <!-- Smart Alert Explainer -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-96"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 max-h-96"
                leave-to-class="opacity-0 max-h-0"
              >
                <div
                  v-if="showSmartExplainer"
                  class="mt-2 overflow-hidden rounded-lg border border-brand-200 bg-brand-50 p-4"
                >
	                  <div class="flex items-start gap-3">
	                    <div class="flex-shrink-0 mt-0.5">
	                      <svg
	                        class="w-4 h-4 text-accent-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
	                        />
	                      </svg>
	                      <span :class="selectedMetricOption?.unavailable ? 'text-neutral-400' : 'font-semibold text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-brand-600'">
	                        {{ selectedMetricOption?.label || 'Intelligent Alert' }}
	                      </span>
	                    </div>
	                    <span
	                      v-if="selectedMetricOption?.unavailable"
	                      class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-body-sm font-medium text-warning-700"
	                      :title="selectedMetricOption?.unavailableReason"
	                    >
	                      <svg
	                        class="w-3 h-3"
	                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
	                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
	                        />
	                      </svg>
	                      {{ selectedMetricOption?.unavailableLabel || 'No data' }}
	                    </span>
	                    <span
	                      v-else-if="selectedMetricOption?.locked"
	                      class="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-0.5 text-body-sm font-semibold text-neutral-600"
	                    >
	                      <svg
	                        class="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 11V7a4 4 0 118 0v4m-4 4h-4a2 2 0 01-2-2v-2a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2h-4"
                        />
                      </svg>
                      Locked
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-600 to-primary-500 px-2 py-0.5 text-body-sm font-bold text-white"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Plus
                    </span>
                  </div>
                </div>
              </Transition>

              <div
                v-if="target.type === 'corridor' && corridorEligibility && !eligibilityLoading && smartStatus === 'not_offered'"
                class="mt-2 rounded-lg border border-rs-border bg-neutral-50 px-3 py-2 text-body-sm text-neutral-700"
              >
                <span class="block text-neutral-700">{{ SMART_NOT_OFFERED_COPY }}</span>
                <NuxtLink
                  to="/smart-corridors"
                  class="mt-1 inline-flex text-body-sm font-semibold text-brand-700 hover:text-primary-800"
                >
                  See supported Smart corridors
                </NuxtLink>
              </div>

              <div
                v-if="target.type === 'corridor' && quoteCoverageCopy"
                class="mt-2 rounded-lg border border-rs-border bg-neutral-50 px-3 py-2 text-body-sm text-neutral-700"
              >
                {{ quoteCoverageCopy }}
              </div>

              <div
                v-else-if="target.type === 'corridor' && corridorEligibility && !eligibilityLoading && smartStatus === 'rolling_out'"
                class="mt-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-body-sm text-warning-800"
              >
                {{ smartRollingOutCopy }}
              </div>

              <div
                v-else-if="target.type === 'corridor' && corridorEligibility && !eligibilityLoading && smartStatus === 'available'"
                class="mt-2 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-body-sm text-success-800"
              >
                {{ SMART_AVAILABLE_COPY }}
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                  Condition
                </label>
                <UniversalDropdown
                  v-model="comparator"
                  :options="comparatorOptions"
                  placeholder="Select condition"
                  button-class="h-11"
                  :disabled="formLocked"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="save-alert-value"
                  class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2"
                >
                  Value
                </label>
                <input
                  id="save-alert-value"
                  v-model.number="value"
                  type="number"
                  :step="valueStep"
                  :min="valueMin"
                  :max="valueMax"
                  :disabled="formLocked"
                  class="h-11 w-full rounded-lg border border-neutral-300 bg-surface px-3 text-rs-fg focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
              </div>

              <div v-if="showCurrency">
                <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                  Currency
                </label>
                <UniversalDropdown
                  v-model="currency"
                  :options="currencyOptions"
                  placeholder="Select currency"
                  button-class="h-11"
                  :disabled="formLocked"
                />
              </div>
              <div v-else>
                <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                  Currency
                </label>
                <div
                  class="h-11 w-full rounded-lg border border-rs-border bg-neutral-50 px-3 text-body-sm text-neutral-400 flex items-center"
                >
                  Not required
                </div>
              </div>
            </div>

            <div>
              <label class="block text-body-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">
                Frequency
              </label>
              <UniversalDropdown
                v-model="frequency"
                :options="frequencyOptions"
                placeholder="Select frequency"
                button-class="h-11"
                :disabled="formLocked"
              />
              <p class="mt-2 text-body-sm text-rs-muted">
                Free plans are weekly. Plus unlocks daily alerts.
              </p>
            </div>

            <ErrorState
              v-if="error"
              mode="inline"
              variant="consumer"
              :message="error"
            />

            <div
              v-if="limitState"
              class="rounded-xl border border-rs-border bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-neutral-800">{{ limitTitle }}</span>
                <span class="text-body-sm text-rs-muted">{{ limitCount }}/{{ limitState.limit }}</span>
              </div>
              <div
                v-if="limitItems.length"
                class="mb-3 rounded-lg border border-rs-border bg-surface max-h-40 overflow-y-auto"
              >
                <div
                  v-for="item in limitItems"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2 last:border-b-0"
                >
                  <div class="min-w-0">
                    <div class="text-body-sm font-medium text-neutral-800 truncate">
                      {{ item.label }}
                    </div>
                    <div
                      v-if="item.meta"
                      class="text-body-sm text-rs-muted truncate"
                    >
                      {{ item.meta }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-body-sm font-semibold text-danger-600 hover:text-danger-600"
                    @click="handleLimitRemove(item.id)"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  v-if="!isPlus"
                  type="button"
                  class="h-10 flex-1 rounded-lg bg-brand-600 text-white text-body-sm font-semibold hover:bg-brand-700 transition-colors"
                  @click="handleUpgrade"
                >
                  Upgrade to Plus
                </button>
                <button
                  type="button"
                  class="h-10 flex-1 rounded-lg border border-neutral-300 text-neutral-700 text-body-sm font-semibold hover:bg-neutral-100 transition-colors"
                  @click="handleManage"
                >
                  {{ manageLabel }}
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-rs-border bg-surface px-4 py-2 text-body-sm font-semibold text-neutral-800 hover:bg-neutral-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              @click="close"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="formLocked"
              class="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:bg-neutral-300 disabled:text-rs-muted disabled:cursor-not-allowed"
              @click="save"
            >
              {{ isEditing ? 'Update alert' : 'Create alert' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <SuccessToast
    ref="successToastRef"
    :title="toastTitle"
    :message="toastMessage"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import type { AlertComparator, AlertFrequency, AlertRule, WatchTarget } from '~/types/tracking'
import type { Method } from '~/types/remit'
import UniversalDropdown from '~/components/shared/UniversalDropdown.vue'
import CountrySelect from '~/components/shared/CountrySelect.vue'
import SuccessToast from '~/components/shared/SuccessToast.vue'
import { ErrorState } from '~/ui/states'
import { COUNTRIES, getCountryByCode, getCurrencyDisplay } from '~/utils/countries-currencies'
import { useCorridorCurrencies } from '~/composables/useCorridorCurrencies'
import { useFocusTrap } from '~/composables/useFocusTrap'

const { isOpen, context, close: closeModal } = useSaveAlertModal()
const alerts = useAlerts()
const watchlist = useWatchlist()
const { isPlus } = useEntitlements()
const { request } = useApi()
const route = useRoute()

// Close modal on route change
watch(() => route.fullPath, () => {
  if (isOpen.value) {
    closeModal()
  }
})

const modalContent = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalContent)
const error = ref<string>('')
const initializing = ref(false)
const successToastRef = ref<{ show: () => void, hide: () => void } | null>(null)
const toastTitle = ref('')
const toastMessage = ref('')
const limitState = ref<{ feature: 'watchlist' | 'alert', limit: number } | null>(null)
const showSmartExplainer = ref(false)

const shouldRenderModal = computed(() => isOpen.value && Boolean(context.value))

watch(
  () => shouldRenderModal.value,
  async (open) => {
    if (!open) {
      deactivate()
      return
    }

    await nextTick()
    activate()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  deactivate()
})

const metric = ref<AlertRule['metric']>('rate')
const comparator = ref<AlertComparator>('gte')
const value = ref<number>(0)
const frequency = ref<AlertFrequency>('weekly')
const currency = ref<string>('')

const targetType = computed(() => context.value?.target?.type ?? 'corridor')
const showCorridorSelector = computed(() => targetType.value === 'corridor')

// Corridor selection
const corridorFrom = ref('US')
const corridorTo = ref('PH')
const corridorMethod = ref<Method>('bank')

const sortedCountries = computed(() => (
  [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name))
))

const fromDropdownOptions = computed(() => {
  return sortedCountries.value.map(country => ({
    label: `${country.flag} ${country.code} - ${country.name}`,
    value: country.code,
  }))
})

const toDropdownOptions = computed(() => {
  return sortedCountries.value.map(country => ({
    label: `${country.flag} ${country.code} - ${country.name}`,
    value: country.code,
  }))
})

const { availableFromCurrencies, availableToCurrencies } = useCorridorCurrencies(
  corridorFrom,
  corridorTo,
)

const corridorFromCurrency = computed(() => {
  const preferred = getCountryByCode(corridorFrom.value)?.currency?.toUpperCase() || ''
  if (preferred && availableFromCurrencies.value.includes(preferred)) {
    return preferred
  }
  return availableFromCurrencies.value[0] || preferred
})

const corridorToCurrency = computed(() => {
  const preferred = getCountryByCode(corridorTo.value)?.currency?.toUpperCase() || ''
  if (preferred && availableToCurrencies.value.includes(preferred)) {
    return preferred
  }
  return availableToCurrencies.value[0] || preferred
})

const target = computed<WatchTarget>(() => {
  const ctxTarget = context.value?.target
  if (!ctxTarget || ctxTarget.type === 'corridor') {
    return {
      type: 'corridor',
      from: corridorFrom.value,
      to: corridorTo.value,
      method: corridorMethod.value,
    }
  }
  return ctxTarget
})

const targetLabel = computed(() => {
  switch (target.value.type) {
    case 'corridor':
      return `${target.value.from} → ${target.value.to}${target.value.method ? ` • ${target.value.method}` : ''}`
    case 'fxPair':
      return `${target.value.base}/${target.value.quote}`
    case 'pulseChart':
      return `Pulse chart ${target.value.chartId}`
    case 'guide':
      return `Guide: ${target.value.slug}`
    default:
      return 'Alert target'
  }
})

const contextLabel = computed(() => context.value?.label || targetLabel.value)

const ratePairBase = computed(() => {
  if (target.value.type === 'fxPair') return target.value.base
  if (target.value.type === 'corridor') return corridorFromCurrency.value
  return ''
})

const ratePairQuote = computed(() => {
  if (target.value.type === 'fxPair') return target.value.quote
  if (target.value.type === 'corridor') return corridorToCurrency.value
  return ''
})

const ratePairAvailable = computed(() => {
  return !!ratePairBase.value && !!ratePairQuote.value && ratePairBase.value !== ratePairQuote.value
})

const currentRateValue = ref<number | null>(null)
const currentRateLabel = computed(() => {
  if (currentRateValue.value === null) return '—'
  return currentRateValue.value.toFixed(4)
})

type CorridorEligibility = {
  corridorId: string
  isMacroCorridor: boolean
  smartAlerts: {
    programEligible: boolean
    status: 'available' | 'rolling_out' | 'not_offered'
    eligible: boolean
    reason: string | null
    dataProgress: {
      sampleDays: number | null
      minSampleDays: number
      confidence: number | null
      minConfidence: number
    }
    confidence: number | null
    sampleDays: number | null
    requirements: {
      minConfidence: number
      minSampleDays: number
    }
  }
  regularAlerts: {
    eligible: boolean
    refreshCadence: string
    note: string
    fxCoverage?: {
      supported: boolean
    }
    quoteCoverage?: {
      supported: boolean
      eligibleProviderCount: number
      observedProviderCount: number
      latestQuoteCollectedAt: string | null
      fresh: boolean
      supportedMetrics: Array<'recipientGets' | 'fee' | 'totalCost'>
    }
  }
}

const corridorEligibility = ref<CorridorEligibility | null>(null)
const eligibilityLoading = ref(false)

const SMART_NOT_OFFERED_COPY = 'Smart Alerts are available for select major corridors we track continuously.'
const SMART_AVAILABLE_COPY = 'Smart Alerts are available for this corridor.'

const smartProgramEligible = computed(() => corridorEligibility.value?.smartAlerts?.programEligible === true)
const smartStatus = computed(() => corridorEligibility.value?.smartAlerts?.status ?? null)
const smartDataProgress = computed(() => corridorEligibility.value?.smartAlerts?.dataProgress ?? null)

const smartRollingOutCopy = computed(() => {
  const progress = smartDataProgress.value
  const sampleDays = progress?.sampleDays ?? corridorEligibility.value?.smartAlerts?.sampleDays ?? null
  const minSampleDays = progress?.minSampleDays ?? corridorEligibility.value?.smartAlerts?.requirements?.minSampleDays ?? 21
  if (sampleDays === null) {
    return `Collecting data for Smart Alerts: 0/${minSampleDays} days.`
  }
  return `Collecting data for Smart Alerts: ${sampleDays}/${minSampleDays} days.`
})

const loadCorridorEligibility = async () => {
  if (!isOpen.value || import.meta.server) {
    corridorEligibility.value = null
    return
  }

  if (target.value.type !== 'corridor') {
    corridorEligibility.value = null
    return
  }

  eligibilityLoading.value = true
  try {
    const data = await request<{ success: boolean } & CorridorEligibility>('/alerts/corridor-eligibility', {
      query: {
        from: corridorFrom.value,
        to: corridorTo.value,
        fromCurrency: corridorFromCurrency.value,
        toCurrency: corridorToCurrency.value,
        method: corridorMethod.value,
      },
      timeoutMs: 5000,
      retries: 0,
    })
    if (data?.success) {
      corridorEligibility.value = data
    }
    else {
      corridorEligibility.value = null
    }
  }
  catch {
    corridorEligibility.value = null
  }
  finally {
    eligibilityLoading.value = false
  }
}

const quoteCoverage = computed(() => corridorEligibility.value?.regularAlerts?.quoteCoverage ?? null)
const quoteCoverageSupported = computed(() => quoteCoverage.value?.supported === true)

const quoteCoverageCopy = computed(() => {
  if (eligibilityLoading.value) return null
  if (!corridorEligibility.value) return null
  if (quoteCoverageSupported.value) return null
  return 'Quote-based alerts aren’t available for this corridor yet. Use an FX Rate Alert instead.'
})

const smartAlertDisabledReason = computed(() => {
  if (!isPlus.value) return 'plus_required'
  if (eligibilityLoading.value) return 'loading'
  if (!corridorEligibility.value) return 'unknown'
  if (corridorEligibility.value.smartAlerts.programEligible === false) return 'not_offered'
  if (corridorEligibility.value.smartAlerts.status === 'rolling_out') return 'rolling_out'
  if (corridorEligibility.value.smartAlerts.status !== 'available') return 'unknown'
  return null
})

const smartAlertDisabledMessage = computed(() => {
  switch (smartAlertDisabledReason.value) {
    case 'plus_required':
      return 'Upgrade to Plus to use Smart Alerts'
    case 'loading':
      return 'Checking corridor data...'
    case 'unknown':
      return 'Unable to verify corridor data availability'
    case 'not_offered':
      return SMART_NOT_OFFERED_COPY
    case 'rolling_out':
      return smartRollingOutCopy.value
    default:
      return null
  }
})

const loadCurrentRate = async () => {
  if (!ratePairAvailable.value || !isOpen.value || import.meta.server) {
    currentRateValue.value = null
    return
  }
  try {
    const data = await request<{ rate?: number }>('/rates/spot', {
      query: { base: ratePairBase.value, quote: ratePairQuote.value },
      timeoutMs: 5000,
      retries: 0,
    })
    currentRateValue.value = typeof data?.rate === 'number' ? data.rate : null
  }
  catch {
    currentRateValue.value = null
  }
}

watch([isOpen, ratePairBase, ratePairQuote], () => {
  void loadCurrentRate()
})

watch([isOpen, corridorFrom, corridorTo, corridorFromCurrency, corridorToCurrency], () => {
  void loadCorridorEligibility()
})

	const metricOptions = computed(() => {
	  const options = []
	  switch (target.value.type) {
	    case 'corridor':
      options.push({ value: 'rate' as const, label: 'FX rate' })
      options.push(
        {
          value: 'recipientGets' as const,
          label: 'Recipient gets',
          disabled: !quoteCoverageSupported.value && metric.value !== 'recipientGets',
        },
        {
          value: 'totalCost' as const,
          label: 'Total cost',
          disabled: !quoteCoverageSupported.value && metric.value !== 'totalCost',
        },
        {
          value: 'fee' as const,
          label: 'Fee',
          disabled: !quoteCoverageSupported.value && metric.value !== 'fee',
        },
      )
      {
        const shouldIncludeSmart = metric.value === 'sendScore' || smartProgramEligible.value
        if (!shouldIncludeSmart) break

        const reason = smartAlertDisabledReason.value
        const smartDisabled = reason !== null
        const isDataIssue = reason && !['plus_required', 'loading'].includes(reason)
        const isLoading = reason === 'loading'
        const unavailableLabel = !isDataIssue
          ? undefined
          : reason === 'rolling_out'
            ? 'Collecting'
            : reason === 'not_offered'
              ? 'Not offered'
              : reason === 'unknown'
                ? 'Unknown'
                : 'No data'
        options.push({
          value: 'sendScore' as const,
          label: 'Intelligent Alert',
          disabled: smartDisabled,
          locked: !isPlus.value,
          unavailable: isDataIssue,
          unavailableLabel,
          loading: isLoading,
          unavailableReason: smartAlertDisabledMessage.value,
        })
      }
      break
    case 'fxPair':
      options.push({ value: 'rate' as const, label: 'FX rate' })
      break
    case 'pulseChart':
      options.push({ value: 'index' as const, label: 'Index' })
      break
    case 'guide':
      options.push({ value: 'index' as const, label: 'Index' })
      break
    default:
      options.push({ value: 'rate' as const, label: 'Rate' })
	  }
	  return options
	})

	type MetricOption = {
	  value: AlertRule['metric']
	  label: string
	  disabled?: boolean
	  locked?: boolean
	  unavailable?: boolean
	  unavailableLabel?: string | undefined
	  loading?: boolean
	  unavailableReason?: string | undefined
	}

	const selectedMetricOption = computed<MetricOption | null>(() => {
	  const match = metricOptions.value.find((option: any) => {
	    const optionValue = typeof option === 'string' ? option : option?.value
	    return optionValue === metric.value
	  })
	  if (!match || typeof match === 'string') return null
	  return match as MetricOption
	})

	const firstEnabledMetric = computed<AlertRule['metric']>(() => {
	  for (const option of metricOptions.value) {
	    if (typeof option === 'string') return option as AlertRule['metric']
	    if (!option.disabled) return option.value as AlertRule['metric']
  }
  return 'rate'
})

const metricReady = computed(() => {
  if (!metric.value) return false
  return metricOptions.value.some((option) => {
    const optionValue = typeof option === 'string' ? option : option.value
    return optionValue === metric.value
  })
})

const comparatorOptions = computed(() => [
  { value: 'gte' as const, label: '≥' },
  { value: 'lte' as const, label: '≤' },
  { value: 'gt' as const, label: '>' },
  { value: 'lt' as const, label: '<' },
])

const currencyOptions = computed(() => {
  if (target.value.type === 'corridor') {
    const values = Array.from(new Set([
      ...availableFromCurrencies.value,
      ...availableToCurrencies.value,
    ].map(code => code.toUpperCase()).filter(Boolean)))
    return values.map(code => ({
      value: code,
      label: code,
    }))
  }
  if (target.value.type === 'fxPair') {
    const values = [target.value.base, target.value.quote].filter(Boolean)
    return values.map(code => ({
      value: code,
      label: code,
    }))
  }
  return []
})

const frequencyOptions = computed(() => {
  const isSmart = metric.value === 'sendScore'
  return [
    { value: 'weekly' as const, label: 'Weekly' },
    { value: 'daily' as const, label: 'Daily', disabled: !isPlus.value || isSmart },
  ]
})

const limitTitle = computed(() => {
  if (!limitState.value) return ''
  return limitState.value.feature === 'watchlist' ? 'Watchlist limit reached' : 'Alert limit reached'
})

const limitCount = computed(() => {
  if (!limitState.value) return 0
  return limitState.value.feature === 'watchlist'
    ? watchlist.count.value
    : alerts.count.value
})

const manageLabel = computed(() => {
  if (!limitState.value) return ''
  return limitState.value.feature === 'watchlist' ? 'Manage watchlist' : 'Manage alerts'
})

const managePath = computed(() => {
  if (!limitState.value) return ''
  return limitState.value.feature === 'watchlist'
    ? '/dashboard?tab=watchlist'
    : '/dashboard?tab=alerts'
})

const limitMetricLabels: Record<string, string> = {
  recipientGets: 'Recipient gets',
  totalCost: 'Total cost',
  fee: 'Fee',
  midMarketRate: 'Mid-market rate',
  rate: 'Rate',
  sendScore: 'Intelligent alert',
  index: 'Index',
}

const limitComparatorLabels: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
}

const formatLimitAlertValue = (metric: string, threshold: number) => {
  if (!Number.isFinite(threshold)) return '—'
  if (metric === 'sendScore') return Math.round(threshold).toString()
  if (metric === 'rate' || metric === 'midMarketRate') return threshold.toFixed(4)
  return threshold.toFixed(2)
}

const limitItems = computed(() => {
  if (!limitState.value) return []
  const limit = limitState.value.limit
  if (limitState.value.feature === 'alert') {
    const items = alerts.alerts.value.map((alert) => {
      const label = watchlist.findById(alert.watchlistItemId)?.label || 'Alert'
      const metricLabel = limitMetricLabels[alert.rule.metric] || 'Alert'
      const comparatorLabel = limitComparatorLabels[alert.rule.comparator] || alert.rule.comparator
      const valueLabel = formatLimitAlertValue(alert.rule.metric, alert.rule.value)
      const currencyLabel = alert.rule.currency ? ` ${alert.rule.currency}` : ''
      return {
        id: alert.id,
        label,
        meta: `${metricLabel} ${comparatorLabel} ${valueLabel}${currencyLabel}`.trim(),
      }
    })
    return limit > 0 ? items.slice(0, limit) : items
  }

  const items = watchlist.items.value.map(item => ({
    id: item.id,
    label: item.label,
    meta: undefined,
  }))
  return limit > 0 ? items.slice(0, limit) : items
})

const handleLimitRemove = async (id: string) => {
  if (!limitState.value) return
  if (limitState.value.feature === 'watchlist') {
    await watchlist.remove(id)
  }
  else {
    await alerts.remove(id)
  }

  if (limitState.value.limit > 0 && limitCount.value < limitState.value.limit) {
    limitState.value = null
  }
}

const isSmartMetric = computed(() => metric.value === 'sendScore')
const showCurrency = computed(() => (
  target.value.type === 'corridor'
  && !isSmartMetric.value
  && metric.value !== 'rate'
  && metric.value !== 'midMarketRate'
))
const valueStep = computed(() => {
  if (isSmartMetric.value) return 1
  if (metric.value === 'rate' || metric.value === 'midMarketRate') return 0.0001
  return 0.01
})
const valueMin = computed(() => (isSmartMetric.value ? 0 : undefined))
const valueMax = computed(() => (isSmartMetric.value ? 100 : undefined))
const formLocked = computed(() => !metricReady.value)

const roundForMetric = (raw: number, metricValue: AlertRule['metric']) => {
  if (metricValue === 'sendScore') return Math.round(raw)
  if (metricValue === 'rate' || metricValue === 'midMarketRate') return Math.round(raw * 10000) / 10000
  return Math.round(raw * 100) / 100
}

const defaultValueForMetric = (metricValue: AlertRule['metric']) => {
  if (metricValue === 'sendScore') return 90
  if (metricValue === 'rate' || metricValue === 'midMarketRate') {
    return roundForMetric(currentRateValue.value ?? 0, metricValue)
  }
  return 0
}

const defaultCurrencyForMetric = (metricValue: AlertRule['metric']) => {
  if (target.value.type !== 'corridor') return ''
  if (metricValue === 'totalCost' || metricValue === 'fee') return corridorFromCurrency.value
  return corridorToCurrency.value
}

function close() {
  closeModal()
}

async function handleUpgrade() {
  await navigateTo('/plus')
  close()
}

async function handleManage() {
  if (!managePath.value) {
    close()
    return
  }
  await navigateTo(managePath.value)
  close()
}

const isEditing = computed(() => !!context.value?.alertId)
const shouldDefaultToSmartAlert = computed(() => (
  (context.value?.source === 'alerts' || context.value?.source === 'pulse')
  && isPlus.value
  && target.value.type === 'corridor'
  && corridorEligibility.value?.smartAlerts?.status === 'available'
))

async function save() {
  error.value = ''
  limitState.value = null

  if (isEditing.value && context.value?.alertId) {
    await alerts.update(context.value.alertId, {
      frequency: frequency.value,
      rule: {
        metric: metric.value,
        comparator: comparator.value,
        value: value.value,
        currency: currency.value || undefined,
      },
    })
    close()
    toastTitle.value = 'Alert updated'
    toastMessage.value = `${contextLabel.value} updated`
    successToastRef.value?.show()
    return
  }

  const res = await alerts.createForTarget(target.value, {
    label: contextLabel.value,
    frequency: frequency.value,
    enabled: true,
    rule: {
      metric: metric.value,
      comparator: comparator.value,
      value: value.value,
      currency: currency.value || undefined,
    },
  })

  if (res.status === 'watchlist_limit_reached') {
    limitState.value = { feature: 'watchlist', limit: res.limit }
    error.value = res.message
    return
  }

  if (res.status === 'alert_limit_reached') {
    limitState.value = { feature: 'alert', limit: res.limit }
    error.value = res.message
    return
  }

  if (res.status === 'error') {
    limitState.value = null
    error.value = res.message
    return
  }

  close()
  limitState.value = null
  if (res.status === 'created') {
    toastTitle.value = 'Rate alert created!'
    toastMessage.value = `We'll notify you about ${contextLabel.value}`
    successToastRef.value?.show()
  }
  else if (res.status === 'already_exists') {
    toastTitle.value = 'Alert exists'
    toastMessage.value = 'You already have an alert for this item'
    successToastRef.value?.show()
  }
}

const syncCurrency = () => {
  if (!showCurrency.value) {
    currency.value = ''
    return
  }
  const options = currencyOptions.value.map(option => option.value)
  if (!options.length) {
    currency.value = ''
    return
  }
  if (!options.includes(currency.value)) {
    currency.value = defaultCurrencyForMetric(metric.value) || options[0]
  }
}

watch(
  () => isOpen.value,
  async (open) => {
    if (!open) {
      error.value = ''
      limitState.value = null
      showSmartExplainer.value = false
      document.body.style.overflow = ''
      return
    }

    initializing.value = true

    if (context.value?.target?.type === 'corridor') {
      corridorFrom.value = context.value.target.from
      corridorTo.value = context.value.target.to
      corridorMethod.value = (context.value.target.method as Method) || 'bank'
    }

    if (context.value?.alertId) {
      const existingAlert = alerts.findById(context.value.alertId)
      if (existingAlert) {
        metric.value = existingAlert.rule.metric
        comparator.value = existingAlert.rule.comparator
        value.value = existingAlert.rule.value
        frequency.value = existingAlert.frequency
        currency.value = existingAlert.rule.currency || defaultCurrencyForMetric(existingAlert.rule.metric)
      }
    }
    else {
      const defaultMetric = shouldDefaultToSmartAlert.value
        ? 'sendScore'
        : firstEnabledMetric.value
      metric.value = defaultMetric
      comparator.value = 'gte'
      value.value = defaultValueForMetric(metric.value)
      frequency.value = isPlus.value && defaultMetric !== 'sendScore' ? 'daily' : 'weekly'
      currency.value = showCurrency.value ? defaultCurrencyForMetric(metric.value) : ''
    }

    await nextTick()
    syncCurrency()
    modalContent.value?.focus()
    document.body.style.overflow = 'hidden'
    initializing.value = false
  },
)

watch([corridorFrom, corridorTo], () => {
  if (initializing.value) return
  syncCurrency()
})

watch(currencyOptions, () => {
  if (initializing.value) return
  syncCurrency()
})

watch(currentRateValue, (rate) => {
  if (initializing.value || isEditing.value) return
  if (metric.value === 'rate' && rate !== null) {
    value.value = roundForMetric(rate, 'rate')
  }
})

watch(metric, (nextMetric) => {
  if (initializing.value) return
  if (nextMetric === 'sendScore') {
    if (!isPlus.value) {
      error.value = 'Smart alerts are available on Plus plans.'
      metric.value = firstEnabledMetric.value
      return
    }
    if (smartAlertDisabledReason.value) {
      error.value = smartAlertDisabledMessage.value || 'Unable to verify corridor data availability'
      metric.value = firstEnabledMetric.value
      return
    }
    currency.value = ''
    frequency.value = 'weekly'
  }
  value.value = defaultValueForMetric(nextMetric)
  if (nextMetric !== 'sendScore') {
    syncCurrency()
  }
})

watch([isPlus, metric, frequency], ([plus, nextMetric, nextFrequency]) => {
  if (nextMetric === 'sendScore' && nextFrequency !== 'weekly') {
    frequency.value = 'weekly'
    return
  }
  if (!plus && nextFrequency === 'daily') {
    frequency.value = 'weekly'
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
