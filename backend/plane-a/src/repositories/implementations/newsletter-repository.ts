import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  INewsletterRepository,
  NewsletterCreateInput,
  NewsletterSubscriberRow,
} from '../interfaces/newsletter-repository.interface'

export class NewsletterRepository implements INewsletterRepository {
  constructor(private readonly pool: Pool) {}

  async createPending(input: NewsletterCreateInput): Promise<NewsletterSubscriberRow> {
    const result = await query<NewsletterSubscriberRow>(
      `INSERT INTO silver.newsletter_subscriber (
        email,
        status,
        verify_token_hash,
        unsubscribe_token_hash,
        source,
        verify_token_expires_at
      ) VALUES ($1, 'pending', $2, $3, $4, $5)
      RETURNING id, email, status, verify_token_hash, unsubscribe_token_hash, source,
                created_at, verified_at, unsubscribed_at, verify_token_expires_at`,
      [
        input.email,
        input.verify_token_hash,
        input.unsubscribe_token_hash,
        input.source ?? null,
        input.verify_token_expires_at ?? null,
      ],
      this.pool,
    )
    return result.rows[0]
  }

  async findByEmail(email: string): Promise<NewsletterSubscriberRow | null> {
    const result = await query<NewsletterSubscriberRow>(
      `SELECT id, email, status, verify_token_hash, unsubscribe_token_hash, source,
              created_at, verified_at, unsubscribed_at, verify_token_expires_at
       FROM silver.newsletter_subscriber
       WHERE email = $1`,
      [email],
      this.pool,
    )
    return result.rows[0] || null
  }

  async findByVerifyTokenHash(hash: string): Promise<NewsletterSubscriberRow | null> {
    const result = await query<NewsletterSubscriberRow>(
      `SELECT id, email, status, verify_token_hash, unsubscribe_token_hash, source,
              created_at, verified_at, unsubscribed_at, verify_token_expires_at
       FROM silver.newsletter_subscriber
       WHERE verify_token_hash = $1`,
      [hash],
      this.pool,
    )
    return result.rows[0] || null
  }

  async findByUnsubscribeTokenHash(hash: string): Promise<NewsletterSubscriberRow | null> {
    const result = await query<NewsletterSubscriberRow>(
      `SELECT id, email, status, verify_token_hash, unsubscribe_token_hash, source,
              created_at, verified_at, unsubscribed_at, verify_token_expires_at
       FROM silver.newsletter_subscriber
       WHERE unsubscribe_token_hash = $1`,
      [hash],
      this.pool,
    )
    return result.rows[0] || null
  }

  async updatePendingTokens(
    id: string,
    input: {
      verify_token_hash: string
      unsubscribe_token_hash: string
      source?: string | null
      verify_token_expires_at?: Date | null
    },
  ): Promise<void> {
    await query(
      `UPDATE silver.newsletter_subscriber
       SET status = 'pending',
           verify_token_hash = $2,
           unsubscribe_token_hash = $3,
           source = COALESCE($4, source),
           verified_at = NULL,
           unsubscribed_at = NULL,
           verify_token_expires_at = $5
       WHERE id = $1`,
      [
        id,
        input.verify_token_hash,
        input.unsubscribe_token_hash,
        input.source ?? null,
        input.verify_token_expires_at ?? null,
      ],
      this.pool,
    )
  }

  async activate(id: string): Promise<void> {
    await query(
      `UPDATE silver.newsletter_subscriber
       SET status = 'active',
           verified_at = NOW()
       WHERE id = $1`,
      [id],
      this.pool,
    )
  }

  async unsubscribe(id: string): Promise<void> {
    await query(
      `UPDATE silver.newsletter_subscriber
       SET status = 'unsubscribed',
           unsubscribed_at = NOW()
       WHERE id = $1`,
      [id],
      this.pool,
    )
  }

  async getActiveSubscribers(limit = 500): Promise<NewsletterSubscriberRow[]> {
    const result = await query<NewsletterSubscriberRow>(
      `SELECT id, email, status, verify_token_hash, unsubscribe_token_hash, source,
              created_at, verified_at, unsubscribed_at, verify_token_expires_at
       FROM silver.newsletter_subscriber
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
      this.pool,
    )
    return result.rows
  }
}
