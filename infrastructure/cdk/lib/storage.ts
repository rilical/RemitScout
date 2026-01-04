import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  StorageClass,
} from 'aws-cdk-lib/aws-s3'
import type { Construct } from 'constructs'

export type StorageResources = {
  bronzeBucket: Bucket
  exportsBucket: Bucket
  userAssetsBucket: Bucket
  auditLogsBucket: Bucket
}

export type StorageOptions = {
  envName: string
}

export const createStorage = (scope: Construct, options: StorageOptions): StorageResources => {
  const isProd = options.envName === 'prod'

  const bronzeBucket = new Bucket(scope, 'BronzeBucket', {
    bucketName: `remit-scout-bronze-${options.envName}`,
    versioned: true,
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
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
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        expiration: Duration.days(30),
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  const userAssetsBucket = new Bucket(scope, 'UserAssetsBucket', {
    bucketName: `remit-scout-user-assets-${options.envName}`,
    versioned: false,
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
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
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
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

  return { bronzeBucket, exportsBucket, userAssetsBucket, auditLogsBucket }
}
