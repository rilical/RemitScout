#!/usr/bin/env node

/**
 * Links staging/prod AWS accounts to New Relic Cloud Integrations and
 * configures the selected pull/stream integrations.
 *
 * Required env:
 * - NEW_RELIC_USER_API_KEY
 * - NEW_RELIC_ACCOUNT_ID
 * - NEW_RELIC_STAGING_AWS_ROLE_ARN
 * - NEW_RELIC_PROD_AWS_ROLE_ARN
 *
 * Optional env:
 * - NEW_RELIC_REGION (US|EU, default US)
 * - NEW_RELIC_UNLINK_ACCOUNT_IDS (comma-separated linked account IDs)
 * - NEW_RELIC_STAGING_AWS_MODE (push_pull|push_only|otlp_only, default push_pull)
 * - NEW_RELIC_PROD_AWS_MODE (push_pull|push_only|otlp_only, default push_pull)
 */

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
const NEW_RELIC_STAGING_AWS_ROLE_ARN = (process.env.NEW_RELIC_STAGING_AWS_ROLE_ARN || '').trim()
const NEW_RELIC_PROD_AWS_ROLE_ARN = (process.env.NEW_RELIC_PROD_AWS_ROLE_ARN || '').trim()
const normalizeAwsMode = (value, fallback = 'push_pull') => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  throw new Error(`Unsupported New Relic AWS mode: ${value}`)
}
const NEW_RELIC_STAGING_AWS_MODE = normalizeAwsMode(process.env.NEW_RELIC_STAGING_AWS_MODE, 'push_pull')
const NEW_RELIC_PROD_AWS_MODE = normalizeAwsMode(process.env.NEW_RELIC_PROD_AWS_MODE, 'push_pull')
const NEW_RELIC_UNLINK_ACCOUNT_IDS = (process.env.NEW_RELIC_UNLINK_ACCOUNT_IDS || '')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value))
const NEW_RELIC_REPAIR_DRIFTED_LINKS = process.env.NEW_RELIC_REPAIR_DRIFTED_LINKS === '1'

if (!NEW_RELIC_USER_API_KEY) {
  console.error('Missing NEW_RELIC_USER_API_KEY')
  process.exit(1)
}

if (!Number.isFinite(NEW_RELIC_ACCOUNT_ID)) {
  console.error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
  process.exit(1)
}

if (NEW_RELIC_STAGING_AWS_MODE !== 'otlp_only' && !NEW_RELIC_STAGING_AWS_ROLE_ARN) {
  console.error('Missing NEW_RELIC_STAGING_AWS_ROLE_ARN for staging AWS-linked New Relic mode')
  process.exit(1)
}

if (NEW_RELIC_PROD_AWS_MODE !== 'otlp_only' && !NEW_RELIC_PROD_AWS_ROLE_ARN) {
  console.error('Missing NEW_RELIC_PROD_AWS_ROLE_ARN for prod AWS-linked New Relic mode')
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
    throw new Error(`NerdGraph error: ${payload.errors.map((error) => error.message).join(' | ')}`)
  }
  return payload.data
}

const getAwsProviderTrustRequirements = async () => {
  const query = `
    query AwsProvider($accountId: Int!) {
      actor {
        account(id: $accountId) {
          cloud {
            provider(slug: "aws") {
              ... on CloudAwsProvider {
                roleAccountId
                roleExternalId
              }
            }
          }
        }
      }
    }
  `

  const data = await gql(query, {
    accountId: NEW_RELIC_ACCOUNT_ID,
  })

  const provider = data.actor.account.cloud.provider
  if (!provider?.roleAccountId || !provider?.roleExternalId) {
    throw new Error('Unable to resolve New Relic AWS trust requirements from provider metadata')
  }

  return provider
}

const linkAccounts = async (awsAccounts) => {
  const mutation = `
    mutation Link($accountId: Int!, $accounts: LinkCloudAccountsInput!) {
      cloudLinkAccount(accountId: $accountId, accounts: $accounts) {
        errors {
          type
          message
          linkedAccountId
        }
        linkedAccounts {
          id
          name
          authLabel
          externalId
          metricCollectionMode
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    accounts: {
      aws: awsAccounts.map(({ expectedAwsAccountId, ...account }) => account),
    },
  })

  const result = data.cloudLinkAccount
  if (result.errors?.length) {
    throw new Error(`cloudLinkAccount failed: ${JSON.stringify(result.errors)}`)
  }
  return result.linkedAccounts || []
}

const configureIntegrations = async (integrations) => {
  const mutation = `
    mutation Configure($accountId: Int!, $integrations: CloudIntegrationsInput!) {
      cloudConfigureIntegration(accountId: $accountId, integrations: $integrations) {
        errors {
          type
          message
          linkedAccountId
        }
        integrations {
          id
          name
          linkedAccount {
            id
            name
          }
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    integrations,
  })

  return data.cloudConfigureIntegration
}

const unlinkAccounts = async (linkedAccountIds) => {
  if (!linkedAccountIds.length) return

  const mutation = `
    mutation Unlink($accountId: Int!, $accounts: [UnlinkAccountsInput!]!) {
      cloudUnlinkAccount(accountId: $accountId, accounts: $accounts) {
        errors {
          type
          message
          linkedAccountId
        }
        unlinkedAccounts {
          id
          name
          metricCollectionMode
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    accounts: linkedAccountIds.map((linkedAccountId) => ({ linkedAccountId })),
  })

  const result = data.cloudUnlinkAccount
  if (result.errors?.length) {
    throw new Error(`cloudUnlinkAccount failed: ${JSON.stringify(result.errors)}`)
  }

  console.log(`UNLINKED: ${result.unlinkedAccounts.map((item) => item.id).join(', ')}`)
}

const listLinkedAccounts = async () => {
  const query = `
    query LinkedAccounts($accountId: Int!) {
      actor {
        account(id: $accountId) {
          cloud {
            linkedAccounts {
              id
              name
              metricCollectionMode
              externalId
              authLabel
              integrations {
                id
                name
              }
            }
          }
        }
      }
    }
  `

  const data = await gql(query, {
    accountId: NEW_RELIC_ACCOUNT_ID,
  })

  return data.actor.account.cloud.linkedAccounts || []
}

const parseAwsAccountId = (arn) => {
  const match = arn.match(/^arn:aws:iam::(\d{12}):role\/.+$/)
  if (!match) {
    throw new Error(`Invalid AWS role ARN: ${arn}`)
  }
  return match[1]
}

const parseAwsAccountIdFromAuthLabel = (authLabel) => {
  if (!authLabel) return null
  const match = String(authLabel).match(/\b(\d{12})\b/)
  return match ? match[1] : null
}

const MANAGED_LINK_NAMES = [
  'remit-scout-staging-aws-metric-stream-push',
  'remit-scout-staging-aws-metric-stream-pull',
  'remit-scout-prod-aws-metric-stream-push',
  'remit-scout-prod-aws-metric-stream-pull',
]

const buildDesiredLinks = ({ envName, arn, mode, expectedAwsAccountId }) => {
  if (mode === 'otlp_only') return []

  const prefix = `remit-scout-${envName}-aws-metric-stream`
  const links = [
    {
      name: `${prefix}-push`,
      arn,
      metricCollectionMode: 'PUSH',
      expectedAwsAccountId,
    },
  ]

  if (mode === 'push_pull') {
    links.push({
      name: `${prefix}-pull`,
      arn,
      metricCollectionMode: 'PULL',
      expectedAwsAccountId,
    })
  }

  return links
}

const main = async () => {
  const trust = await getAwsProviderTrustRequirements()
  console.log(`NR AWS role principal account: ${trust.roleAccountId}`)
  console.log(`NR AWS required external ID: ${trust.roleExternalId}`)

  const stagingAwsAccountId = NEW_RELIC_STAGING_AWS_ROLE_ARN
    ? parseAwsAccountId(NEW_RELIC_STAGING_AWS_ROLE_ARN)
    : null
  const prodAwsAccountId = NEW_RELIC_PROD_AWS_ROLE_ARN
    ? parseAwsAccountId(NEW_RELIC_PROD_AWS_ROLE_ARN)
    : null

  const desiredLinks = [
    ...buildDesiredLinks({
      envName: 'staging',
      arn: NEW_RELIC_STAGING_AWS_ROLE_ARN,
      mode: NEW_RELIC_STAGING_AWS_MODE,
      expectedAwsAccountId: stagingAwsAccountId,
    }),
    ...buildDesiredLinks({
      envName: 'prod',
      arn: NEW_RELIC_PROD_AWS_ROLE_ARN,
      mode: NEW_RELIC_PROD_AWS_MODE,
      expectedAwsAccountId: prodAwsAccountId,
    }),
  ]
  const desiredNames = new Set(desiredLinks.map((item) => item.name))

  const existingBefore = await listLinkedAccounts()
  const staleManagedLinks = existingBefore
    .filter((item) => MANAGED_LINK_NAMES.includes(item.name) && !desiredNames.has(item.name))
    .map((item) => item.id)
  if (staleManagedLinks.length > 0) {
    await unlinkAccounts(staleManagedLinks)
  }
  const existingByName = new Map(existingBefore.map((item) => [item.name, item]))
  const missingLinks = desiredLinks.filter((item) => !existingByName.has(item.name))

  if (missingLinks.length > 0) {
    await linkAccounts(missingLinks)
  } else {
    console.log('Cloud links already present; skipping link create step')
  }

  const driftSnapshot = await listLinkedAccounts()
  const driftByName = new Map(driftSnapshot.map((item) => [item.name, item]))
  const driftedLinks = desiredLinks
    .map((desired) => {
      const existing = driftByName.get(desired.name)
      if (!existing) return null
      const observedAwsAccountId = parseAwsAccountIdFromAuthLabel(existing.authLabel)
      const reasons = []
      if (existing.metricCollectionMode !== desired.metricCollectionMode) {
        reasons.push(
          `mode_mismatch expected=${desired.metricCollectionMode} observed=${existing.metricCollectionMode}`,
        )
      }
      if (observedAwsAccountId && observedAwsAccountId !== desired.expectedAwsAccountId) {
        reasons.push(
          `aws_account_mismatch expected=${desired.expectedAwsAccountId} observed=${observedAwsAccountId}`,
        )
      }
      if (!observedAwsAccountId) {
        reasons.push('aws_account_unverified authLabel_missing_or_unparseable')
      }
      return reasons.length > 0
        ? {
            linkedAccountId: existing.id,
            name: desired.name,
            reasons,
          }
        : null
    })
    .filter(Boolean)

  if (driftedLinks.length > 0) {
    if (!NEW_RELIC_REPAIR_DRIFTED_LINKS) {
      throw new Error(
        `Linked account drift detected. Re-run with NEW_RELIC_REPAIR_DRIFTED_LINKS=1 to auto-unlink and relink drifted accounts. Details: ${JSON.stringify(
          driftedLinks,
        )}`,
      )
    }

    const driftedIds = driftedLinks.map((item) => item.linkedAccountId)
    await unlinkAccounts(driftedIds)
    const namesToRepair = new Set(driftedLinks.map((item) => item.name))
    const linksToRepair = desiredLinks.filter((item) => namesToRepair.has(item.name))
    await linkAccounts(linksToRepair)
  }

  const linked = await listLinkedAccounts()
  const byName = new Map(linked.map((item) => [item.name, item]))
  const resolvedDesiredLinks = desiredLinks.map((desired) => {
    const linkedAccount = byName.get(desired.name)
    if (!linkedAccount) {
      throw new Error(`Unable to resolve linked account ${desired.name} after link operation`)
    }
    return {
      desired,
      linkedAccount,
    }
  })

  const pullInput = resolvedDesiredLinks
    .filter(({ desired }) => desired.metricCollectionMode === 'PULL')
    .map(({ linkedAccount }) => ({ linkedAccountId: linkedAccount.id }))
  if (pullInput.length > 0) {
    const pullConfig = await configureIntegrations({
      aws: {
        apigateway: pullInput,
        awsRoute53resolver: pullInput,
        awsWafv2: pullInput,
        awsXray: pullInput,
        billing: pullInput,
        cloudfront: pullInput,
        cloudtrail: pullInput,
        ec2: pullInput,
        ecs: pullInput,
        elasticache: pullInput,
        health: pullInput,
        iam: pullInput,
        lambda: pullInput,
        rds: pullInput,
        s3: pullInput,
        sqs: pullInput,
      },
    })

    if (pullConfig.errors?.length) {
      throw new Error(`pull integration configuration failed: ${JSON.stringify(pullConfig.errors)}`)
    }
  }

  const pushInput = resolvedDesiredLinks
    .filter(({ desired }) => desired.metricCollectionMode === 'PUSH')
    .map(({ linkedAccount }) => ({ linkedAccountId: linkedAccount.id }))
  if (pushInput.length > 0) {
    const pushConfig = await configureIntegrations({
      aws: {
        awsMetadata: pushInput,
        awsMsElasticache: pushInput,
        awsTagsGlobal: pushInput,
      },
    })

    if (pushConfig.errors?.length) {
      throw new Error(`push integration configuration failed: ${JSON.stringify(pushConfig.errors)}`)
    }
  }

  if (NEW_RELIC_UNLINK_ACCOUNT_IDS.length) {
    await unlinkAccounts(NEW_RELIC_UNLINK_ACCOUNT_IDS)
  }

  const summary = await listLinkedAccounts()
  const summaryByName = new Map(summary.map((account) => [account.name, account]))
  const missingDesiredNames = desiredLinks
    .map((item) => item.name)
    .filter((name) => !summaryByName.has(name))
  if (missingDesiredNames.length > 0) {
    throw new Error(`Cloud link mapping missing desired links: ${JSON.stringify(missingDesiredNames)}`)
  }

  const desiredByName = new Map(desiredLinks.map((item) => [item.name, item]))
  const mappingSummary = summary
    .map((account) => {
      const desired = desiredByName.get(account.name)
      if (!desired) return null
      const observedAwsAccountId = parseAwsAccountIdFromAuthLabel(account.authLabel)
      const modeMatches = account.metricCollectionMode === desired.metricCollectionMode
      const accountMatches = observedAwsAccountId === desired.expectedAwsAccountId
      return {
        name: account.name,
        linkedAccountId: account.id,
        expectedMode: desired.metricCollectionMode,
        observedMode: account.metricCollectionMode,
        expectedAwsAccountId: desired.expectedAwsAccountId,
        observedAwsAccountId,
        modeMatches,
        accountMatches,
      }
    })
    .filter(Boolean)

  const mismatchedMappings = mappingSummary.filter(
    (item) => item.modeMatches !== true || item.accountMatches !== true,
  )
  if (mismatchedMappings.length > 0) {
    throw new Error(`Cloud link mapping validation failed: ${JSON.stringify(mismatchedMappings)}`)
  }

  console.log(
    JSON.stringify(
      {
        stagingAwsAccountId,
        prodAwsAccountId,
        modes: {
          staging: NEW_RELIC_STAGING_AWS_MODE,
          prod: NEW_RELIC_PROD_AWS_MODE,
        },
        linkedAccounts: summary.map((account) => ({
          id: account.id,
          name: account.name,
          mode: account.metricCollectionMode,
          externalId: account.externalId,
          authLabel: account.authLabel,
          integrationCount: account.integrations.length,
        })),
        mappingSummary,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
