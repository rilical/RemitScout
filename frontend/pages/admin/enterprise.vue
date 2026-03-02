<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageShell
        title="Enterprise Account Management"
        subtitle="Manually grant or revoke enterprise access for users."
      />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">
            {{ summary.enterprise }}
          </div>
          <div class="text-body-sm text-neutral-600">
            Enterprise Accounts
          </div>
        </div>
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">
            {{ summary.plus }}
          </div>
          <div class="text-body-sm text-neutral-600">
            Plus Accounts
          </div>
        </div>
        <div class="rounded-2xl bg-surface p-6 shadow-sm">
          <div class="text-h2 font-bold text-rs-fg">
            {{ summary.free }}
          </div>
          <div class="text-body-sm text-neutral-600">
            Free Accounts
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-surface shadow-sm overflow-hidden">
        <div class="p-6 border-b border-rs-border">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Grant Enterprise Access
          </h2>
        </div>
        <div class="p-6">
          <form
            class="flex flex-col sm:flex-row gap-4"
            @submit.prevent="grantAccess"
          >
            <div class="flex-1">
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">User Email</label>
              <input
                v-model="grantForm.email"
                type="email"
                placeholder="user@example.com"
                required
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div class="flex-1">
              <label class="block text-body-sm font-medium text-neutral-700 mb-1">Notes (optional)</label>
              <input
                v-model="grantForm.notes"
                type="text"
                placeholder="Company name, deal terms, etc."
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div class="flex items-end">
              <button
                type="submit"
                :disabled="granting"
                class="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {{ granting ? 'Granting...' : 'Grant Enterprise' }}
              </button>
            </div>
          </form>
          <div
            v-if="grantMessage"
            class="mt-3 text-body-sm"
            :class="grantSuccess ? 'text-success-600' : 'text-danger-600'"
          >
            {{ grantMessage }}
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-surface shadow-sm overflow-hidden">
        <div class="p-6 border-b border-rs-border flex items-center justify-between">
          <h2 class="text-body-lg font-semibold text-rs-fg">
            Enterprise Accounts
          </h2>
          <button
            :disabled="loading"
            class="text-body-sm text-brand-600 hover:text-brand-700 font-medium"
            @click="loadUsers"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
        <div class="p-6">
          <DataTable
            :columns="tableColumns"
            :rows="tableRows"
            :row-key="(row: any) => row.user_id ?? String(row)"
            :loading="loading"
            :error="tableError ? { message: tableError } : null"
            :empty="{ title: 'No enterprise accounts yet.' }"
          >
            <template #cell-actions="{ row }">
              <button
                :disabled="revoking === (row as any).user_id"
                class="text-body-sm font-medium text-danger-600 hover:text-danger-700 disabled:opacity-50"
                @click="revokeAccess(toUserWithPlan((row as any).raw))"
              >
                {{ revoking === (row as any).user_id ? 'Revoking...' : 'Revoke' }}
              </button>
            </template>
          </DataTable>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { DataTable } from '~/ui'
import type { DataTableColumn } from '~/ui'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin',
})

useAdminPage({
  title: 'Admin: Enterprise | Remit-Scout',
  description: 'Admin tools for managing enterprise accounts.',
})

const { request } = useApi()
const log = useLogger('admin/enterprise')
const route = useRoute()
const { formatTimestamp } = useAdminFormat()

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
const tableError = ref<string | null>(null)
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

const tableColumns: DataTableColumn[] = [
  { key: 'email', label: 'Email' },
  { key: 'enterprise_granted_at', label: 'Granted' },
  { key: 'enterprise_notes', label: 'Notes' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const tableRows = computed(() =>
  enterpriseUsers.value.map(user => ({
    user_id: user.user_id,
    email: user.email || user.user_id,
    enterprise_granted_at: user.enterprise_granted_at ? formatTimestamp(user.enterprise_granted_at) : 'n/a',
    enterprise_notes: user.enterprise_notes || '-',
    actions: 'revoke',
    raw: user,
  })),
)

const toUserWithPlan = (value: unknown): UserWithPlan => value as UserWithPlan

const loadUsers = async () => {
  loading.value = true
  tableError.value = null
  try {
    const data = await request<{ users?: UserWithPlan[], summary?: { free: number, plus: number, enterprise: number } }>(
      '/admin/plans',
    )
    if (data) {
      users.value = data.users || []
      summary.value = data.summary || { free: 0, plus: 0, enterprise: 0 }
    }
  }
  catch (error) {
    tableError.value = error instanceof Error ? error.message : 'Failed to load enterprise users.'
    log.error('Failed to load users', error)
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
      body: {
        user_id: user.user_id,
        reason: 'Admin revocation',
      },
    })
    await loadUsers()
  }
  catch (error) {
    log.error('Failed to revoke access', error)
  }
  finally {
    revoking.value = null
  }
}

onMounted(() => {
  if (typeof route.query.email === 'string') {
    grantForm.value.email = route.query.email.trim().toLowerCase()
  }
  void loadUsers()
})
</script>
