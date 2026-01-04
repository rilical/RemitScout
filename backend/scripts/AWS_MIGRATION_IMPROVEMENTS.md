# AWS Migration Readiness Improvements

This document summarizes all improvements made to prepare backend scripts for AWS migration.

## ✅ Completed Improvements

### 1. Missing Provider Probe Infrastructure (HIGH) ✅

**Problem**: No Lambda wrappers or EventBridge schedules for provider probes.

**Solution**: 
- Created 5 Lambda wrapper files in `backend/scripts/aws/`:
  - `remitly-probe-lambda.ts`
  - `westernunion-probe-lambda.ts`
  - `wise-probe-lambda.ts`
  - `worldremit-probe-lambda.ts`
  - `xe-probe-lambda.ts`
- Added EventBridge schedules in `infrastructure/cdk/lib/scheduled-jobs.ts` (runs every 5 minutes)
- Added CloudWatch alarms for probe failures in `infrastructure/cdk/lib/monitoring.ts`

**Files**:
- `backend/scripts/aws/*-probe-lambda.ts` (5 new files)
- `infrastructure/cdk/lib/scheduled-jobs.ts` (updated)
- `infrastructure/cdk/lib/monitoring.ts` (updated)

**Features**:
- Each Lambda wrapper resolves AWS parameters (database URL, Redis URL)
- Calls generic probe with provider-specific ID
- Returns structured error responses for Lambda
- Includes timeout warnings (logs if approaching Lambda timeout)

### 2. Eliminate Code Duplication (HIGH) ✅

**Problem**: 5 provider probe files with 95% duplicate code.

**Solution**: Created generic probe module that accepts provider ID as parameter.

**Files**:
- `backend/scripts/lib/generic-probe.ts` (new)
- `backend/scripts/remitly-probe.ts` (refactored)
- `backend/scripts/wise-probe.ts` (refactored)
- `backend/scripts/westernunion-probe.ts` (refactored)
- `backend/scripts/worldremit-probe.ts` (refactored)
- `backend/scripts/xe-probe.ts` (refactored)

**Changes**:
- All provider-specific probe files now call `runGenericProbe()` with provider ID
- Provider-specific configuration passed as parameters
- Maintains backward compatibility

**Usage**:
```typescript
import { runGenericProbe } from './lib/generic-probe'

const result = await runGenericProbe({
  providerId: 'remitly',
  timeoutMs: 300000,
  retries: 0,
})
```

### 3. Fix Lambda Wrapper Error Handling (HIGH) ✅

**Problem**: No try-catch blocks around parameter resolution, no structured error responses.

**Solution**: Added comprehensive error handling to all Lambda wrappers.

**Features**:
- Try-catch blocks around `resolveDatabaseUrl()` and `resolveAwsEnv()`
- Logs errors with context (job name, env vars attempted)
- Returns structured error responses for Lambda
- Timeout warnings (logs if job approaches Lambda timeout at 80% threshold)
- Validation after resolution (throws descriptive errors if required vars missing)

**Example**:
```typescript
try {
  await resolveDatabaseUrl({ ... })
  if (!process.env.DATABASE_URL_PLANE_B) {
    throw new Error('DATABASE_URL_PLANE_B is required but not set after resolution')
  }
} catch (error) {
  logger.error('database_url_resolution_failed', {
    job_name: 'remitly-probe',
    env_vars_attempted: [...],
    error: message,
    stack,
  })
  throw new Error(`Failed to resolve database URL: ${message}`)
}
```

### 4. Fix ECS Entry Point (MEDIUM) ✅

**Problem**: Using `path.resolve(__dirname, ...)` for imports, no error handling.

**Solution**: 
- Replaced with direct import path
- Added error handling around parameter resolution
- Added graceful shutdown handlers (SIGTERM/SIGINT)

**Files**:
- `backend/scripts/aws/b2c-refresh-worker-ecs.ts` (updated)

**Changes**:
- Direct import: `import('../b2c-refresh-worker')` instead of path.resolve
- Added validation after `resolveDatabaseUrl()` and `resolveAwsEnv()`
- Added `createShutdownHandler()` for graceful shutdown
- Comprehensive error logging with context

**Note**: File name `b2c-refresh-worker-ecs.ts` is correct - it's used as ECS entry point (verified in `infrastructure/cdk/lib/ecs-tasks.ts`).

### 5. Enhance Probe Utilities (MEDIUM) ✅

**Problem**: No CloudWatch metrics, no timeout cleanup warnings.

**Solution**: Enhanced probe utilities with CloudWatch metrics and timeout warnings.

**Files**:
- `backend/scripts/lib/probe-utils.ts` (updated)

**Features**:
- CloudWatch metrics publishing for probe results
- Success/failure counters
- Duration histograms
- Timeout cleanup always happens (both timeout and warning timers cleared)
- Timeout warning at 80% of timeout duration

**Metrics Published**:
- `probe_result` (Count) - 1 for success, 0 for failure
- `probe_duration` (Seconds) - Probe execution duration
- `probe_corridors_tested` (Count) - Number of corridors tested
- `probe_corridors_succeeded` (Count) - Number of corridors that succeeded
- `probe_corridors_failed` (Count) - Number of corridors that failed

**Namespace**: `RemitScout/Probes`

**Dimensions**:
- `ProviderId` - Provider ID (e.g., 'remitly', 'wise')
- `Status` - Probe status ('success' or 'failure')

### 6. Fix Naming Inconsistency (LOW) ✅

**Problem**: `b2c-refresh-worker-ecs.ts` name suggests Lambda but it's used as ECS entry point.

**Solution**: Verified file is correctly used as ECS entry point in CDK.

**Verification**:
- File is referenced in `infrastructure/cdk/lib/ecs-tasks.ts` line 303
- Command: `['node', 'backend/dist/scripts/aws/b2c-refresh-worker-ecs.js']`
- Used in ECS task definition, not Lambda
- File name is correct - no change needed

### 7. Add Missing Validation (LOW) ✅

**Problem**: No validation after parameter resolution.

**Solution**: Added validation after `resolveDatabaseUrl()` and `resolveAwsEnv()`.

**Validation**:
- After `resolveDatabaseUrl()`: Validates that `DATABASE_URL_*` is set
- After `resolveAwsEnv()`: Validates required env vars are present
- Throws descriptive errors if validation fails

**Example**:
```typescript
await resolveDatabaseUrl({ ... })
if (!process.env.DATABASE_URL_PLANE_B) {
  throw new Error('DATABASE_URL_PLANE_B is required but not set after resolution')
}
```

## CDK Infrastructure Updates

### EventBridge Schedules

Added 5 EventBridge rules in `infrastructure/cdk/lib/scheduled-jobs.ts`:
- `RemitlyProbeSchedule` - Runs every 5 minutes
- `WesternUnionProbeSchedule` - Runs every 5 minutes
- `WiseProbeSchedule` - Runs every 5 minutes
- `WorldRemitProbeSchedule` - Runs every 5 minutes
- `XeProbeSchedule` - Runs every 5 minutes

### CloudWatch Alarms

Added probe failure alarms in `infrastructure/cdk/lib/monitoring.ts`:
- One alarm per provider (remitly, westernunion, wise, worldremit, xe)
- Alarms when `probe_result` metric with `Status: 'failure'` > 0
- All alarms send to SNS topic

## Files Created

1. `backend/scripts/lib/generic-probe.ts` - Generic probe implementation
2. `backend/scripts/aws/remitly-probe-lambda.ts` - Remitly probe Lambda wrapper
3. `backend/scripts/aws/westernunion-probe-lambda.ts` - Western Union probe Lambda wrapper
4. `backend/scripts/aws/wise-probe-lambda.ts` - Wise probe Lambda wrapper
5. `backend/scripts/aws/worldremit-probe-lambda.ts` - WorldRemit probe Lambda wrapper
6. `backend/scripts/aws/xe-probe-lambda.ts` - XE probe Lambda wrapper

## Files Modified

1. `backend/scripts/lib/probe-utils.ts` - Added CloudWatch metrics and timeout warnings
2. `backend/scripts/remitly-probe.ts` - Refactored to use generic probe
3. `backend/scripts/wise-probe.ts` - Refactored to use generic probe
4. `backend/scripts/westernunion-probe.ts` - Refactored to use generic probe
5. `backend/scripts/worldremit-probe.ts` - Refactored to use generic probe
6. `backend/scripts/xe-probe.ts` - Refactored to use generic probe
7. `backend/scripts/aws/b2c-refresh-worker-ecs.ts` - Fixed error handling and validation
8. `infrastructure/cdk/lib/scheduled-jobs.ts` - Added EventBridge schedules for probes
9. `infrastructure/cdk/lib/monitoring.ts` - Added CloudWatch alarms for probe failures

## CloudWatch Metrics

### Probe Metrics

**Namespace**: `RemitScout/Probes`

**Metrics**:
- `probe_result` - Probe result (1 = success, 0 = failure)
- `probe_duration` - Probe duration in seconds
- `probe_corridors_tested` - Number of corridors tested
- `probe_corridors_succeeded` - Number of corridors that succeeded
- `probe_corridors_failed` - Number of corridors that failed

**Dimensions**:
- `ProviderId` - Provider ID (e.g., 'remitly', 'wise')
- `Status` - Probe status ('success' or 'failure')

## Backward Compatibility

All changes maintain backward compatibility:

1. **Generic Probe**: Provider-specific probe files still work, now call generic probe
2. **Lambda Wrappers**: New files, don't affect existing probe scripts
3. **Error Handling**: Enhanced error handling doesn't change function signatures
4. **Metrics**: Metrics are non-blocking, failures don't affect probe execution
5. **ECS Entry Point**: Enhanced error handling doesn't change behavior

## Next Steps

1. **Deploy**: Deploy CDK changes to create EventBridge schedules and CloudWatch alarms
2. **Test**: Test Lambda probe functions in AWS
3. **Monitor**: Set up SNS subscriptions for probe failure alarms
4. **Verify**: Verify CloudWatch metrics are being published
5. **Cleanup**: Consider removing old provider-specific probe files after migration (optional)

## Migration Guide

### Using Generic Probe

Replace provider-specific probe code with:

```typescript
import { runGenericProbe } from './lib/generic-probe'

const result = await runGenericProbe({
  providerId: 'remitly',
  timeoutMs: 300000,
  retries: 0,
  outputFormat: 'json',
})
```

### Lambda Wrapper Pattern

All Lambda wrappers follow this pattern:

1. Resolve database URL with error handling
2. Resolve AWS environment variables with error handling
3. Validate required environment variables
4. Check timeout warning threshold
5. Call generic probe
6. Return structured response

### Error Handling

All Lambda wrappers include:
- Try-catch around parameter resolution
- Context logging (job name, env vars attempted)
- Validation after resolution
- Timeout warnings
- Structured error responses


