import { NestedStack } from 'aws-cdk-lib'
import type { Construct } from 'constructs'

import { createCache } from '../cache'
import { createDatabase } from '../database'
import { createGithubActionsOidcRoles } from '../github-actions-oidc'
import { createIam } from '../iam'
import { createPinpoint } from '../pinpoint'
import { createQueues } from '../queues'
import { createRegistry } from '../registry'
import { createStorage } from '../storage'
import type { FoundationNestedStackProps, FoundationResources } from './contracts'

export class FoundationNestedStack extends NestedStack {
  public readonly resources: FoundationResources

  constructor(scope: Construct, id: string, props: FoundationNestedStackProps) {
    super(scope, id, props)

    const networking = props.networking

    const pinpoint = props.pinpointEnabled
      ? createPinpoint(this, {
          envName: props.envName,
          enabled: true,
          sesIdentityArn: props.sesIdentityArns[0],
          fromAddress: props.pinpointFromAddress,
        })
      : null

    const iam = createIam(this, {
      envName: props.envName,
      sharedSecretArns: [props.sharedSecretArn],
      sesIdentityArns: props.sesIdentityArns,
      snsTopicArns: props.snsTopicArns,
      pinpointAppId: pinpoint?.pinpointAppId,
    })

    const registry = createRegistry(this, {
      envName: props.envName,
      importExistingBackendRepository: props.importExistingBackendRepository,
    })

    createGithubActionsOidcRoles(this, {
      enabled: props.enableGithubActionsOidc,
      repoOwner: props.githubRepoOwner,
      repoName: props.githubRepoName,
      providerArn: props.githubActionsOidcProviderArn,
    })

    const database = createDatabase(this, {
      envName: props.envName,
      vpc: networking.vpc,
      dbSecurityGroup: networking.dbSecurityGroup,
      enableProxy: props.enableDbProxy,
    })

    const cache = createCache(this, {
      envName: props.envName,
      vpc: networking.vpc,
      redisSecurityGroup: networking.redisSecurityGroup,
      redisAuthMode: props.redisAuthMode,
    })

    const storage = createStorage(this, {
      envName: props.envName,
      exportsPrefix: props.exportsPrefix,
    })

    const queues = createQueues(this, {
      envName: props.envName,
    })

    const redisHost = cache.replicationGroup.attrPrimaryEndPointAddress
    const redisPort = cache.replicationGroup.attrPrimaryEndPointPort
    const redisUrl = props.redisAuthMode === 'required'
      ? `rediss://:${cache.redisAuthToken.toString()}@${redisHost}:${redisPort}`
      : `rediss://${redisHost}:${redisPort}`

    this.resources = {
      networking,
      iam,
      registry,
      database,
      cache,
      storage,
      queues,
      pinpoint,
      redisUrl,
    }
  }
}
