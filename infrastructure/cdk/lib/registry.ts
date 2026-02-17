import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Repository, TagMutability, TagStatus } from 'aws-cdk-lib/aws-ecr'
import type { Construct } from 'constructs'

export type RegistryResources = {
  backendRepository: Repository
}

export type RegistryOptions = {
  envName: string
}

export const createRegistry = (
  scope: Construct,
  options: RegistryOptions,
): RegistryResources => {
  const isProd = options.envName === 'prod'

  const backendRepository = new Repository(scope, 'BackendRepository', {
    repositoryName: `remit-scout-backend-${options.envName}`,
    imageScanOnPush: true,
    imageTagMutability: isProd ? TagMutability.IMMUTABLE : undefined,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        maxImageAge: Duration.days(90),
        tagStatus: TagStatus.UNTAGGED,
        rulePriority: 1,
        description: 'Delete untagged images after 90 days',
      },
      {
        maxImageCount: 30,
        tagStatus: TagStatus.ANY,
        rulePriority: 2,
        description: 'Keep last 30 images',
      },
    ],
  })

  return { backendRepository }
}
