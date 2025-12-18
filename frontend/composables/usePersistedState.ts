type Serializer<T> = {
  read: (raw: string) => T
  write: (value: T) => string
}

type PersistedStateOptions<T> = {
  storageKey?: string
  serializer?: Serializer<T>
  validate?: (value: unknown) => value is T
  listenToStorage?: boolean
}

const defaultJsonSerializer = <T>(): Serializer<T> => ({
  read: raw => JSON.parse(raw) as T,
  write: value => JSON.stringify(value),
})

function safeRead<T>(key: string, serializer: Serializer<T>) {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    if (!raw) return { ok: false as const, value: undefined }
    return { ok: true as const, value: serializer.read(raw) }
  }
  catch {
    return { ok: false as const, value: undefined }
  }
}

function safeWrite<T>(key: string, value: T, serializer: Serializer<T>) {
  try {
    globalThis.localStorage?.setItem(key, serializer.write(value))
    return true
  }
  catch {
    return false
  }
}

export function usePersistedState<T>(
  key: string,
  initial: () => T,
  options: PersistedStateOptions<T> = {},
) {
  const storageKey = options.storageKey ?? `remitscout:${key}`
  const serializer = options.serializer ?? defaultJsonSerializer<T>()
  const validate = options.validate
  const listenToStorage = options.listenToStorage ?? true

  const state = useState<T>(`persisted:${storageKey}`, initial)
  const hydrated = useState<boolean>(`persisted:${storageKey}:hydrated`, () => false)

  function hydrateFromStorage() {
    if (!import.meta.client) return

    const loaded = safeRead<T>(storageKey, serializer)
    if (!loaded.ok) {
      hydrated.value = true
      return
    }

    if (validate && !validate(loaded.value)) {
      hydrated.value = true
      return
    }

    state.value = loaded.value
    hydrated.value = true
  }

  function persistToStorage() {
    if (!import.meta.client) return
    if (!hydrated.value) return
    safeWrite(storageKey, state.value, serializer)
  }

  const storageListener = (e: StorageEvent) => {
    if (e.key !== storageKey) return
    hydrateFromStorage()
  }

  onMounted(() => {
    hydrateFromStorage()

    if (!listenToStorage) return
    globalThis.addEventListener?.('storage', storageListener)
  })

  onBeforeUnmount(() => {
    if (!listenToStorage) return
    globalThis.removeEventListener?.('storage', storageListener)
  })

  watch(
    state,
    () => {
      persistToStorage()
    },
    { deep: true },
  )

  function reset() {
    state.value = initial()
    persistToStorage()
  }

  return {
    state,
    hydrated,
    reset,
    storageKey,
  }
}
