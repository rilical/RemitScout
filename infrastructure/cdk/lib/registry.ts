import { RemovalPolicy } from 'aws-cdk-lib'
import { Repository } from 'aws-cdk-lib/aws-ecr'
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
        maxImageCount: 25,
        description: 'Retain the last 25 images.',
      },
    ],
  })

  return { backendRepository }
}
