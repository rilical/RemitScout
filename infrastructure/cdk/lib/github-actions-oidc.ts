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
        thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'], // pragma: allowlist secret
      })

  const account = Stack.of(scope).account
  const region = Stack.of(scope).region
  const repoSubjects = Array.from(new Set([
    `${repoOwner}/${repoName}`,
    `${repoOwner.toLowerCase()}/${repoName.toLowerCase()}`,
  ]))

  const buildDeployPolicy = (targetEnv: 'dev' | 'staging' | 'prod') => {
    const envPrefix = `remit-scout-${targetEnv}`
    const ecrRepositoryResource = `arn:aws:ecr:${region}:${account}:repository/remit-scout-backend-${targetEnv}`
    const s3FrontendBucketResource = `arn:aws:s3:::remit-scout-frontend-${targetEnv}*`
    const ssmResource = `arn:aws:ssm:${region}:${account}:parameter/remit-scout/${targetEnv}/*`
    const eventRuleResource = `arn:aws:events:${region}:${account}:rule/${envPrefix}*`
    const lambdaResource = `arn:aws:lambda:${region}:${account}:function:${envPrefix}*OpsPauseControllerFuncti*`
    const secretResource = `arn:aws:secretsmanager:${region}:${account}:secret:*${targetEnv}*`

    return new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'cloudformation:Describe*',
            'cloudformation:Get*',
            'cloudformation:List*',
            'cloudformation:DetectStackDrift',
            'cloudformation:CreateChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:CreateStack',
            'cloudformation:UpdateStack',
            'cloudformation:CancelUpdateStack',
            'cloudformation:ContinueUpdateRollback',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'ecr:BatchCheckLayerAvailability',
            'ecr:BatchDeleteImage',
            'ecr:BatchGetImage',
            'ecr:CompleteLayerUpload',
            'ecr:CreateRepository',
            'ecr:DescribeImageScanFindings',
            'ecr:DescribeImages',
            'ecr:DescribeRepositories',
            'ecr:GetDownloadUrlForLayer',
            'ecr:GetLifecyclePolicy',
            'ecr:GetRepositoryPolicy',
            'ecr:InitiateLayerUpload',
            'ecr:ListImages',
            'ecr:ListTagsForResource',
            'ecr:PutImage',
            'ecr:UploadLayerPart',
            'ecr:PutImageScanningConfiguration',
            'ecr:StartImageScan',
          ],
          resources: [ecrRepositoryResource],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['ecr:GetAuthorizationToken'],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [s3FrontendBucketResource],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [`${s3FrontendBucketResource}/*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetDistribution', 'cloudfront:ListDistributions'],
          resources: [`arn:aws:cloudfront::${account}:distribution/*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['ssm:GetParameter', 'ssm:PutParameter', 'ssm:DeleteParameter'],
          resources: [ssmResource],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'ecs:RegisterTaskDefinition',
            'ecs:DeregisterTaskDefinition',
            'ecs:RunTask',
            'ecs:ListServices',
            'ecs:DescribeTasks',
            'ecs:DescribeTaskDefinition',
            'ecs:ListTasks',
            'ecs:DescribeClusters',
            'ecs:DescribeServices',
            'ecs:UpdateService',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['iam:PassRole'],
          resources: [
            `arn:aws:iam::${account}:role/${envPrefix}*`,
            `arn:aws:iam::${account}:role/cdk-hnb659fds-*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'rds:DescribeDBClusters',
            'rds:StartDBCluster',
          ],
          resources: [
            `arn:aws:rds:${region}:${account}:cluster:${envPrefix}*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          resources: [secretResource],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['events:ListRules'],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['events:EnableRule', 'events:DisableRule'],
          resources: [eventRuleResource],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
            'logs:GetLogEvents',
            'logs:FilterLogEvents',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['lambda:ListFunctions'],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['lambda:InvokeFunction'],
          resources: [lambdaResource, `${lambdaResource}:*`],
        }),
      ],
    })
  }

  const makePrincipal = (subjectPatterns: string[]) =>
    new FederatedPrincipal(
      provider.openIdConnectProviderArn,
      {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': subjectPatterns.flatMap((subjectPattern) =>
            repoSubjects.map((repoSubject) => `repo:${repoSubject}:${subjectPattern}`),
          ),
        },
      },
      'sts:AssumeRoleWithWebIdentity',
    )

  // Three roles, one per promotion stage.
  new Role(scope, 'GithubActionsDeployDevRole', {
    roleName: 'remit-scout-gha-deploy-dev',
    description: `GitHub Actions deploy role (dev) for ${repoOwner}/${repoName}`,
    assumedBy: makePrincipal([
      'environment:dev',
      'ref:refs/heads/develop',
    ]),
    inlinePolicies: { DeployPermissions: buildDeployPolicy('dev') },
    maxSessionDuration: Duration.hours(6),
  })

  new Role(scope, 'GithubActionsDeployStagingRole', {
    roleName: 'remit-scout-gha-deploy-staging',
    description: `GitHub Actions deploy role (staging) for ${repoOwner}/${repoName}`,
    assumedBy: makePrincipal([
      'environment:staging',
      'ref:refs/heads/develop',
      'ref:refs/heads/main',
      'ref:refs/heads/staging',
    ]),
    inlinePolicies: { DeployPermissions: buildDeployPolicy('staging') },
    maxSessionDuration: Duration.hours(6),
  })

  new Role(scope, 'GithubActionsDeployProdRole', {
    roleName: 'remit-scout-gha-deploy-prod',
    description: `GitHub Actions deploy role (prod) for ${repoOwner}/${repoName}`,
    assumedBy: makePrincipal([
      'environment:prod',
      'ref:refs/tags/v*.*.*',
    ]),
    inlinePolicies: { DeployPermissions: buildDeployPolicy('prod') },
    maxSessionDuration: Duration.hours(6),
  })
}
