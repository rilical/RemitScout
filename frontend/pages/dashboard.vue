<template>
  <div class="min-h-screen bg-slate-50 py-10">
    <div class="mx-auto w-full max-w-6xl px-4">
      <!-- Signed-out gate (intent: increase sign-ups) -->
      <div
        v-if="!isAuthenticated"
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
      >
        <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">
              Your Transfer Tracker
            </h1>
            <p class="mt-2 max-w-2xl text-base text-slate-600">
              Save corridors, set alerts, and see your comparison history — all in one place.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <NuxtLink
              to="/sign-up"
              class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Create free account
            </NuxtLink>
            <NuxtLink
              to="/sign-in"
              class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 motion-safe:transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Sign in
            </NuxtLink>
          </div>
        </div>

        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div class="text-sm font-semibold text-slate-900">
              Watchlist
            </div>
            <p class="mt-2 text-sm text-slate-600">
              Save your corridors and providers so you don’t have to re-search.
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div class="text-sm font-semibold text-slate-900">
              Alerts
            </div>
            <p class="mt-2 text-sm text-slate-600">
              Get notified when rates hit your target (or fees drop).
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div class="text-sm font-semibold text-slate-900">
              Compare history
            </div>
            <p class="mt-2 text-sm text-slate-600">
              Track your recent comparisons and re-run them in one click.
            </p>
          </div>
        </div>

        <div class="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div class="text-sm font-semibold text-blue-900">
            Why we ask you to create an account
          </div>
          <p class="mt-1 text-sm text-blue-800">
            Your dashboard becomes your “home base” for transfers — synced across devices once we connect a backend.
          </p>
        </div>
      </div>

      <!-- Signed-in dashboard -->
      <div
        v-else
        class="space-y-6"
      >
        <!-- Welcome Header -->
        <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6">
          <h1 class="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
            Welcome Back, {{ user?.name || 'User' }}
          </h1>
          <p class="text-slate-600">
            Your transfer command center
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Sidebar Navigation -->
          <aside class="lg:w-64 flex-shrink-0">
            <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 sticky top-6">
              <!-- Plan Badge -->
              <div class="mb-6">
                <div
                  class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold w-full justify-center"
                  :class="isPlus ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200' : 'bg-slate-100 text-slate-700 border-2 border-slate-200'"
                >
                  <svg
                    v-if="isPlus"
                    class="w-4 h-4"
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
                  {{ isPlus ? 'Plus Member' : 'Free Plan' }}
                </div>
                <NuxtLink
                  v-if="!isPlus"
                  to="/plus"
                  class="mt-3 w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                >
                  Upgrade to Plus
                </NuxtLink>
              </div>

              <!-- Navigation -->
              <nav class="space-y-2">
                <button
                  v-for="t in tabs"
                  :key="t.id"
                  type="button"
                  class="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200"
                  :class="activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100'"
                  @click="setTab(t.id)"
                >
                  <svg
                    v-if="t.id === 'overview'"
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <svg
                    v-else-if="t.id === 'watchlist'"
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <svg
                    v-else-if="t.id === 'alerts'"
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
                  <svg
                    v-else-if="t.id === 'history'"
                    class="w-5 h-5"
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
                  <svg
                    v-else
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{{ t.label }}</span>
                </button>
              </nav>
            </div>
          </aside>

          <!-- Main Content Area -->
          <main class="flex-1 min-w-0">
            <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
              <!-- Overview -->
              <div
                v-if="activeTab === 'overview'"
                class="p-8"
              >
                <!-- Quick Actions -->
                <div class="mb-8">
                  <h2 class="text-xl font-bold text-slate-900 mb-4">
                    Quick Actions
                  </h2>
                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <NuxtLink
                      to="/send-money"
                      class="group rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            class="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Compare Rates</div>
                          <div class="text-sm text-slate-600">Find the best provider</div>
                        </div>
                      </div>
                    </NuxtLink>
                    <button
                      type="button"
                      class="group rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 hover:border-emerald-300 hover:shadow-lg transition-all text-left"
                      @click="openCreateAlert"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            class="w-7 h-7 text-white"
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
                        </div>
                        <div>
                          <div class="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            Create Alert
                          </div>
                          <div class="text-sm text-slate-600">
                            Get rate notifications
                          </div>
                        </div>
                      </div>
                    </button>
                    <NuxtLink
                      to="/learn"
                      class="group rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-amber-50 to-white p-6 hover:border-amber-300 hover:shadow-lg transition-all"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            class="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <div>
                          <div class="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Learn</div>
                          <div class="text-sm text-slate-600">Read guides & tips</div>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                </div>

                <!-- Stats Overview -->
                <div class="mb-8">
                  <h2 class="text-xl font-bold text-slate-900 mb-4">
                    Your Stats
                  </h2>
                  <div class="grid gap-6 sm:grid-cols-3">
                    <button
                      type="button"
                      class="group rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-xl transition-all text-left"
                      @click="setTab('watchlist')"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-600 transition-colors flex items-center justify-center">
                          <svg
                            class="w-6 h-6 text-blue-600 group-hover:text-white transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                      </div>
                      <div class="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Watchlist
                      </div>
                      <div class="text-4xl font-bold text-slate-900 mb-2">
                        {{ watchlistCount }}
                      </div>
                      <div class="text-sm text-slate-500 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        View all
                        <svg
                          class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                    </button>
                    <button
                      type="button"
                      class="group rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-xl transition-all text-left"
                      @click="setTab('alerts')"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-600 transition-colors flex items-center justify-center">
                          <svg
                            class="w-6 h-6 text-blue-600 group-hover:text-white transition-colors"
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
                        </div>
                      </div>
                      <div class="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Alerts
                      </div>
                      <div class="text-4xl font-bold text-slate-900 mb-2">
                        {{ alertsCount }}
                      </div>
                      <div class="text-sm text-slate-500 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        View all
                        <svg
                          class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                    </button>
                    <button
                      type="button"
                      class="group rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-xl transition-all text-left"
                      @click="setTab('history')"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-600 transition-colors flex items-center justify-center">
                          <svg
                            class="w-6 h-6 text-blue-600 group-hover:text-white transition-colors"
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
                        </div>
                      </div>
                      <div class="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Comparisons
                      </div>
                      <div class="text-4xl font-bold text-slate-900 mb-2">
                        {{ compareCount }}
                      </div>
                      <div class="text-sm text-slate-500 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        View all
                        <svg
                          class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                    </button>
                  </div>

                  <!-- Add Watchlist & Set Alert -->
                  <div class="grid gap-6 lg:grid-cols-2 mb-8">
                    <!-- Add to Watchlist -->
                    <div class="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
                      <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <svg
                            class="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900">
                          Add to Watchlist
                        </h3>
                      </div>
                      <form
                        class="space-y-4"
                        @submit.prevent="handleAddWatchlist"
                      >
                        <div>
                          <label class="block text-sm font-semibold text-slate-700 mb-2">From Currency</label>
                          <select
                            v-model="newWatchlist.from"
                            class="w-full rounded-lg border-2 border-slate-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="US">
                              USD - US Dollar
                            </option>
                            <option value="GB">
                              GBP - British Pound
                            </option>
                            <option value="EU">
                              EUR - Euro
                            </option>
                            <option value="CA">
                              CAD - Canadian Dollar
                            </option>
                            <option value="AU">
                              AUD - Australian Dollar
                            </option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-semibold text-slate-700 mb-2">To Currency</label>
                          <select
                            v-model="newWatchlist.to"
                            class="w-full rounded-lg border-2 border-slate-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="PH">
                              PHP - Philippine Peso
                            </option>
                            <option value="MX">
                              MXN - Mexican Peso
                            </option>
                            <option value="IN">
                              INR - Indian Rupee
                            </option>
                            <option value="PK">
                              PKR - Pakistani Rupee
                            </option>
                            <option value="BD">
                              BDT - Bangladeshi Taka
                            </option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          Add to Watchlist
                        </button>
                      </form>
                    </div>

                    <!-- Set Alert -->
                    <div class="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
                      <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <svg
                            class="w-5 h-5 text-emerald-600"
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
                        </div>
                        <h3 class="text-lg font-bold text-slate-900">
                          Set Rate Alert
                        </h3>
                      </div>
                      <form
                        class="space-y-4"
                        @submit.prevent="handleSetAlert"
                      >
                        <div>
                          <label class="block text-sm font-semibold text-slate-700 mb-2">Corridor</label>
                          <div class="grid grid-cols-2 gap-2">
                            <select
                              v-model="newAlert.from"
                              class="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="US">
                                USD
                              </option>
                              <option value="GB">
                                GBP
                              </option>
                              <option value="EU">
                                EUR
                              </option>
                            </select>
                            <select
                              v-model="newAlert.to"
                              class="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="PH">
                                PHP
                              </option>
                              <option value="MX">
                                MXN
                              </option>
                              <option value="IN">
                                INR
                              </option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label class="block text-sm font-semibold text-slate-700 mb-2">Alert When Rate</label>
                          <div class="grid grid-cols-2 gap-2">
                            <select
                              v-model="newAlert.comparator"
                              class="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="gte">
                                ≥ (Above)
                              </option>
                              <option value="lte">
                                ≤ (Below)
                              </option>
                            </select>
                            <input
                              v-model.number="newAlert.targetRate"
                              type="number"
                              step="0.01"
                              placeholder="Rate"
                              class="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                          </div>
                        </div>
                        <div>
                          <label class="block text-sm font-semibold text-slate-700 mb-2">Notify Me</label>
                          <select
                            v-model="newAlert.frequency"
                            class="w-full rounded-lg border-2 border-slate-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="realtime">
                              Real-time (immediate)
                            </option>
                            <option value="hourly">
                              Hourly digest
                            </option>
                            <option value="daily">
                              Daily digest
                            </option>
                            <option value="weekly">
                              Weekly digest
                            </option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                          Create Alert
                        </button>
                      </form>
                    </div>
                  </div>

                  <!-- Exchange Rate Graph -->
                  <div class="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg mb-8">
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <svg
                            class="w-5 h-5 text-blue-600"
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
                        <div>
                          <h3 class="text-lg font-bold text-slate-900">
                            Exchange Rate Trend
                          </h3>
                          <p class="text-sm text-slate-600">
                            USD → PHP (Last 7 days)
                          </p>
                        </div>
                      </div>
                      <select
                        v-model="graphTimeframe"
                        class="rounded-lg border-2 border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="7d">
                          7 Days
                        </option>
                        <option value="30d">
                          30 Days
                        </option>
                        <option value="90d">
                          90 Days
                        </option>
                      </select>
                    </div>
                    <div class="h-64 bg-slate-50 rounded-xl border-2 border-slate-200 flex items-center justify-center relative overflow-hidden">
                      <!-- Simple SVG Graph -->
                      <svg
                        class="w-full h-full"
                        viewBox="0 0 400 200"
                        preserveAspectRatio="none"
                      >
                        <!-- Grid lines -->
                        <defs>
                          <pattern
                            id="grid"
                            width="40"
                            height="20"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 40 0 L 0 0 0 20"
                              fill="none"
                              stroke="#e2e8f0"
                              stroke-width="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect
                          width="100%"
                          height="100%"
                          fill="url(#grid)"
                        />
                        <!-- Graph line -->
                        <polyline
                          :points="graphPoints"
                          fill="none"
                          stroke="#2563eb"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <!-- Area under curve -->
                        <polygon
                          :points="`${graphPoints} 400,200 0,200`"
                          fill="url(#gradient)"
                          opacity="0.2"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              style="stop-color:#2563eb;stop-opacity:0.3"
                            />
                            <stop
                              offset="100%"
                              style="stop-color:#2563eb;stop-opacity:0"
                            />
                          </linearGradient>
                        </defs>
                        <!-- Data points -->
                        <circle
                          v-for="(point, i) in graphDataPoints"
                          :key="i"
                          :cx="point.x"
                          :cy="point.y"
                          r="4"
                          fill="#2563eb"
                        />
                      </svg>
                      <!-- Current rate display -->
                      <div class="absolute top-4 right-4 bg-white rounded-lg px-4 py-2 shadow-lg border-2 border-blue-200">
                        <div class="text-xs text-slate-600">
                          Current Rate
                        </div>
                        <div class="text-2xl font-bold text-blue-600">
                          56.82
                        </div>
                        <div class="text-xs text-emerald-600">
                          +2.3% today
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
                    <div class="flex items-center gap-3 mb-4">
                      <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <svg
                          class="w-5 h-5 text-blue-600"
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
                      </div>
                      <h3 class="text-lg font-bold text-slate-900">
                        Recent Activity
                      </h3>
                    </div>
                    <div
                      v-if="!compareHydrated || !watchlistHydrated || !alertsHydrated"
                      class="text-sm text-slate-500 py-4"
                    >
                      Loading…
                    </div>
                    <div
                      v-else
                      class="space-y-4"
                    >
                      <div v-if="compareRuns[0]">
                        Last compare: <span class="font-semibold">{{ compareRuns[0].label }}</span>
                      </div>
                      <div v-if="watchlistItems[0]">
                        Last saved: <span class="font-semibold">{{ watchlistItems[0].label }}</span>
                      </div>
                      <div v-if="alertItems[0]">
                        Last alert: <span class="font-semibold">{{ formatRule(alertItems[0].rule) }}</span>
                      </div>
                      <div
                        v-if="!compareRuns[0] && !watchlistItems[0] && !alertItems[0]"
                        class="text-slate-500"
                      >
                        No activity yet — run a compare and hit “Save” to start tracking.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else-if="activeTab === 'watchlist'"
                class="p-6"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">
                      Saved items ({{ watchlistCount }})
                    </div>
                    <div class="mt-1 text-xs text-slate-500">
                      Save from Compare, Exchange Rates, Pulse, or Guides.
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                      @click="watchlistReset"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  v-if="!watchlistHydrated"
                  class="mt-6 text-sm text-slate-500"
                >
                  Loading…
                </div>

                <div
                  v-else-if="watchlistItems.length === 0"
                  class="mt-6 text-sm text-slate-500"
                >
                  No saved items yet. Run a compare and tap “Save”.
                </div>

                <div
                  v-else
                  class="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white"
                >
                  <div
                    v-for="item in watchlistItems"
                    :key="item.id"
                    class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div class="text-sm font-semibold text-slate-900">
                        {{ item.label }}
                      </div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ formatTarget(item.target) }}
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        @click="openAlert(item)"
                      >
                        Set alert
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        @click="watchlistRemove(item.id)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else-if="activeTab === 'alerts'"
                class="p-6"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">
                      Alerts ({{ alertsCount }})
                    </div>
                    <div class="mt-1 text-xs text-slate-500">
                      Alerts are stored locally for now.
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      @click="openCreateAlert"
                    >
                      New alert
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                      @click="alertsReset"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  v-if="!alertsHydrated"
                  class="mt-6 text-sm text-slate-500"
                >
                  Loading…
                </div>

                <div
                  v-else-if="alertItems.length === 0"
                  class="mt-6 text-sm text-slate-500"
                >
                  No alerts yet. Create one from any corridor or from your watchlist.
                </div>

                <div
                  v-else
                  class="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white"
                >
                  <div
                    v-for="alert in alertItems"
                    :key="alert.id"
                    class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <div class="text-sm font-semibold text-slate-900">
                        {{ watchlistFindById(alert.watchlistItemId)?.label ?? 'Saved item' }}
                      </div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ formatRule(alert.rule) }} • {{ alert.frequency }} • {{ alert.enabled ? 'On' : 'Off' }}
                      </div>
                      <div
                        v-if="alert.lastTriggeredAt"
                        class="mt-1 text-xs text-slate-500"
                      >
                        Last triggered: {{ new Date(alert.lastTriggeredAt).toLocaleString() }}
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        @click="alertsToggleEnabled(alert.id)"
                      >
                        {{ alert.enabled ? 'Pause' : 'Resume' }}
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        @click="alertsTestTrigger(alert.id)"
                      >
                        Test trigger ({{ alertsGetHistory(alert.id).length }})
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                        @click="alertsRemove(alert.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else-if="activeTab === 'history'"
                class="p-6"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">
                      Recent comparisons ({{ compareCount }})
                    </div>
                    <div class="mt-1 text-xs text-slate-500">
                      Re-run comparisons you’ve done before.
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                      @click="compareReset"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  v-if="!compareHydrated"
                  class="mt-6 text-sm text-slate-500"
                >
                  Loading…
                </div>

                <div
                  v-else-if="compareRuns.length === 0"
                  class="mt-6 text-sm text-slate-500"
                >
                  No comparisons yet. Run a compare and we’ll store it here.
                </div>

                <div
                  v-else
                  class="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white"
                >
                  <div
                    v-for="run in compareRuns"
                    :key="run.id"
                    class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div class="text-sm font-semibold text-slate-900">
                        {{ run.label }}
                      </div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ new Date(run.createdAt).toLocaleString() }}
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <NuxtLink
                        v-if="run.path"
                        :to="run.path"
                        class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Open
                      </NuxtLink>
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        @click="compareRemove(run.id)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="p-6"
              >
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="text-sm font-semibold text-slate-900">
                      Account
                    </div>
                    <div class="mt-2 text-sm text-slate-700">
                      Signed in as <span class="font-semibold">{{ user?.email }}</span>
                    </div>
                    <div class="mt-4 flex items-center gap-2">
                      <NuxtLink
                        to="/settings"
                        class="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50"
                      >
                        Settings
                      </NuxtLink>
                      <NuxtLink
                        to="/forgot-password"
                        class="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50"
                      >
                        Reset password
                      </NuxtLink>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="text-sm font-semibold text-slate-900">
                      Billing
                    </div>
                    <div class="mt-2 text-sm text-slate-700">
                      {{ isPlus ? 'Manage your Plus subscription.' : 'Upgrade to Plus for unlimited alerts and deeper history.' }}
                    </div>
                    <div class="mt-4">
                      <NuxtLink
                        to="/plus"
                        class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        {{ isPlus ? 'View Plus' : 'Get Plus' }}
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlertRule, WatchTarget, WatchlistItem } from '~/types/tracking'

type DashboardTab = 'overview' | 'watchlist' | 'alerts' | 'history' | 'account'

const tabs: { id: DashboardTab, label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'history', label: 'History' },
  { id: 'account', label: 'Account' },
]

const route = useRoute()

const { user, isAuthenticated } = useAuth()
const { isPlus } = useEntitlements()

const modal = useSaveAlertModal()

const {
  items: watchlistItems,
  hydrated: watchlistHydrated,
  count: watchlistCount,
  remove: watchlistRemove,
  reset: watchlistReset,
} = useWatchlist()

const {
  alerts: alertItems,
  hydrated: alertsHydrated,
  count: alertsCount,
  toggleEnabled: alertsToggleEnabled,
  remove: alertsRemove,
  reset: alertsReset,
  getHistory: alertsGetHistory,
  addHistoryEvent: alertsAddHistoryEvent,
} = useAlerts()

const {
  runs: compareRuns,
  hydrated: compareHydrated,
  count: compareCount,
  remove: compareRemove,
  reset: compareReset,
} = useCompareHistory()

const watchlistFindById = (id: string) => watchlistItems.value.find(i => i.id === id) ?? null

// New Watchlist Form
const newWatchlist = ref({
  from: 'US',
  to: 'PH',
})

// New Alert Form
const newAlert = ref({
  from: 'US',
  to: 'PH',
  comparator: 'gte' as 'gte' | 'lte',
  targetRate: 56.0,
  frequency: 'realtime',
})

// Graph Data
const graphTimeframe = ref('7d')

// Mock graph data - in production, this would come from an API
const graphData = computed(() => {
  const days = graphTimeframe.value === '7d' ? 7 : graphTimeframe.value === '30d' ? 30 : 90
  const baseRate = 56.0
  const minRate = 54.0
  const maxRate = 58.0
  const data = []
  for (let i = 0; i < days; i++) {
    const variation = (Math.random() - 0.5) * 2
    const rate = Math.max(minRate, Math.min(maxRate, baseRate + variation))
    // SVG y coordinates start from top, so we invert: higher rate = lower y
    const normalizedRate = (rate - minRate) / (maxRate - minRate)
    data.push({
      x: (i / (days - 1)) * 400,
      y: 180 - (normalizedRate * 160), // Inverted: 180 is bottom, 20 is top
      rate: rate,
    })
  }
  return data
})

const graphPoints = computed(() => {
  return graphData.value.map(d => `${d.x},${d.y}`).join(' ')
})

const graphDataPoints = computed(() => {
  return graphData.value.map(d => ({ x: d.x, y: d.y }))
})

function handleAddWatchlist() {
  const target: WatchTarget = {
    type: 'corridor',
    from: newWatchlist.value.from,
    to: newWatchlist.value.to,
    method: 'bank',
  }

  const label = `${newWatchlist.value.from} → ${newWatchlist.value.to}`

  // Add to watchlist using the composable
  const { save } = useWatchlist()
  const result = save(target, { label })

  if (result.status === 'saved') {
    // Reset form
    newWatchlist.value = { from: 'US', to: 'PH' }
    alert(`Added ${label} to your watchlist!`)
  }
  else if (result.status === 'limit_reached') {
    alert(result.message)
  }
  else {
    alert(`${label} is already in your watchlist!`)
  }
}

function handleSetAlert() {
  const target: WatchTarget = {
    type: 'corridor',
    from: newAlert.value.from,
    to: newAlert.value.to,
    method: 'bank',
  }

  const label = `${newAlert.value.from} → ${newAlert.value.to}`

  // Open the alert modal with pre-filled data
  modal.open({
    target,
    label,
    source: 'dashboard',
  })

  // Reset form
  newAlert.value = {
    from: 'US',
    to: 'PH',
    comparator: 'gte',
    targetRate: 56.0,
    frequency: 'realtime',
  }
}

const activeTab = computed<DashboardTab>(() => {
  const raw = route.query.tab
  const tab = Array.isArray(raw) ? raw[0] : raw
  if (tab === 'watchlist' || tab === 'alerts' || tab === 'history' || tab === 'account') return tab
  return 'overview'
})

function setTab(tab: DashboardTab) {
  const nextQuery = { ...route.query } as Record<string, unknown>
  if (tab === 'overview') {
    delete nextQuery.tab
  }
  else {
    nextQuery.tab = tab
  }
  void navigateTo({ path: route.path, query: nextQuery })
}

function formatTarget(target: WatchTarget) {
  switch (target.type) {
    case 'corridor':
      return `corridor ${target.from}→${target.to} • ${target.method ?? 'bank'}`
    case 'fxPair':
      return `fx ${target.base}/${target.quote}`
    case 'pulseChart':
      return `pulse chart ${target.chartId}`
    case 'guide':
      return `guide ${target.slug}`
  }
}

function openAlert(item: WatchlistItem) {
  modal.open({
    target: item.target,
    label: item.label,
    source: 'other',
  })
}

function openCreateAlert() {
  const first = watchlistItems.value[0]
  const fallbackTarget: WatchTarget = { type: 'corridor', from: 'US', to: 'PH', method: 'bank' }

  modal.open({
    target: first?.target ?? fallbackTarget,
    label: first?.label ?? 'US→PH • bank',
    source: 'other',
  })
}

function alertsTestTrigger(alertId: string) {
  alertsAddHistoryEvent(alertId, 'Test trigger fired (stub)')
}

function formatRule(rule: AlertRule) {
  const op = rule.comparator === 'gte'
    ? '≥'
    : rule.comparator === 'lte'
      ? '≤'
      : rule.comparator === 'gt'
        ? '>'
        : '<'
  return `${rule.metric} ${op} ${rule.value}${rule.currency ? ` ${rule.currency}` : ''}`
}

useHead({
  title: 'Dashboard | Remit-Scout',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
