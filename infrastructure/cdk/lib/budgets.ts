import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { CfnBudget } from 'aws-cdk-lib/aws-budgets'
import { CfnAnomalyMonitor, CfnAnomalySubscription } from 'aws-cdk-lib/aws-ce'
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3'
import { CfnReportDefinition } from 'aws-cdk-lib/aws-cur'
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export type CostGuardrailsResources = {
  curBucket?: Bucket
  curReport?: CfnReportDefinition
  budget?: CfnBudget
  anomalyMonitor?: CfnAnomalyMonitor
  anomalySubscription?: CfnAnomalySubscription
}

export type CostGuardrailsOptions = {
  envName: string
  enabled?: boolean
  costAlertEmails?: string[]
  costAlertSnsTopicArn?: string
  monthlyBudgetAmountUsd?: number
  anomalyThresholdUsd?: number
  createCur?: boolean
  enableAnomalyDetection?: boolean
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
  const createCur = options.createCur ?? isProd
  const anomalyDetectionEnabled = options.enableAnomalyDetection ?? isProd

  let curBucket: Bucket | undefined
  let curReport: CfnReportDefinition | undefined

  if (createCur) {
    curBucket = new Bucket(scope, 'CostAndUsageReportBucket', {
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

    curReport = new CfnReportDefinition(scope, 'CostAndUsageReport', {
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
  }

  const costAlertEmails = (options.costAlertEmails ?? []).filter(Boolean)
  const costAlertSnsTopicArn = options.costAlertSnsTopicArn
  const hasAlertSubscribers = costAlertEmails.length > 0 || Boolean(costAlertSnsTopicArn)

  // NOTE:
  // - Cost Explorer Anomaly Subscriptions only allow SNS subscribers when frequency is IMMEDIATE.
  // - DAILY/WEEKLY only support EMAIL.
  // Ref: Error seen in CloudFormation deploy: "Daily or weekly frequencies only support Email subscriptions".
  const anomalyFrequency = costAlertSnsTopicArn ? 'IMMEDIATE' : 'DAILY'
  const budgetSubscribers = [
    ...costAlertEmails.map((email) => ({
      address: email,
      subscriptionType: 'EMAIL' as const,
    })),
    ...(costAlertSnsTopicArn
      ? [{
          address: costAlertSnsTopicArn,
          subscriptionType: 'SNS' as const,
        }]
      : []),
  ]
  // Cost Explorer Anomaly Subscription constraints:
  // - DAILY/WEEKLY only support EMAIL
  // - IMMEDIATE supports SNS but max 1 subscriber
  // We prefer SNS (auto-pause) when configured.
  const anomalySubscribers = costAlertSnsTopicArn
    ? [
        {
          address: costAlertSnsTopicArn,
          type: 'SNS' as const,
        },
      ]
    : costAlertEmails.map((email) => ({
        address: email,
        type: 'EMAIL' as const,
      }))
  const budgetAmount = toNumber(
    options.monthlyBudgetAmountUsd,
    options.envName === 'prod' ? 500 : (options.envName === 'staging' ? 300 : 100),
  )
  const anomalyThreshold = toNumber(
    options.anomalyThresholdUsd,
    options.envName === 'prod' ? 100 : (options.envName === 'staging' ? 60 : 20),
  )

  let budget: CfnBudget | undefined
  let anomalyMonitor: CfnAnomalyMonitor | undefined
  let anomalySubscription: CfnAnomalySubscription | undefined

  if (hasAlertSubscribers) {
    const nameSuffix = options.envName === 'dev' ? '-guardrail' : ''

    budget = new CfnBudget(scope, 'MonthlyCostBudget', {
      budget: {
        budgetName: `remit-scout-${options.envName}-monthly${nameSuffix}`,
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
          subscribers: budgetSubscribers,
        },
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'FORECASTED',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: budgetSubscribers,
        },
      ],
    })

    if (anomalyDetectionEnabled) {
      anomalyMonitor = new CfnAnomalyMonitor(scope, 'CostAnomalyMonitor', {
        monitorName: `remit-scout-${options.envName}-service-anomalies${nameSuffix}`,
        monitorType: 'DIMENSIONAL',
        monitorDimension: 'SERVICE',
      })

      anomalySubscription = new CfnAnomalySubscription(scope, 'CostAnomalySubscription', {
        subscriptionName: `remit-scout-${options.envName}-anomaly-subscription${nameSuffix}`,
        frequency: anomalyFrequency,
        threshold: anomalyThreshold,
        monitorArnList: [anomalyMonitor.attrMonitorArn],
        subscribers: anomalySubscribers,
      })
    }
  }

  return {
    curBucket,
    curReport,
    budget,
    anomalyMonitor,
    anomalySubscription,
  }
}
