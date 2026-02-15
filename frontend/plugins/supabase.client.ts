import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabasePluginReturn = {
  provide: {
    supabase: SupabaseClient | null
  }
}

export default defineNuxtPlugin((): SupabasePluginReturn => {
  const config = useRuntimeConfig()
  const supabaseUrl = String(config.public.supabaseUrl || '')
  const supabaseAnonKey = String(config.public.supabaseAnonKey || '')

  if (!supabaseUrl || !supabaseAnonKey) {
    useLogger('supabase').warn('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY')
    return { provide: { supabase: null } }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'remit-scout-auth',
    },
  })

  return { provide: { supabase } }
})
