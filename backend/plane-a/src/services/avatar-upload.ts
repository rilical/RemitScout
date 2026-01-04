import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomBytes } from 'crypto'
import sharp from 'sharp'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.avatar-upload')

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 2048
const OUTPUT_SIZE = 512
const SIGNED_URL_TTL_SECONDS = 900

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

let s3Client: S3Client | null = null

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({})
  }
  return s3Client
}

const normalizePrefix = (value: string) => value.replace(/^\/+|\/+$/g, '')

const getBucket = () => config.storage.userAssets.bucket
const getPrefix = () => normalizePrefix(config.storage.userAssets.prefix || 'avatars')

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const isManagedKey = (value: string) => {
  if (!value || isAbsoluteUrl(value)) return false
  const prefix = getPrefix()
  return value.startsWith(`${prefix}/`)
}

const validateImage = async (buffer: Buffer, mimeType: string) => {
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error('unsupported_image_type')
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('image_too_large')
  }

  const metadata = await sharp(buffer, { failOnError: false }).metadata()
  if (metadata.width && metadata.width > MAX_DIMENSION) {
    throw new Error('image_dimensions_exceeded')
  }
  if (metadata.height && metadata.height > MAX_DIMENSION) {
    throw new Error('image_dimensions_exceeded')
  }
}

const processImage = async (buffer: Buffer) => {
  return sharp(buffer, { failOnError: false })
    .rotate()
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
      fit: 'cover',
      withoutEnlargement: true,
    })
    .toFormat('webp', { quality: 82 })
    .toBuffer()
}

export type AvatarUploadResult = {
  key: string
  url: string
}

export const uploadAvatar = async (
  userId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<AvatarUploadResult> => {
  const bucket = getBucket()
  if (!bucket) {
    throw new Error('user_assets_bucket_missing')
  }

  await validateImage(buffer, mimeType)
  const processed = await processImage(buffer)

  const prefix = getPrefix()
  const suffix = randomBytes(8).toString('hex')
  const key = `${prefix}/${userId}/${Date.now()}-${suffix}.webp`

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: processed,
      ContentType: 'image/webp',
    }),
  )

  const url = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  )

  return { key, url }
}

export const resolveAvatarUrl = async (
  storedValue: string | null | undefined,
): Promise<string | null> => {
  if (!storedValue) return null
  if (isAbsoluteUrl(storedValue)) return storedValue
  if (!isManagedKey(storedValue)) return storedValue

  const bucket = getBucket()
  if (!bucket) return null

  try {
    return await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: bucket,
        Key: storedValue,
      }),
      { expiresIn: SIGNED_URL_TTL_SECONDS },
    )
  } catch (error) {
    logger.warn('avatar_presign_failed', {
      key: storedValue,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export const deleteAvatar = async (storedValue: string | null | undefined): Promise<void> => {
  if (!storedValue) return
  if (!isManagedKey(storedValue)) return

  const bucket = getBucket()
  if (!bucket) return

  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storedValue,
      }),
    )
  } catch (error) {
    logger.warn('avatar_delete_failed', {
      key: storedValue,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
