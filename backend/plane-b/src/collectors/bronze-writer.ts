import type { Pool } from 'pg'
import { query } from '../../../shared/db'

export type BronzeWriteInput = {
  provider_id: string
  corridor_id: string
  payload: unknown
}

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

const normalizePayload = (payload: unknown) => {
  if (payload === undefined) return null
  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed) return { raw: payload }
    const parsed = tryParseJson(trimmed)
    if (parsed === undefined) return { raw: payload }
    if (typeof parsed === 'string') {
      const reparsed = tryParseJson(parsed)
      if (reparsed !== undefined && typeof reparsed !== 'string') {
        return reparsed
      }
      return { raw: parsed }
    }
    return parsed
  }
  return payload
}

export const writeBronzePayload = async (pool: Pool, input: BronzeWriteInput) => {
  const normalized = normalizePayload(input.payload)
  let serialized = 'null'
  try {
    serialized = JSON.stringify(normalized ?? null) ?? 'null'
  } catch {
    serialized = JSON.stringify(String(normalized))
  }
  const result = await query<{ id: number }>(
    'INSERT INTO bronze.provider_raw (provider_id, corridor, payload) VALUES ($1, $2, $3) RETURNING id',
    [input.provider_id, input.corridor_id, serialized],
    pool,
  )

  return result.rows[0]?.id
}
