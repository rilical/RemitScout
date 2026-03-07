import '../../shared/load-env'
import { randomUUID } from 'node:crypto'
import {
  evaluateMeChecks,
  readSmokeMeExpectations,
  resolveSmokeApiBaseUrl,
  resolveSmokeRootBaseUrl,
} from './alerts-watchlists-smoke'
import {
  findVerifiedTotpFactor,
  hasTotpMfaAmr,
  readSmokeUserMfaCode,
} from './admin-surface-smoke'

type Check = {
  name: string
  ok: boolean
  note?: string
}

type SupabasePasswordSignInResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

type SupabaseUserFactor = {
  id?: string
  factor_type?: string
  status?: string
}

type SupabaseUserResponse = {
  id?: string
  email?: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  factors?: SupabaseUserFactor[]
  user?: {
    id?: string
    email?: string
    email_confirmed_at?: string | null
    confirmed_at?: string | null
    factors?: SupabaseUserFactor[]
  }
  error?: string
  message?: string
}

type SupabaseSignupResponse = {
  user?: {
    id?: string
    email?: string
    email_confirmed_at?: string | null
    confirmed_at?: string | null
  } | null
  session?: {
    access_token?: string
  } | null
  error?: {
    message?: string
  } | string
  message?: string
}

type SupabaseAdminListResponse = {
  users?: Array<{
    id?: string
    email?: string | null
    email_confirmed_at?: string | null
    confirmed_at?: string | null
  }>
}

type SupabaseMfaChallengeResponse = {
  id?: string
  error?: string
  message?: string
}

type SupabaseMfaVerifyResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
  message?: string
}

type ForgotPasswordResponse = {
  message?: string
}

type AuthSmokeConfig = {
  expectMfa: boolean
  requireEmailConfirmation: boolean
  signupEmailPrefix: string
}

const SUCCESS_MESSAGE = 'If that email exists, a reset link has been sent.'

const mustEnv = (key: string): string => {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value.trim()
}

const parseOptionalBoolean = (value: string | undefined): boolean | undefined => {
  if (!value || !value.trim()) return undefined
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  throw new Error(`Invalid boolean value: ${value}`)
}

const readAuthSmokeConfig = (env: NodeJS.ProcessEnv = process.env): AuthSmokeConfig => {
  const runtime = (
    env.ENVIRONMENT ||
    env.ENV_NAME ||
    env.NODE_ENV ||
    'staging'
  ).trim().toLowerCase()

  return {
    expectMfa: parseOptionalBoolean(env.SMOKE_EXPECT_MFA) ?? false,
    requireEmailConfirmation:
      parseOptionalBoolean(env.SMOKE_REQUIRE_EMAIL_CONFIRMATION)
      ?? (runtime === 'staging' || runtime === 'prod' || runtime === 'production'),
    signupEmailPrefix: env.SMOKE_SIGNUP_EMAIL_PREFIX?.trim() || 'release-smoke-auth',
  }
}

const jsonFetch = async <T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> => {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''
  const body: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '')
  return { status: res.status, body: body as T }
}

const buildAnonHeaders = (apiKey: string, accessToken?: string): HeadersInit => ({
  apikey: apiKey,
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : { Authorization: `Bearer ${apiKey}` }),
  'Content-Type': 'application/json',
})

const buildServiceHeaders = (serviceRoleKey: string): HeadersInit => ({
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
})

const signInSupabase = async (
  supabaseUrl: string,
  apiKey: string,
  email: string,
  password: string,
): Promise<string> => {
  const { status, body } = await jsonFetch<SupabasePasswordSignInResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: buildAnonHeaders(apiKey),
      body: JSON.stringify({ email, password }),
    },
  )

  const token = typeof body?.access_token === 'string' ? body.access_token : ''
  if (status >= 400 || !token) {
    throw new Error(`Supabase sign-in failed status=${status} body=${JSON.stringify(body)}`)
  }

  return token
}

const getSupabaseUser = async (
  supabaseUrl: string,
  apiKey: string,
  accessToken: string,
): Promise<SupabaseUserResponse> => {
  const { status, body } = await jsonFetch<SupabaseUserResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
    {
      headers: buildAnonHeaders(apiKey, accessToken),
    },
  )

  if (status >= 400) {
    throw new Error(`Supabase getUser failed status=${status} body=${JSON.stringify(body)}`)
  }

  return body
}

const maybeVerifySupabaseMfa = async (
  supabaseUrl: string,
  apiKey: string,
  accessToken: string,
): Promise<{ accessToken: string; factorPresent: boolean; factorVerified: boolean }> => {
  if (hasTotpMfaAmr(accessToken)) {
    return {
      accessToken,
      factorPresent: true,
      factorVerified: true,
    }
  }

  const user = await getSupabaseUser(supabaseUrl, apiKey, accessToken)
  const verifiedFactor = findVerifiedTotpFactor(user)
  if (!verifiedFactor?.id) {
    return {
      accessToken,
      factorPresent: false,
      factorVerified: false,
    }
  }

  const mfaCode = readSmokeUserMfaCode()
  if (!mfaCode) {
    return {
      accessToken,
      factorPresent: true,
      factorVerified: false,
    }
  }

  const { status: challengeStatus, body: challengeBody } = await jsonFetch<SupabaseMfaChallengeResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/factors/${verifiedFactor.id}/challenge`,
    {
      method: 'POST',
      headers: buildAnonHeaders(apiKey, accessToken),
      body: JSON.stringify({}),
    },
  )

  if (challengeStatus >= 400 || !challengeBody?.id) {
    throw new Error(
      `Supabase MFA challenge failed status=${challengeStatus} body=${JSON.stringify(challengeBody)}`,
    )
  }

  const { status: verifyStatus, body: verifyBody } = await jsonFetch<SupabaseMfaVerifyResponse>(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/factors/${verifiedFactor.id}/verify`,
    {
      method: 'POST',
      headers: buildAnonHeaders(apiKey, accessToken),
      body: JSON.stringify({
        challenge_id: challengeBody.id,
        code: mfaCode,
      }),
    },
  )

  const nextToken = typeof verifyBody?.access_token === 'string' ? verifyBody.access_token : ''
  if (verifyStatus >= 400 || !nextToken) {
    throw new Error(`Supabase MFA verify failed status=${verifyStatus} body=${JSON.stringify(verifyBody)}`)
  }

  return {
    accessToken: nextToken,
    factorPresent: true,
    factorVerified: hasTotpMfaAmr(nextToken),
  }
}

const extractSupabaseUsers = (payload: unknown): Array<{
  id?: string
  email?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}> => {
  if (!payload || typeof payload !== 'object') return []
  const users = (payload as SupabaseAdminListResponse).users
  return Array.isArray(users) ? users : []
}

const findSupabaseUserByEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<{
  id?: string
  email?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
} | null> => {
  const normalizedEmail = email.trim().toLowerCase()
  const baseUrl = supabaseUrl.replace(/\/$/, '')

  const direct = await jsonFetch<SupabaseAdminListResponse>(
    `${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalizedEmail)}`,
    {
      method: 'GET',
      headers: buildServiceHeaders(serviceRoleKey),
    },
  )

  if (direct.status < 400) {
    const match = extractSupabaseUsers(direct.body)
      .find((user) => user.email?.trim().toLowerCase() === normalizedEmail)
    if (match) return match
  }

  for (let page = 1; page <= 5; page += 1) {
    const paged = await jsonFetch<SupabaseAdminListResponse>(
      `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=100`,
      {
        method: 'GET',
        headers: buildServiceHeaders(serviceRoleKey),
      },
    )
    if (paged.status >= 400) break

    const users = extractSupabaseUsers(paged.body)
    const match = users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail)
    if (match) return match
    if (users.length < 100) break
  }

  return null
}

const extractConfirmedAt = (candidate: {
  email_confirmed_at?: string | null
  confirmed_at?: string | null
} | null | undefined) => candidate?.email_confirmed_at || candidate?.confirmed_at || null

const createSmokeSignupEmail = (prefix: string) =>
  `${prefix}+${Date.now()}-${randomUUID().slice(0, 8)}@example.com`

const createSmokePassword = () => `Smoke-${randomUUID()}-Passw0rd!`

const main = async () => {
  const smokeBaseUrl = mustEnv('SMOKE_BASE_URL')
  const supabaseUrl = mustEnv('SUPABASE_URL')
  const supabasePublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || ''
  if (!supabasePublishableKey) {
    throw new Error('Missing SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)')
  }

  const smokeEmail = mustEnv('SMOKE_USER_EMAIL')
  const smokePassword = mustEnv('SMOKE_USER_PASSWORD')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''
  const apiBase = resolveSmokeApiBaseUrl(smokeBaseUrl)
  const rootBase = resolveSmokeRootBaseUrl(smokeBaseUrl)
  const authConfig = readAuthSmokeConfig()
  const checks: Check[] = []
  const record = (check: Check) => checks.push(check)
  const meExpectations = readSmokeMeExpectations()

  let authToken = await signInSupabase(supabaseUrl, supabasePublishableKey, smokeEmail, smokePassword)
  record({
    name: 'Supabase password sign-in',
    ok: Boolean(authToken),
    note: `email=${smokeEmail}`,
  })

  const mfa = await maybeVerifySupabaseMfa(supabaseUrl, supabasePublishableKey, authToken)
  authToken = mfa.accessToken
  record({
    name: 'Supabase MFA truth',
    ok:
      authConfig.expectMfa
        ? mfa.factorPresent && mfa.factorVerified
        : true,
    note: `factor_present=${String(mfa.factorPresent)} factor_verified=${String(mfa.factorVerified)}`,
  })

  {
    const { status, body } = await jsonFetch(`${apiBase}/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    for (const check of evaluateMeChecks(status, body as never, meExpectations)) {
      record(check)
    }
  }

  {
    const { status, body } = await jsonFetch(`${apiBase}/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    record({
      name: 'GET /me repeated session truth',
      ok: Boolean(
        status < 400
        && body
        && typeof body === 'object'
        && (body as { success?: boolean }).success === true,
      ),
      note: `status=${status}`,
    })
  }

  {
    const { status, body } = await jsonFetch<ForgotPasswordResponse>(`${apiBase}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: smokeEmail }),
    })
    record({
      name: 'POST /auth/forgot-password known email',
      ok: status === 200 && body?.message === SUCCESS_MESSAGE,
      note: `status=${status} message=${String(body?.message || '')}`,
    })
  }

  {
    const { status, body } = await jsonFetch<ForgotPasswordResponse>(`${apiBase}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `nobody+${Date.now()}@example.com` }),
    })
    record({
      name: 'POST /auth/forgot-password unknown email',
      ok: status === 200 && body?.message === SUCCESS_MESSAGE,
      note: `status=${status} message=${String(body?.message || '')}`,
    })
  }

  {
    const { status, body } = await jsonFetch<ForgotPasswordResponse>(`${apiBase}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    record({
      name: 'POST /auth/forgot-password invalid email anti-enumeration',
      ok: status === 200 && body?.message === SUCCESS_MESSAGE,
      note: `status=${status} message=${String(body?.message || '')}`,
    })
  }

  let createdUserId: string | null = null
  let createdEmail: string | null = null

  if (serviceRoleKey) {
    createdEmail = createSmokeSignupEmail(authConfig.signupEmailPrefix)
    const createdPassword = createSmokePassword()

    const signup = await jsonFetch<SupabaseSignupResponse>(
      `${supabaseUrl.replace(/\/$/, '')}/auth/v1/signup`,
      {
        method: 'POST',
        headers: buildAnonHeaders(supabasePublishableKey),
        body: JSON.stringify({
          email: createdEmail,
          password: createdPassword,
          options: {
            emailRedirectTo: `${rootBase}/auth/confirm`,
          },
        }),
      },
    )

    createdUserId = typeof signup.body?.user?.id === 'string' ? signup.body.user.id : null
    const sessionToken = typeof signup.body?.session?.access_token === 'string'
      ? signup.body.session.access_token
      : ''

    record({
      name: 'Supabase sign-up',
      ok: signup.status < 400 && Boolean(createdUserId),
      note: `status=${signup.status} user_id=${String(createdUserId)}`,
    })

    record({
      name: 'Supabase email verification truth',
      ok: authConfig.requireEmailConfirmation ? !sessionToken : Boolean(sessionToken),
      note: `session_present=${String(Boolean(sessionToken))}`,
    })

    const adminUser = await findSupabaseUserByEmail(supabaseUrl, serviceRoleKey, createdEmail)
    createdUserId = createdUserId || adminUser?.id || null
    record({
      name: 'Supabase admin lookup sees signup user',
      ok: Boolean(adminUser?.id),
      note: `confirmed_at=${String(extractConfirmedAt(adminUser))}`,
    })

    record({
      name: 'Supabase signup user confirmation state matches policy',
      ok:
        authConfig.requireEmailConfirmation
          ? !extractConfirmedAt(adminUser)
          : Boolean(extractConfirmedAt(adminUser)),
      note: `confirmed_at=${String(extractConfirmedAt(adminUser))}`,
    })

    if (createdUserId) {
      const confirm = await jsonFetch(
        `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${createdUserId}`,
        {
          method: 'PUT',
          headers: buildServiceHeaders(serviceRoleKey),
          body: JSON.stringify({
            email_confirm: true,
            password: createdPassword,
          }),
        },
      )

      record({
        name: 'Supabase admin confirms signup user',
        ok: confirm.status < 400,
        note: `status=${confirm.status}`,
      })

      const createdToken = await signInSupabase(
        supabaseUrl,
        supabasePublishableKey,
        createdEmail,
        createdPassword,
      )

      record({
        name: 'Confirmed signup can sign in',
        ok: Boolean(createdToken),
        note: `email=${createdEmail}`,
      })

      const me = await jsonFetch(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${createdToken}` },
      })
      record({
        name: 'New signup bootstrap /me',
        ok: Boolean(
          me.status < 400
          && me.body
          && typeof me.body === 'object'
          && (me.body as { success?: boolean }).success === true,
        ),
        note: `status=${me.status}`,
      })
    }
  } else {
    record({
      name: 'Supabase sign-up',
      ok: false,
      note: 'skipped because SUPABASE_SERVICE_ROLE_KEY is missing',
    })
  }

  if (serviceRoleKey && createdUserId) {
    const cleanup = await jsonFetch(
      `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${createdUserId}`,
      {
        method: 'DELETE',
        headers: buildServiceHeaders(serviceRoleKey),
      },
    ).catch(() => ({ status: 0 }))

    record({
      name: 'cleanup delete smoke signup user',
      ok: cleanup.status < 400,
      note: `status=${cleanup.status}`,
    })
  }

  const failures = checks.filter((check) => !check.ok)
  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` | ${check.note}` : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\nAuth surface smoke failed: ${failures.length} checks failed`)
    process.exit(1)
  }

  console.log('\nAuth surface smoke passed.')
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      'Auth surface smoke crashed:',
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  })
}

export {
  extractConfirmedAt,
  jsonFetch,
  maybeVerifySupabaseMfa,
  readAuthSmokeConfig,
  signInSupabase,
}
