export type UserAccountUpsertInput = {
  user_id: string
  email: string | null
}

export interface IUserAccountRepository {
  upsertUserAccount(input: UserAccountUpsertInput): Promise<void>
}
