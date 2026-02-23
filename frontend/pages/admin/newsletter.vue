<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <AdminPageShell
      title="Newsletter"
      subtitle="Compose, preview, and send newsletter campaigns to all active subscribers."
    >
      <template #actions>
        <span class="text-body-sm text-rs-muted tabular-nums">{{ subscriberCount }} active subscribers</span>
        <button
          class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="loadCampaigns"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </template>
    </AdminPageShell>

    <!-- Tab Switcher -->
    <nav class="flex gap-1 rounded-xl border border-rs-border bg-rs-surface p-1 shadow-sm">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="rounded-lg px-4 py-2 text-body-sm font-medium transition-colors"
        :class="activeTab === tab.id
          ? 'bg-brand-600 text-white'
          : 'text-rs-muted hover:bg-neutral-100 hover:text-rs-fg'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Compose -->
    <section
      v-if="activeTab === 'compose'"
      class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm"
    >
      <h2 class="text-body-lg font-semibold text-rs-fg">Compose campaign</h2>
      <form
        class="mt-4 space-y-4"
        @submit.prevent="saveDraft"
      >
        <label class="block text-body-sm text-rs-muted">
          Subject
          <input
            v-model="composeForm.subject"
            type="text"
            placeholder="Weekly Market Update — Feb 22"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </label>
        <label class="block text-body-sm text-rs-muted">
          Preview text
          <input
            v-model="composeForm.previewText"
            type="text"
            placeholder="Short preview shown in inbox..."
            maxlength="200"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm"
          >
        </label>
        <label class="block text-body-sm text-rs-muted">
          Body HTML
          <textarea
            v-model="composeForm.bodyHtml"
            rows="14"
            placeholder="<p>Hi there,</p><p>Here's what happened this week...</p>"
            class="mt-1 w-full rounded-lg border border-rs-border px-3 py-2 text-body-sm font-mono"
          />
        </label>
        <div class="flex items-center gap-3">
          <button
            type="submit"
            class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="saving"
          >
            {{ saving ? 'Saving…' : 'Save as draft' }}
          </button>
          <button
            type="button"
            class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50 disabled:opacity-60"
            :disabled="!composeForm.subject || !composeForm.bodyHtml || previewing"
            @click="loadPreview"
          >
            {{ previewing ? 'Loading…' : 'Preview' }}
          </button>
          <span
            v-if="composeMessage"
            class="text-body-sm"
            :class="composeSuccess ? 'text-success-600' : 'text-danger-600'"
          >
            {{ composeMessage }}
          </span>
        </div>
      </form>
    </section>

    <!-- Preview -->
    <section
      v-if="activeTab === 'preview'"
      class="rounded-2xl border border-rs-border bg-rs-surface shadow-sm"
    >
      <div class="flex items-center justify-between border-b border-rs-border px-6 py-4">
        <h2 class="text-body-lg font-semibold text-rs-fg">Preview</h2>
        <button
          class="h-9 rounded-lg border border-rs-border px-3 text-body-sm text-rs-fg hover:bg-neutral-50 disabled:opacity-60"
          :disabled="!composeForm.subject || !composeForm.bodyHtml || previewing"
          @click="loadPreview"
        >
          {{ previewing ? 'Loading…' : 'Refresh preview' }}
        </button>
      </div>
      <div
        v-if="!previewHtml"
        class="p-6 text-body-sm text-rs-muted"
      >
        Write content in the Compose tab and click Preview to see the rendered email.
      </div>
      <div
        v-else
        class="bg-neutral-100 p-4"
      >
        <iframe
          :srcdoc="previewHtml"
          class="mx-auto w-full max-w-[640px] rounded-lg border border-rs-border bg-white shadow-sm"
          style="min-height: 700px;"
          sandbox="allow-same-origin"
        />
      </div>
    </section>

    <!-- Send -->
    <section
      v-if="activeTab === 'send'"
      class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm"
    >
      <h2 class="text-body-lg font-semibold text-rs-fg">Send campaign</h2>

      <div
        v-if="!draftCampaigns.length"
        class="mt-4 rounded-lg border border-dashed border-rs-border p-4 text-body-sm text-rs-muted"
      >
        No draft campaigns. Create one in the Compose tab first.
      </div>

      <div
        v-else
        class="mt-4 space-y-4"
      >
        <div
          v-for="draft in draftCampaigns"
          :key="draft.id"
          class="flex items-center justify-between rounded-lg border border-rs-border p-4"
        >
          <div>
            <div class="text-body-sm font-semibold text-rs-fg">{{ draft.subject }}</div>
            <div class="text-body-sm text-rs-muted">Created {{ formatTimestamp(draft.created_at) }}</div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-body-sm text-rs-muted tabular-nums">{{ subscriberCount }} recipients</span>
            <button
              class="h-9 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="sending === draft.id"
              @click="confirmSend(draft)"
            >
              {{ sending === draft.id ? 'Sending…' : 'Send now' }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="sendMessage"
        class="mt-4 text-body-sm"
        :class="sendSuccess ? 'text-success-600' : 'text-danger-600'"
      >
        {{ sendMessage }}
      </div>
    </section>

    <!-- History -->
    <section
      v-if="activeTab === 'history'"
      class="rounded-2xl border border-rs-border bg-rs-surface p-6 shadow-sm"
    >
      <h2 class="text-body-lg font-semibold text-rs-fg">Campaign history</h2>
      <div class="mt-4 overflow-auto">
        <table class="min-w-full text-body-sm">
          <thead class="text-body-sm uppercase text-neutral-400">
            <tr>
              <th class="py-2 text-left">Subject</th>
              <th class="py-2 text-left">Status</th>
              <th class="py-2 text-right">Sent</th>
              <th class="py-2 text-right">Failed</th>
              <th class="py-2 text-right">Total</th>
              <th class="py-2 text-left">Sent by</th>
              <th class="py-2 text-left">Created</th>
              <th class="py-2 text-left">Completed</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="campaign in campaigns"
              :key="campaign.id"
              class="border-t border-neutral-100"
            >
              <td class="max-w-xs truncate py-2 text-rs-fg font-medium">{{ campaign.subject }}</td>
              <td class="py-2">
                <span
                  class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="statusClass(campaign.status)"
                >
                  {{ campaign.status }}
                </span>
              </td>
              <td class="py-2 text-right text-rs-muted tabular-nums">{{ campaign.sent_count }}</td>
              <td class="py-2 text-right text-rs-muted tabular-nums">{{ campaign.failed_count }}</td>
              <td class="py-2 text-right text-rs-muted tabular-nums">{{ campaign.total_recipients }}</td>
              <td class="py-2 text-rs-muted">{{ campaign.sent_by || '—' }}</td>
              <td class="py-2 text-rs-muted">{{ formatTimestamp(campaign.created_at) }}</td>
              <td class="py-2 text-rs-muted">{{ campaign.completed_at ? formatTimestamp(campaign.completed_at) : '—' }}</td>
            </tr>
            <tr v-if="campaigns.length === 0">
              <td
                colspan="8"
                class="py-3 text-center text-body-sm text-neutral-400"
              >
                No campaigns yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Send Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="confirmDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="confirmDialog = null"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h3 class="text-body-lg font-semibold text-rs-fg">Confirm send</h3>
          <p class="mt-2 text-body-sm text-rs-muted">
            You are about to send <strong>"{{ confirmDialog.subject }}"</strong> to
            <strong>{{ subscriberCount }}</strong> active subscribers. This cannot be undone.
          </p>
          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              class="h-10 rounded-lg border border-rs-border px-4 text-body-sm font-semibold text-rs-fg hover:bg-neutral-50"
              @click="confirmDialog = null"
            >
              Cancel
            </button>
            <button
              class="h-10 rounded-lg bg-brand-600 px-4 text-body-sm font-semibold text-white hover:bg-brand-700"
              @click="executeSend"
            >
              Send to {{ subscriberCount }} subscribers
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'], layout: 'admin' })

useAdminPage({
  title: 'Admin: Newsletter | Remit-Scout',
  description: 'Compose and send newsletter campaigns.',
})

type Campaign = {
  id: string
  subject: string
  preview_text: string | null
  body_html: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  sent_by: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

const tabs = [
  { id: 'compose', label: 'Compose' },
  { id: 'preview', label: 'Preview' },
  { id: 'send', label: 'Send' },
  { id: 'history', label: 'History' },
] as const

type TabId = (typeof tabs)[number]['id']

const { request } = useApi()
const { formatTimestamp } = useAdminFormat()

const activeTab = ref<TabId>('compose')
const loading = ref(false)
const saving = ref(false)
const previewing = ref(false)
const sending = ref<string | null>(null)
const subscriberCount = ref(0)
const campaigns = ref<Campaign[]>([])
const previewHtml = ref('')
const confirmDialog = ref<Campaign | null>(null)

const composeForm = reactive({
  subject: '',
  previewText: '',
  bodyHtml: '',
})

const composeMessage = ref('')
const composeSuccess = ref(false)
const sendMessage = ref('')
const sendSuccess = ref(false)

const draftCampaigns = computed(() =>
  campaigns.value.filter((c) => c.status === 'draft'),
)

const statusClass = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-neutral-200 text-neutral-700'
    case 'sending': return 'bg-yellow-100 text-yellow-700'
    case 'sent': return 'bg-green-100 text-green-700'
    case 'failed': return 'bg-red-100 text-red-700'
    default: return 'bg-neutral-200 text-neutral-700'
  }
}

const loadSubscriberCount = async () => {
  try {
    const res = await request<{ count: number }>('/admin/newsletter/subscribers/count')
    subscriberCount.value = res.count ?? 0
  } catch {
    subscriberCount.value = 0
  }
}

const loadCampaigns = async () => {
  loading.value = true
  try {
    const [campaignRes] = await Promise.all([
      request<{ campaigns: Campaign[] }>('/admin/newsletter/campaigns'),
      loadSubscriberCount(),
    ])
    campaigns.value = campaignRes.campaigns ?? []
  } catch {
    campaigns.value = []
  } finally {
    loading.value = false
  }
}

const saveDraft = async () => {
  if (!composeForm.subject || !composeForm.bodyHtml) return
  saving.value = true
  composeMessage.value = ''
  composeSuccess.value = false
  try {
    await request('/admin/newsletter/campaigns', {
      method: 'POST',
      body: {
        subject: composeForm.subject,
        preview_text: composeForm.previewText || undefined,
        body_html: composeForm.bodyHtml,
      },
    })
    composeMessage.value = 'Draft saved. Go to the Send tab to dispatch it.'
    composeSuccess.value = true
    composeForm.subject = ''
    composeForm.previewText = ''
    composeForm.bodyHtml = ''
    await loadCampaigns()
  } catch (err) {
    composeMessage.value = err instanceof Error ? err.message : 'Failed to save draft.'
    composeSuccess.value = false
  } finally {
    saving.value = false
  }
}

const loadPreview = async () => {
  if (!composeForm.subject || !composeForm.bodyHtml) return
  previewing.value = true
  try {
    const res = await request<{ html: string }>('/admin/newsletter/preview', {
      method: 'POST',
      body: {
        subject: composeForm.subject,
        preview_text: composeForm.previewText || undefined,
        body_html: composeForm.bodyHtml,
      },
    })
    previewHtml.value = res.html ?? ''
    activeTab.value = 'preview'
  } catch {
    previewHtml.value = ''
  } finally {
    previewing.value = false
  }
}

const confirmSend = (campaign: Campaign) => {
  confirmDialog.value = campaign
}

const executeSend = async () => {
  if (!confirmDialog.value) return
  const campaign = confirmDialog.value
  confirmDialog.value = null
  sending.value = campaign.id
  sendMessage.value = ''
  sendSuccess.value = false
  try {
    const res = await request<{ sent: number; failed: number }>(
      `/admin/newsletter/campaigns/${campaign.id}/send`,
      { method: 'POST' },
    )
    sendMessage.value = `Sent to ${res.sent} subscribers${res.failed ? `, ${res.failed} failed` : ''}.`
    sendSuccess.value = true
    await loadCampaigns()
  } catch (err) {
    sendMessage.value = err instanceof Error ? err.message : 'Failed to send campaign.'
    sendSuccess.value = false
  } finally {
    sending.value = null
  }
}

onMounted(() => {
  void loadCampaigns()
})
</script>
