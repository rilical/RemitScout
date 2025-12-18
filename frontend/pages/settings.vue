<template>
  <div class="min-h-screen bg-slate-50 py-12">
    <div class="mx-auto w-full max-w-4xl px-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-2xl font-bold text-slate-900">
          Settings
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Frontend-first account + plan controls (local only).
        </p>

        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-sm font-semibold text-slate-900">
              Account
            </div>
            <div class="mt-2 text-sm text-slate-700">
              <template v-if="isLoggedIn">
                Signed in as <span class="font-semibold">{{ user?.email }}</span>
              </template>
              <template v-else>
                Not signed in.
              </template>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <NuxtLink
                v-if="!isLoggedIn"
                to="/sign-in"
                class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sign in
              </NuxtLink>
              <button
                v-else
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                @click="signOut"
              >
                Sign out
              </button>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-sm font-semibold text-slate-900">
              Plan
            </div>
            <div class="mt-2 text-sm text-slate-700">
              Current: <span class="font-semibold">{{ plan }}</span>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                @click="togglePlan"
              >
                Toggle plan
              </button>
              <NuxtLink
                to="/plus"
                class="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                View Plus
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div class="text-sm font-semibold text-rose-900">
            Danger zone (local)
          </div>
          <p class="mt-1 text-sm text-rose-800">
            Clears watchlist, alerts, and plan settings from localStorage.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              @click="clearAll"
            >
              Clear local data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isLoggedIn, signOut } = useAuth()
const { plan, togglePlan, reset: resetEntitlements } = useEntitlements()
const { reset: resetWatchlist } = useWatchlist()
const { reset: resetAlerts } = useAlerts()

function clearAll() {
  resetWatchlist()
  resetAlerts()
  resetEntitlements()
  signOut()
}

useHead({
  title: 'Settings | Remit-Scout',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
