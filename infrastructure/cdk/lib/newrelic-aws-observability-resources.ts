import { Aws, Duration, RemovalPolicy, Token } from 'aws-cdk-lib'
import { CfnMetricStream } from 'aws-cdk-lib/aws-cloudwatch'
import { CfnDeliveryStream } from 'aws-cdk-lib/aws-kinesisfirehose'
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import { CfnSubscriptionFilter, type ILogGroup } from 'aws-cdk-lib/aws-logs'
import { Secret, type ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3'
import type { Construct } from 'constructs'

export type NewRelicAwsObservabilityOptions = {
  envName: string
  metricStreamEnabled?: boolean
  logForwardingEnabled?: boolean
  ingestKeySecretArn?: string
  ingestKeySecretJsonKey?: string
  logGroups?: ILogGroup[]
}

export type NewRelicAwsObservabilityResources = {
  backupBucket?: Bucket
  metricsDeliveryStream?: CfnDeliveryStream
  metricStream?: CfnMetricStream
  logsDeliveryStream?: CfnDeliveryStream
  logTransformFunction?: LambdaFunction
}

const completeSecretArnPattern =
  /^arn:aws[a-zA-Z-]*:secretsmanager:[^:]+:\d{12}:secret:[^:]+-[A-Za-z0-9]{6}$/

const metricNamespaces = [
  'AWS/ApiGateway',
  'AWS/SQS',
  'AWS/RDS',
  'AWS/ECS',
  'AWS/ApplicationELB',
  'AWS/Lambda',
  'AWS/Events',
  'AWS/ElastiCache',
] as const

const normalizeNewRelicRegion = (value?: string): 'US' | 'EU' => (
  value?.trim().toUpperCase() === 'EU' ? 'EU' : 'US'
)

const importSecretByRef = (scope: Construct, id: string, secretRef: string): ISecret => {
  const normalizedRef = secretRef.trim()
  if (Token.isUnresolved(normalizedRef)) {
    return Secret.fromSecretCompleteArn(scope, id, normalizedRef)
  }
  if (normalizedRef.startsWith('arn:')) {
    return completeSecretArnPattern.test(normalizedRef)
      ? Secret.fromSecretCompleteArn(scope, id, normalizedRef)
      : Secret.fromSecretPartialArn(scope, id, normalizedRef)
  }
  return Secret.fromSecretNameV2(scope, id, normalizedRef)
}

const resolveIngestKey = (
  scope: Construct,
  options: Pick<NewRelicAwsObservabilityOptions, 'ingestKeySecretArn' | 'ingestKeySecretJsonKey'>,
): string | undefined => {
  const secretArn = options.ingestKeySecretArn?.trim()
  if (!secretArn) return undefined

  const secret = importSecretByRef(scope, 'NewRelicIngestKeySecret', secretArn)
  const secretJsonKey = options.ingestKeySecretJsonKey?.trim()
  return secretJsonKey
    ? secret.secretValueFromJson(secretJsonKey).toString()
    : secret.secretValue.toString()
}

const addFirehoseBackupPermissions = (role: Role, bucket: Bucket): void => {
  role.addToPolicy(new PolicyStatement({
    actions: [
      's3:AbortMultipartUpload',
      's3:GetBucketLocation',
      's3:GetObject',
      's3:ListBucket',
      's3:ListBucketMultipartUploads',
      's3:PutObject',
    ],
    resources: [bucket.bucketArn, bucket.arnForObjects('*')],
  }))
}

const createS3BackupConfiguration = (
  bucket: Bucket,
  roleArn: string,
  prefix: string,
): CfnDeliveryStream.S3DestinationConfigurationProperty => ({
  bucketArn: bucket.bucketArn,
  roleArn,
  compressionFormat: 'GZIP',
  bufferingHints: {
    intervalInSeconds: 300,
    sizeInMBs: 5,
  },
  prefix: `${prefix}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/`,
  errorOutputPrefix:
    `${prefix}/failed/!{firehose:error-output-type}/`
    + 'year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
})

const createLogTransformFunction = (
  scope: Construct,
  envName: string,
): LambdaFunction => new LambdaFunction(scope, 'NewRelicLogsTransformFunction', {
  runtime: Runtime.NODEJS_22_X,
  handler: 'index.handler',
  timeout: Duration.seconds(60),
  memorySize: 256,
  environment: {
    REMIT_SCOUT_ENV: envName,
    REMIT_SCOUT_APP_NAME: `remit-scout-${envName}-cloudwatch`,
  },
  code: Code.fromInline(`
const zlib = require('zlib')

const parseMessage = (message) => {
  try {
    const parsed = JSON.parse(message)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return { message, parsedMessage: parsed }
  } catch {
    return { message }
  }
}

exports.handler = async (event) => {
  const environment = process.env.REMIT_SCOUT_ENV || 'unknown'
  const appName = process.env.REMIT_SCOUT_APP_NAME || ('remit-scout-' + environment + '-cloudwatch')
  const records = (event.records || []).map((record) => {
    try {
      const decoded = Buffer.from(record.data, 'base64')
      let payload = decoded
      try {
        payload = zlib.gunzipSync(decoded)
      } catch {}
      const envelope = JSON.parse(payload.toString('utf8'))
      if (!envelope || envelope.messageType === 'CONTROL_MESSAGE') {
        return { recordId: record.recordId, result: 'Dropped', data: record.data }
      }
      const base = {
        environment,
        appName,
        'entity.name': appName,
        'aws.logs.Resource': envelope.logGroup,
        awsAccountId: envelope.owner,
        logGroup: envelope.logGroup,
        logStream: envelope.logStream,
        subscriptionFilters: envelope.subscriptionFilters || [],
        cloudwatchMessageType: envelope.messageType,
      }
      const lines = (envelope.logEvents || []).map((logEvent) => JSON.stringify({
        ...parseMessage(String(logEvent.message || '')),
        ...base,
        cloudwatchLogEventId: logEvent.id,
        cloudwatchTimestamp: new Date(logEvent.timestamp || Date.now()).toISOString(),
        cloudwatchTimestampMs: logEvent.timestamp || Date.now(),
      }))
      if (lines.length === 0) {
        return { recordId: record.recordId, result: 'Dropped', data: record.data }
      }
      return {
        recordId: record.recordId,
        result: 'Ok',
        data: Buffer.from(lines.join('\\n') + '\\n').toString('base64'),
      }
    } catch (error) {
      console.error('newrelic-log-transform-failed', {
        message: error instanceof Error ? error.message : String(error),
      })
      return { recordId: record.recordId, result: 'ProcessingFailed', data: record.data }
    }
  })
  return { records }
}
`),
})

export const createNewRelicAwsObservabilityResources = (
  scope: Construct,
  options: NewRelicAwsObservabilityOptions,
): NewRelicAwsObservabilityResources => {
  const metricStreamEnabled = options.metricStreamEnabled === true
  const logGroups = options.logGroups ?? []
  const logForwardingEnabled = options.logForwardingEnabled === true && logGroups.length > 0

  if (!metricStreamEnabled && !logForwardingEnabled) {
    return {}
  }

  const ingestKey = resolveIngestKey(scope, options)
  if (!ingestKey) {
    throw new Error(
      'NEW_RELIC_INGEST_KEY_SECRET_ARN is required when '
      + 'New Relic AWS metric streaming or log forwarding is enabled. '
      + 'Plaintext NEW_RELIC_INGEST_KEY fallback is not allowed for these resources.',
    )
  }

  const isProd = options.envName === 'prod'
  const newRelicRegion = normalizeNewRelicRegion(process.env.NEW_RELIC_REGION)
  const metricsEndpoint = newRelicRegion === 'EU'
    ? 'https://aws-api.eu01.nr-data.net/cloudwatch-metrics/v1'
    : 'https://aws-api.newrelic.com/cloudwatch-metrics/v1'
  const logsEndpoint = newRelicRegion === 'EU'
    ? 'https://aws-api.eu01.nr-data.net/firehose/v1'
    : 'https://aws-api.newrelic.com/firehose/v1'

  const backupBucket = new Bucket(scope, 'NewRelicFirehoseBackupBucket', {
    bucketName: `remit-scout-${options.envName}-nr-firehose-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: !isProd,
    lifecycleRules: [
      {
        expiration: Duration.days(isProd ? 14 : 3),
        abortIncompleteMultipartUploadAfter: Duration.days(1),
      },
    ],
  })

  let metricsDeliveryStream: CfnDeliveryStream | undefined
  let metricStream: CfnMetricStream | undefined
  if (metricStreamEnabled) {
    const metricsFirehoseRole = new Role(scope, 'NewRelicMetricsFirehoseRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
    })
    addFirehoseBackupPermissions(metricsFirehoseRole, backupBucket)

    metricsDeliveryStream = new CfnDeliveryStream(scope, 'NewRelicMetricsDeliveryStream', {
      deliveryStreamName: `remit-scout-${options.envName}-nr-metrics`,
      deliveryStreamType: 'DirectPut',
      httpEndpointDestinationConfiguration: {
        endpointConfiguration: {
          name: 'New Relic Metrics',
          url: metricsEndpoint,
          accessKey: ingestKey,
        },
        roleArn: metricsFirehoseRole.roleArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 1,
        },
        requestConfiguration: {
          contentEncoding: 'GZIP',
        },
        retryOptions: {
          durationInSeconds: 300,
        },
        s3BackupMode: 'FailedDataOnly',
        s3Configuration: createS3BackupConfiguration(
          backupBucket,
          metricsFirehoseRole.roleArn,
          `metrics/${options.envName}`,
        ),
      },
    })

    const metricStreamRole = new Role(scope, 'NewRelicMetricStreamRole', {
      assumedBy: new ServicePrincipal('streams.metrics.cloudwatch.amazonaws.com'),
    })
    metricStreamRole.addToPolicy(new PolicyStatement({
      actions: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
      resources: [metricsDeliveryStream.attrArn],
    }))

    metricStream = new CfnMetricStream(scope, 'NewRelicMetricStream', {
      name: `remit-scout-${options.envName}-newrelic-metric-stream`,
      firehoseArn: metricsDeliveryStream.attrArn,
      outputFormat: 'opentelemetry0.7',
      roleArn: metricStreamRole.roleArn,
      includeFilters: metricNamespaces.map((namespace) => ({ namespace })),
    })
  }

  let logsDeliveryStream: CfnDeliveryStream | undefined
  let logTransformFunction: LambdaFunction | undefined
  if (logForwardingEnabled) {
    logTransformFunction = createLogTransformFunction(scope, options.envName)
    const logsFirehoseRole = new Role(scope, 'NewRelicLogsFirehoseRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
    })
    addFirehoseBackupPermissions(logsFirehoseRole, backupBucket)
    logsFirehoseRole.addToPolicy(new PolicyStatement({
      actions: ['lambda:GetFunctionConfiguration', 'lambda:InvokeFunction'],
      resources: [logTransformFunction.functionArn],
    }))

    logsDeliveryStream = new CfnDeliveryStream(scope, 'NewRelicLogsDeliveryStream', {
      deliveryStreamName: `remit-scout-${options.envName}-nr-logs`,
      deliveryStreamType: 'DirectPut',
      httpEndpointDestinationConfiguration: {
        endpointConfiguration: {
          name: 'New Relic Logs',
          url: logsEndpoint,
          accessKey: ingestKey,
        },
        roleArn: logsFirehoseRole.roleArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 1,
        },
        processingConfiguration: {
          enabled: true,
          processors: [{
            type: 'Lambda',
            parameters: [
              {
                parameterName: 'LambdaArn',
                parameterValue: logTransformFunction.functionArn,
              },
              {
                parameterName: 'NumberOfRetries',
                parameterValue: '3',
              },
              {
                parameterName: 'BufferSizeInMBs',
                parameterValue: '1',
              },
              {
                parameterName: 'BufferIntervalInSeconds',
                parameterValue: '60',
              },
            ],
          }],
        },
        requestConfiguration: {
          contentEncoding: 'GZIP',
        },
        retryOptions: {
          durationInSeconds: 300,
        },
        s3BackupMode: 'FailedDataOnly',
        s3Configuration: createS3BackupConfiguration(
          backupBucket,
          logsFirehoseRole.roleArn,
          `logs/${options.envName}`,
        ),
      },
    })
    const logsDeliveryStreamArn = logsDeliveryStream.attrArn

    logTransformFunction.addPermission('AllowFirehoseInvoke', {
      principal: new ServicePrincipal('firehose.amazonaws.com'),
      sourceArn: logsDeliveryStreamArn,
    })

    const cloudWatchLogsToFirehoseRole = new Role(scope, 'NewRelicCloudWatchLogsToFirehoseRole', {
      assumedBy: new ServicePrincipal('logs.amazonaws.com', {
        conditions: {
          StringEquals: {
            'aws:SourceAccount': Aws.ACCOUNT_ID,
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/remit-scout/${options.envName}/*`,
          },
        },
      }),
    })
    cloudWatchLogsToFirehoseRole.addToPolicy(new PolicyStatement({
      actions: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
      resources: [logsDeliveryStreamArn],
    }))

    logGroups.forEach((logGroup, index) => {
      new CfnSubscriptionFilter(scope, `NewRelicLogSubscription${index + 1}`, {
        destinationArn: logsDeliveryStreamArn,
        filterName: 'newrelic-firehose',
        filterPattern: '',
        logGroupName: logGroup.logGroupName,
        roleArn: cloudWatchLogsToFirehoseRole.roleArn,
      })
    })
  }

  return {
    backupBucket,
    metricsDeliveryStream,
    metricStream,
    logsDeliveryStream,
    logTransformFunction,
  }
}
