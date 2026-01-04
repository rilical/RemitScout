import type { SupabaseClient } from '@supabase/supabase-js'

export const useSupabaseClient = (): SupabaseClient | null => {
  const nuxtApp = useNuxtApp() as { $supabase?: SupabaseClient | null }
  return nuxtApp.$supabase ?? null
}
