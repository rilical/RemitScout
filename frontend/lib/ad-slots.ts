import type { AdPlacement } from '~/lib/ads'

const AD_SLOT_DEFAULTS: Record<AdPlacement, number[]> = {
  compare_inline: [101],
  compare_sidebar: [101],
  home_inline: [101],
  dashboard_inline: [101],
  corridor_interstitial: [101],
  corridor_below_faq: [101],
  corridor_footer: [101],
  blog_sidebar: [101],
  blog_inline: [101],
  blog_banner: [101],
}

type AdSlotMap = Partial<Record<AdPlacement, number[]>>

const usedPlaceholderIds = new Set<number>()

const sanitizePlaceholderIds = (ids?: number[]): number[] => {
  if (!Array.isArray(ids)) return []
  return ids
    .map(id => Number(id))
    .filter(id => Number.isInteger(id) && id > 0)
}

export const getAdSlotId = (
  placement: AdPlacement,
  slotIndex?: number,
  overrideId?: number,
  runtimePlacementIds?: AdSlotMap,
): number | null => {
  if (overrideId !== undefined) return overrideId
  const runtimeIds = sanitizePlaceholderIds(runtimePlacementIds?.[placement])
  const ids = runtimeIds.length > 0 ? runtimeIds : AD_SLOT_DEFAULTS[placement] ?? []
  if (slotIndex !== undefined) {
    return ids[slotIndex] ?? null
  }
  return ids[0] ?? null
}

export const claimAdSlotId = (id: number): boolean => {
  if (usedPlaceholderIds.has(id)) return false
  usedPlaceholderIds.add(id)
  return true
}

export const releaseAdSlotId = (id: number) => {
  usedPlaceholderIds.delete(id)
}

export const resetAdSlotIds = () => {
  usedPlaceholderIds.clear()
}
