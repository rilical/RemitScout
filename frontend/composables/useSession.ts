import { computed } from 'vue'
import { usePrivacySettings } from '~/composables/usePrivacySettings'

const storageKeySession = 'rs:telemetry:session_id'
const storageKeyAnon = 'rs:telemetry:anon_id'

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  }
  catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  }
  catch {
    // ignore storage failures
  }
}

const removeStorage = (key: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  }
  catch {
    // ignore storage failures
  }
}

export const useSession = () => {
  const { request } = useApi()
  const { analyticsConsent, marketingConsent } = usePrivacySettings()
  const sessionId = useState<string | null>('telemetry:session_id', () => null)
  const anonId = useState<string | null>('telemetry:anon_id', () => null)

  const canPersist = computed(() => analyticsConsent.value || marketingConsent.value)

  const ensureSession = () => {
    if (!sessionId.value) {
      if (canPersist.value) {
        const stored = readStorage(storageKeySession)
        sessionId.value = stored || makeId()
        if (!stored) {
          writeStorage(storageKeySession, sessionId.value)
        }
      }
      else {
        sessionId.value = makeId()
      }
    }

    if (!anonId.value) {
      if (canPersist.value) {
        const stored = readStorage(storageKeyAnon)
        anonId.value = stored || makeId()
        if (!stored) {
          writeStorage(storageKeyAnon, anonId.value)
        }
      }
      else {
        anonId.value = makeId()
      }
    }

    return {
      session_id: sessionId.value,
      anon_id: anonId.value,
    }
  }

  const ids = computed(() => ({
    session_id: sessionId.value,
    anon_id: anonId.value,
  }))

  const clearSession = () => {
    sessionId.value = null
    anonId.value = null
    removeStorage(storageKeySession)
    removeStorage(storageKeyAnon)
  }

  return {
    sessionId,
    anonId,
    ids,
    ensureSession,
    clearSession,
    trackSession: async () => {
      if (import.meta.server) return
      if (!analyticsConsent.value) return
      const ids = ensureSession()
      try {
        await request('/sessions/track', {
          method: 'POST',
          body: {
            session_id: ids.session_id,
            anon_id: ids.anon_id,
          },
          retries: 0,
        })
      }
      catch {
        // ignore session tracking errors
      }
    },
  }
}
