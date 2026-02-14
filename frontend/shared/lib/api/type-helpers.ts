import type { paths } from './types'

export type SuccessResponse<P extends keyof paths, M extends keyof paths[P]> =
  paths[P][M] extends { responses: { 200: { content: { 'application/json': infer R } } } }
    ? R
    : never

export type RequestBody<P extends keyof paths, M extends keyof paths[P]> =
  paths[P][M] extends { requestBody: { content: { 'application/json': infer B } } }
    ? B
    : never

export type QueryParams<P extends keyof paths, M extends keyof paths[P]> =
  paths[P][M] extends { parameters: { query: infer Q } }
    ? Q
    : never

