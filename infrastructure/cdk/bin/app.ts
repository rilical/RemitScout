#!/usr/bin/env node

import { App } from 'aws-cdk-lib'
import { RemitScoutStack } from '../lib/remit-scout-stack'
import { validateContext } from '../lib/context-validator'

const app = new App()

const envName = app.node.tryGetContext('env') ?? process.env.REMIT_SCOUT_ENV ?? 'dev'

if (!['dev', 'staging', 'prod'].includes(envName)) {
  console.error(
    `Error: Invalid environment '${envName}'. Must be one of: dev, staging, prod`,
  )
  process.exit(1)
}

const account = process.env.CDK_DEFAULT_ACCOUNT
const region = process.env.CDK_DEFAULT_REGION

if (!account || !region) {
  console.error('Error: CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set')
  console.error('  Set via environment variables:')
  console.error('    export CDK_DEFAULT_ACCOUNT=123456789012')
  console.error('    export CDK_DEFAULT_REGION=us-east-1')
  console.error('  Or via AWS CLI:')
  console.error('    aws configure set account 123456789012')
  console.error('    aws configure set region us-east-1')
  process.exit(1)
}

const validation = validateContext(app, envName)

if (validation.errors.length > 0) {
  console.error('Context validation errors:')
  validation.errors.forEach((error) => {
    console.error(`  ❌ ${error}`)
  })
  process.exit(1)
}

if (validation.warnings.length > 0) {
  console.warn('Context validation warnings:')
  validation.warnings.forEach((warning) => {
    console.warn(`  ⚠️  ${warning}`)
  })
}

const stackVersion = app.node.tryGetContext('stackVersion') ?? '1.0.0'

console.log(`Deploying Remit-Scout stack:`)
console.log(`  Environment: ${envName}`)
console.log(`  Account: ${account}`)
console.log(`  Region: ${region}`)
console.log(`  Stack Version: ${stackVersion}`)

new RemitScoutStack(app, `remit-scout-${envName}`, {
  env: { account, region },
  description: `Remit-Scout AWS-native stack (${envName}) - v${stackVersion}`,
  envName,
})

app.synth()
