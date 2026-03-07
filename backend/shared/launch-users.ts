export type LaunchUserRole = 'user' | 'admin' | 'super_admin'
export type LaunchUserPlanCode = 'free' | 'plus' | 'enterprise'

export type LaunchUserSpec = {
  email: string
  appRole: LaunchUserRole
  planCode: LaunchUserPlanCode
  passwordEnvKey: string
}

export const LAUNCH_USERS: readonly LaunchUserSpec[] = [
  {
    email: 'omar@remit-scout.com',
    appRole: 'super_admin',
    planCode: 'enterprise',
    passwordEnvKey: 'LAUNCH_PASSWORD_OMAR',
  },
  {
    email: 'developer@remit-scout.com',
    appRole: 'admin',
    planCode: 'enterprise',
    passwordEnvKey: 'LAUNCH_PASSWORD_DEVELOPER',
  },
  {
    email: 'austrilic@gmail.com',
    appRole: 'user',
    planCode: 'enterprise',
    passwordEnvKey: 'LAUNCH_PASSWORD_AUSTRILIC',
  },
  {
    email: 'ghabayenedu@gmail.com',
    appRole: 'user',
    planCode: 'plus',
    passwordEnvKey: 'LAUNCH_PASSWORD_GHABAYENEDU',
  },
  {
    email: 'support@remit-scout.com',
    appRole: 'user',
    planCode: 'free',
    passwordEnvKey: 'LAUNCH_PASSWORD_SUPPORT',
  },
]

export const normalizeLaunchUserEmail = (value?: string | null): string | null => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return normalized || null
}

export const getLaunchUserByEmail = (email?: string | null): LaunchUserSpec | null => {
  const normalized = normalizeLaunchUserEmail(email)
  if (!normalized) return null
  return LAUNCH_USERS.find(user => user.email === normalized) ?? null
}
