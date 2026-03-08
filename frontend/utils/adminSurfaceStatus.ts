export type AdminSurfaceTone = 'healthy' | 'watch' | 'critical' | 'disabled' | 'gated'

export type AdminSurfaceStat = {
  label: string
  value: string
  detail?: string
}

export type AdminSurfaceDependency = {
  label: string
  status: AdminSurfaceTone
  detail: string
}

export type AdminSurfaceAction = {
  label: string
  detail?: string
}

export type AdminSurfaceEmptyState = {
  title: string
  body: string
}

export type AdminSurfaceOverviewModel = {
  runtimeLabel: string
  runtimeTone: AdminSurfaceTone
  runtimeDetail?: string
  freshnessLabel: string
  freshnessTone: AdminSurfaceTone
  freshnessDetail?: string
  lastJobLabel: string
  lastJobDetail?: string
  stats?: AdminSurfaceStat[]
  dependencies: AdminSurfaceDependency[]
  nextActions: AdminSurfaceAction[]
  emptyState?: AdminSurfaceEmptyState | null
}

export const getAdminSurfaceToneClasses = (tone: AdminSurfaceTone) => {
  switch (tone) {
    case 'healthy':
      return {
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        dot: 'bg-emerald-500',
      }
    case 'watch':
      return {
        badge: 'border-amber-200 bg-amber-50 text-amber-800',
        dot: 'bg-amber-500',
      }
    case 'critical':
      return {
        badge: 'border-rose-200 bg-rose-50 text-rose-800',
        dot: 'bg-rose-500',
      }
    case 'disabled':
      return {
        badge: 'border-slate-200 bg-slate-100 text-slate-700',
        dot: 'bg-slate-500',
      }
    case 'gated':
      return {
        badge: 'border-sky-200 bg-sky-50 text-sky-800',
        dot: 'bg-sky-500',
      }
    default:
      return {
        badge: 'border-slate-200 bg-slate-100 text-slate-700',
        dot: 'bg-slate-500',
      }
  }
}

const minuteMs = 60 * 1000
const hourMs = 60 * minuteMs
const dayMs = 24 * hourMs

export const formatAdminSurfaceAge = (timestamp: string | null | undefined, nowMs = Date.now()): string => {
  if (!timestamp) return 'Not available'
  const parsed = new Date(timestamp).getTime()
  if (!Number.isFinite(parsed)) return 'Not available'
  const diff = Math.max(0, nowMs - parsed)
  if (diff < minuteMs) return 'Just now'
  if (diff < hourMs) return `${Math.floor(diff / minuteMs)}m ago`
  if (diff < dayMs) return `${Math.floor(diff / hourMs)}h ago`
  return `${Math.floor(diff / dayMs)}d ago`
}

export const getFreshnessTone = (
  timestamp: string | null | undefined,
  thresholds: { watchMinutes: number, criticalMinutes: number },
  nowMs = Date.now(),
): AdminSurfaceTone => {
  if (!timestamp) return 'watch'
  const parsed = new Date(timestamp).getTime()
  if (!Number.isFinite(parsed)) return 'watch'
  const diffMinutes = Math.max(0, nowMs - parsed) / minuteMs
  if (diffMinutes >= thresholds.criticalMinutes) return 'critical'
  if (diffMinutes >= thresholds.watchMinutes) return 'watch'
  return 'healthy'
}
