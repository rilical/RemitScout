import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { createLogger } from './logger'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.eventbridge-cache-refresh')

let eventBridgeClient: EventBridgeClient | null = null

const getEventBridgeClient = (): EventBridgeClient => {
  if (!eventBridgeClient) {
    eventBridgeClient = new EventBridgeClient({})
  }
  return eventBridgeClient
}

/**
 * Triggers EventBridge event to refresh cache.
 * EventBridge rules can be configured to trigger Lambda functions or other services.
 */
export const triggerCacheRefresh = async (
  cacheType: 'fx-rate' | 'pulse-cache' | 'queue-depth',
  keys?: string[],
): Promise<void> => {
  try {
    const eventBusName = process.env.CACHE_REFRESH_EVENT_BUS_NAME || 'default'
    const client = getEventBridgeClient()

    await client.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'remitscout.cache',
            DetailType: 'Cache Refresh Request',
            Detail: JSON.stringify({
              cacheType,
              keys: keys || [],
              timestamp: new Date().toISOString(),
            }),
            EventBusName: eventBusName !== 'default' ? eventBusName : undefined,
          },
        ],
      }),
    )

    logger.info('cache_refresh_triggered', {
      cache_type: cacheType,
      keys: keys?.length || 0,
    })
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.warn('cache_refresh_trigger_failed', {
      cache_type: cacheType,
      error: message,
    })
  }
}

/**
 * Triggers FX rate cache refresh via EventBridge.
 */
export const triggerFxRateCacheRefresh = async (): Promise<void> => {
  await triggerCacheRefresh('fx-rate')
}

/**
 * Triggers Pulse cache refresh via EventBridge.
 */
export const triggerPulseCacheRefresh = async (): Promise<void> => {
  await triggerCacheRefresh('pulse-cache')
}

/**
 * Triggers queue depth cache refresh via EventBridge.
 */
export const triggerQueueDepthCacheRefresh = async (): Promise<void> => {
  await triggerCacheRefresh('queue-depth')
}


