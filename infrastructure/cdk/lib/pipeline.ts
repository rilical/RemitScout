import { Duration } from 'aws-cdk-lib'
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline'
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
  ManualApprovalAction,
} from 'aws-cdk-lib/aws-codepipeline-actions'
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
  type BuildEnvironmentVariable,
} from 'aws-cdk-lib/aws-codebuild'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import type { Repository } from 'aws-cdk-lib/aws-ecr'
import type { Bucket } from 'aws-cdk-lib/aws-s3'
import type { Distribution } from 'aws-cdk-lib/aws-cloudfront'
import type { Construct } from 'constructs'

export type PipelineOptions = {
  envName: string
  connectionArn?: string
  repoOwner?: string
  repoName?: string
  repoBranch?: string
  enableDeploy?: boolean
  backendRepository?: Repository
  frontendBucket?: Bucket
  frontendDistribution?: Distribution
  planeACloudFrontDomain?: string
  publicSupabaseUrl?: string
  publicSupabaseAnonKey?: string
}

export type PipelineResources = {
  pipeline: Pipeline
  buildProject: PipelineProject
  deployProject?: PipelineProject
}

export const createPipeline = (
  scope: Construct,
  options: PipelineOptions,
): PipelineResources | null => {
  if (!options.connectionArn || !options.repoOwner || !options.repoName || !options.backendRepository) {
    return null
  }

  const backendRepository = options.backendRepository

  const sourceOutput = new Artifact('Source')
  const buildOutput = new Artifact('Build')

  const pipeline = new Pipeline(scope, 'RemitScoutPipeline', {
    pipelineName: `remit-scout-${options.envName}`,
  })

  pipeline.addStage({
    stageName: 'Source',
    actions: [
      new CodeStarConnectionsSourceAction({
        actionName: 'GitHub_Source',
        connectionArn: options.connectionArn,
        owner: options.repoOwner,
        repo: options.repoName,
        branch: options.repoBranch ?? 'main',
        output: sourceOutput,
      }),
    ],
  })

  const buildEnvVars: Record<string, BuildEnvironmentVariable> = {
    ENV_NAME: { value: options.envName },
    ECR_REPO_URI: { value: backendRepository.repositoryUri },
  }
  if (options.frontendBucket) {
    buildEnvVars.FRONTEND_BUCKET_NAME = { value: options.frontendBucket.bucketName }
  }
  if (options.frontendDistribution) {
    buildEnvVars.FRONTEND_DISTRIBUTION_ID = { value: options.frontendDistribution.distributionId }
  }
  if (options.planeACloudFrontDomain) {
    buildEnvVars.PLANE_A_CLOUDFRONT_DOMAIN = { value: options.planeACloudFrontDomain }
  }
  if (options.publicSupabaseUrl) {
    buildEnvVars.PUBLIC_SUPABASE_URL = { value: options.publicSupabaseUrl }
  }
  if (options.publicSupabaseAnonKey) {
    buildEnvVars.PUBLIC_SUPABASE_ANON_KEY = { value: options.publicSupabaseAnonKey }
  }

  const buildProject = new PipelineProject(scope, 'RemitScoutBuildProject', {
    environment: {
      buildImage: LinuxBuildImage.STANDARD_7_0,
      privileged: true,
    },
    environmentVariables: buildEnvVars,
    buildSpec: BuildSpec.fromObject({
      version: '0.2',
      phases: {
        install: {
          'runtime-versions': { nodejs: 20 },
          commands: [
            'corepack enable',
            'pnpm --version',
            'pnpm install --frozen-lockfile',
          ],
        },
        pre_build: {
          commands: [
            'IMAGE_TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION:0:7}',
            'echo "IMAGE_TAG=$IMAGE_TAG" > image.env',
            'aws --version',
            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI',
          ],
        },
        build: {
          commands: [
            'docker build -f backend/Dockerfile --build-arg BUILD_VERSION=$IMAGE_TAG -t $ECR_REPO_URI:$IMAGE_TAG .',
            'docker push $ECR_REPO_URI:$IMAGE_TAG',
            'pnpm -C backend build',
            'if [ -n "$FRONTEND_BUCKET_NAME" ]; then',
            '  echo "Building frontend..."',
            '  export PUBLIC_API_BASE=${PLANE_A_CLOUDFRONT_DOMAIN:+https://$PLANE_A_CLOUDFRONT_DOMAIN/api/v1}',
            '  export PUBLIC_SITE_URL=${FRONTEND_DISTRIBUTION_ID:+https://d$FRONTEND_DISTRIBUTION_ID.cloudfront.net}',
            '  export PUBLIC_IMAGE_BASE=${FRONTEND_DISTRIBUTION_ID:+https://d$FRONTEND_DISTRIBUTION_ID.cloudfront.net/images}',
            '  export PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL:-}',
            '  export PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY:-}',
            '  pnpm -C frontend build',
            '  pnpm -C frontend generate',
            '  echo "Frontend build complete"',
            'fi',
            'pnpm -C infrastructure/cdk synth -c env=$ENV_NAME -c backendImageTag=$IMAGE_TAG',
          ],
        },
      },
      artifacts: {
        files: [
          'infrastructure/cdk/cdk.out/**/*',
          'backend/dist/**/*',
          'frontend/.output/**/*',
          'image.env',
        ],
      },
      cache: {
        paths: ['.pnpm-store/**/*', 'node_modules/**/*'],
      },
    }),
    timeout: Duration.minutes(30),
  })

  backendRepository.grantPullPush(buildProject)

  if (options.frontendBucket) {
    options.frontendBucket.grantReadWrite(buildProject)
  }

  pipeline.addStage({
    stageName: 'Build',
    actions: [
      new CodeBuildAction({
        actionName: 'Build',
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput],
      }),
    ],
  })

  let deployProject: PipelineProject | undefined
  if (options.enableDeploy) {
    deployProject = new PipelineProject(scope, 'RemitScoutDeployProject', {
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
        privileged: false,
      },
      environmentVariables: {
        ENV_NAME: { value: options.envName },
      },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: 20 },
            commands: [
              'corepack enable',
              'pnpm --version',
              'pnpm install --frozen-lockfile',
            ],
          },
          build: {
            commands: [
              'if [ -f image.env ]; then source image.env; fi',
              'pnpm -C infrastructure/cdk deploy -c env=$ENV_NAME -c backendImageTag=$IMAGE_TAG --require-approval never',
              'if [ -n "$FRONTEND_BUCKET_NAME" ] && [ -n "$FRONTEND_DISTRIBUTION_ID" ]; then',
              '  echo "Deploying frontend to S3..."',
              '  aws s3 sync frontend/.output/public s3://$FRONTEND_BUCKET_NAME --delete --cache-control "public, max-age=31536000, immutable" --exclude "*.html" --exclude "*.json"',
              '  aws s3 sync frontend/.output/public s3://$FRONTEND_BUCKET_NAME --delete --cache-control "no-cache, no-store, must-revalidate" --include "*.html" --include "*.json"',
              '  echo "Invalidating CloudFront cache..."',
              '  aws cloudfront create-invalidation --distribution-id $FRONTEND_DISTRIBUTION_ID --paths "/*"',
              '  echo "Frontend deployment complete"',
              'fi',
            ],
          },
        },
      }),
      timeout: Duration.minutes(45),
    })

    deployProject.addToRolePolicy(
      new PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: ['*'],
      }),
    )

    pipeline.addStage({
      stageName: 'Approve',
      actions: [new ManualApprovalAction({ actionName: 'Manual_Approval' })],
    })

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new CodeBuildAction({
          actionName: 'Deploy',
          project: deployProject,
          input: buildOutput,
        }),
      ],
    })
  }

  if (options.frontendBucket && deployProject) {
    options.frontendBucket.grantReadWrite(deployProject)
  }

  if (options.frontendDistribution && deployProject) {
    deployProject.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetInvalidation',
          'cloudfront:ListInvalidations',
        ],
        resources: [
          `arn:aws:cloudfront::*:distribution/${options.frontendDistribution.distributionId}`,
        ],
      }),
    )
  }

  return { pipeline, buildProject, deployProject }
}
