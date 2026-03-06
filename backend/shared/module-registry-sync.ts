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

export const syncModuleRegistry = async (
  pool: Pool,
  modules: ModuleCatalogEntry[] = loadModuleCatalog().modules,
): Promise<number> => {
  const rows = buildModuleRegistrySeedRows(modules)
  if (rows.length === 0) return 0

  const moduleIds = rows.map((row) => row.module_id)
  const providerIds = rows.map((row) => row.provider_id)
  const ownerKinds = rows.map((row) => row.owner_kind)
  const ownerIds = rows.map((row) => row.owner_id)
  const collectorTypes = rows.map((row) => row.collector_type)
  const displayNames = rows.map((row) => row.display_name)
  const statuses = rows.map((row) => row.status)
  const signalLayers = rows.map((row) => row.signal_layer)
  const captureMethods = rows.map((row) => row.capture_method)
  const rolloutStates = rows.map((row) => row.rollout_state)
  const policies = rows.map((row) => JSON.stringify(row.policy))
  const supportedCorridors = rows.map((row) => row.supported_corridors)
  const supportedAmountBuckets = rows.map((row) => row.supported_amount_buckets)
  const payinMethods = rows.map((row) => row.payin_method)
  const payoutMethods = rows.map((row) => row.payout_method)
  const specVersions = rows.map((row) => row.spec_version)
  const schemaVersions = rows.map((row) => row.schema_version)
  const lineages = rows.map((row) => JSON.stringify(row.lineage))

  const result = await query<{ synced: number }>(
    `WITH synced AS (
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
         policy::jsonb,
         supported_corridors,
         supported_amount_buckets::numeric[],
         payin_method,
         payout_method,
         spec_version,
         schema_version,
         lineage::jsonb
       FROM unnest(
         $1::text[],
         $2::text[],
         $3::text[],
         $4::text[],
         $5::text[],
         $6::text[],
         $7::text[],
         $8::text[],
         $9::text[],
         $10::text[],
         $11::text[],
         $12::text[][],
         $13::numeric[][],
         $14::text[],
         $15::text[],
         $16::int[],
         $17::int[],
         $18::text[]
       ) AS t(
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
     SELECT COUNT(*)::int AS synced FROM synced`,
    [
      moduleIds,
      providerIds,
      ownerKinds,
      ownerIds,
      collectorTypes,
      displayNames,
      statuses,
      signalLayers,
      captureMethods,
      rolloutStates,
      policies,
      supportedCorridors,
      supportedAmountBuckets,
      payinMethods,
      payoutMethods,
      specVersions,
      schemaVersions,
      lineages,
    ],
    pool,
  )

  return result.rows[0]?.synced ?? 0
}
