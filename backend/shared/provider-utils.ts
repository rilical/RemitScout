export const normalizeProviderId = (value: string | null | undefined): string => {
  return (value ?? '').trim().toLowerCase()
}

