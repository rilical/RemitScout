# Lambda Optimizations Summary

This document summarizes all Lambda-specific optimizations applied to Plane A.

## ✅ Completed Optimizations

### 1. Rate Limiting for Lambda

**Problem**: `@fastify/rate-limit` uses in-memory storage, which doesn't work across Lambda invocations.

**Solution**: 
- Created Redis-based rate limiting (`rate-limit-redis.ts`)
- Falls back to in-memory if Redis unavailable
- **Recommendation**: Use API Gateway throttling for production

**Files**:
- `backend/plane-a/src/plugins/rate-limit-redis.ts`
- `backend/plane-a/src/app.ts` (lines 128-145)

### 2. Lambda Timeout Optimization

**Problem**: Routes may exceed Lambda 30-second timeout.

**Solution**:
- Added timeout monitoring (warns at 5s, errors at 28s)
- Optimized refresh enqueue to be parallel and non-blocking
- Ops health routes use efficient queries

**Files**:
- `backend/plane-a/src/plugins/timeout-monitor.ts`
- `backend/plane-a/src/routes/quotes.ts` (lines 286-309)

### 3. Payload Size Management

**Problem**: API Gateway has 10MB response limit.

**Solution**:
- Added payload size monitoring
- Warns at 5MB, errors at 10MB
- Pulse table route already has pagination

**Files**:
- `backend/plane-a/src/plugins/payload-size.ts`
- `backend/plane-a/src/routes/pulse.ts` (line 509-516 - pagination)

### 4. Connection Pooling with RDS Proxy

**Problem**: Lambda needs connection pooling for database.

**Solution**:
- RDS Proxy support via connection string
- Connection pool monitoring
- Lazy pool initialization

**Files**:
- `backend/shared/db.ts` (supports RDS Proxy endpoints)
- `backend/plane-a/src/plugins/rds-proxy-monitor.ts`
- `backend/plane-a/src/app.ts` (lazy pool loading)

### 5. Cold Start Optimization

**Problem**: Cold starts increase latency.

**Solution**:
- Lazy loading of database pools
- Deferred Redis connection
- Lambda container reuse detection

**Files**:
- `backend/plane-a/src/plugins/lambda-optimization.ts`
- `backend/plane-a/src/app.ts` (lazy pool: line 47)

### 6. API Gateway Integration

**Problem**: CORS, error responses, and webhooks must work with API Gateway.

**Solution**:
- CORS configured with exposed headers
- Consistent error response format
- Raw body handling for webhooks

**Files**:
- `backend/plane-a/src/app.ts` (CORS: lines 72-82, webhook: lines 120-133)
- `backend/plane-a/src/plugins/error-handler.ts`

## Configuration

### Required Environment Variables

```bash
# Database (RDS Proxy)
PLANE_A_DB_SECRET_ARN=arn:aws:secretsmanager:...
PLANE_A_DB_HOST=proxy-endpoint.proxy-xxxxx.us-east-1.rds.amazonaws.com
PLANE_A_DB_PORT=5432
PLANE_A_DB_NAME=remit_scout
PGSSLMODE=require

# Redis (for rate limiting)
REDIS_URL=redis://...

# CORS
PLANE_A_CORS_ORIGINS=https://app.example.com,https://www.example.com
PLANE_A_CORS_ALLOW_CREDENTIALS=1

# Rate Limiting
PLANE_A_RATE_LIMIT_MAX=120
PLANE_A_RATE_LIMIT_WINDOW_MS=60000
```

## Performance Targets

- **Cold Start**: < 2 seconds
- **Warm Request**: < 500ms (p95)
- **Database Query**: < 100ms (p95)
- **Response Size**: < 5MB (warning), < 10MB (error)

## Monitoring

### CloudWatch Metrics

- Request duration (warnings at 5s, errors at 28s)
- Payload size (warnings at 5MB)
- Rate limit hits
- Connection pool status

### Logs

- Cold start detection
- RDS Proxy endpoint detection
- Timeout warnings
- Payload size warnings

## Best Practices

1. **Always use RDS Proxy** for Lambda database connections
2. **Monitor timeout warnings** - optimize routes > 5 seconds
3. **Use pagination** for large datasets
4. **Enable Redis** for distributed rate limiting
5. **Configure API Gateway throttling** as primary rate limit
6. **Monitor cold starts** - consider provisioned concurrency for critical routes

## Related Documentation

- **AWS Lambda Deployment**: `AWS_LAMBDA_DEPLOYMENT.md`
- **API Versioning**: `API_VERSIONING.md`
- **Error Handling**: `src/plugins/error-handler.ts`


