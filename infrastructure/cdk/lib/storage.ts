import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  ObjectOwnership,
  StorageClass,
} from 'aws-cdk-lib/aws-s3'
import { Key } from 'aws-cdk-lib/aws-kms'
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export type StorageResources = {
  storageAccessLogsBucket: Bucket
  bronzeBucket: Bucket
  exportsBucket: Bucket
  userAssetsBucket: Bucket
  auditLogsBucket: Bucket
}

export type StorageOptions = {
  envName: string
  exportsPrefix?: string
}

export const createStorage = (scope: Construct, options: StorageOptions): StorageResources => {
  const isProd = options.envName === 'prod'
  const isStaging = options.envName === 'staging'
  const isProtectedEnv = isProd || isStaging
  const exportsLifecyclePrefix = (() => {
    const normalized = (options.exportsPrefix ?? 'exports').replace(/^\/+|\/+$/g, '')
    return normalized ? `${normalized}/` : 'exports/'
  })()
  const sourceLogPrefix = (name: string): string => `s3-access-logs/${name}/`
  const grantLogDeliveryAccess = (sourceBucket: Bucket, logsBucket: Bucket, logsPrefix: string): void => {
    const account = Stack.of(scope).account
    logsBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:PutObject'],
        principals: [new ServicePrincipal('logging.s3.amazonaws.com')],
        resources: [logsBucket.arnForObjects(`${logsPrefix}*`)],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': account,
            'aws:SourceArn': sourceBucket.bucketArn,
          },
        },
      }),
    )
    logsBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:GetBucketAcl'],
        principals: [new ServicePrincipal('logging.s3.amazonaws.com')],
        resources: [logsBucket.bucketArn],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': account,
          },
        },
      }),
    )
  }

  const storageAccessLogsBucket = new Bucket(scope, 'StorageAccessLogsBucket', {
    bucketName: `remit-scout-storage-access-logs-${options.envName}`,
    versioned: false,
    encryption: BucketEncryption.S3_MANAGED,
    objectOwnership: ObjectOwnership.OBJECT_WRITER,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        expiration: Duration.days(isProd ? 365 : 30),
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
    autoDeleteObjects: !isProtectedEnv,
  })

  // KMS CMK with automatic annual rotation for bronze and audit-logs buckets.
  // Provides auditable key usage via CloudTrail (unlike S3-managed keys).
  const dataEncryptionKey = new Key(scope, 'DataEncryptionKey', {
    alias: `remit-scout-${options.envName}-data`,
    description: `RemitScout ${options.envName} data encryption key (bronze + audit-logs)`,
    enableKeyRotation: true,
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const bronzeBucket = new Bucket(scope, 'BronzeBucket', {
    bucketName: `remit-scout-bronze-${options.envName}`,
    versioned: true,
    encryption: BucketEncryption.KMS,
    encryptionKey: dataEncryptionKey,
    bucketKeyEnabled: true,
    serverAccessLogsBucket: storageAccessLogsBucket,
    serverAccessLogsPrefix: sourceLogPrefix('bronze'),
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        transitions: [
          {
            storageClass: StorageClass.GLACIER,
            transitionAfter: Duration.days(90),
          },
          {
            storageClass: StorageClass.DEEP_ARCHIVE,
            transitionAfter: Duration.days(365),
          },
        ],
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  const exportsBucket = new Bucket(scope, 'ExportsBucket', {
    bucketName: `remit-scout-exports-${options.envName}`,
    versioned: false,
    encryption: BucketEncryption.S3_MANAGED,
    serverAccessLogsBucket: storageAccessLogsBucket,
    serverAccessLogsPrefix: sourceLogPrefix('exports'),
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    metrics: [
      { id: 'ExportsIndicesMetrics', prefix: 'indices/' },
      { id: 'ExportsParquetMetrics', prefix: 'parquet/' },
    ],
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        prefix: exportsLifecyclePrefix,
        expiration: Duration.days(30),
      },
      {
        // Institutional/B2B daily drops (2-year retention).
        prefix: 'indices/',
        transitions: [
          {
            storageClass: StorageClass.GLACIER,
            transitionAfter: Duration.days(90),
          },
          {
            storageClass: StorageClass.DEEP_ARCHIVE,
            transitionAfter: Duration.days(365),
          },
        ],
        expiration: Duration.days(730),
      },
      {
        // Institutional/B2B parquet drops (2-year retention).
        prefix: 'parquet/',
        transitions: [
          {
            storageClass: StorageClass.GLACIER,
            transitionAfter: Duration.days(90),
          },
          {
            storageClass: StorageClass.DEEP_ARCHIVE,
            transitionAfter: Duration.days(365),
          },
        ],
        expiration: Duration.days(730),
      },
      {
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  const userAssetsBucket = new Bucket(scope, 'UserAssetsBucket', {
    bucketName: `remit-scout-user-assets-${options.envName}`,
    versioned: false,
    encryption: BucketEncryption.S3_MANAGED,
    serverAccessLogsBucket: storageAccessLogsBucket,
    serverAccessLogsPrefix: sourceLogPrefix('user-assets'),
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        expiration: Duration.days(365),
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  const auditLogsBucket = new Bucket(scope, 'AuditLogsBucket', {
    bucketName: `remit-scout-audit-logs-${options.envName}`,
    versioned: false,
    encryption: BucketEncryption.KMS,
    encryptionKey: dataEncryptionKey,
    bucketKeyEnabled: true,
    serverAccessLogsBucket: storageAccessLogsBucket,
    serverAccessLogsPrefix: sourceLogPrefix('audit-logs'),
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        transitions: [
          {
            storageClass: StorageClass.GLACIER,
            transitionAfter: Duration.days(90),
          },
          {
            storageClass: StorageClass.DEEP_ARCHIVE,
            transitionAfter: Duration.days(365),
          },
        ],
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  grantLogDeliveryAccess(bronzeBucket, storageAccessLogsBucket, sourceLogPrefix('bronze'))
  grantLogDeliveryAccess(exportsBucket, storageAccessLogsBucket, sourceLogPrefix('exports'))
  grantLogDeliveryAccess(userAssetsBucket, storageAccessLogsBucket, sourceLogPrefix('user-assets'))
  grantLogDeliveryAccess(auditLogsBucket, storageAccessLogsBucket, sourceLogPrefix('audit-logs'))

  return { storageAccessLogsBucket, bronzeBucket, exportsBucket, userAssetsBucket, auditLogsBucket }
}
