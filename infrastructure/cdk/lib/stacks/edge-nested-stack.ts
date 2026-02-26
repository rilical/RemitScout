import { NestedStack } from 'aws-cdk-lib'
import type { Construct } from 'constructs'

import { createApi } from '../api'
import { createFrontend } from '../frontend'
import type { EdgeNestedStackProps, EdgeResources } from './contracts'

export class EdgeNestedStack extends NestedStack {
  public readonly resources: EdgeResources

  constructor(scope: Construct, id: string, props: EdgeNestedStackProps) {
    super(scope, id, props)

    const api = createApi(this, {
      envName: props.envName,
      vpc: props.foundation.networking.vpc,
      roles: props.foundation.iam,
      planeASecurityGroup: props.foundation.networking.planeASecurityGroup,
      planeCSecurityGroup: props.foundation.networking.planeCSecurityGroup,
      ...props.apiOptions,
    })

    const frontend = createFrontend(this, {
      envName: props.envName,
      planeAWaf: api.planeAWaf,
      planeACloudFrontDomain: api.planeACloudFront?.distributionDomainName,
      ...props.frontendOptions,
    })

    const frontendUrlFromStack = frontend
      ? (props.frontendOptions.frontendDomainName
          ? `https://${props.frontendOptions.frontendDomainName}`
          : `https://${frontend.distribution.distributionDomainName}`)
      : undefined

    if (!props.defaultFrontendBaseUrl && frontendUrlFromStack) {
      api.planeAFunction.addEnvironment('FRONTEND_BASE_URL', frontendUrlFromStack)
    }

    if (props.foundation.pinpoint) {
      api.planeAFunction.addEnvironment('PINPOINT_APP_ID', props.foundation.pinpoint.pinpointAppId)
      api.planeAFunction.addEnvironment('PINPOINT_ENABLED', '1')
    }

    this.resources = {
      api,
      frontend,
    }
  }
}
