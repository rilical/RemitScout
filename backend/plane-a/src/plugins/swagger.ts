import type { FastifyInstance } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from '../../../shared/config'

/**
 * Get server URLs based on environment
 */
const getServerUrls = (): Array<{ url: string; description: string }> => {
  const isAwsRuntime = Boolean(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION,
  )

  // In Lambda, try to get API Gateway URL from environment or construct it
  if (isAwsRuntime) {
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL ||
      process.env.API_BASE_URL ||
      (process.env.AWS_REGION && process.env.API_ID
        ? `https://${process.env.API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com`
        : undefined)

    if (apiGatewayUrl) {
      return [
        {
          url: `${apiGatewayUrl}/api/v1`,
          description: 'Production API (v1)',
        },
        {
          url: `${apiGatewayUrl}/api`,
          description: 'Production API (deprecated)',
        },
      ]
    }

    // Fallback for Lambda without explicit URL
    return [
      {
        url: '/api/v1',
        description: 'API Gateway (v1) - relative URL',
      },
      {
        url: '/api',
        description: 'API Gateway (deprecated) - relative URL',
      },
    ]
  }

  // Local development
  const port = config.planeA.port
  const baseUrl = `http://localhost:${port}`
  return [
    {
      url: `${baseUrl}/api/v1`,
      description: 'Local development (v1)',
    },
    {
      url: `${baseUrl}/api`,
      description: 'Local development (deprecated)',
    },
  ]
}

export const swaggerPlugin = async (app: FastifyInstance) => {
  const isAwsRuntime = Boolean(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION,
  )
  if (isAwsRuntime && process.env.SWAGGER_ENABLED !== '1') {
    app.log.info('Swagger UI disabled in AWS runtime')
    return
  }

  try {
    await app.register(swagger, {
      openapi: {
        openapi: '3.0.3',
        info: {
          title: 'Remit-Scout API',
          version: '1.0.0',
          description: 'Remit-Scout API for comparing money transfer providers and accessing remittance data. All endpoints are versioned under `/api/v1/*`. Unversioned endpoints at `/api/*` are deprecated and will be sunset on January 3, 2026.',
        },
        servers: getServerUrls(),
        tags: [
          { name: 'Providers', description: 'Provider quotes and comparison endpoints' },
          { name: 'Quotes', description: 'Raw quote data endpoints' },
          { name: 'Corridors', description: 'Corridor information endpoints' },
          { name: 'User', description: 'User account and plan endpoints' },
          { name: 'Billing', description: 'Billing and subscription endpoints' },
          { name: 'Pulse', description: 'Pulse analytics endpoints (Plus only)' },
          { name: 'Operations', description: 'Operational endpoints (Admin only)' },
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Metrics', description: 'Metrics endpoints' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT token from Supabase Auth',
            },
          },
        },
      },
    })

    await app.register(swaggerUi, {
      routePrefix: '/api-docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
    })

    app.log.info('Swagger UI available at /api-docs')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    app.log.warn({ error: errorMessage }, 'Swagger setup failed, continuing without it')
  }
}
