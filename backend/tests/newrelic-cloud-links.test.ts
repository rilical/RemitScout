import { describe, expect, it } from 'vitest'

describe('new relic cloud-link config', () => {
  it('fails closed when non-dev AWS modes are missing', async () => {
    const { readCloudLinkConfig } = await import('../../ops/newrelic/cloud-link-config.mjs')

    expect(() => readCloudLinkConfig({
      NEW_RELIC_USER_API_KEY: 'nrua_test',
      NEW_RELIC_ACCOUNT_ID: '7756888',
      NEW_RELIC_REGION: 'US',
    } as NodeJS.ProcessEnv)).toThrow('Missing NEW_RELIC_STAGING_AWS_MODE')
  })

  it('accepts push_only staging and otlp_only prod without prod role wiring', async () => {
    const { readCloudLinkConfig } = await import('../../ops/newrelic/cloud-link-config.mjs')

    const config = readCloudLinkConfig({
      NEW_RELIC_USER_API_KEY: 'nrua_test',
      NEW_RELIC_ACCOUNT_ID: '7756888',
      NEW_RELIC_REGION: 'US',
      NEW_RELIC_STAGING_AWS_MODE: 'push_only',
      NEW_RELIC_PROD_AWS_MODE: 'otlp_only',
      NEW_RELIC_STAGING_AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/new-relic-staging',
    } as NodeJS.ProcessEnv)

    expect(config.stagingAwsMode).toBe('push_only')
    expect(config.prodAwsMode).toBe('otlp_only')
    expect(config.stagingAwsRoleArn).toContain('new-relic-staging')
    expect(config.prodAwsRoleArn).toBe('')
  })
})
