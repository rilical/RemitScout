import type { AuthError, AuthUser } from '../auth/types'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
    authError?: AuthError
  }
}
