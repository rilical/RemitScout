export type AccountDeletionResponse = {
  deleted: boolean
  anonymized: boolean
  errors?: string[]
  warnings?: string[]
}

export const useAccount = () => {
  const { request } = useApi()
  const { signOut } = useAuth()

  const deleting = useState<boolean>('account:delete:loading', () => false)
  const error = useState<string | null>('account:delete:error', () => null)
  const warnings = useState<string[] | null>('account:delete:warnings', () => null)

  const deleteAccount = async (): Promise<{
    ok: boolean
    result?: AccountDeletionResponse
    error?: string
  }> => {
    error.value = null
    warnings.value = null
    deleting.value = true

    try {
      const response = await request<AccountDeletionResponse>('/account', {
        method: 'DELETE',
        body: { confirm: true },
      })

      if (!response.deleted) {
        const message = response.errors?.join(', ') || 'Account deletion failed.'
        error.value = message
        return { ok: false, error: message, result: response }
      }

      if (response.warnings?.length) {
        warnings.value = response.warnings
      }

      await signOut()
      await navigateTo('/')

      return { ok: true, result: response }
    } catch (err: any) {
      const message = err?.message || 'Failed to delete account.'
      error.value = message
      return { ok: false, error: message }
    } finally {
      deleting.value = false
    }
  }

  return {
    deleting,
    error,
    warnings,
    deleteAccount,
  }
}
