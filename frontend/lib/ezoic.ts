import type { AdPlacement } from '~/lib/ads'

const EZOIC_PLACEHOLDERS: Record<AdPlacement, number[]> = {
  compare_inline: [101],
  compare_sidebar: [101],
  home_inline: [101],
  dashboard_inline: [101],
  blog_sidebar: [101],
  blog_inline: [101],
  blog_banner: [101],
}

const usedPlaceholderIds = new Set<number>()

export const getEzoicPlaceholderId = (
  placement: AdPlacement,
  slotIndex?: number,
  overrideId?: number,
): number | null => {
  if (overrideId !== undefined) return overrideId
  const ids = EZOIC_PLACEHOLDERS[placement] ?? []
  if (slotIndex !== undefined) {
    return ids[slotIndex] ?? null
  }
  return ids[0] ?? null
}

export const claimEzoicPlaceholderId = (id: number): boolean => {
  if (usedPlaceholderIds.has(id)) return false
  usedPlaceholderIds.add(id)
  return true
}

export const releaseEzoicPlaceholderId = (id: number) => {
  usedPlaceholderIds.delete(id)
}

export const resetEzoicPlaceholderIds = () => {
  usedPlaceholderIds.clear()
}
