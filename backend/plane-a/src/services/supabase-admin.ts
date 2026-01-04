import { getErrorMessage } from '../types/errors'

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
    } catch {
      // Ignore JSON parsing errors
    }

    const errorMessage = details || `Supabase deletion failed with status ${response.status}`
    throw new Error(getErrorMessage(errorMessage))
  }
}
