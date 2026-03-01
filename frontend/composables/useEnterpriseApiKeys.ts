import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useEntitlements } from '~/composables/useEntitlements'
import type { DataTableColumn } from '~/ui'

type ApiKeyRecord = {
  key_id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export function useEnterpriseApiKeys() {
  const { request } = useApi()
  const { apiAccess, apiKeyMax } = useEntitlements()

  const apiKeys = ref<ApiKeyRecord[]>([])
  const apiKeysLoading = ref(false)
  const apiKeysError = ref<string | null>(null)
  const apiKeysLoaded = ref(false)
  const apiKeyName = ref('')
  const apiKeyScopes = ref<string[]>(['indices:read', 'corridors:read'])
  const apiKeyToken = ref<string | null>(null)
  const apiKeyTokenLabel = ref<string | null>(null)
  const apiKeyCopyStatus = ref<string | null>(null)
  const showApiReference = ref(false)

  const maxApiKeys = computed(() => apiKeyMax.value ?? 5)

  const availableScopes = [
    { value: 'indices:read', label: 'Indices' },
    { value: 'corridors:read', label: 'Corridors' },
    { value: 'exports:read', label: 'Exports' },
  ]

  const activeApiKeyCount = computed(() => apiKeys.value.filter(k => !k.revoked_at).length)

  const apiKeyFromRow = (row: unknown): ApiKeyRecord => row as ApiKeyRecord

  const columns: DataTableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'key_prefix', label: 'Prefix', widthClass: 'w-32' },
    { key: 'scopes', label: 'Scopes' },
    { key: 'last_used_at', label: 'Last Used' },
    { key: 'revoked_at', label: 'Status' },
    { key: 'actions', label: 'Actions', align: 'right', widthClass: 'w-40' },
  ]

  const rowKey = (row: unknown, rowIndex: number) => {
    return apiKeyFromRow(row).key_id || String(rowIndex)
  }

  const toErrorMessage = (error: unknown, fallback: string) => {
    const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
    if (/429|too many|rate.?limit/i.test(raw)) return 'Rate limited — wait a moment then press Refresh.'
    if (/api_key_limit_reached/i.test(raw)) return `Maximum of ${maxApiKeys.value} active keys reached. Revoke a key before creating a new one.`
    return raw || fallback
  }

  const fetchApiKeys = async () => {
    if (apiKeysLoading.value) return
    apiKeysLoading.value = true
    apiKeysError.value = null
    try {
      const response = await request<{ success: boolean; keys: ApiKeyRecord[] }>('/me/api-keys')
      apiKeys.value = response.keys ?? []
      apiKeysLoaded.value = true
    } catch (error) {
      apiKeysError.value = toErrorMessage(error, 'Unable to load API keys.')
    } finally {
      apiKeysLoading.value = false
    }
  }

  const createKey = async () => {
    if (apiKeysLoading.value) return
    apiKeysLoading.value = true
    apiKeysError.value = null
    apiKeyToken.value = null
    apiKeyTokenLabel.value = null
    try {
      const scopes = apiKeyScopes.value.length > 0 ? [...apiKeyScopes.value] : ['indices:read', 'corridors:read']
      const response = await request<{ success: boolean; api_key: ApiKeyRecord; token: string }>('/me/api-keys', {
        method: 'POST',
        body: {
          name: apiKeyName.value.trim() || undefined,
          scopes,
        },
      })
      apiKeys.value = [response.api_key, ...apiKeys.value.filter(key => key.key_id !== response.api_key.key_id)]
      apiKeyToken.value = response.token
      apiKeyTokenLabel.value = response.api_key.key_prefix
      apiKeyName.value = ''
    } catch (error) {
      apiKeysError.value = toErrorMessage(error, 'Unable to create API key.')
    } finally {
      apiKeysLoading.value = false
    }
  }

  const rotateKey = async (key: ApiKeyRecord) => {
    if (apiKeysLoading.value) return
    apiKeysLoading.value = true
    apiKeysError.value = null
    apiKeyToken.value = null
    apiKeyTokenLabel.value = null
    try {
      const response = await request<{ success: boolean; api_key: ApiKeyRecord; token: string }>(`/me/api-keys/${key.key_id}/rotate`, {
        method: 'POST',
      })
      apiKeys.value = apiKeys.value.map(item => (
        item.key_id === key.key_id ? response.api_key : item
      ))
      apiKeyToken.value = response.token
      apiKeyTokenLabel.value = response.api_key.key_prefix
    } catch (error) {
      apiKeysError.value = toErrorMessage(error, 'Unable to rotate API key.')
    } finally {
      apiKeysLoading.value = false
    }
  }

  const revokeKey = async (key: ApiKeyRecord) => {
    if (apiKeysLoading.value) return
    apiKeysLoading.value = true
    apiKeysError.value = null
    try {
      await request(`/me/api-keys/${key.key_id}`, { method: 'DELETE' })
      apiKeys.value = apiKeys.value.map(item => (
        item.key_id === key.key_id ? { ...item, revoked_at: new Date().toISOString() } : item
      ))
    } catch (error) {
      apiKeysError.value = toErrorMessage(error, 'Unable to revoke API key.')
    } finally {
      apiKeysLoading.value = false
    }
  }

  const copyToken = async () => {
    if (!apiKeyToken.value || !import.meta.client) return
    try {
      await navigator.clipboard.writeText(apiKeyToken.value)
      apiKeyCopyStatus.value = 'Token copied.'
    } catch {
      apiKeyCopyStatus.value = 'Copy failed.'
    } finally {
      setTimeout(() => { apiKeyCopyStatus.value = null }, 2000)
    }
  }

  return {
    apiKeys,
    apiKeysLoading,
    apiKeysError,
    apiKeysLoaded,
    apiKeyName,
    apiKeyScopes,
    apiKeyToken,
    apiKeyTokenLabel,
    apiKeyCopyStatus,
    showApiReference,
    maxApiKeys,
    availableScopes,
    activeApiKeyCount,
    apiKeyFromRow,
    columns,
    rowKey,
    fetchApiKeys,
    createKey,
    rotateKey,
    revokeKey,
    copyToken,
  }
}
