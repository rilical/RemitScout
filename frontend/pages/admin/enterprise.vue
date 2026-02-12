<template>
  <div class="min-h-screen bg-slate-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">
          Enterprise Account Management
        </h1>
        <p class="text-slate-600 mt-1">
          Manually grant or revoke enterprise access for users.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl p-5 border border-slate-200">
          <div class="text-3xl font-bold text-slate-900">
            {{ summary.enterprise }}
          </div>
          <div class="text-sm text-slate-600">
            Enterprise Accounts
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-slate-200">
          <div class="text-3xl font-bold text-slate-900">
            {{ summary.plus }}
          </div>
          <div class="text-sm text-slate-600">
            Plus Accounts
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-slate-200">
          <div class="text-3xl font-bold text-slate-900">
            {{ summary.free }}
          </div>
          <div class="text-sm text-slate-600">
            Free Accounts
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <div class="p-5 border-b border-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">
            Grant Enterprise Access
          </h2>
        </div>
        <div class="p-5">
          <form
            class="flex flex-col sm:flex-row gap-4"
            @submit.prevent="grantAccess"
          >
            <div class="flex-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">User Email</label>
              <input
                v-model="grantForm.email"
                type="email"
                placeholder="user@example.com"
                required
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
              <input
                v-model="grantForm.notes"
                type="text"
                placeholder="Company name, deal terms, etc."
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            <div class="flex items-end">
              <button
                type="submit"
                :disabled="granting"
                class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {{ granting ? 'Granting...' : 'Grant Enterprise' }}
              </button>
            </div>
          </form>
          <div
            v-if="grantMessage"
            class="mt-3 text-sm"
            :class="grantSuccess ? 'text-green-600' : 'text-red-600'"
          >
            {{ grantMessage }}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">
            Enterprise Accounts
          </h2>
          <button
            :disabled="loading"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            @click="loadUsers"
          >
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>

        <div
          v-if="loading"
          class="p-8 text-center text-slate-500"
        >
          Loading accounts...
        </div>

        <div
          v-else-if="enterpriseUsers.length === 0"
          class="p-8 text-center text-slate-500"
        >
          No enterprise accounts yet.
        </div>

        <table
          v-else
          class="w-full"
        >
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Email
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Granted
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Notes
              </th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="user in enterpriseUsers"
              :key="user.user_id"
              class="hover:bg-slate-50"
            >
              <td class="px-5 py-4 text-sm text-slate-900">
                {{ user.email || user.user_id }}
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">
                {{ user.enterprise_granted_at ? formatDate(user.enterprise_granted_at) : 'N/A' }}
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">
                {{ user.enterprise_notes || '-' }}
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  :disabled="revoking === user.user_id"
                  class="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  @click="revokeAccess(user)"
                >
                  {{ revoking === user.user_id ? 'Revoking...' : 'Revoke' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const supabase = useSupabaseClient()
const { request } = useApi()

type UserWithPlan = {
  user_id: string
  email: string | null
  app_role: string
  plan_code: string
  plan_status: string
  created_at: string
  last_seen_at: string | null
  enterprise_granted_at: string | null
  enterprise_granted_by: string | null
  enterprise_notes: string | null
}

const loading = ref(true)
const users = ref<UserWithPlan[]>([])
const summary = ref({ free: 0, plus: 0, enterprise: 0 })
const granting = ref(false)
const grantMessage = ref('')
const grantSuccess = ref(false)
const revoking = ref<string | null>(null)

const grantForm = ref({
  email: '',
  notes: '',
})

const enterpriseUsers = computed(() =>
  users.value.filter(u => u.plan_code === 'enterprise'),
)

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  if (!supabase) {
    return {}
  }
  const session = (await supabase.auth.getSession()).data.session
  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }
  return headers
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await request<{ users?: UserWithPlan[], summary?: { free: number, plus: number, enterprise: number } }>(
      '/admin/plans',
      { headers: await getAuthHeaders() },
    )
    if (data) {
      users.value = data.users || []
      summary.value = data.summary || { free: 0, plus: 0, enterprise: 0 }
    }
  }
  catch (error) {
    console.error('Failed to load users:', error)
  }
  finally {
    loading.value = false
  }
}

const grantAccess = async () => {
  if (!grantForm.value.email) return
  granting.value = true
  grantMessage.value = ''
  grantSuccess.value = false

  try {
    const data = await request<{ success?: boolean, message?: string }>(
      '/admin/plans/grant',
      {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: {
          email: grantForm.value.email,
          plan_code: 'enterprise',
          notes: grantForm.value.notes || undefined,
        },
      },
    )

    if (!data?.success) {
      grantMessage.value = data?.message || 'Failed to grant access'
      grantSuccess.value = false
    }
    else {
      grantMessage.value = `Enterprise access granted to ${grantForm.value.email}`
      grantSuccess.value = true
      grantForm.value = { email: '', notes: '' }
      await loadUsers()
    }
  }
  catch (error) {
    grantMessage.value = 'Failed to grant access'
    grantSuccess.value = false
  }
  finally {
    granting.value = false
  }
}

const revokeAccess = async (user: UserWithPlan) => {
  if (!confirm(`Revoke enterprise access for ${user.email || user.user_id}?`)) return
  revoking.value = user.user_id

  try {
    await request('/admin/plans/revoke', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: {
        user_id: user.user_id,
        reason: 'Admin revocation',
      },
    })
    await loadUsers()
  }
  catch (error) {
    console.error('Failed to revoke access:', error)
  }
  finally {
    revoking.value = null
  }
}

onMounted(() => {
  loadUsers()
})

useHead({
  title: 'Enterprise Management | Admin',
})
</script>
