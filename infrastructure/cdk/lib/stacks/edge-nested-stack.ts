import { NestedStack } from 'aws-cdk-lib'
import type { Construct } from 'constructs'

import { createFrontend } from '../frontend'
import type { EdgeNestedStackProps, EdgeResources } from './contracts'

export class EdgeNestedStack extends NestedStack {
  public readonly resources: EdgeResources

  constructor(scope: Construct, id: string, props: EdgeNestedStackProps) {
    super(scope, id, props)

    const api = props.api

    const frontend = createFrontend(this, {
      envName: props.envName,
      planeAWaf: api.planeAWaf,
      planeAApiEndpoint: api.planeAApi.apiEndpoint,
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

    if (props.pinpointAppId) {
      api.planeAFunction.addEnvironment('PINPOINT_APP_ID', props.pinpointAppId)
      api.planeAFunction.addEnvironment('PINPOINT_ENABLED', '1')
    }

    this.resources = {
      api,
      frontend,
    }
  }
}
