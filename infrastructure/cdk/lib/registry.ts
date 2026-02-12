import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Repository, TagStatus } from 'aws-cdk-lib/aws-ecr'
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
  const backendRepository = new Repository(scope, 'BackendRepository', {
    repositoryName: `remit-scout-backend-${options.envName}`,
    imageScanOnPush: true,
    removalPolicy: options.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        maxImageCount: 30,
        rulePriority: 1,
        description: 'Keep last 30 images',
      },
      {
        maxImageAge: Duration.days(90),
        tagStatus: TagStatus.UNTAGGED,
        rulePriority: 2,
        description: 'Delete untagged images after 90 days',
      },
    ],
  })

  return { backendRepository }
}
