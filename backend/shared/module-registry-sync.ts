import type { Pool } from 'pg'

import { query } from './db'
import { loadModuleCatalog, type ModuleCatalogEntry } from './module-catalog'

export type ModuleRegistrySeedRow = {
  module_id: string
  provider_id: string
  owner_kind: string
  owner_id: string
  collector_type: string
  display_name: string
  status: string
  signal_layer: string
  capture_method: string
  rollout_state: string
  policy: Record<string, unknown>
  supported_corridors: string[]
  supported_amount_buckets: number[]
  payin_method: string
  payout_method: string
  spec_version: number
  schema_version: number
  lineage: Record<string, unknown>
}

export const buildModuleRegistrySeedRows = (
  modules: ModuleCatalogEntry[],
): ModuleRegistrySeedRow[] =>
  modules.map((module) => ({
    module_id: module.module_id,
    provider_id: module.provider_id,
    owner_kind: module.owner_kind,
    owner_id: module.owner_id,
    collector_type: module.collector_type,
    display_name: module.display_name,
    status: module.status,
    signal_layer: module.signal_layer,
    capture_method: module.capture_method,
    rollout_state: module.rollout_state,
    policy: {
      ...module.policy_flags,
      ...(module.volume ? { volume: module.volume } : {}),
    },
    supported_corridors: module.supported_corridors,
    supported_amount_buckets: module.supported_amount_buckets,
    payin_method: module.payin_method ?? 'bank_transfer',
    payout_method: module.payout_method ?? 'bank_deposit',
    spec_version: module.spec_version,
    schema_version: module.schema_version,
    lineage: module.lineage,
  }))

export const moduleRegistrySyncSql = `WITH seed_rows AS (
  SELECT *
  FROM jsonb_to_recordset($1::jsonb) AS row(
    module_id text,
    provider_id text,
    owner_kind text,
    owner_id text,
    collector_type text,
    display_name text,
    status text,
    signal_layer text,
    capture_method text,
    rollout_state text,
    policy jsonb,
    supported_corridors jsonb,
    supported_amount_buckets jsonb,
    payin_method text,
    payout_method text,
    spec_version int,
    schema_version int,
    lineage jsonb
  )
), synced AS (
  INSERT INTO silver.module_registry (
    module_id,
    provider_id,
    owner_kind,
    owner_id,
    collector_type,
    display_name,
    status,
    signal_layer,
    capture_method,
    rollout_state,
    policy,
    supported_corridors,
    supported_amount_buckets,
    payin_method,
    payout_method,
    spec_version,
    schema_version,
    lineage
  )
  SELECT
    module_id,
    provider_id,
    owner_kind,
    owner_id,
    collector_type,
    display_name,
    status,
    signal_layer,
    capture_method,
    rollout_state,
    COALESCE(policy, '{}'::jsonb),
    ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(supported_corridors, '[]'::jsonb))
    ),
    ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(supported_amount_buckets, '[]'::jsonb))::numeric
    ),
    COALESCE(NULLIF(payin_method, ''), 'bank_transfer'),
    COALESCE(NULLIF(payout_method, ''), 'bank_deposit'),
    COALESCE(spec_version, 1),
    COALESCE(schema_version, 1),
    COALESCE(lineage, '{}'::jsonb)
  FROM seed_rows
  ON CONFLICT (module_id)
  DO UPDATE SET
    provider_id = EXCLUDED.provider_id,
    owner_kind = EXCLUDED.owner_kind,
    owner_id = EXCLUDED.owner_id,
    collector_type = EXCLUDED.collector_type,
    display_name = EXCLUDED.display_name,
    status = EXCLUDED.status,
    signal_layer = EXCLUDED.signal_layer,
    capture_method = EXCLUDED.capture_method,
    rollout_state = EXCLUDED.rollout_state,
    policy = EXCLUDED.policy,
    supported_corridors = EXCLUDED.supported_corridors,
    supported_amount_buckets = EXCLUDED.supported_amount_buckets,
    payin_method = EXCLUDED.payin_method,
    payout_method = EXCLUDED.payout_method,
    spec_version = EXCLUDED.spec_version,
    schema_version = EXCLUDED.schema_version,
    lineage = EXCLUDED.lineage,
    updated_at = NOW()
  RETURNING 1
)
SELECT COUNT(*)::int AS synced FROM synced`

export const syncModuleRegistry = async (
  pool: Pool,
  modules: ModuleCatalogEntry[] = loadModuleCatalog().modules,
): Promise<number> => {
  const rows = buildModuleRegistrySeedRows(modules)
  if (rows.length === 0) return 0

  const result = await query<{ synced: number }>(
    moduleRegistrySyncSql,
    [JSON.stringify(rows)],
    pool,
  )

  return result.rows[0]?.synced ?? 0
}
