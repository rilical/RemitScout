import { z } from 'zod'
import { DEFAULT_LIMIT_MAX } from '../../../shared/constants'
import type { ExportJobType } from '../repositories'

export const exportCreateSchema = z.object({
  dataType: z.enum(['history', 'watchlist', 'alerts', 'all', 'indices']),
  format: z.enum(['csv', 'pdf', 'parquet']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  itemIds: z.array(z.string()).optional(),
  corridorIds: z.array(z.string().min(1)).max(50).optional(),
})

export type ExportCreatePayload = z.infer<typeof exportCreateSchema>

export const exportListSchema = z.object({
  status: z.enum(['queued', 'running', 'done', 'failed']).optional(),
  limit: z.coerce.number().int().positive().max(DEFAULT_LIMIT_MAX).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export type ExportListQuery = z.infer<typeof exportListSchema>

export const exportJobParamsSchema = z.object({
  id: z.string().uuid(),
})

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

const exportJobTypeMap: Record<
  ExportCreatePayload['dataType'],
  Record<ExportCreatePayload['format'], ExportJobType>
> = {
  history: { csv: 'history_csv', pdf: 'history_pdf', parquet: 'history_parquet' },
  watchlist: { csv: 'watchlist_csv', pdf: 'watchlist_pdf', parquet: 'watchlist_parquet' },
  alerts: { csv: 'alerts_csv', pdf: 'alerts_pdf', parquet: 'alerts_parquet' },
  all: { csv: 'all_csv', pdf: 'all_pdf', parquet: 'all_parquet' },
  indices: { csv: 'indices_csv', pdf: 'indices_pdf', parquet: 'indices_parquet' },
}

export const resolveExportJobType = (
  dataType: ExportCreatePayload['dataType'],
  format: ExportCreatePayload['format'],
): ExportJobType => {
  return exportJobTypeMap[dataType][format]
}

export const toDateFromOrNull = (value?: string) => {
  if (!value) return null
  const parsed = DATE_ONLY_RE.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const toDateToOrNull = (value?: string) => {
  if (!value) return null
  const parsed = DATE_ONLY_RE.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const getInclusiveWindowDays = (dateFrom: Date, dateTo: Date): number => {
  const diff = dateTo.getTime() - dateFrom.getTime()
  return Math.floor(diff / DAY_MS) + 1
}
