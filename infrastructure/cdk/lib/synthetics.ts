import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
  Metric,
} from 'aws-cdk-lib/aws-cloudwatch'
import { Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { CfnCanary } from 'aws-cdk-lib/aws-synthetics'
import type { Topic } from 'aws-cdk-lib/aws-sns'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import type { Construct } from 'constructs'

export type SyntheticsResources = {
  canaries: CfnCanary[]
  alarms: Alarm[]
}

export type SyntheticsOptions = {
  envName: string
  planeABaseUrl: string
  alertsTopic: Topic
}

const createCanaryCode = (testName: string, url: string): string => {
  return `
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
  const targetUrl = '${url}';
  const parsedUrl = new URL(targetUrl);
  const requestOptions = {
    hostname: parsedUrl.hostname,
    method: 'GET',
    path: parsedUrl.pathname,
    port: parsedUrl.port || (targetUrl.startsWith('https') ? 443 : 80),
    protocol: parsedUrl.protocol.replace(':', ''),
    headers: {
      'User-Agent': 'CloudWatch-Synthetics',
    },
  };

  const stepConfig = {
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    includeRequestBody: true,
    includeResponseBody: true,
    logRequestBody: true,
    logResponseBody: true,
    restrictedHeaders: [],
    restrictedUrlParameters: [],
  };

  await synthetics.executeHttpStep('${testName}', requestOptions, stepConfig);
};

exports.handler = async () => {
  return await apiCanaryBlueprint();
};
`.trim()
}

export const createSynthetics = (
  scope: Construct,
  options: SyntheticsOptions,
): SyntheticsResources => {
  const isProd = options.envName === 'prod'
  const canaries: CfnCanary[] = []
  const alarms: Alarm[] = []

  const syntheticsBucket = new Bucket(scope, 'SyntheticsArtifactsBucket', {
    bucketName: `remit-scout-${options.envName}-synthetics-artifacts`,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: !isProd,
  })

  const syntheticsRole = new Role(scope, 'SyntheticsExecutionRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    description: 'Role for CloudWatch Synthetics canaries',
  })

  syntheticsRole.addToPolicy(
    new PolicyStatement({
      actions: [
        's3:PutObject',
        's3:GetBucketLocation',
        's3:ListAllMyBuckets',
        'xray:PutTraceSegments',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }),
  )

  syntheticsBucket.grantReadWrite(syntheticsRole)

  const healthCheckUrl = `${options.planeABaseUrl}/healthz`
  const quotesUrl = `${options.planeABaseUrl}/api/quotes/current?from=USD&to=EUR&amount=100`

  const healthCheckCanary = new CfnCanary(scope, 'HealthCheckCanary', {
    name: `remit-scout-${options.envName}-health-check`,
    artifactS3Location: `s3://${syntheticsBucket.bucketName}/health-check`,
    code: {
      handler: 'index.handler',
      script: createCanaryCode('HealthCheck', healthCheckUrl),
    },
    executionRoleArn: syntheticsRole.roleArn,
    runtimeVersion: 'syn-nodejs-puppeteer-7.0',
    schedule: {
      expression: 'rate(1 minute)',
    },
    runConfig: {
      timeoutInSeconds: 30,
      memoryInMb: 1000,
      activeTracing: true,
    },
    failureRetentionPeriod: 30,
    successRetentionPeriod: 30,
  })

  const quotesCanary = new CfnCanary(scope, 'QuotesCanary', {
    name: `remit-scout-${options.envName}-quotes`,
    artifactS3Location: `s3://${syntheticsBucket.bucketName}/quotes`,
    code: {
      handler: 'index.handler',
      script: createCanaryCode('Quotes', quotesUrl),
    },
    executionRoleArn: syntheticsRole.roleArn,
    runtimeVersion: 'syn-nodejs-puppeteer-7.0',
    schedule: {
      expression: 'rate(5 minutes)',
    },
    runConfig: {
      timeoutInSeconds: 60,
      memoryInMb: 1000,
      activeTracing: true,
    },
    failureRetentionPeriod: 30,
    successRetentionPeriod: 30,
  })

  canaries.push(healthCheckCanary, quotesCanary)

  const alarmAction = new SnsAction(options.alertsTopic)

  const healthCheckAlarm = new Alarm(scope, 'HealthCheckCanaryAlarm', {
    alarmName: `remit-scout-${options.envName}-synthetic-health-check-failure`,
    metric: new Metric({
      namespace: 'CloudWatchSynthetics',
      metricName: 'SuccessPercent',
      dimensionsMap: {
        CanaryName: healthCheckCanary.name!,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 100,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.BREACHING,
    alarmDescription: 'Health check synthetic test is failing',
  })
  healthCheckAlarm.addAlarmAction(alarmAction)

  const quotesAlarm = new Alarm(scope, 'QuotesCanaryAlarm', {
    alarmName: `remit-scout-${options.envName}-synthetic-quotes-failure`,
    metric: new Metric({
      namespace: 'CloudWatchSynthetics',
      metricName: 'SuccessPercent',
      dimensionsMap: {
        CanaryName: quotesCanary.name!,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 100,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
    treatMissingData: TreatMissingData.BREACHING,
    alarmDescription: 'Quotes synthetic test is failing',
  })
  quotesAlarm.addAlarmAction(alarmAction)

  alarms.push(healthCheckAlarm, quotesAlarm)

  return { canaries, alarms }
}
