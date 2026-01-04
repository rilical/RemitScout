export type UserAccountUpsertInput = {
  user_id: string
  email: string | null
}

export type UserAccountProfile = {
  name: string | null
  avatar_url: string | null
}

export type UserAccountProfileUpdateInput = {
  user_id: string
  name?: string | null
  avatar_url?: string | null
}

export interface IUserAccountRepository {
  upsertUserAccount(input: UserAccountUpsertInput): Promise<void>
  getProfile(userId: string): Promise<UserAccountProfile | null>
  updateProfile(input: UserAccountProfileUpdateInput): Promise<UserAccountProfile | null>
  updateAvatar(userId: string, avatarUrl: string | null): Promise<UserAccountProfile | null>
}
