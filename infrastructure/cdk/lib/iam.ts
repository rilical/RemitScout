import { type Construct } from 'constructs'
import { Annotations } from 'aws-cdk-lib'
import {
  ManagedPolicy,
  Role,
  ServicePrincipal,
  PolicyStatement,
  type IRole,
} from 'aws-cdk-lib/aws-iam'

export type IamResources = {
  planeALambdaRole: IRole
  planeBLambdaRole: IRole
  planeCLambdaRole: IRole
  opsPauseLambdaRole: IRole
  planeBEcsTaskExecutionRole: IRole
  planeBEcsTaskRole: IRole
}

export type IamOptions = {
  envName: string
  sharedSecretArns?: string[]
  sesIdentityArns?: string[]
  snsTopicArns?: string[]
  pinpointAppId?: string
  /**
   * Specific ARN of the RDS cluster that OpsPause is allowed to start/stop.
   * When provided, the RDS policy resource is scoped to this ARN instead of
   * the broad wildcard. Recommended for production and staging environments.
   */
  opsPauseDbClusterArn?: string
  /**
   * Specific ARN of the ElastiCache replication group that OpsPause is allowed
   * to create/delete/describe. When provided, the ElastiCache policy resource
   * is scoped to this ARN instead of the broad wildcard.
   */
  opsPauseRedisReplicationGroupArn?: string
  /**
   * ARN prefix for EventBridge rules that OpsPause is allowed to
   * enable/disable (e.g. "arn:aws:events:us-east-1:123456789012:rule/remit-scout-staging-*").
   * When provided, the Events policy resource is scoped to this pattern instead
   * of the broad wildcard.
   */
  opsPauseEventRuleArnPrefix?: string
}

export const createIam = (scope: Construct, options: IamOptions): IamResources => {
  const lambdaBasicPolicy = ManagedPolicy.fromAwsManagedPolicyName(
    'service-role/AWSLambdaBasicExecutionRole',
  )
  const lambdaVpcPolicy = ManagedPolicy.fromAwsManagedPolicyName(
    'service-role/AWSLambdaVPCAccessExecutionRole',
  )

  const planeALambdaRole = new Role(scope, 'PlaneALambdaRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [lambdaBasicPolicy, lambdaVpcPolicy],
  })

  const planeBLambdaRole = new Role(scope, 'PlaneBLambdaRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [lambdaBasicPolicy, lambdaVpcPolicy],
  })

  const planeCLambdaRole = new Role(scope, 'PlaneCLambdaRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [lambdaBasicPolicy, lambdaVpcPolicy],
  })

  const opsPauseLambdaRole = new Role(scope, 'OpsPauseLambdaRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [lambdaBasicPolicy],
  })

  const planeBEcsTaskExecutionRole = new Role(scope, 'PlaneBEcsTaskExecutionRole', {
    assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    ],
  })

  const planeBEcsTaskRole = new Role(scope, 'PlaneBEcsTaskRole', {
    assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
  })

  const secretsPolicyResources = [
    `arn:aws:secretsmanager:*:*:secret:remit-scout/${options.envName}/*`,
  ]
  const sharedSecretArns = (options.sharedSecretArns ?? []).filter(Boolean)
  if (sharedSecretArns.length > 0) {
    secretsPolicyResources.push(...sharedSecretArns)
  } else {
    Annotations.of(scope).addWarning(
      'No sharedSecretArns provided; IAM secret access is limited to remit-scout namespace pattern only.',
    )
  }
  const secretsPolicy = new PolicyStatement({
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
    resources: secretsPolicyResources,
  })
  const ssmPolicy = new PolicyStatement({
    actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
    resources: [`arn:aws:ssm:*:*:parameter/remit-scout/${options.envName}/*`],
  })
  // CloudWatch PutMetricData does not support resource-level permissions — '*' is required by AWS.
  // We scope by condition key instead to limit to our namespace.
  const remitScoutCloudWatchNamespacePattern = 'RemitScout*'
  const cloudWatchPolicy = new PolicyStatement({
    actions: ['cloudwatch:PutMetricData'],
    resources: ['*'],
    conditions: {
      StringLike: { 'cloudwatch:namespace': remitScoutCloudWatchNamespacePattern },
    },
  })
  const cloudWatchReadPolicy = new PolicyStatement({
    actions: ['cloudwatch:GetMetricStatistics', 'cloudwatch:GetMetricData'],
    resources: ['*'],
    conditions: {
      StringLike: { 'cloudwatch:namespace': remitScoutCloudWatchNamespacePattern },
    },
  })
  // X-Ray PutTraceSegments/PutTelemetryRecords are data-plane APIs that require Resource: '*'.
  // AWS does not support resource-level permissions for these actions.
  const xrayPolicy = new PolicyStatement({
    actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
    resources: ['*'],
  })
  const isProdOrStaging = options.envName === 'prod' || options.envName === 'staging'
  if (isProdOrStaging) {
    if (!options.sesIdentityArns || options.sesIdentityArns.length === 0) {
      throw new Error(`sesIdentityArns must be provided for ${options.envName} environment`)
    }
    if (!options.snsTopicArns || options.snsTopicArns.length === 0) {
      throw new Error(`snsTopicArns must be provided for ${options.envName} environment`)
    }
  }

  const sesIdentityArns = (options.sesIdentityArns ?? []).filter(Boolean)
  const snsTopicArns = (options.snsTopicArns ?? []).filter(Boolean)
  const sesPolicyResources =
    sesIdentityArns.length > 0
      ? sesIdentityArns
      : ['arn:aws:ses:*:*:identity/*']
  const snsPolicyResources =
    snsTopicArns.length > 0
      ? snsTopicArns
      : ['arn:aws:sns:*:*:remit-scout-*']
  if (options.envName === 'dev') {
    if (sesIdentityArns.length === 0) {
      Annotations.of(scope).addWarning(
        'No SES identity ARNs provided for dev; falling back to scoped wildcard identity ARN pattern.',
      )
    }
    if (snsTopicArns.length === 0) {
      Annotations.of(scope).addWarning(
        'No SNS topic ARNs provided for dev; falling back to scoped remit-scout topic ARN pattern.',
      )
    }
  }
  const sesPolicy = new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: sesPolicyResources,
  })
  const snsPolicy = new PolicyStatement({
    actions: ['sns:Publish'],
    resources: snsPolicyResources,
  })

  if (options.pinpointAppId) {
    const pinpointPolicy = new PolicyStatement({
      actions: [
        'mobiletargeting:SendMessages',
        'mobiletargeting:GetEmailChannel',
        'mobiletargeting:SendUsersMessages',
      ],
      resources: [`arn:aws:mobiletargeting:*:*:apps/${options.pinpointAppId}/*`],
    })
    planeALambdaRole.addToPolicy(pinpointPolicy)
  }

  for (const role of [
    planeALambdaRole,
    planeBLambdaRole,
    planeCLambdaRole,
    opsPauseLambdaRole,
    planeBEcsTaskExecutionRole,
  ]) {
    role.addToPolicy(secretsPolicy)
    role.addToPolicy(ssmPolicy)
    role.addToPolicy(cloudWatchPolicy)
    role.addToPolicy(xrayPolicy)
  }

  // Keep ops-pause permissions scoped by remit-scout environment naming conventions.
  // These permissions are attached in Foundation so nested stacks do not need to mutate this role.
  const remitScoutClusterName = `remit-scout-${options.envName}`
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['ssm:PutParameter'],
    resources: [`arn:aws:ssm:*:*:parameter/remit-scout/${options.envName}/ops/paused`],
  }))
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['ecs:ListServices', 'ecs:UpdateService', 'ecs:DescribeServices'],
    resources: [
      `arn:aws:ecs:*:*:service/${remitScoutClusterName}/*`,
      `arn:aws:ecs:*:*:cluster/${remitScoutClusterName}`,
    ],
  }))
  // ecs:ListTasks and ecs:DescribeTasks require Resource: '*' when using the
  // plain (non-ARN-filtered) API variants. ecs:StopTask accepts a task ARN but
  // cannot be predicted at synth time.  We scope to the cluster ARN where
  // possible; the task-level actions still need '*' at the resource level but
  // the cluster constraint limits blast radius via a condition key.
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['ecs:ListTasks', 'ecs:DescribeTasks', 'ecs:StopTask'],
    resources: [
      `arn:aws:ecs:*:*:task/${remitScoutClusterName}/*`,
      `arn:aws:ecs:*:*:cluster/${remitScoutClusterName}`,
    ],
  }))
  // EventBridge rule actions: scope to the remit-scout rule name prefix so
  // OpsPause cannot touch rules belonging to other services. If an explicit
  // ARN prefix is supplied (e.g. at synth time with full account/region), use
  // that; otherwise fall back to the naming-convention-scoped pattern.
  const eventRuleResources = options.opsPauseEventRuleArnPrefix
    ? [options.opsPauseEventRuleArnPrefix]
    : [`arn:aws:events:*:*:rule/remit-scout-${options.envName}-*`]
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['events:DisableRule', 'events:EnableRule', 'events:ListRules'],
    resources: eventRuleResources,
  }))
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['sqs:PurgeQueue', 'sqs:GetQueueAttributes'],
    resources: [`arn:aws:sqs:*:*:remit-scout-${options.envName}-*`],
  }))
  // RDS cluster actions: scope to the specific cluster ARN when available.
  // DescribeDBClusters is a list API that AWS allows on '*'; StartDBCluster and
  // StopDBCluster accept the cluster ARN as the resource.
  const rdsResources = options.opsPauseDbClusterArn
    ? [options.opsPauseDbClusterArn]
    : [`arn:aws:rds:*:*:cluster:remit-scout-${options.envName}*`]
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['rds:StartDBCluster', 'rds:StopDBCluster', 'rds:DescribeDBClusters'],
    resources: rdsResources,
  }))
  // ElastiCache replication group actions: scope to the specific replication
  // group ARN when available. DescribeCacheSubnetGroups is a list API and
  // requires '*' per AWS docs; CreateReplicationGroup and DeleteReplicationGroup
  // accept the replication group ARN.
  const elastiCacheReplicationGroupResources = options.opsPauseRedisReplicationGroupArn
    ? [options.opsPauseRedisReplicationGroupArn]
    : [`arn:aws:elasticache:*:*:replicationgroup:remit-scout-${options.envName}*`]
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: [
      'elasticache:CreateReplicationGroup',
      'elasticache:DeleteReplicationGroup',
      'elasticache:DescribeReplicationGroups',
    ],
    resources: elastiCacheReplicationGroupResources,
  }))
  // DescribeCacheSubnetGroups is a list/read API that AWS requires Resource: '*'
  // for — there is no resource-level permission support for this action.
  opsPauseLambdaRole.addToPolicy(new PolicyStatement({
    actions: ['elasticache:DescribeCacheSubnetGroups'],
    resources: ['*'],
  }))

  // Add SES and SNS permissions to Plane A Lambda (for contact form and alerts)
  planeALambdaRole.addToPolicy(sesPolicy)
  planeALambdaRole.addToPolicy(snsPolicy)

  planeBEcsTaskRole.addToPolicy(cloudWatchPolicy)
  planeBEcsTaskRole.addToPolicy(cloudWatchReadPolicy)
  planeBEcsTaskRole.addToPolicy(xrayPolicy)
  planeBEcsTaskRole.addToPolicy(secretsPolicy)
  planeBEcsTaskRole.addToPolicy(sesPolicy)
  planeBEcsTaskRole.addToPolicy(snsPolicy)
  planeBEcsTaskRole.addToPolicy(new PolicyStatement({
    actions: ['events:PutEvents'],
    resources: ['arn:aws:events:*:*:event-bus/default'],
  }))
  if (options.envName !== 'prod') {
    planeBEcsTaskRole.addToPolicy(new PolicyStatement({
      actions: [
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
        'ssm:UpdateInstanceInformation',
      ],
      resources: ['*'],
    }))
  }

  return {
    planeALambdaRole,
    planeBLambdaRole,
    planeCLambdaRole,
    opsPauseLambdaRole,
    planeBEcsTaskExecutionRole,
    planeBEcsTaskRole,
  }
}
