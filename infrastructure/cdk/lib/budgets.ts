import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { CfnBudget } from 'aws-cdk-lib/aws-budgets'
import { CfnAnomalyMonitor, CfnAnomalySubscription } from 'aws-cdk-lib/aws-ce'
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3'
import { CfnReportDefinition } from 'aws-cdk-lib/aws-cur'
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export type CostGuardrailsResources = {
  curBucket: Bucket
  curReport: CfnReportDefinition
  budget?: CfnBudget
  anomalyMonitor?: CfnAnomalyMonitor
  anomalySubscription?: CfnAnomalySubscription
}

export type CostGuardrailsOptions = {
  envName: string
  enabled?: boolean
  costAlertEmails?: string[]
  monthlyBudgetAmountUsd?: number
  anomalyThresholdUsd?: number
}

const toNumber = (value: number | undefined, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return fallback
}

export const createCostGuardrails = (
  scope: Construct,
  options: CostGuardrailsOptions,
): CostGuardrailsResources | null => {
  if (options.enabled === false) {
    return null
  }

  const isProd = options.envName === 'prod'
  const stack = Stack.of(scope)
  const region = stack.region

  const curBucket = new Bucket(scope, 'CostAndUsageReportBucket', {
    bucketName: `remit-scout-${options.envName}-cur`,
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    versioned: false,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: !isProd,
    lifecycleRules: [
      {
        expiration: Duration.days(isProd ? 365 : 90),
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  curBucket.addToResourcePolicy(
    new PolicyStatement({
      principals: [new ServicePrincipal('billingreports.amazonaws.com')],
      actions: ['s3:GetBucketAcl', 's3:GetBucketPolicy', 's3:PutObject'],
      resources: [curBucket.bucketArn, `${curBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          'aws:SourceAccount': stack.account,
        },
      },
    }),
  )

  const curReport = new CfnReportDefinition(scope, 'CostAndUsageReport', {
    reportName: `remit-scout-${options.envName}-cur`,
    timeUnit: 'DAILY',
    format: 'Parquet',
    compression: 'Parquet',
    reportVersioning: 'OVERWRITE_REPORT',
    refreshClosedReports: true,
    s3Bucket: curBucket.bucketName,
    s3Prefix: 'cur',
    s3Region: region,
    additionalArtifacts: ['ATHENA'],
    additionalSchemaElements: ['RESOURCES'],
  })

  const costAlertEmails = (options.costAlertEmails ?? []).filter(Boolean)
  const budgetAmount = toNumber(
    options.monthlyBudgetAmountUsd,
    options.envName === 'prod' ? 1000 : 200,
  )
  const anomalyThreshold = toNumber(
    options.anomalyThresholdUsd,
    options.envName === 'prod' ? 200 : 50,
  )

  let budget: CfnBudget | undefined
  let anomalyMonitor: CfnAnomalyMonitor | undefined
  let anomalySubscription: CfnAnomalySubscription | undefined

  if (costAlertEmails.length > 0) {
    budget = new CfnBudget(scope, 'MonthlyCostBudget', {
      budget: {
        budgetName: `remit-scout-${options.envName}-monthly`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: budgetAmount,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: costAlertEmails.map((email) => ({
            address: email,
            subscriptionType: 'EMAIL',
          })),
        },
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'FORECASTED',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: costAlertEmails.map((email) => ({
            address: email,
            subscriptionType: 'EMAIL',
          })),
        },
      ],
    })

    anomalyMonitor = new CfnAnomalyMonitor(scope, 'CostAnomalyMonitor', {
      monitorName: `remit-scout-${options.envName}-service-anomalies`,
      monitorType: 'DIMENSIONAL',
      monitorDimension: 'SERVICE',
    })

    anomalySubscription = new CfnAnomalySubscription(scope, 'CostAnomalySubscription', {
      subscriptionName: `remit-scout-${options.envName}-anomaly-subscription`,
      frequency: 'DAILY',
      threshold: anomalyThreshold,
      monitorArnList: [anomalyMonitor.attrMonitorArn],
      subscribers: costAlertEmails.map((email) => ({
        address: email,
        type: 'EMAIL',
      })),
    })
  }

  return {
    curBucket,
    curReport,
    budget,
    anomalyMonitor,
    anomalySubscription,
  }
}
