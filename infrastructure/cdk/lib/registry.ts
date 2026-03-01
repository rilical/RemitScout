import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Repository, TagMutability, TagStatus, type IRepository } from 'aws-cdk-lib/aws-ecr'
import type { Construct } from 'constructs'

export type RegistryResources = {
  backendRepository: IRepository
}

export type RegistryOptions = {
  envName: string
  importExistingBackendRepository?: boolean
}

export const createRegistry = (
  scope: Construct,
  options: RegistryOptions,
): RegistryResources => {
  const isProd = options.envName === 'prod'
  const isStaging = options.envName === 'staging'
  const isProtectedEnv = isProd || isStaging
  const repositoryName = `remit-scout-backend-${options.envName}`
  const importExisting = options.importExistingBackendRepository === true

  const backendRepository = importExisting
    ? Repository.fromRepositoryName(scope, 'BackendRepositoryImported', repositoryName)
    : new Repository(scope, 'BackendRepository', {
        repositoryName,
        imageScanOnPush: true,
        imageTagMutability: isProtectedEnv ? TagMutability.IMMUTABLE : undefined,
        removalPolicy: isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
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
