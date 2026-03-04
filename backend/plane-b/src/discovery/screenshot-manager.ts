/**
 * Screenshot capture and persistence for provider discovery.
 *
 * Uploads debug screenshots to S3 for post-mortem analysis of discovery
 * failures. Gated by config — when disabled, all operations are no-ops.
 *
 * S3 path: {bucket}/discovery-screenshots/{provider_id}/{date}/{step}.png
 *
 * Graceful degradation: S3 failures are logged as warnings and never
 * propagate — screenshot capture must never block the discovery pipeline.
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.discovery.screenshot-manager')

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

const buildScreenshotKey = (providerId: string, stepName: string): string => {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  // Sanitize step name to be a safe S3 key segment
  const safeStep = stepName.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `discovery-screenshots/${providerId}/${date}/${safeStep}.png`
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Upload a debug screenshot to S3.
 *
 * Returns the S3 key on success, or null if:
 * - Screenshots are disabled in config
 * - The upload fails (logged as warning, never throws)
 *
 * @param providerId - Provider being scanned
 * @param stepName   - Descriptive step name (e.g., "entry_page", "country_dropdown")
 * @param screenshotBuffer - PNG image buffer from Playwright
 * @returns S3 key string, or null if disabled/failed
 */
export async function captureScreenshot(
  providerId: string,
  stepName: string,
  screenshotBuffer: Buffer,
): Promise<string | null> {
  // Gate: no-op if screenshots disabled
  const screenshotsEnabled = config.planeB?.discovery?.screenshotsEnabled ?? false
  if (!screenshotsEnabled) {
    return null
  }

  const bucket = getBucket()
  const key = buildScreenshotKey(providerId, stepName)

  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: screenshotBuffer,
        ContentType: 'image/png',
        Metadata: {
          provider_id: providerId,
          step: stepName,
          captured_at: new Date().toISOString(),
        },
      }),
    )

    logger.info('discovery_screenshot_uploaded', {
      providerId,
      stepName,
      bucket,
      key,
      sizeBytes: screenshotBuffer.length,
    })

    return key
  } catch (error) {
    logger.warn('discovery_screenshot_upload_failed', {
      providerId,
      stepName,
      bucket,
      key,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
