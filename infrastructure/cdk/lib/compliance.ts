import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { Bucket, BucketEncryption, BlockPublicAccess, ObjectOwnership } from 'aws-cdk-lib/aws-s3'
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import { CfnHub, CfnStandard } from 'aws-cdk-lib/aws-securityhub'
import { CfnDetector } from 'aws-cdk-lib/aws-guardduty'
import { CfnConfigurationRecorder, CfnDeliveryChannel, CfnConfigRule } from 'aws-cdk-lib/aws-config'
import { Trail } from 'aws-cdk-lib/aws-cloudtrail'
import { Rule } from 'aws-cdk-lib/aws-events'
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets'
import { Topic } from 'aws-cdk-lib/aws-sns'
import type { Construct } from 'constructs'

export type ComplianceOptions = {
  envName: string
  criticalTopic: Topic
}

export const createComplianceServices = (scope: Construct, options: ComplianceOptions): void => {
  const { envName } = options
  if (envName === 'dev') {
    return
  }

  const region = Stack.of(scope).region
  const isProd = envName === 'prod'

  const complianceBucket = new Bucket(scope, 'ComplianceArtifactsBucket', {
    bucketName: `remit-scout-${envName}-compliance-artifacts`,
    objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    encryption: BucketEncryption.S3_MANAGED,
    versioned: true,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: !isProd,
    lifecycleRules: [
      {
        id: 'security-rotation',
        expiration: Duration.days(isProd ? 3650 : 180),
      },
    ],
  })

  // CloudTrail (audit) with integrity validation and region-wide event capture.
  new Trail(scope, 'AuditTrail', {
    trailName: `remit-scout-${envName}-audit`,
    bucket: complianceBucket,
    isMultiRegionTrail: true,
    includeGlobalServiceEvents: true,
    enableFileValidation: true,
  })

  // GuardDuty detector for threat findings.
  new CfnDetector(scope, 'GuardDutyDetector', {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
  })

  // Security Hub with AWS Foundational Security Best Practices standard.
  const securityHub = new CfnHub(scope, 'SecurityHub', {
    enableDefaultStandards: false,
  })

  const foundationStandard = new CfnStandard(scope, 'SecurityHubFoundationsStandard', {
    standardsArn: `arn:aws:securityhub:${region}::standards/aws-foundational-security-best-practices/v/1.0.0`,
  })
  foundationStandard.addDependency(securityHub)

  // Route security findings into existing ops alert path.
  new Rule(scope, 'SecurityHubCriticalFindingsRule', {
    eventPattern: {
      source: ['aws.securityhub'],
      detailType: ['Security Hub Findings - Imported'],
    },
  }).addTarget(new SnsTopic(options.criticalTopic))

  new Rule(scope, 'GuardDutyCriticalFindingsRule', {
    eventPattern: {
      source: ['aws.guardduty'],
      detailType: ['GuardDuty Finding'],
    },
  }).addTarget(new SnsTopic(options.criticalTopic))

  // AWS Config recorder + baseline managed rules for compliance and drift signal.
  const configRole = new Role(scope, 'ConfigRecorderRole', {
    roleName: `remit-scout-${envName}-config-recorder`,
    assumedBy: new ServicePrincipal('config.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSConfigRole'),
    ],
  })

  const configRecorder = new CfnConfigurationRecorder(scope, 'ConfigRecorder', {
    name: `remit-scout-${envName}-config-recorder`,
    roleArn: configRole.roleArn,
    recordingGroup: {
      allSupported: true,
      includeGlobalResourceTypes: true,
    },
  })

  const configDeliveryChannel = new CfnDeliveryChannel(scope, 'ConfigDeliveryChannel', {
    name: `remit-scout-${envName}-config-delivery`,
    s3BucketName: complianceBucket.bucketName,
    s3KeyPrefix: 'config',
    configSnapshotDeliveryProperties: {
      deliveryFrequency: 'TwentyFour_Hours',
    },
  })
  configDeliveryChannel.addDependency(configRecorder)

  const managedRuleIds = [
    'CLOUD_TRAIL_ENABLED',
    'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
    'RDS_INSTANCE_PUBLIC_ACCESS_CHECK',
  ]

  for (const managedRuleId of managedRuleIds) {
    const managedRule = new CfnConfigRule(scope, `ConfigManagedRule${managedRuleId}`, {
      configRuleName: `${envName.toLowerCase()}-${managedRuleId.toLowerCase().replace(/_/g, '-')}`,
      description: `AWS Config managed rule ${managedRuleId} (${envName})`,
      source: {
        owner: 'AWS',
        sourceIdentifier: managedRuleId,
      },
    })
    managedRule.addDependency(configRecorder)
  }
}
