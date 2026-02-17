export const useVisitSession = () => {
  // "Visit session" is per browser-tab visit (resets on full reload/new tab).
  // We intentionally avoid storage/cookies to keep this consent-neutral.
  const startedAt = useState<number>('visit:startedAtMs', () => 0)

  if (import.meta.client && startedAt.value === 0) {
    // Prefer a stable navigation-derived timestamp when available.
    // `performance.timeOrigin` is constant for the lifetime of the page and set at navigation start.
    const origin = typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number'
      ? performance.timeOrigin
      : Date.now()
    startedAt.value = Math.floor(origin)
  }

  return { startedAt }
}
