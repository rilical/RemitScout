import { Counter } from 'prom-client'
import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { metricsRegistry } from './metrics-registry'

const cacheHits = new Counter({
  name: 'cache_hit_total',
  help: 'Total cache hits by namespace and layer.',
  labelNames: ['namespace', 'layer'],
  registers: [metricsRegistry],
})

const cacheMisses = new Counter({
  name: 'cache_miss_total',
  help: 'Total cache misses by namespace and layer.',
  labelNames: ['namespace', 'layer'],
  registers: [metricsRegistry],
})

const normalizeNamespace = (value?: string): string => {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : 'default'
}

const normalizeLayer = (value?: string): string => {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : 'unknown'
}

export const trackCacheHit = (namespace: string | undefined, layer: string): void => {
  const ns = normalizeNamespace(namespace)
  const layerName = normalizeLayer(layer)
  cacheHits.inc({ namespace: ns, layer: layerName })
  recordCloudWatchMetric({
    name: 'cache_hit',
    value: 1,
    unit: 'Count',
    dimensions: { namespace: ns, layer: layerName },
  })
}

export const trackCacheMiss = (namespace: string | undefined, layer: string): void => {
  const ns = normalizeNamespace(namespace)
  const layerName = normalizeLayer(layer)
  cacheMisses.inc({ namespace: ns, layer: layerName })
  recordCloudWatchMetric({
    name: 'cache_miss',
    value: 1,
    unit: 'Count',
    dimensions: { namespace: ns, layer: layerName },
  })
}
