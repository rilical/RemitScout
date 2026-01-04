import { createHash, randomBytes } from 'crypto'

const toBase64Url = (buffer: Buffer) => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const generateToken = (bytes = 32): string => {
  return toBase64Url(randomBytes(bytes))
}

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex')
}
