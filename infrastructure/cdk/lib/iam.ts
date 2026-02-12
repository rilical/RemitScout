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
  } else if (options.envName === 'dev') {
    secretsPolicyResources.push(
      'arn:aws:secretsmanager:us-east-1:716156543157:secret:rs-development*',
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
  const cloudWatchPolicy = new PolicyStatement({
    actions: ['cloudwatch:PutMetricData'],
    resources: ['*'],
  })
  const cloudWatchReadPolicy = new PolicyStatement({
    actions: ['cloudwatch:GetMetricStatistics', 'cloudwatch:GetMetricData'],
    resources: ['*'],
  })
  const xrayPolicy = new PolicyStatement({
    actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
    resources: ['*'],
  })
  const sesPolicyResources =
    options.envName === 'dev'
      ? ['*']
      : (
        options.sesIdentityArns && options.sesIdentityArns.length > 0
          ? options.sesIdentityArns
          : ['*']
      )
  const snsPolicyResources =
    options.snsTopicArns && options.snsTopicArns.length > 0
      ? options.snsTopicArns
      : ['*']
  if (options.envName !== 'dev') {
    if (!options.sesIdentityArns || options.sesIdentityArns.length === 0) {
      Annotations.of(scope).addWarning(
        'SES permissions are wildcarded. Provide sesIdentityArns to scope send permissions.',
      )
    }
    if (!options.snsTopicArns || options.snsTopicArns.length === 0) {
      Annotations.of(scope).addWarning(
        'SNS permissions are wildcarded. Provide snsTopicArns to scope publish permissions.',
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
