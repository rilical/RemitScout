/**
 * Session persistence for provider discovery.
 *
 * Saves and loads browser session data (cookies, localStorage) to S3
 * so discovery runs can reuse sessions between invocations. This avoids
 * re-authenticating or re-accepting cookie banners on each scan.
 *
 * S3 path: {bucket}/discovery-sessions/{provider_id}/{date}.json
 *
 * Graceful degradation: if S3 is unavailable, logs a warning and
 * returns null (discovery continues without session reuse).
 */

import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.discovery.session-manager')

// ── Types ────────────────────────────────────────────────────────────

export type DiscoverySessionData = {
  cookies: unknown[]
  localStorage: Record<string, string>
  savedAt: string
}

// ── S3 client (lazy singleton) ───────────────────────────────────────

let s3Client: S3Client | null = null

const getClient = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({})
  }
  return s3Client
}

const getBucket = (): string =>
  config.storage?.bronze?.bucket || 'remit-scout-bronze'

// ── Helpers ──────────────────────────────────────────────────────────

const buildSessionKey = (providerId: string): string => {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `discovery-sessions/${providerId}/${date}.json`
}

/**
 * Convert a readable stream (from S3 GetObject) to a string.
 */
const streamToString = async (stream: NodeJS.ReadableStream): Promise<string> => {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Save session data (cookies + localStorage) to S3 for later reuse.
 *
 * Failures are logged as warnings and swallowed — session persistence
 * is optional and must never block the discovery pipeline.
 */
export async function saveSession(
  providerId: string,
  sessionData: DiscoverySessionData,
): Promise<void> {
  const bucket = getBucket()
  const key = buildSessionKey(providerId)

  try {
    const body = JSON.stringify(sessionData)

    await getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'application/json',
        Metadata: {
          provider_id: providerId,
          saved_at: sessionData.savedAt,
        },
      }),
    )

    logger.info('discovery_session_saved', {
      providerId,
      bucket,
      key,
      cookieCount: sessionData.cookies.length,
      localStorageKeys: Object.keys(sessionData.localStorage).length,
    })
  } catch (error) {
    logger.warn('discovery_session_save_failed', {
      providerId,
      bucket,
      key,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Load the most recent session data for a provider from S3.
 *
 * Returns null if:
 * - No session exists for today
 * - S3 is unavailable
 * - The stored data is unparseable
 */
export async function loadSession(
  providerId: string,
): Promise<DiscoverySessionData | null> {
  const bucket = getBucket()
  const key = buildSessionKey(providerId)

  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )

    if (!response.Body) {
      logger.debug('discovery_session_empty_body', { providerId, key })
      return null
    }

    const bodyStr = await streamToString(response.Body as NodeJS.ReadableStream)
    const data = JSON.parse(bodyStr) as DiscoverySessionData

    logger.info('discovery_session_loaded', {
      providerId,
      bucket,
      key,
      cookieCount: data.cookies?.length ?? 0,
      savedAt: data.savedAt,
    })

    return data
  } catch (error) {
    // NoSuchKey is expected when no session exists yet — log at debug level
    const errorCode = (error as { name?: string })?.name
    if (errorCode === 'NoSuchKey') {
      logger.debug('discovery_session_not_found', { providerId, key })
    } else {
      logger.warn('discovery_session_load_failed', {
        providerId,
        bucket,
        key,
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return null
  }
}
