export type B2bSweepRunTiming = {
  createdAt?: Date | string | null
  startedAt?: Date | string | null
  finishedAt?: Date | string | null
}

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const getCompletedSweepReferenceTime = (
  run: B2bSweepRunTiming | null | undefined,
): Date | null => {
  if (!run) return null
  return toDate(run.finishedAt) ?? toDate(run.startedAt) ?? toDate(run.createdAt)
}

export const isSweepTierDue = (options: {
  latestCompletedRun?: B2bSweepRunTiming | null
  cadenceSeconds: number
  now?: Date
}): boolean => {
  const now = options.now ?? new Date()
  const reference = getCompletedSweepReferenceTime(options.latestCompletedRun)
  if (!reference) return true
  return (now.getTime() - reference.getTime()) >= options.cadenceSeconds * 1000
}

export const getSweepCadenceDriftMinutes = (options: {
  latestCompletedRun?: B2bSweepRunTiming | null
  cadenceSeconds: number
  now?: Date
}): number | null => {
  const now = options.now ?? new Date()
  const reference = getCompletedSweepReferenceTime(options.latestCompletedRun)
  if (!reference) return null

  const dueAtMs = reference.getTime() + (options.cadenceSeconds * 1000)
  return Math.round((now.getTime() - dueAtMs) / 60000)
}
