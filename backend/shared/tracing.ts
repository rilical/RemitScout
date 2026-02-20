import {
  trace,
  propagation,
  SpanStatusCode,
  type Tracer,
  type Span,
  type SpanOptions,
  context,
} from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Resource } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray'
import { createLogger } from './logger'
import { config } from './config'

const logger = createLogger('shared.tracing')

let provider: NodeTracerProvider | null = null
let initialized = false

const configValue = (value?: string) => value?.trim() || ''

const resolveOtlpEndpoint = (): string =>
  configValue(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) ||
  configValue(process.env.OTEL_EXPORTER_OTLP_ENDPOINT) ||
  configValue(config.observability.tracing.otlpEndpoint)

const resolveTraceSampleRate = (): number => {
  const raw = configValue(process.env.TRACE_SAMPLE_RATE)
  if (raw) {
    const parsed = Number.parseFloat(raw)
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed
  }
  return config.observability.tracing.sampleRate
}

const parseExporterMode = (): string[] => {
  // Prefer process.env so unit tests can tweak env after importing config/tracing.
  // Config remains the source of truth in production when env is stable at boot.
  const raw = configValue(process.env.TRACING_EXPORTER) || configValue(config.observability.tracing.exporter)
  if (raw) {
    const modes: string[] = []
    for (const value of raw.split(',')) {
      const mode = value.trim().toLowerCase()
      if (!mode) continue
      if (mode === 'both' || mode === 'all') {
        modes.push('xray')
      } else {
        modes.push(mode)
      }
    }
    return Array.from(new Set(modes))
  }

  if (resolveOtlpEndpoint()) {
    return ['xray']
  }

  return ['none']
}

/**
 * Initialize OpenTelemetry tracing for a service.
 * Safe to call multiple times - will only initialize once.
 */
export const initTracing = (serviceName: string): void => {
  if (initialized) {
    logger.debug('tracing_already_initialized', { service_name: serviceName })
    return
  }

  const environment = config.env || 'development'
  const version = config.build.version || 'unknown'
  const nodeEnv = configValue(process.env.NODE_ENV) || 'development'
  const isProdNodeEnv = nodeEnv === 'production'
  const isProdEnvName = environment === 'prod' || environment === 'production'
  const exporterModes = parseExporterMode()
  const requestedXray = exporterModes.includes('xray')
  const requestedOtlp = exporterModes.includes('otlp')
  const otlpEndpoint = resolveOtlpEndpoint()
  const useOtlp = Boolean(otlpEndpoint) && (requestedXray || requestedOtlp)

  try {
    if (exporterModes.includes('none')) {
      logger.info('tracing_disabled', { service_name: serviceName })
      return
    }

    const resource = new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: version,
      'deployment.environment': environment,
    })

    provider = new NodeTracerProvider({ resource })

    const Processor = isProdNodeEnv || isProdEnvName ? BatchSpanProcessor : SimpleSpanProcessor

    if (exporterModes.includes('jaeger')) {
      logger.warn('tracing_exporter_unsupported', {
        service_name: serviceName,
        exporter: 'jaeger',
      })
    }

    if ((requestedXray || requestedOtlp) && !otlpEndpoint) {
      logger.warn('tracing_missing_otlp_endpoint', {
        service_name: serviceName,
      })
    }

    if (useOtlp && otlpEndpoint) {
      const exporter = new OTLPTraceExporter({ url: otlpEndpoint })
      provider.addSpanProcessor(new Processor(exporter))
    }

    if (!useOtlp) {
      logger.warn('tracing_no_exporters', { service_name: serviceName, exporters: exporterModes })
      return
    }

    provider.register({
      propagator: requestedXray ? new AWSXRayPropagator() : undefined,
    })

    initialized = true
    logger.info('tracing_initialized', {
      service_name: serviceName,
      environment,
      version,
      exporters: exporterModes,
      otlp_endpoint: useOtlp ? otlpEndpoint : undefined,
    })
  } catch (error) {
    // Don't crash if Jaeger is unavailable
    logger.warn('tracing_init_failed', {
      service_name: serviceName,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Get a tracer instance for a specific component.
 */
export const getTracer = (name: string): Tracer => {
  return trace.getTracer(name)
}

/**
 * Start a new span and execute a function within its context.
 * Automatically handles span lifecycle and error recording.
 */
export const startSpan = async <T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: SpanOptions,
): Promise<T> => {
  if (isHealthCheck(name, options?.attributes)) {
    if (config.observability.tracing.filterHealthChecks) {
      return await fn({} as Span)
    }
  }

  if (!shouldSampleTrace()) {
    return await fn({} as Span)
  }

  const tracer = getTracer('remit-scout')
  const span = tracer.startSpan(name, options)

  addAWSContextAttributes()

  totalSpans++

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () =>
      fn(span),
    )
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    errorSpans++
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    })
    if (error instanceof Error) {
      span.recordException(error)
    }
    throw error
  } finally {
    span.end()
  }
}

/**
 * Create a child span from the current active span.
 * Useful for tracing sub-operations within a parent span.
 */
export const startChildSpan = async <T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: SpanOptions,
): Promise<T> => {
  if (isHealthCheck(name, options?.attributes)) {
    if (config.observability.tracing.filterHealthChecks) {
      return await fn({} as Span)
    }
  }

  const tracer = getTracer('remit-scout')

  const spanOptions: SpanOptions = {
    ...options,
  }

  const span = tracer.startSpan(name, spanOptions, context.active())

  addAWSContextAttributes()

  totalSpans++

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () =>
      fn(span),
    )
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    errorSpans++
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    })
    if (error instanceof Error) {
      span.recordException(error)
    }
    throw error
  } finally {
    span.end()
  }
}

/**
 * Get the current active span, if any.
 */
export const getCurrentSpan = (): Span | undefined => {
  return trace.getSpan(context.active())
}

export type TraceCarrier = Record<string, string>

export const injectTraceContextToCarrier = (
  carrier: TraceCarrier = {},
): TraceCarrier => {
  propagation.inject(context.active(), carrier)
  return carrier
}

export const extractTraceContextFromCarrier = (
  carrier: TraceCarrier,
): ReturnType<typeof context.active> => {
  return propagation.extract(context.active(), carrier)
}

/**
 * Add attributes to the current active span.
 */
export const addSpanAttributes = (
  attributes: Record<string, string | number | boolean>,
): void => {
  const span = getCurrentSpan()
  if (span) {
    span.setAttributes(attributes)
  }
}

/**
 * Add AWS context attributes to the current active span.
 */
export const addAWSContextAttributes = (): void => {
  const span = getCurrentSpan()
  if (!span) return

  const attributes: Record<string, string> = {}

  if (config.runtime.lambdaFunctionName) {
    attributes['aws.lambda.function_name'] = config.runtime.lambdaFunctionName
  }

  if (config.runtime.isEcs) {
    if (config.runtime.ecsTaskArn) {
      const taskId = config.runtime.ecsTaskArn.split('/').pop() || ''
      attributes['aws.ecs.task_id'] = taskId
    }
    if (config.runtime.ecsContainerName) {
      attributes['aws.ecs.container_id'] = config.runtime.ecsContainerName
    }
  }

  if (config.aws.region) {
    attributes['aws.region'] = config.aws.region
  }

  if (config.runtime.awsAccountId) {
    attributes['aws.account_id'] = config.runtime.awsAccountId
  } else if (config.runtime.lambdaFunctionArn) {
    const accountMatch = config.runtime.lambdaFunctionArn.match(/^arn:aws:lambda:.*?:(.*?):/)
    if (accountMatch) {
      attributes['aws.account_id'] = accountMatch[1]
    }
  }

  if (Object.keys(attributes).length > 0) {
    span.setAttributes(attributes)
  }
}

let errorRate = 0
let totalSpans = 0
let errorSpans = 0
const ERROR_RATE_WINDOW = 100

export const resetTracingState = (): void => {
  initialized = false
  provider = null
  errorRate = 0
  totalSpans = 0
  errorSpans = 0
}

const shouldSampleTrace = (): boolean => {
  const sampleRate = resolveTraceSampleRate()
  if (Number.isFinite(sampleRate) && sampleRate >= 0 && sampleRate <= 1) {
    return Math.random() < sampleRate
  }

  if (totalSpans > ERROR_RATE_WINDOW) {
    errorRate = errorSpans / totalSpans
    totalSpans = 0
    errorSpans = 0
  }

  if (errorRate > 0.1) {
    return true
  }

  if (errorRate > 0.05) {
    return Math.random() < 0.5
  }

  return Math.random() < 0.1
}

const isHealthCheck = (spanName: string, attributes?: Record<string, any>): boolean => {
  if (spanName.includes('health') || spanName.includes('ping') || spanName.includes('status')) {
    return true
  }
  if (attributes?.route?.includes('/health') || attributes?.route?.includes('/ping')) {
    return true
  }
  return false
}

/**
 * Record an event on the current active span.
 */
export const addSpanEvent = (
  name: string,
  attributes?: Record<string, string | number | boolean>,
): void => {
  const span = getCurrentSpan()
  if (span) {
    span.addEvent(name, attributes)
  }
}

/**
 * Shutdown the tracer provider gracefully.
 */
export const shutdownTracing = async (): Promise<void> => {
  if (provider) {
    try {
      await provider.shutdown()
      logger.info('tracing_shutdown_complete')
    } catch (error) {
      logger.warn('tracing_shutdown_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

export { SpanStatusCode }
