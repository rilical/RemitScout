#!/usr/bin/env node

/**
 * Upserts Remit-Scout notification destination/channels and incident workflows.
 *
 * Required env:
 * - NEW_RELIC_USER_API_KEY
 * - NEW_RELIC_ACCOUNT_ID
 * Optional:
 * - NEW_RELIC_REGION (US|EU, default US)
 * - NEW_RELIC_ALERT_EMAIL (default: austrilic@gmail.com)
 */

const NEW_RELIC_USER_API_KEY = process.env.NEW_RELIC_USER_API_KEY || ''
const NEW_RELIC_ACCOUNT_ID = Number.parseInt(process.env.NEW_RELIC_ACCOUNT_ID || '', 10)
const NEW_RELIC_REGION = (process.env.NEW_RELIC_REGION || 'US').trim().toUpperCase()
const NEW_RELIC_ALERT_EMAIL = (process.env.NEW_RELIC_ALERT_EMAIL || 'austrilic@gmail.com').trim()

if (!NEW_RELIC_USER_API_KEY) {
  console.error('Missing NEW_RELIC_USER_API_KEY')
  process.exit(1)
}

if (!Number.isFinite(NEW_RELIC_ACCOUNT_ID)) {
  console.error('Missing/invalid NEW_RELIC_ACCOUNT_ID')
  process.exit(1)
}

if (!NEW_RELIC_ALERT_EMAIL) {
  console.error('Missing NEW_RELIC_ALERT_EMAIL')
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

const listState = async () => {
  const query = `
    query ListState($accountId: Int!) {
      actor {
        account(id: $accountId) {
          aiNotifications {
            destinations {
              entities {
                id
                name
                type
                status
                active
                properties {
                  key
                  value
                  displayValue
                }
              }
            }
            channels {
              entities {
                id
                name
                type
                product
                destinationId
                status
                active
                properties {
                  key
                  value
                  displayValue
                }
              }
            }
          }
          aiWorkflows {
            workflows {
              entities {
                id
                name
                workflowEnabled
                destinationsEnabled
                mutingRulesHandling
                destinationConfigurations {
                  channelId
                  notificationTriggers
                  updateOriginalMessage
                }
                issuesFilter {
                  id
                  name
                  type
                  predicates {
                    attribute
                    operator
                    values
                  }
                }
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

  return {
    destinations: data.actor.account.aiNotifications.destinations.entities || [],
    channels: data.actor.account.aiNotifications.channels.entities || [],
    workflows: data.actor.account.aiWorkflows.workflows.entities || [],
  }
}

const createDestination = async (destination) => {
  const mutation = `
    mutation CreateDestination($accountId: Int!, $destination: AiNotificationsDestinationInput!) {
      aiNotificationsCreateDestination(accountId: $accountId, destination: $destination) {
        destination {
          id
          name
          type
          status
        }
        error {
          __typename
          ... on AiNotificationsDataValidationError {
            details
            fields {
              field
              message
            }
          }
          ... on AiNotificationsResponseError {
            description
            details
            type
          }
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    destination,
  })
  return data.aiNotificationsCreateDestination
}

const updateDestination = async (destinationId, destination) => {
  const mutation = `
    mutation UpdateDestination(
      $accountId: Int!
      $destinationId: ID!
      $destination: AiNotificationsDestinationUpdate!
    ) {
      aiNotificationsUpdateDestination(
        accountId: $accountId
        destinationId: $destinationId
        destination: $destination
      ) {
        destination {
          id
          name
          type
          status
        }
        error {
          __typename
          ... on AiNotificationsDataValidationError {
            details
            fields {
              field
              message
            }
          }
          ... on AiNotificationsResponseError {
            description
            details
            type
          }
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    destinationId,
    destination,
  })
  return data.aiNotificationsUpdateDestination
}

const createChannel = async (channel) => {
  const mutation = `
    mutation CreateChannel($accountId: Int!, $channel: AiNotificationsChannelInput!) {
      aiNotificationsCreateChannel(accountId: $accountId, channel: $channel) {
        channel {
          id
          name
          type
          product
          destinationId
          status
        }
        error {
          __typename
          ... on AiNotificationsDataValidationError {
            details
            fields {
              field
              message
            }
          }
          ... on AiNotificationsResponseError {
            description
            details
            type
          }
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    channel,
  })
  return data.aiNotificationsCreateChannel
}

const updateChannel = async (channelId, channel) => {
  const mutation = `
    mutation UpdateChannel($accountId: Int!, $channelId: ID!, $channel: AiNotificationsChannelUpdate!) {
      aiNotificationsUpdateChannel(accountId: $accountId, channelId: $channelId, channel: $channel) {
        channel {
          id
          name
          type
          product
          destinationId
          status
        }
        error {
          __typename
          ... on AiNotificationsDataValidationError {
            details
            fields {
              field
              message
            }
          }
          ... on AiNotificationsResponseError {
            description
            details
            type
          }
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    channelId,
    channel,
  })
  return data.aiNotificationsUpdateChannel
}

const createWorkflow = async (createWorkflowData) => {
  const mutation = `
    mutation CreateWorkflow($accountId: Int!, $createWorkflowData: AiWorkflowsCreateWorkflowInput!) {
      aiWorkflowsCreateWorkflow(accountId: $accountId, createWorkflowData: $createWorkflowData) {
        workflow {
          id
          guid
          name
        }
        errors {
          description
          type
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    createWorkflowData,
  })
  return data.aiWorkflowsCreateWorkflow
}

const updateWorkflow = async (updateWorkflowData) => {
  const mutation = `
    mutation UpdateWorkflow(
      $accountId: Int!
      $deleteUnusedChannels: Boolean!
      $updateWorkflowData: AiWorkflowsUpdateWorkflowInput!
    ) {
      aiWorkflowsUpdateWorkflow(
        accountId: $accountId
        deleteUnusedChannels: $deleteUnusedChannels
        updateWorkflowData: $updateWorkflowData
      ) {
        workflow {
          id
          guid
          name
        }
        errors {
          description
          type
        }
      }
    }
  `

  const data = await gql(mutation, {
    accountId: NEW_RELIC_ACCOUNT_ID,
    deleteUnusedChannels: false,
    updateWorkflowData,
  })
  return data.aiWorkflowsUpdateWorkflow
}

const ensureDestination = async (state) => {
  const destinationName = 'Remit-Scout Ops Email Destination'
  const existing = state.destinations.find(
    (destination) => destination.name === destinationName && destination.type === 'EMAIL',
  )

  if (!existing) {
    const created = await createDestination({
      name: destinationName,
      type: 'EMAIL',
      properties: [{ key: 'email', value: NEW_RELIC_ALERT_EMAIL }],
    })
    if (created.error) {
      throw new Error(`Failed to create destination: ${JSON.stringify(created.error)}`)
    }
    console.log(`CREATED destination: ${created.destination.name} (${created.destination.id})`)
    return created.destination
  }

  const updated = await updateDestination(existing.id, {
    name: destinationName,
    active: true,
    properties: [{ key: 'email', value: NEW_RELIC_ALERT_EMAIL }],
  })
  if (updated.error) {
    throw new Error(`Failed to update destination: ${JSON.stringify(updated.error)}`)
  }
  console.log(`UPDATED destination: ${updated.destination.name} (${updated.destination.id})`)
  return updated.destination
}

const ensureChannel = async ({
  state,
  destinationId,
  channelName,
  subject,
}) => {
  const existing = state.channels.find(
    (channel) =>
      channel.name === channelName &&
      channel.type === 'EMAIL' &&
      channel.destinationId === destinationId,
  )

  if (!existing) {
    const created = await createChannel({
      name: channelName,
      type: 'EMAIL',
      product: 'IINT',
      destinationId,
      properties: [{ key: 'subject', value: subject }],
    })
    if (created.error) {
      throw new Error(`Failed to create channel: ${JSON.stringify(created.error)}`)
    }
    console.log(`CREATED channel: ${created.channel.name} (${created.channel.id})`)
    return created.channel
  }

  const updated = await updateChannel(existing.id, {
    name: channelName,
    active: true,
    properties: [{ key: 'subject', value: subject }],
  })
  if (updated.error) {
    throw new Error(`Failed to update channel: ${JSON.stringify(updated.error)}`)
  }
  console.log(`UPDATED channel: ${updated.channel.name} (${updated.channel.id})`)
  return updated.channel
}

const ensureWorkflow = async ({
  state,
  workflowName,
  filterName,
  policyNameContains,
  channelId,
  notificationTriggers,
}) => {
  const existing = state.workflows.find((workflow) => workflow.name === workflowName)

  if (!existing) {
    const created = await createWorkflow({
      name: workflowName,
      mutingRulesHandling: 'DONT_NOTIFY_FULLY_MUTED_ISSUES',
      workflowEnabled: true,
      destinationsEnabled: true,
      issuesFilter: {
        name: filterName,
        type: 'FILTER',
        predicates: [
          {
            attribute: 'accumulations.policyName',
            operator: 'CONTAINS',
            values: [policyNameContains],
          },
        ],
      },
      destinationConfigurations: [
        {
          channelId,
          notificationTriggers,
        },
      ],
    })
    if (created.errors?.length) {
      throw new Error(`Failed to create workflow ${workflowName}: ${JSON.stringify(created.errors)}`)
    }
    console.log(`CREATED workflow: ${created.workflow.name} (${created.workflow.id})`)
    return
  }

  const updated = await updateWorkflow({
    id: existing.id,
    name: workflowName,
    mutingRulesHandling: 'DONT_NOTIFY_FULLY_MUTED_ISSUES',
    workflowEnabled: true,
    destinationsEnabled: true,
    issuesFilter: {
      id: existing.issuesFilter?.id || undefined,
      filterInput: {
        name: filterName,
        type: 'FILTER',
        predicates: [
          {
            attribute: 'accumulations.policyName',
            operator: 'CONTAINS',
            values: [policyNameContains],
          },
        ],
      },
    },
    destinationConfigurations: [
      {
        channelId,
        notificationTriggers,
      },
    ],
  })
  if (updated.errors?.length) {
    throw new Error(`Failed to update workflow ${workflowName}: ${JSON.stringify(updated.errors)}`)
  }
  console.log(`UPDATED workflow: ${updated.workflow.name} (${updated.workflow.id})`)
}

const main = async () => {
  let state = await listState()

  const destination = await ensureDestination(state)

  state = await listState()
  const stagingChannel = await ensureChannel({
    state,
    destinationId: destination.id,
    channelName: 'Remit-Scout Ops Email Channel',
    subject: '[Remit-Scout STAGING] New Relic Incident',
  })

  state = await listState()
  const prodChannel = await ensureChannel({
    state,
    destinationId: destination.id,
    channelName: 'Remit-Scout Prod Email Channel',
    subject: '[Remit-Scout PROD] New Relic Incident',
  })

  state = await listState()
  await ensureWorkflow({
    state,
    workflowName: 'Remit-Scout STAGING Incident Workflow',
    filterName: 'Remit-Scout STAGING Filter',
    policyNameContains: 'STAGING',
    channelId: stagingChannel.id,
    notificationTriggers: ['ACTIVATED', 'CLOSED', 'PRIORITY_CHANGED'],
  })

  state = await listState()
  await ensureWorkflow({
    state,
    workflowName: 'Remit-Scout PROD Incident Workflow',
    filterName: 'Remit-Scout PROD Filter',
    policyNameContains: 'PROD',
    channelId: prodChannel.id,
    notificationTriggers: ['ACTIVATED', 'CLOSED', 'PRIORITY_CHANGED'],
  })
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})

