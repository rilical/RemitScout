export type NewsletterStatus = 'pending' | 'active' | 'unsubscribed'

export type NewsletterSubscriberRow = {
  id: string
  email: string
  status: NewsletterStatus
  verify_token_hash: string
  unsubscribe_token_hash: string
  source: string | null
  created_at: Date
  verified_at: Date | null
  unsubscribed_at: Date | null
  verify_token_expires_at: Date | null
}

export type NewsletterCreateInput = {
  email: string
  verify_token_hash: string
  unsubscribe_token_hash: string
  source?: string | null
  verify_token_expires_at?: Date | null
}

export interface INewsletterRepository {
  createPending(input: NewsletterCreateInput): Promise<NewsletterSubscriberRow>
  findByEmail(email: string): Promise<NewsletterSubscriberRow | null>
  findByVerifyTokenHash(hash: string): Promise<NewsletterSubscriberRow | null>
  findByUnsubscribeTokenHash(hash: string): Promise<NewsletterSubscriberRow | null>
  updatePendingTokens(
    id: string,
    input: {
      verify_token_hash: string
      unsubscribe_token_hash: string
      source?: string | null
      verify_token_expires_at?: Date | null
    },
  ): Promise<void>
  activate(id: string): Promise<void>
  unsubscribe(id: string): Promise<void>
  getActiveSubscribers(limit?: number): Promise<NewsletterSubscriberRow[]>
}
