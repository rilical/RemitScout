import { type Construct } from 'constructs'
import { Cluster } from 'aws-cdk-lib/aws-ecs'
import type { Vpc } from 'aws-cdk-lib/aws-ec2'

import type { IamResources } from './iam'

export type ComputeOptions = {
  envName: string
  vpc: Vpc
  roles: IamResources
}

export type ComputeResources = {
  cluster: Cluster
}

export const createCompute = (scope: Construct, options: ComputeOptions): ComputeResources => {
  const cluster = new Cluster(scope, 'RemitScoutCluster', {
    vpc: options.vpc,
    clusterName: `remit-scout-${options.envName}`,
    enableFargateCapacityProviders: true,
  })

  return { cluster }
}
