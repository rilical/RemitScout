import { computed } from 'vue'

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
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore storage failures
  }
}

export const useSession = () => {
  const { request } = useApi()
  const sessionId = useState<string | null>('telemetry:session_id', () => null)
  const anonId = useState<string | null>('telemetry:anon_id', () => null)

  const ensureSession = () => {
    if (!sessionId.value) {
      const stored = readStorage(storageKeySession)
      sessionId.value = stored || makeId()
      if (!stored) {
        writeStorage(storageKeySession, sessionId.value)
      }
    }

    if (!anonId.value) {
      const stored = readStorage(storageKeyAnon)
      anonId.value = stored || makeId()
      if (!stored) {
        writeStorage(storageKeyAnon, anonId.value)
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

  return {
    sessionId,
    anonId,
    ids,
    ensureSession,
    trackSession: async () => {
      if (import.meta.server) return
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
      } catch {
        // ignore session tracking errors
      }
    },
  }
}
