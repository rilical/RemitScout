import { context, trace } from '@opentelemetry/api'

export type TraceCorrelation = {
  traceId: string | null
  parentSpanId: string | null
  correlationId: string | null
  sampled: boolean | null
}

export type CorrelationEnvelope = {
  trace: TraceCorrelation
}

export const getCurrentTraceCorrelation = (correlationId?: string): TraceCorrelation => {
  const span = trace.getSpan(context.active())
  const spanContext = span?.spanContext()
  const sampled = spanContext ? (spanContext.traceFlags & 0x1) === 1 : null

  return {
    traceId: spanContext?.traceId ?? null,
    parentSpanId: spanContext?.spanId ?? null,
    correlationId: correlationId ?? spanContext?.traceId ?? null,
    sampled,
  }
}
