const parseAccountId = (value, key) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Missing/invalid ${key}`)
  }
  return parsed
}

export const normalizeAwsMode = (value, options = {}) => {
  const {
    key = 'NEW_RELIC_AWS_MODE',
    fallback,
    allowEmpty = fallback !== undefined,
  } = options
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) {
    if (allowEmpty) return fallback
    throw new Error(`Missing ${key}`)
  }
  if (['push_pull', 'push+pull', 'all'].includes(normalized)) return 'push_pull'
  if (['push_only', 'push'].includes(normalized)) return 'push_only'
  if (['otlp_only', 'otlp', 'none', 'disabled'].includes(normalized)) return 'otlp_only'
  throw new Error(`Unsupported New Relic AWS mode for ${key}: ${value}`)
}

export const readCloudLinkConfig = (env = process.env) => {
  const config = {
    newRelicUserApiKey: String(env.NEW_RELIC_USER_API_KEY || '').trim(),
    newRelicAccountId: parseAccountId(env.NEW_RELIC_ACCOUNT_ID, 'NEW_RELIC_ACCOUNT_ID'),
    newRelicRegion: String(env.NEW_RELIC_REGION || 'US').trim().toUpperCase(),
    stagingAwsRoleArn: String(env.NEW_RELIC_STAGING_AWS_ROLE_ARN || '').trim(),
    prodAwsRoleArn: String(env.NEW_RELIC_PROD_AWS_ROLE_ARN || '').trim(),
    stagingAwsMode: normalizeAwsMode(env.NEW_RELIC_STAGING_AWS_MODE, {
      key: 'NEW_RELIC_STAGING_AWS_MODE',
    }),
    prodAwsMode: normalizeAwsMode(env.NEW_RELIC_PROD_AWS_MODE, {
      key: 'NEW_RELIC_PROD_AWS_MODE',
    }),
    unlinkAccountIds: String(env.NEW_RELIC_UNLINK_ACCOUNT_IDS || '')
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value)),
    repairDriftedLinks: env.NEW_RELIC_REPAIR_DRIFTED_LINKS === '1',
  }

  if (!config.newRelicUserApiKey) {
    throw new Error('Missing NEW_RELIC_USER_API_KEY')
  }

  if (config.stagingAwsMode !== 'otlp_only' && !config.stagingAwsRoleArn) {
    throw new Error('Missing NEW_RELIC_STAGING_AWS_ROLE_ARN for staging AWS-linked New Relic mode')
  }

  if (config.prodAwsMode !== 'otlp_only' && !config.prodAwsRoleArn) {
    throw new Error('Missing NEW_RELIC_PROD_AWS_ROLE_ARN for prod AWS-linked New Relic mode')
  }

  return config
}
