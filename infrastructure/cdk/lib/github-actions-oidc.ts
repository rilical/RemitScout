import { Duration, Stack } from 'aws-cdk-lib'
import { OpenIdConnectProvider, type IOpenIdConnectProvider } from 'aws-cdk-lib/aws-iam'
import {
  Effect,
  FederatedPrincipal,
  PolicyDocument,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

type GithubOidcOptions = {
  enabled: boolean
  repoOwner: string
  repoName: string
  providerArn?: string
}

const normalizeRepoPart = (value: string) => value.trim().replace(/^@/, '').replace(/^\/+|\/+$/g, '')

export const createGithubActionsOidcRoles = (scope: Construct, options: GithubOidcOptions) => {
  if (!options.enabled) return

  const repoOwner = normalizeRepoPart(options.repoOwner)
  const repoName = normalizeRepoPart(options.repoName)
  if (!repoOwner || !repoName) {
    throw new Error('GitHub OIDC enabled but repoOwner/repoName are missing.')
  }

  // GitHub Actions OIDC provider (account-level resource).
  // Thumbprint is the well-known GitHub Actions root CA thumbprint.
  const provider: IOpenIdConnectProvider = options.providerArn && options.providerArn.trim()
    ? OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        scope,
        'GithubActionsOidcProvider',
        options.providerArn.trim(),
      )
    : new OpenIdConnectProvider(scope, 'GithubActionsOidcProvider', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
      })

  const account = Stack.of(scope).account

  const policy = new PolicyDocument({
    statements: [
      // CloudFormation read (useful for post-deploy output discovery).
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'cloudformation:Describe*',
          'cloudformation:Get*',
          'cloudformation:List*',
          'cloudformation:DetectStackDrift',
        ],
        resources: ['*'],
      }),
      // ECR push/pull (startup pragmatic).
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ecr:*'],
        resources: ['*'],
      }),
      // ECR auth token must be wildcard.
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
      // Frontend uploads.
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: ['arn:aws:s3:::remit-scout-frontend-*'],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        resources: ['arn:aws:s3:::remit-scout-frontend-*/*'],
      }),
      // CloudFront cache bust.
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetDistribution', 'cloudfront:ListDistributions'],
        resources: ['*'],
      }),
      // Run migrations (ECS task) + inspect task logs.
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'ecs:RunTask',
          'ecs:DescribeTasks',
          'ecs:DescribeTaskDefinition',
          'ecs:ListTasks',
          'ecs:DescribeClusters',
          'ecs:DescribeServices',
        ],
        resources: ['*'],
      }),
      // Allow passing task roles/execution roles.
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [
          `arn:aws:iam::${account}:role/remit-scout-*`,
          `arn:aws:iam::${account}:role/cdk-hnb659fds-*`,
        ],
      }),
    ],
  })

  const makePrincipal = (refPattern: string) =>
    new FederatedPrincipal(
      provider.openIdConnectProviderArn,
      {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${repoOwner}/${repoName}:ref:${refPattern}`,
        },
      },
      'sts:AssumeRoleWithWebIdentity',
    )

  // Three roles, one per promotion stage.
  new Role(scope, 'GithubActionsDeployDevRole', {
    roleName: 'remit-scout-gha-deploy-dev',
    description: `GitHub Actions deploy role (dev) for ${repoOwner}/${repoName}`,
    assumedBy: makePrincipal('refs/heads/develop'),
    inlinePolicies: { DeployPermissions: policy },
    maxSessionDuration: Duration.hours(1),
  })

  new Role(scope, 'GithubActionsDeployStagingRole', {
    roleName: 'remit-scout-gha-deploy-staging',
    description: `GitHub Actions deploy role (staging) for ${repoOwner}/${repoName}`,
    assumedBy: makePrincipal('refs/heads/main'),
    inlinePolicies: { DeployPermissions: policy },
    maxSessionDuration: Duration.hours(1),
  })

  new Role(scope, 'GithubActionsDeployProdRole', {
    roleName: 'remit-scout-gha-deploy-prod',
    description: `GitHub Actions deploy role (prod) for ${repoOwner}/${repoName}`,
    assumedBy: makePrincipal('refs/tags/v*'),
    inlinePolicies: { DeployPermissions: policy },
    maxSessionDuration: Duration.hours(1),
  })
}
