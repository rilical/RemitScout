import { Registry } from 'prom-client'

export const metricsRegistry = new Registry()

export const getMetrics = async (): Promise<string> => metricsRegistry.metrics()
export const metricsContentType = metricsRegistry.contentType
