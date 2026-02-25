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
 */

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
const NEW_RELIC_STAGING_AWS_ROLE_ARN = (process.env.NEW_RELIC_STAGING_AWS_ROLE_ARN || '').trim()
const NEW_RELIC_PROD_AWS_ROLE_ARN = (process.env.NEW_RELIC_PROD_AWS_ROLE_ARN || '').trim()
const NEW_RELIC_UNLINK_ACCOUNT_IDS = (process.env.NEW_RELIC_UNLINK_ACCOUNT_IDS || '')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value))

if (!NEW_RELIC_USER_API_KEY) {
  console.error('Missing NEW_RELIC_USER_API_KEY')
  process.exit(1)
}

if (!Number.isFinite(NEW_RELIC_ACCOUNT_ID)) {
  console.error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
  process.exit(1)
}

if (!NEW_RELIC_STAGING_AWS_ROLE_ARN || !NEW_RELIC_PROD_AWS_ROLE_ARN) {
  console.error('Missing NEW_RELIC_STAGING_AWS_ROLE_ARN or NEW_RELIC_PROD_AWS_ROLE_ARN')
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
      aws: awsAccounts,
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

const main = async () => {
  const trust = await getAwsProviderTrustRequirements()
  console.log(`NR AWS role principal account: ${trust.roleAccountId}`)
  console.log(`NR AWS required external ID: ${trust.roleExternalId}`)

  const stagingAwsAccountId = parseAwsAccountId(NEW_RELIC_STAGING_AWS_ROLE_ARN)
  const prodAwsAccountId = parseAwsAccountId(NEW_RELIC_PROD_AWS_ROLE_ARN)

  const desiredLinks = [
    {
      name: 'remit-scout-staging-aws-metric-stream-push',
      arn: NEW_RELIC_STAGING_AWS_ROLE_ARN,
      metricCollectionMode: 'PUSH',
    },
    {
      name: 'remit-scout-staging-aws-metric-stream-pull',
      arn: NEW_RELIC_STAGING_AWS_ROLE_ARN,
      metricCollectionMode: 'PULL',
    },
    {
      name: 'remit-scout-prod-aws-metric-stream-push',
      arn: NEW_RELIC_PROD_AWS_ROLE_ARN,
      metricCollectionMode: 'PUSH',
    },
    {
      name: 'remit-scout-prod-aws-metric-stream-pull',
      arn: NEW_RELIC_PROD_AWS_ROLE_ARN,
      metricCollectionMode: 'PULL',
    },
  ]

  const existingBefore = await listLinkedAccounts()
  const existingByName = new Map(existingBefore.map((item) => [item.name, item]))
  const missingLinks = desiredLinks.filter((item) => !existingByName.has(item.name))

  if (missingLinks.length > 0) {
    await linkAccounts(missingLinks)
  } else {
    console.log('Cloud links already present; skipping link create step')
  }

  const linked = await listLinkedAccounts()

  const byName = new Map(linked.map((item) => [item.name, item]))
  const stagingPush = byName.get('remit-scout-staging-aws-metric-stream-push')
  const stagingPull = byName.get('remit-scout-staging-aws-metric-stream-pull')
  const prodPush = byName.get('remit-scout-prod-aws-metric-stream-push')
  const prodPull = byName.get('remit-scout-prod-aws-metric-stream-pull')

  if (!stagingPush || !stagingPull || !prodPush || !prodPull) {
    throw new Error('Unable to resolve all linked account IDs after link operation')
  }

  const pullIds = [stagingPull.id, prodPull.id]
  const pullInput = pullIds.map((linkedAccountId) => ({ linkedAccountId }))
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

  const pushIds = [stagingPush.id, prodPush.id]
  const pushInput = pushIds.map((linkedAccountId) => ({ linkedAccountId }))
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

  if (NEW_RELIC_UNLINK_ACCOUNT_IDS.length) {
    await unlinkAccounts(NEW_RELIC_UNLINK_ACCOUNT_IDS)
  }

  const summary = await listLinkedAccounts()
  console.log(
    JSON.stringify(
      {
        stagingAwsAccountId,
        prodAwsAccountId,
        linkedAccounts: summary.map((account) => ({
          id: account.id,
          name: account.name,
          mode: account.metricCollectionMode,
          externalId: account.externalId,
          authLabel: account.authLabel,
          integrationCount: account.integrations.length,
        })),
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
