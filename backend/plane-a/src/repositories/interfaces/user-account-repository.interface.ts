export type UserAccountUpsertInput = {
  user_id: string
  email: string | null
  app_role?: 'user' | 'admin' | 'super_admin' | null
}

export type UserAccountProfile = {
  name: string | null
}

export type UserAccountProfileUpdateInput = {
  user_id: string
  name?: string | null
}

export type UserPrivacySettings = {
  analytics_enabled: boolean
  marketing_enabled: boolean
  personalization_enabled: boolean
  updated_at: string | null
}

export type UserPrivacyUpdateInput = {
  user_id: string
  analytics_enabled: boolean
  // Optional until the DB column exists; safe no-op in repository implementation.
  marketing_enabled?: boolean
  personalization_enabled: boolean
}

export type UserAdminRecord = {
  user_id: string
  email: string | null
  app_role: string
  created_at: string
  last_seen_at: string | null
  privacy_analytics_enabled: boolean
  privacy_personalization_enabled: boolean
}

export type UserRoleUpdateInput = {
  user_id: string
  app_role: 'user' | 'admin' | 'super_admin'
}

export interface IUserAccountRepository {
  upsertUserAccount(input: UserAccountUpsertInput): Promise<{ created: boolean }>
  getProfile(userId: string): Promise<UserAccountProfile | null>
  updateProfile(input: UserAccountProfileUpdateInput): Promise<UserAccountProfile | null>
  getPrivacySettings(userId: string): Promise<UserPrivacySettings | null>
  updatePrivacySettings(input: UserPrivacyUpdateInput): Promise<UserPrivacySettings | null>
  listAdminUsers(query?: string, limit?: number): Promise<UserAdminRecord[]>
  updateUserRole(input: UserRoleUpdateInput): Promise<UserAdminRecord | null>
  updateUserRoleByEmail(email: string, role: UserRoleUpdateInput['app_role']): Promise<UserAdminRecord | null>
}
