import { type Construct } from 'constructs'
import { Annotations } from 'aws-cdk-lib'
import { ManagedPolicy, Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export type IamResources = {
  planeALambdaRole: Role
  planeBLambdaRole: Role
  planeCLambdaRole: Role
  opsPauseLambdaRole: Role
  planeBEcsTaskExecutionRole: Role
  planeBEcsTaskRole: Role
}

export type IamOptions = {
  envName: string
  sharedSecretArns?: string[]
  sesIdentityArns?: string[]
  snsTopicArns?: string[]
  pinpointAppId?: string
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
  const cloudWatchPolicy = new PolicyStatement({
    actions: ['cloudwatch:PutMetricData'],
    resources: ['*'],
    conditions: {
      StringEquals: { 'cloudwatch:namespace': 'RemitScout' },
    },
  })
  const cloudWatchReadPolicy = new PolicyStatement({
    actions: ['cloudwatch:GetMetricStatistics', 'cloudwatch:GetMetricData'],
    resources: ['*'],
    conditions: {
      StringEquals: { 'cloudwatch:namespace': 'RemitScout' },
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
