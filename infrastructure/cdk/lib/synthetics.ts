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

const createIndicesCanaryCode = (testName: string, url: string): string => {
  return `
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
  const targetUrl = '${url}';
  const parsedUrl = new URL(targetUrl);
  const requestOptions = {
    hostname: parsedUrl.hostname,
    method: 'GET',
    path: parsedUrl.pathname + parsedUrl.search,
    port: parsedUrl.port || (targetUrl.startsWith('https') ? 443 : 80),
    protocol: parsedUrl.protocol.replace(':', ''),
    headers: {
      'User-Agent': 'CloudWatch-Synthetics',
    },
  };

  const stepConfig = {
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    includeRequestBody: false,
    includeResponseBody: true,
    logRequestBody: false,
    logResponseBody: true,
    restrictedHeaders: [],
    restrictedUrlParameters: [],
  };

  await synthetics.executeHttpStep('${testName}', requestOptions, stepConfig, async (response) => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error('Non-200 status: ' + response.statusCode);
    }
    let body = '';
    await new Promise((resolve, reject) => {
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', resolve);
      response.on('error', reject);
    });
    let data;
    try {
      data = JSON.parse(body);
    } catch (err) {
      throw new Error('Invalid JSON response');
    }
    if (!data || !data.point) {
      throw new Error('Missing indices point');
    }
    if (data.point.suppressionFlag === true) {
      throw new Error('Indices suppressed');
    }
    if (data.point.teer == null || data.point.rci == null || data.point.rvi_bps == null) {
      throw new Error('Indices values missing');
    }
  });
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
  const isDev = options.envName === 'dev'
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
  const indicesUrl = `${options.planeABaseUrl}/api/indices/latest?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank`

  const healthCheckCanary = new CfnCanary(scope, 'HealthCheckCanary', {
    name: `remit-scout-${options.envName}-health-check`,
    artifactS3Location: `s3://${syntheticsBucket.bucketName}/health-check`,
    code: {
      handler: 'index.handler',
      script: createCanaryCode('HealthCheck', healthCheckUrl),
    },
    executionRoleArn: syntheticsRole.roleArn,
    runtimeVersion: 'syn-nodejs-puppeteer-13.1',
    schedule: {
      expression: isDev ? 'rate(15 minutes)' : 'rate(1 minute)',
    },
    runConfig: {
      timeoutInSeconds: 30,
      memoryInMb: 1000,
      activeTracing: true,
    },
    failureRetentionPeriod: 30,
    successRetentionPeriod: 30,
  })

  const quotesCanary = isDev
    ? null
    : new CfnCanary(scope, 'QuotesCanary', {
        name: `remit-scout-${options.envName}-quotes`,
        artifactS3Location: `s3://${syntheticsBucket.bucketName}/quotes`,
        code: {
          handler: 'index.handler',
          script: createCanaryCode('Quotes', quotesUrl),
        },
        executionRoleArn: syntheticsRole.roleArn,
        runtimeVersion: 'syn-nodejs-puppeteer-13.1',
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

  const indicesCanary = isDev
    ? null
    : new CfnCanary(scope, 'IndicesCanary', {
        name: `remit-scout-${options.envName}-indices`,
        artifactS3Location: `s3://${syntheticsBucket.bucketName}/indices`,
        code: {
          handler: 'index.handler',
          script: createIndicesCanaryCode('Indices', indicesUrl),
        },
        executionRoleArn: syntheticsRole.roleArn,
        runtimeVersion: 'syn-nodejs-puppeteer-13.1',
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

  canaries.push(healthCheckCanary)
  if (quotesCanary) {
    canaries.push(quotesCanary)
  }
  if (indicesCanary) {
    canaries.push(indicesCanary)
  }

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

  if (quotesCanary) {
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
    alarms.push(quotesAlarm)
  }

  if (indicesCanary) {
    const indicesAlarm = new Alarm(scope, 'IndicesCanaryAlarm', {
      alarmName: `remit-scout-${options.envName}-synthetic-indices-failure`,
      metric: new Metric({
        namespace: 'CloudWatchSynthetics',
        metricName: 'SuccessPercent',
        dimensionsMap: {
          CanaryName: indicesCanary.name!,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 100,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.BREACHING,
      alarmDescription: 'Indices synthetic test is failing',
    })
    indicesAlarm.addAlarmAction(alarmAction)
    alarms.push(indicesAlarm)
  }

  alarms.push(healthCheckAlarm)

  return { canaries, alarms }
}
