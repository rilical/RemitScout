import { getErrorMessage } from '../types/errors'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.supabase-admin')

export const deleteSupabaseAccount = async (
  userId: string,
  serviceRoleKey: string,
  supabaseUrl: string,
): Promise<void> => {
  const baseUrl = supabaseUrl.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    let details = ''
    try {
      const payload = await response.json()
      if (payload && typeof payload === 'object' && 'message' in payload) {
        details = String((payload as { message?: string }).message || '')
      }
    } catch (error) {
      logger.debug('supabase_delete_error_payload_parse_failed', {
        user_id: userId,
        status: response.status,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    const errorMessage = details || `Supabase deletion failed with status ${response.status}`
    throw new Error(getErrorMessage(errorMessage))
  }
}
