# AWS Lambda Deployment Guide for Plane A

This document covers AWS Lambda-specific optimizations and considerations for the Remit-Scout Plane A API.

## Rate Limiting

### Redis-Based Rate Limiting (Recommended)

The application uses Redis/ElastiCache for distributed rate limiting across Lambda invocations:

- **Location**: `backend/plane-a/src/plugins/rate-limit-redis.ts`
- **Storage**: Redis/ElastiCache
- **Fallback**: In-memory rate limiting (only works within a single Lambda invocation)

### API Gateway Throttling (Alternative)

For production, consider using API Gateway throttling instead of or in addition to application-level rate limiting:

- **Burst Limit**: Maximum requests per second
- **Rate Limit**: Steady-state requests per second
- **Per-Key Throttling**: Throttle by API key or user

**Configuration**:
```yaml
# In CDK or CloudFormation
throttle:
  burstLimit: 5000
  rateLimit: 2000
```

### Rate Limit Configuration

Environment variables:
- `PLANE_A_RATE_LIMIT_MAX`: Maximum requests per window (default: 120)
- `PLANE_A_RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 60000)
- `REDIS_URL`: Redis connection string (required for distributed rate limiting)

## Lambda Timeout Optimization

### Timeout Monitoring

The application monitors request duration and logs warnings:
- **Warning Threshold**: 5 seconds
- **Critical Threshold**: 28 seconds (Lambda max is 30s)

**Location**: `backend/plane-a/src/plugins/timeout-monitor.ts`

### Optimized Routes

#### Quotes Route (`/api/v1/quotes/current`)

- **Refresh Enqueue**: Non-blocking, parallel execution
- **Database Queries**: Optimized with indexes
- **Caching**: TTL cache for frequently accessed data
- **Expected Duration**: < 2 seconds for cached requests

#### Ops Health Routes (`/api/v1/ops/*/health`)

- **Query Optimization**: Single query per provider
- **Limited Corridors**: Uses health corridors subset
- **Expected Duration**: < 1 second

### Heavy Operations

For operations that may exceed Lambda timeout:

1. **Move to Async Jobs**: Use SQS + Lambda for background processing
2. **Pagination**: Break large datasets into smaller chunks
3. **Streaming**: Use response streaming for large payloads (API Gateway HTTP API)

## Payload Size Management

### API Gateway Limits

- **Maximum Response Size**: 10MB
- **Warning Threshold**: 5MB (logged)

**Location**: `backend/plane-a/src/plugins/payload-size.ts`

### Large Response Handling

Routes that may return large payloads:

1. **Pulse Routes**: Consider pagination for large datasets
2. **Providers Route**: Already cached, but monitor size
3. **Quotes Route**: Typically small, but monitor with many providers

### Pagination

For routes that may exceed size limits:

```typescript
// Example pagination pattern
app.get('/api/v1/pulse/data', async (request, reply) => {
  const page = Number(request.query.page) || 1
  const pageSize = Math.min(Number(request.query.pageSize) || 100, 1000)
  const offset = (page - 1) * pageSize
  
  // Fetch paginated data
  const data = await repository.list({ limit: pageSize, offset })
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      total: await repository.count(),
    },
  }
})
```

## Connection Pooling with RDS Proxy

### RDS Proxy Configuration

The application supports RDS Proxy through connection string configuration:

**Environment Variables**:
- `PLANE_A_DB_HOST`: RDS Proxy endpoint
- `PLANE_A_DB_PORT`: Database port (default: 5432)
- `PLANE_A_DB_NAME`: Database name
- `PLANE_A_DB_SECRET_ARN`: Secrets Manager ARN for credentials
- `PGSSLMODE`: SSL mode (should be `require` for RDS Proxy)

**Connection String Format**:
```
postgresql://username:password@proxy-endpoint:5432/dbname?sslmode=require
```

### Pool Configuration

**Location**: `backend/shared/db.ts`

The connection pool is automatically configured:
- **Max Connections**: Defaults to pg Pool defaults (10)
- **Idle Timeout**: Managed by RDS Proxy
- **SSL**: Required for RDS Proxy connections

### Monitoring

Connection pool metrics are tracked:
- **Active Connections**: `db_pool_active_connections`
- **Idle Connections**: `db_pool_idle_connections`
- **Namespace**: `RemitScout`

### Lambda Concurrency

**Important**: Ensure RDS Proxy max connections >= Lambda concurrency

- **Lambda Reserved Concurrency**: Set based on expected load
- **RDS Proxy Max Connections**: Should be 2-3x Lambda concurrency
- **Connection Pool Size**: Should match Lambda concurrency per instance

**Example**:
- Lambda Reserved Concurrency: 100
- RDS Proxy Max Connections: 300
- Pool Max Connections: 10 (per Lambda instance)

## Cold Start Optimization

### Lazy Loading

Heavy initialization is deferred until first use:

- **Repositories**: Created on-demand
- **Services**: Lazy-loaded
- **Redis Client**: Connection deferred until first use

### Warm-Up Strategies

For critical routes, consider:

1. **CloudWatch Events**: Schedule periodic warm-up requests
2. **API Gateway Canary**: Use canary deployments to keep instances warm
3. **Provisioned Concurrency**: For critical routes (cost consideration)

### Initialization Order

1. **Fast**: Config, logging, error handlers
2. **Medium**: Database pools (RDS Proxy handles connection reuse)
3. **Slow**: Redis connection (deferred)

## API Gateway Integration

### CORS Configuration

CORS is configured for API Gateway:

**Environment Variables**:
- `PLANE_A_CORS_ORIGINS`: Allowed origins (comma-separated)
- `PLANE_A_CORS_ALLOW_CREDENTIALS`: Allow credentials (default: true)
- `PLANE_A_CORS_ALLOWED_METHODS`: Allowed methods
- `PLANE_A_CORS_ALLOWED_HEADERS`: Allowed headers

**Headers Added**:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

### Error Response Format

All errors follow a consistent format for API Gateway:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {}
}
```

**Status Codes**:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
- `503`: Service Unavailable

### Webhook Route (`/api/billing/webhook`)

**Raw Body Handling**:
- Content-Type parser configured to preserve raw body for Stripe webhook verification
- Body is kept as Buffer for signature verification

**Location**: `backend/plane-a/src/app.ts` (line 117-133)

### API Gateway HTTP API vs REST API

The application works with both:
- **HTTP API**: Recommended (lower latency, lower cost)
- **REST API**: Also supported

**Differences**:
- HTTP API: No stage variables, simpler integration
- REST API: Stage variables, more features

## Environment Detection

The application automatically detects AWS Lambda environment:

```typescript
const isAwsRuntime = Boolean(
  process.env.AWS_EXECUTION_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_REGION
)
```

This enables:
- Redis-based rate limiting
- Environment-aware Swagger URLs
- AWS-specific optimizations

## Monitoring and Logging

### CloudWatch Logs

All logs are sent to CloudWatch Logs:
- **Log Group**: `/aws/lambda/remit-scout-plane-a-{env}`
- **Structured Logging**: JSON format
- **Log Levels**: `debug`, `info`, `warn`, `error`

### CloudWatch Metrics

Custom metrics published to `RemitScout` namespace:
- Request duration
- Error rates
- Cache hit rates
- Database query performance

### X-Ray Tracing

Distributed tracing enabled:
- **Service Name**: `plane-a`
- **Sampling**: Configurable via environment variables

## Best Practices

1. **Use RDS Proxy**: Always use RDS Proxy for Lambda database connections
2. **Monitor Timeouts**: Watch for requests > 5 seconds
3. **Payload Size**: Monitor response sizes, use pagination when needed
4. **Rate Limiting**: Use Redis or API Gateway throttling
5. **Cold Starts**: Consider provisioned concurrency for critical routes
6. **Error Handling**: All errors return consistent format
7. **CORS**: Configure CORS for your frontend domains

## Troubleshooting

### Rate Limiting Not Working

- Check Redis connection: `REDIS_URL` environment variable
- Verify Redis is accessible from Lambda (VPC configuration)
- Check CloudWatch Logs for rate limit errors

### Timeout Errors

- Check CloudWatch Logs for slow request warnings
- Review database query performance
- Consider moving heavy operations to async jobs

### Payload Too Large

- Check response size in logs (`X-Response-Size-Bytes` header in dev)
- Implement pagination for large datasets
- Consider response compression

### Connection Pool Exhausted

- Verify RDS Proxy max connections > Lambda concurrency
- Check connection pool metrics
- Review connection pool configuration

## Related Documentation

- **API Versioning**: `API_VERSIONING.md`
- **Error Handling**: `src/plugins/error-handler.ts`
- **Database Migrations**: `../../docs/aws/database-migrations.md`
- **CDK Infrastructure**: `../../../infrastructure/cdk/README.md`


