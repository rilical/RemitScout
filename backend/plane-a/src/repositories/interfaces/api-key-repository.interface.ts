export type ApiKeyRecord = {
  key_id: string
  user_id: string
  key_prefix: string
  key_hash: string
  name: string | null
  scopes: string[]
  created_at: Date
  last_used_at: Date | null
  revoked_at: Date | null
}

export type ApiKeyCreateInput = {
  user_id: string
  key_prefix: string
  key_hash: string
  name?: string | null
  scopes?: string[]
}

export interface IApiKeyRepository {
  createKey(input: ApiKeyCreateInput): Promise<ApiKeyRecord>
  listKeys(userId: string): Promise<ApiKeyRecord[]>
  getKeyByHash(keyHash: string): Promise<ApiKeyRecord | null>
  revokeKey(userId: string, keyId: string): Promise<boolean>
  markKeyUsed(keyId: string): Promise<void>
  countActiveKeys(userId: string): Promise<number>
}
