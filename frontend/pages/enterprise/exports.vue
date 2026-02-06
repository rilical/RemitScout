<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <NuxtLink
            to="/dashboard"
            class="text-slate-500 hover:text-slate-700"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </NuxtLink>
          <h1 class="text-2xl font-bold text-slate-900">
            Data Exports
          </h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Enterprise
          </span>
        </div>
        <p class="text-slate-600">
          Export your remittance data for analysis, reporting, and integrations.
        </p>
      </div>

      <div
        v-if="!isEnterprise"
        class="bg-white rounded-2xl border border-slate-200 p-8 text-center"
      >
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            class="w-8 h-8 text-blue-600"
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
        <h2 class="text-xl font-bold text-slate-900 mb-2">
          Enterprise Feature
        </h2>
        <p class="text-slate-600 mb-6 max-w-md mx-auto">
          Bulk data exports and API access are available on the Enterprise plan.
        </p>
        <NuxtLink
          to="/institutions"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Learn About Enterprise
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

      <div
        v-else
        class="space-y-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-green-600"
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
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">
                  API Status
                </h3>
                <p class="text-sm text-green-600">
                  Active
                </p>
              </div>
            </div>
            <div class="text-sm text-slate-600">
              <div class="flex justify-between py-1">
                <span>API Keys</span>
                <span class="font-medium text-slate-900">{{ apiKeys.length }} / 5</span>
              </div>
              <div class="flex justify-between py-1">
                <span>Requests Today</span>
                <span class="font-medium text-slate-900">{{ requestsToday }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
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
              <div>
                <h3 class="font-semibold text-slate-900">
                  Data Freshness
                </h3>
                <p class="text-sm text-slate-500">
                  By corridor tier
                </p>
              </div>
            </div>
            <div class="text-sm text-slate-600">
              <div class="flex justify-between py-1">
                <span>Tier 1 (USD corridors)</span>
                <span class="font-medium text-slate-900">10 min</span>
              </div>
              <div class="flex justify-between py-1">
                <span>Tier 2 (All others)</span>
                <span class="font-medium text-slate-900">3 hours</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-purple-600"
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
                <h3 class="font-semibold text-slate-900">
                  Indices Available
                </h3>
                <p class="text-sm text-slate-500">
                  Gold export
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">TEER</span>
              <span class="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">RCI</span>
              <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">RVI</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  Create New Export
                </h2>
                <p class="text-sm text-slate-500">
                  Export corridor data in CSV or PDF format
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <form
              class="space-y-6"
              @submit.prevent="createExport"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Data Type</label>
                  <select
                    v-model="exportForm.dataType"
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="history">
                      Transfer History
                    </option>
                    <option value="watchlist">
                      Watchlist Data
                    </option>
                    <option value="alerts">
                      Alert History
                    </option>
                    <option value="all">
                      All Data
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Format</label>
                  <select
                    v-model="exportForm.format"
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="csv">
                      CSV (Spreadsheet)
                    </option>
                    <option value="pdf">
                      PDF (Report)
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Date From</label>
                  <input
                    v-model="exportForm.dateFrom"
                    type="date"
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Date To</label>
                  <input
                    v-model="exportForm.dateTo"
                    type="date"
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>
              </div>

              <div class="flex items-center justify-end gap-4">
                <button
                  type="submit"
                  :disabled="exportLoading"
                  class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    v-if="exportLoading"
                    class="w-4 h-4 animate-spin"
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
                  <svg
                    v-else
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Create Export
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-200">
            <h2 class="text-lg font-semibold text-slate-900">
              Export History
            </h2>
          </div>

          <div
            v-if="exportsLoading"
            class="p-8 text-center text-slate-500"
          >
            <svg
              class="w-8 h-8 animate-spin mx-auto mb-2"
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
            Loading exports...
          </div>

          <div
            v-else-if="exports.length === 0"
            class="p-8 text-center text-slate-500"
          >
            <svg
              class="w-12 h-12 mx-auto mb-3 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No exports yet. Create your first export above.</p>
          </div>

          <table
            v-else
            class="w-full"
          >
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Format
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Expires
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="exp in exports"
                :key="exp.id"
                class="hover:bg-slate-50"
              >
                <td class="px-6 py-4 text-sm text-slate-900 capitalize">
                  {{ formatJobType(exp.jobType) }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600 uppercase">
                  {{ getFormat(exp.jobType) }}
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      statusColors[exp.status] || 'bg-slate-100 text-slate-800',
                    ]"
                  >
                    {{ exp.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ formatDate(exp.createdAt) }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ exp.expiresAt ? formatDate(exp.expiresAt) : '-' }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    v-if="exp.status === 'done'"
                    :disabled="downloadingId === exp.id"
                    class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    @click="downloadExport(exp.id)"
                  >
                    <svg
                      v-if="downloadingId === exp.id"
                      class="w-4 h-4 animate-spin"
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
                    <svg
                      v-else
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </button>
                  <span
                    v-else-if="exp.status === 'queued' || exp.status === 'running'"
                    class="text-sm text-slate-400"
                  >
                    Processing...
                  </span>
                  <span
                    v-else-if="exp.status === 'failed'"
                    class="text-sm text-red-500"
                  >
                    Failed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  API Keys
                </h2>
                <p class="text-sm text-slate-500">
                  Manage your API keys for programmatic access
                </p>
              </div>
              <button
                :disabled="apiKeys.length >= 5"
                class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="showCreateKeyModal = true"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Key
              </button>
            </div>
          </div>

          <div
            v-if="apiKeys.length === 0"
            class="p-8 text-center text-slate-500"
          >
            <svg
              class="w-12 h-12 mx-auto mb-3 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <p>No API keys yet. Create one to access the indices API.</p>
          </div>

          <table
            v-else
            class="w-full"
          >
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Key Prefix
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Scopes
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Used
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="key in apiKeys"
                :key="key.key_id"
                class="hover:bg-slate-50"
              >
                <td class="px-6 py-4 text-sm font-medium text-slate-900">
                  {{ key.name || 'Unnamed Key' }}
                </td>
                <td class="px-6 py-4">
                  <code class="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700">{{ key.key_prefix }}...</code>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="scope in key.scopes.slice(0, 3)"
                      :key="scope"
                      class="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                    >
                      {{ scope }}
                    </span>
                    <span
                      v-if="key.scopes.length > 3"
                      class="text-xs text-slate-400"
                    >
                      +{{ key.scopes.length - 3 }} more
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ formatDate(key.created_at) }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ key.last_used_at ? formatDate(key.last_used_at) : 'Never' }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    class="text-sm font-medium text-red-600 hover:text-red-700"
                    @click="revokeKey(key.key_id)"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h3 class="font-semibold text-blue-900 mb-2">
            API Documentation
          </h3>
          <p class="text-sm text-blue-800 mb-4">
            Access TEER, RCI, and RVI indices via our REST API. Data freshness depends on the corridor tier:
            USD-origin corridors update every 10 minutes, all others every 3 hours.
          </p>
          <div class="bg-white rounded-xl p-4 border border-blue-200">
            <code class="text-sm text-slate-700 block">
              <span class="text-green-600">GET</span> /api/v1/indices/series?corridor_id=US-MX-USD-MXN&amp;days=30
            </code>
          </div>
          <div class="mt-4 flex gap-4">
            <NuxtLink
              to="/institutions/api"
              class="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Full Documentation →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showCreateKeyModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="showCreateKeyModal = false"
        />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">
            Create API Key
          </h3>
          <form @submit.prevent="createApiKey">
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-2">Key Name</label>
              <input
                v-model="newKeyName"
                type="text"
                placeholder="e.g., Production API Key"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                @click="showCreateKeyModal = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="creatingKey"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ creatingKey ? 'Creating...' : 'Create Key' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="newKeyToken"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                class="w-5 h-5 text-green-600"
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
            <h3 class="text-lg font-semibold text-slate-900">
              API Key Created
            </h3>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p class="text-sm text-amber-800">
              <strong>Important:</strong> Copy this key now. You won't be able to see it again.
            </p>
          </div>
          <div class="bg-slate-100 rounded-xl p-4 mb-4">
            <code class="text-sm text-slate-800 break-all">{{ newKeyToken }}</code>
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              @click="copyKey"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {{ copied ? 'Copied!' : 'Copy Key' }}
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              @click="newKeyToken = ''"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

const { isEnterprise } = useEntitlements()
const supabase = useSupabaseClient()
const { request } = useApi()

const exportForm = ref({
  dataType: 'history',
  format: 'csv',
  dateFrom: '',
  dateTo: '',
})

const exports = ref<Array<{
  id: string
  jobType: string
  status: 'queued' | 'running' | 'done' | 'failed'
  createdAt: string
  finishedAt: string | null
  expiresAt: string | null
  error: string | null
}>>([])

const apiKeys = ref<Array<{
  key_id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  created_at: string
  last_used_at: string | null
}>>([])

const exportsLoading = ref(true)
const exportLoading = ref(false)
const downloadingId = ref<string | null>(null)
const showCreateKeyModal = ref(false)
const newKeyName = ref('')
const newKeyToken = ref('')
const creatingKey = ref(false)
const copied = ref(false)
const requestsToday = ref(0)

const statusColors: Record<string, string> = {
  queued: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const formatJobType = (jobType: string) => {
  return jobType.replace(/_csv|_pdf/g, '').replace(/_/g, ' ')
}

const getFormat = (jobType: string) => {
  return jobType.includes('pdf') ? 'pdf' : 'csv'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  if (!supabase) return {}
  const session = (await supabase.auth.getSession()).data.session
  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }
  return headers
}

const loadExports = async () => {
  if (!isEnterprise.value) return
  exportsLoading.value = true
  try {
    const data = await request<{ jobs?: typeof exports.value }>(
      '/exports',
      { headers: await getAuthHeaders() },
    )
    if (data?.jobs) {
      exports.value = data.jobs
    }
  }
  catch (error) {
    console.error('Failed to load exports:', error)
  }
  finally {
    exportsLoading.value = false
  }
}

const loadApiKeys = async () => {
  if (!isEnterprise.value) return
  try {
    const data = await request<{ keys?: typeof apiKeys.value }>(
      '/me/api-keys',
      { headers: await getAuthHeaders() },
    )
    if (data?.keys) {
      apiKeys.value = data.keys
    }
  }
  catch (error) {
    console.error('Failed to load API keys:', error)
  }
}

const createExport = async () => {
  exportLoading.value = true
  try {
    const data = await request<{ job?: (typeof exports.value)[number] }>(
      '/exports',
    {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: exportForm.value,
    },
    )
    if (data?.job) {
      exports.value.unshift(data.job)
    }
  }
  catch (error) {
    console.error('Failed to create export:', error)
  }
  finally {
    exportLoading.value = false
  }
}

const downloadExport = async (id: string) => {
  downloadingId.value = id
  try {
    const data = await request<{ url?: string }>(
      `/exports/${id}/download`,
      { headers: await getAuthHeaders() },
    )
    if (data?.url) {
      window.open(data.url, '_blank')
    }
  }
  catch (error) {
    console.error('Failed to download export:', error)
  }
  finally {
    downloadingId.value = null
  }
}

const createApiKey = async () => {
  creatingKey.value = true
  try {
    const data = await request<{ token?: string }>(
      '/me/api-keys',
      {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: { name: newKeyName.value || null },
      },
    )
    if (data?.token) {
      newKeyToken.value = data.token
      showCreateKeyModal.value = false
      newKeyName.value = ''
      await loadApiKeys()
    }
  }
  catch (error) {
    console.error('Failed to create API key:', error)
  }
  finally {
    creatingKey.value = false
  }
}

const revokeKey = async (keyId: string) => {
  if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return
  try {
    await request(`/me/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })
    apiKeys.value = apiKeys.value.filter(k => k.key_id !== keyId)
  }
  catch (error) {
    console.error('Failed to revoke API key:', error)
  }
}

const copyKey = async () => {
  await navigator.clipboard.writeText(newKeyToken.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  if (isEnterprise.value) {
    loadExports()
    loadApiKeys()
  }
})

useHead({
  title: 'Data Exports | Remit-Scout Enterprise',
})
</script>
