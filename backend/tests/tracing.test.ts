import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  initTracing,
  getTracer,
  startSpan,
  startChildSpan,
  getCurrentSpan,
  addSpanAttributes,
  addSpanEvent,
  shutdownTracing,
  SpanStatusCode,
  resetTracingState,
} from '../shared/tracing'
import * as opentelemetry from '@opentelemetry/api'
import * as sdkTraceNode from '@opentelemetry/sdk-trace-node'
import * as sdkTraceBase from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: vi.fn().mockImplementation(() => ({
    addSpanProcessor: vi.fn(),
    register: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@opentelemetry/sdk-trace-base', () => ({
  SimpleSpanProcessor: vi.fn(),
  BatchSpanProcessor: vi.fn(),
}))

vi.mock('@opentelemetry/resources', () => ({
  Resource: vi.fn().mockImplementation((attrs) => attrs),
}))

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('@opentelemetry/propagator-aws-xray', () => ({
  AWSXRayPropagator: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(),
    getSpan: vi.fn(),
    setSpan: vi.fn(),
  },
  context: {
    active: vi.fn(),
    with: vi.fn(),
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
  },
}))

describe('tracing', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.JAEGER_ENDPOINT
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://otel.local/v1/traces'
    process.env.TRACING_EXPORTER = 'xray'
    process.env.TRACE_SAMPLE_RATE = '1'
    resetTracingState()
    vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(undefined)
    vi.mocked(opentelemetry.trace.getTracer).mockReturnValue({} as any)
    vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)
    vi.mocked(opentelemetry.context.with).mockImplementation((_ctx, fn) => fn())
    vi.mocked(opentelemetry.trace.setSpan).mockReturnValue({} as any)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initTracing', () => {
    it('initializes tracing with default endpoint', () => {
      initTracing('test-service')

      expect(vi.mocked(sdkTraceNode.NodeTracerProvider)).toHaveBeenCalled()
    })

    it('uses custom OTLP endpoint when provided', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://custom:4318/v1/traces'
      initTracing('test-service')

      expect(vi.mocked(OTLPTraceExporter)).toHaveBeenCalledWith({
        url: 'http://custom:4318/v1/traces',
      })
    })

    it('uses BatchSpanProcessor in production', () => {
      process.env.NODE_ENV = 'production'
      initTracing('test-service')

      expect(vi.mocked(sdkTraceBase.BatchSpanProcessor)).toHaveBeenCalled()
    })

    it('uses SimpleSpanProcessor in development', () => {
      process.env.NODE_ENV = 'development'
      initTracing('test-service')

      expect(vi.mocked(sdkTraceBase.SimpleSpanProcessor)).toHaveBeenCalled()
    })

    it('only initializes once', () => {
      initTracing('test-service')
      initTracing('test-service-2')

      expect(vi.mocked(sdkTraceNode.NodeTracerProvider)).toHaveBeenCalledTimes(1)
    })

    it('handles initialization errors gracefully', () => {
      vi.mocked(sdkTraceNode.NodeTracerProvider).mockImplementation(() => {
        throw new Error('Init failed')
      })

      expect(() => initTracing('test-service')).not.toThrow()
    })
  })

  describe('getTracer', () => {
    it('returns a tracer instance', () => {
      const tracer = getTracer('test-component')

      expect(tracer).toBeDefined()
    })
  })

  describe('startSpan', () => {
    it('executes function within span context', async () => {
      const mockSpan = {
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      }

      vi.mocked(opentelemetry.trace.getTracer).mockReturnValue({
        startSpan: vi.fn(() => mockSpan),
      } as any)

      const result = await startSpan('test-span', async () => {
        return 'success'
      })

      expect(result).toBe('success')
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK })
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('handles errors in span', async () => {
      const mockSpan = {
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      }

      vi.mocked(opentelemetry.trace.getTracer).mockReturnValue({
        startSpan: vi.fn(() => mockSpan),
      } as any)

      const error = new Error('Test error')

      await expect(
        startSpan('test-span', async () => {
          throw error
        }),
      ).rejects.toThrow('Test error')

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test error',
      })
      expect(mockSpan.recordException).toHaveBeenCalledWith(error)
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('handles non-Error exceptions', async () => {
      const mockSpan = {
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      }

      vi.mocked(opentelemetry.trace.getTracer).mockReturnValue({
        startSpan: vi.fn(() => mockSpan),
      } as any)

      await expect(
        startSpan('test-span', async () => {
          throw 'string error'
        }),
      ).rejects.toBe('string error')

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'string error',
      })
      expect(mockSpan.recordException).not.toHaveBeenCalled()
    })
  })

  describe('startChildSpan', () => {
    it('creates child span from parent', async () => {
      const mockParentSpan = {
        setStatus: vi.fn(),
        end: vi.fn(),
      }

      const mockChildSpan = {
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      }

      vi.mocked(opentelemetry.trace.getTracer).mockReturnValue({
        startSpan: vi.fn(() => mockChildSpan),
      } as any)
      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(mockParentSpan as any)

      const result = await startChildSpan('child-span', async () => {
        return 'success'
      })

      expect(result).toBe('success')
      expect(mockChildSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK })
      expect(mockChildSpan.end).toHaveBeenCalled()
    })
  })

  describe('getCurrentSpan', () => {
    it('returns current active span', () => {
      const mockSpan = { name: 'test-span' } as any

      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(mockSpan)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      const span = getCurrentSpan()

      expect(span).toBe(mockSpan)
    })

    it('returns undefined when no active span', () => {
      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(undefined)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      const span = getCurrentSpan()

      expect(span).toBeUndefined()
    })
  })

  describe('addSpanAttributes', () => {
    it('adds attributes to current span', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
      } as any

      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(mockSpan)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      addSpanAttributes({ key: 'value', count: 42, flag: true })

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        key: 'value',
        count: 42,
        flag: true,
      })
    })

    it('does nothing when no active span', () => {
      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(undefined)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      expect(() => addSpanAttributes({ key: 'value' })).not.toThrow()
    })
  })

  describe('addSpanEvent', () => {
    it('adds event to current span', () => {
      const mockSpan = {
        addEvent: vi.fn(),
      } as any

      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(mockSpan)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      addSpanEvent('test-event', { key: 'value' })

      expect(mockSpan.addEvent).toHaveBeenCalledWith('test-event', { key: 'value' })
    })

    it('adds event without attributes', () => {
      const mockSpan = {
        addEvent: vi.fn(),
      } as any

      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(mockSpan)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      addSpanEvent('test-event')

      expect(mockSpan.addEvent).toHaveBeenCalledWith('test-event', undefined)
    })

    it('does nothing when no active span', () => {
      vi.mocked(opentelemetry.trace.getSpan).mockReturnValue(undefined)
      vi.mocked(opentelemetry.context.active).mockReturnValue({} as any)

      expect(() => addSpanEvent('test-event')).not.toThrow()
    })
  })

  describe('shutdownTracing', () => {
    it('shuts down provider when initialized', async () => {
      const mockShutdown = vi.fn().mockResolvedValue(undefined)
      const NodeTracerProviderMock = vi.fn().mockImplementation(() => ({
        addSpanProcessor: vi.fn(),
        register: vi.fn(),
        shutdown: mockShutdown,
      }))

      vi.mocked(sdkTraceNode.NodeTracerProvider).mockImplementation(NodeTracerProviderMock as any)

      initTracing('test-service')
      await shutdownTracing()

      expect(mockShutdown).toHaveBeenCalled()
    })

    it('handles shutdown errors gracefully', async () => {
      const mockShutdown = vi.fn().mockRejectedValue(new Error('Shutdown failed'))
      const NodeTracerProviderMock = vi.fn().mockImplementation(() => ({
        addSpanProcessor: vi.fn(),
        register: vi.fn(),
        shutdown: mockShutdown,
      }))

      vi.mocked(sdkTraceNode.NodeTracerProvider).mockImplementation(NodeTracerProviderMock as any)

      initTracing('test-service')
      await expect(shutdownTracing()).resolves.not.toThrow()
    })

    it('does nothing when provider not initialized', async () => {
      await expect(shutdownTracing()).resolves.not.toThrow()
    })
  })

  describe('SpanStatusCode', () => {
    it('exports SpanStatusCode', () => {
      expect(SpanStatusCode).toBeDefined()
      expect(SpanStatusCode.OK).toBeDefined()
      expect(SpanStatusCode.ERROR).toBeDefined()
    })
  })
})
