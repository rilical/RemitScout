import { config } from '../../../shared/config'

const isDevEnv = () => {
  return config.env === 'development' || config.env === 'dev' || config.env === 'test'
}

export const isSupabaseMockEnabled = () => {
  return config.auth.supabase.mock.enabled && isDevEnv()
}

export const isSupabaseMockMisconfigured = () => {
  return config.auth.supabase.mock.enabled && !isDevEnv()
}
