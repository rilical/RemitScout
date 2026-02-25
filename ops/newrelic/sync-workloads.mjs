#!/usr/bin/env node

/**
 * Upserts Remit-Scout New Relic workloads.
 *
 * Required env:
 * - NEW_RELIC_USER_API_KEY
 * - NEW_RELIC_ACCOUNT_ID
 * Optional:
 * - NEW_RELIC_REGION (US|EU, default US)
 */

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()

if (!NEW_RELIC_USER_API_KEY) {
  console.error('Missing NEW_RELIC_USER_API_KEY')
  process.exit(1)
}

if (!Number.isFinite(NEW_RELIC_ACCOUNT_ID)) {
  console.error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
  process.exit(1)
}

const ENDPOINT =
  NEW_RELIC_REGION === 'EU'
    ? 'https://api.eu.newrelic.com/graphql'
    : 'https://api.newrelic.com/graphql'

const gql = async (query, variables = {}) => {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': NEW_RELIC_USER_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`NerdGraph request failed: HTTP ${response.status}`)
  }

  const payload = await response.json()
  if (payload.errors?.length) {
    throw new Error(`NerdGraph error: ${payload.errors.map((e) => e.message).join(' | ')}`)
  }
  return payload.data
}

const listWorkloads = async () => {
  const query = `
    query ListWorkloads($accountId: Int!) {
      actor {
        account(id: $accountId) {
          workload {
            collections {
              guid
              name
              description
              permalink
              entitySearchQuery
            }
          }
        }
      }
    }
  `

  const data = await gql(query, {
    accountId: NEW_RELIC_ACCOUNT_ID,
  })
  return data.actor.account.workload.collections || []
}

const createWorkload = async (workload) => {
  const mutation = `
    mutation CreateWorkload($accountId: Int!, $workload: WorkloadCreateInput!) {
      workloadCreate(accountId: $accountId, workload: $workload) {
        guid
        name
        description
        permalink
        entitySearchQuery
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    workload,
  })
  return data.workloadCreate
}

const updateWorkload = async (guid, workload) => {
  const mutation = `
    mutation UpdateWorkload($guid: EntityGuid!, $workload: WorkloadUpdateInput!) {
      workloadUpdate(guid: $guid, workload: $workload) {
        guid
        name
        description
        permalink
        entitySearchQuery
      }
    }
  `

  const data = await gql(mutation, {
    guid,
    workload,
  })
  return data.workloadUpdate
}

const desiredWorkloads = [
  {
    name: 'Remit-Scout Global Workload',
    description: 'All Remit-Scout entities across environments.',
    entitySearchQueries: [{ query: "name LIKE 'remit-scout-%' OR name LIKE 'remitscout%'" }],
  },
  {
    name: 'Remit-Scout STAGING Workload',
    description: 'Staging workload entities for Remit-Scout.',
    entitySearchQueries: [{ query: "name LIKE 'remit-scout-staging%'" }],
  },
  {
    name: 'Remit-Scout PROD Workload',
    description: 'Production workload entities for Remit-Scout.',
    entitySearchQueries: [
      { query: "name LIKE 'remit-scout-prod%' OR name LIKE 'remit-scout-production%'" },
    ],
  },
]

const main = async () => {
  const current = await listWorkloads()
  const byName = new Map(current.map((item) => [item.name, item]))

  for (const desired of desiredWorkloads) {
    const existing = byName.get(desired.name)
    if (!existing) {
      const created = await createWorkload({
        name: desired.name,
        description: desired.description,
        entitySearchQueries: desired.entitySearchQueries,
      })
      console.log(`CREATED: ${created.name}`)
      console.log(`  guid: ${created.guid}`)
      console.log(`  url: ${created.permalink}`)
      continue
    }

    const updated = await updateWorkload(existing.guid, {
      name: desired.name,
      description: desired.description,
      entitySearchQueries: desired.entitySearchQueries,
    })
    console.log(`UPDATED: ${updated.name}`)
    console.log(`  guid: ${updated.guid}`)
    console.log(`  url: ${updated.permalink}`)
  }
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})

