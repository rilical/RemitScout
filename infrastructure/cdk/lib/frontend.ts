import path from 'path'
import { Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib'
import {
  Distribution,
  ViewerProtocolPolicy,
  AllowedMethods,
  CachePolicy,
  ResponseHeadersPolicy,
  ErrorResponse,
  Function,
  FunctionCode,
  FunctionEventType,
} from 'aws-cdk-lib/aws-cloudfront'
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import {
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import type { CfnWebACL } from 'aws-cdk-lib/aws-wafv2'
import type { Construct } from 'constructs'

export type FrontendOptions = {
  envName: string
  frontendDomainName?: string
  frontendCertificateArn?: string
  frontendHostedZoneId?: string
  frontendHostedZoneName?: string
  planeAWaf?: CfnWebACL
  planeACloudFrontDomain?: string
  enableFrontend?: boolean
}

export type FrontendResources = {
  bucket: Bucket
  distribution: Distribution
  deployment?: BucketDeployment
}

const createISRLambdaEdge = (scope: Construct): Function => {
  return new Function(scope, 'FrontendISRFunction', {
    code: FunctionCode.fromInline(`
      function handler(event) {
        var request = event.request;
        var uri = request.uri;
        
        // Handle ISR routes
        if (uri.startsWith('/send-money/') || 
            uri.startsWith('/providers/') || 
            uri.startsWith('/pulse')) {
          // Check if this is a request for HTML
          if (request.headers['accept'] && 
              request.headers['accept'].value.includes('text/html')) {
            // For ISR routes, check cache and serve if available
            // Otherwise, let it through to origin
            return request;
          }
        }
        
        // For non-HTML requests, serve from cache
        return request;
      }
    `),
  })
}

export const createFrontend = (
  scope: Construct,
  options: FrontendOptions,
): FrontendResources | null => {
  const shouldCreateFrontend =
    options.enableFrontend ??
    (Boolean(options.frontendDomainName) || options.envName === 'prod')
  if (!shouldCreateFrontend) {
    return null
  }

  const bucket = new Bucket(scope, 'FrontendBucket', {
    bucketName: `remit-scout-frontend-${options.envName}`,
    encryption: BucketEncryption.S3_MANAGED,
    accessControl: BucketAccessControl.PRIVATE,
    objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
    removalPolicy:
      options.envName === 'prod'
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
    autoDeleteObjects: options.envName !== 'prod',
    versioned: options.envName === 'prod',
    lifecycleRules: [
      {
        id: 'DeleteOldVersions',
        enabled: options.envName === 'prod',
        noncurrentVersionExpiration: Duration.days(30),
        abortIncompleteMultipartUploadAfter: Duration.days(7),
      },
    ],
  })

  const s3Origin = S3BucketOrigin.withOriginAccessControl(bucket)

  const isrFunction = createISRLambdaEdge(scope)

  const staticCachePolicy = new CachePolicy(scope, 'FrontendStaticCachePolicy', {
    cachePolicyName: `remit-scout-frontend-static-${options.envName}`,
    defaultTtl: Duration.days(365),
    minTtl: Duration.days(365),
    maxTtl: Duration.days(365),
    enableAcceptEncodingGzip: true,
    enableAcceptEncodingBrotli: true,
  })

  const htmlCachePolicy = new CachePolicy(scope, 'FrontendHtmlCachePolicy', {
    cachePolicyName: `remit-scout-frontend-html-${options.envName}`,
    defaultTtl: Duration.seconds(0),
    minTtl: Duration.seconds(0),
    maxTtl: Duration.seconds(0),
    enableAcceptEncodingGzip: false,
    enableAcceptEncodingBrotli: false,
  })

  const isrCachePolicy = new CachePolicy(scope, 'FrontendISRCachePolicy', {
    cachePolicyName: `remit-scout-frontend-isr-${options.envName}`,
    defaultTtl: Duration.minutes(10),
    minTtl: Duration.seconds(0),
    maxTtl: Duration.hours(24),
    enableAcceptEncodingGzip: true,
    enableAcceptEncodingBrotli: true,
  })

  const certificate = options.frontendDomainName && options.frontendCertificateArn
    ? Certificate.fromCertificateArn(
        scope,
        'FrontendCertificate',
        options.frontendCertificateArn,
      )
    : undefined

  const distribution = new Distribution(scope, 'FrontendDistribution', {
    defaultBehavior: {
      origin: s3Origin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: htmlCachePolicy,
      compress: true,
      functionAssociations: [
        {
          function: isrFunction,
          eventType: FunctionEventType.VIEWER_REQUEST,
        },
      ],
    },
    additionalBehaviors: {
      '/send-money/*': {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: isrCachePolicy,
        compress: true,
        functionAssociations: [
          {
            function: isrFunction,
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      '/providers/*': {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: new CachePolicy(scope, 'FrontendProvidersCachePolicy', {
          cachePolicyName: `remit-scout-frontend-providers-${options.envName}`,
          defaultTtl: Duration.minutes(30),
          minTtl: Duration.seconds(0),
          maxTtl: Duration.hours(24),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
        compress: true,
      },
      '/pulse': {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: new CachePolicy(scope, 'FrontendPulseCachePolicy', {
          cachePolicyName: `remit-scout-frontend-pulse-${options.envName}`,
          defaultTtl: Duration.minutes(5),
          minTtl: Duration.seconds(0),
          maxTtl: Duration.hours(1),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
        compress: true,
      },
      '/_nuxt/*': {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: staticCachePolicy,
        compress: true,
      },
      '/images/*': {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: staticCachePolicy,
        compress: true,
      },
    },
    domainNames:
      certificate && options.frontendDomainName
        ? [options.frontendDomainName]
        : undefined,
    certificate,
    errorResponses: [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        // For unknown routes on static hosting, serve Nuxt's SPA fallback.
        // Using index.html here collapses deep links to "/" because it's prerendered for home.
        responsePagePath: '/200.html',
        ttl: Duration.minutes(10),
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/200.html',
        ttl: Duration.minutes(10),
      },
    ],
    defaultRootObject: 'index.html',
    comment: `Remit-Scout Frontend Distribution (${options.envName})`,
    webAclId: options.planeAWaf?.attrArn,
  })

  if (
    options.frontendDomainName &&
    options.frontendHostedZoneId &&
    options.frontendHostedZoneName &&
    certificate
  ) {
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      scope,
      'FrontendHostedZone',
      {
        hostedZoneId: options.frontendHostedZoneId,
        zoneName: options.frontendHostedZoneName,
      },
    )

    new ARecord(scope, 'FrontendARecord', {
      zone: hostedZone,
      recordName: options.frontendDomainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    })
  }

  new CfnOutput(scope, 'FrontendBucketName', {
    value: bucket.bucketName,
    description: 'Frontend S3 Bucket Name',
    exportName: `remit-scout-frontend-bucket-${options.envName}`,
  })

  new CfnOutput(scope, 'FrontendDistributionId', {
    value: distribution.distributionId,
    description: 'Frontend CloudFront Distribution ID',
    exportName: `remit-scout-frontend-distribution-id-${options.envName}`,
  })

  new CfnOutput(scope, 'FrontendDistributionDomain', {
    value: distribution.distributionDomainName,
    description: 'Frontend CloudFront Distribution Domain',
    exportName: `remit-scout-frontend-distribution-domain-${options.envName}`,
  })

  new CfnOutput(scope, 'FrontendUrl', {
    value:
      certificate && options.frontendDomainName
        ? `https://${options.frontendDomainName}`
        : `https://${distribution.distributionDomainName}`,
    description: 'Frontend URL',
    exportName: `remit-scout-frontend-url-${options.envName}`,
  })

  return {
    bucket,
    distribution,
  }
}
