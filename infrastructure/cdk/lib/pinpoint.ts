import { CfnOutput } from 'aws-cdk-lib'
import { CfnApp, CfnEmailChannel } from 'aws-cdk-lib/aws-pinpoint'
import type { Construct } from 'constructs'

export type PinpointResources = {
  pinpointAppId: string
}

export type PinpointOptions = {
  envName: string
  enabled?: boolean
  sesIdentityArn?: string
  fromAddress?: string
}

export const createPinpoint = (scope: Construct, options: PinpointOptions): PinpointResources | null => {
  if (options.enabled === false) {
    return null
  }

  const app = new CfnApp(scope, 'PinpointApp', {
    name: `remit-scout-${options.envName}-newsletter`,
  })

  const pinpointAppId = app.ref

  if (options.sesIdentityArn && options.fromAddress) {
    new CfnEmailChannel(scope, 'PinpointEmailChannel', {
      applicationId: pinpointAppId,
      enabled: true,
      fromAddress: options.fromAddress,
      identity: options.sesIdentityArn,
    })
  }

  new CfnOutput(scope, 'PinpointAppId', {
    value: pinpointAppId,
    description: 'Amazon Pinpoint application ID for newsletter campaigns',
  })

  return { pinpointAppId }
}
