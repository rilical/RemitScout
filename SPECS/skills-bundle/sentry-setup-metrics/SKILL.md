---
name: sentry-setup-metrics
description: "Use when asked to add Sentry metrics, track custom metrics, setup counters/gauges/distributions, or instrument application performance metrics. Supports JavaScript, TypeScript, Python, React, Next.js, and Node.js."
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

# Setup Sentry Metrics

This agent configures Sentry's custom metrics feature to track counters, gauges, and distributions across your applications.

## When to Use This Agent

Invoke when:
- User asks to "setup Sentry metrics" or "add custom metrics"
- User wants to "track metrics in Sentry"
- User requests "counters", "gauges", or "distributions" with Sentry
- User mentions they want to track business KPIs or application health
- User asks about `Sentry.metrics` or `sentry_sdk.metrics`
- User wants to instrument performance metrics

## Platform Support

**Supported Platforms:**
- JavaScript/TypeScript (SDK 10.25.0+): Next.js, React, Node.js, Browser
- Python (SDK 2.44.0+): Django, Flask, FastAPI, general Python

## Metric Types Overview

| Type | Purpose | Use Cases | Aggregations |
|------|---------|-----------|--------------|
| **Counter** | Track cumulative occurrences | Button clicks, API calls, errors | sum, per_second, per_minute |
| **Gauge** | Point-in-time snapshots | Queue depth, memory usage, connections | min, max, avg |
| **Distribution** | Statistical analysis of values | Response times, cart amounts, query duration | p50, p75, p95, p99, avg, min, max |

## Platform Detection

### JavaScript/TypeScript Detection
Check `package.json` for `@sentry/nextjs`, `@sentry/react`, `@sentry/node`, `@sentry/browser` and verify SDK version is 10.25.0+.

### Python Detection
Check `requirements.txt` / `pyproject.toml` for `sentry-sdk` version 2.44.0+.

---

## JavaScript/TypeScript Configuration

### Minimum SDK Version
- All JS platforms: `10.25.0+`

### Verify SDK Version

```bash
grep -E '"@sentry/(nextjs|react|node|browser)"' package.json
```

### Step 1: Metrics Are Enabled by Default

Metrics are **enabled by default** in SDK 10.25.0+. No changes to `Sentry.init()` are required unless filtering is needed.

**Optional: Explicitly enable:**
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  enableMetrics: true,
  // ... other existing config
});
```

### Step 2: Add Metric Filtering (Optional)

```javascript
Sentry.init({
  dsn: "YOUR_DSN_HERE",

  beforeSendMetric: (metric) => {
    if (metric.attributes?.sensitive === true) {
      return null;
    }
    if (metric.attributes?.internal) {
      delete metric.attributes.internal;
    }
    return metric;
  },
});
```

---

## JavaScript Metrics API Examples

### Counter Examples

```javascript
// Basic counter - increment by 1
Sentry.metrics.count("button_click", 1);

// Counter with attributes for filtering/grouping
Sentry.metrics.count("api_call", 1, {
  attributes: {
    endpoint: "/api/users",
    method: "GET",
    status_code: 200,
  },
});

// Counter for errors
Sentry.metrics.count("checkout_error", 1, {
  attributes: {
    error_type: "payment_declined",
    payment_provider: "stripe",
  },
});

// Counter for business events
Sentry.metrics.count("email_sent", 1, {
  attributes: {
    template: "welcome",
    recipient_type: "new_user",
  },
});
```

### Gauge Examples

```javascript
// Basic gauge
Sentry.metrics.gauge("queue_depth", 42);

// Memory usage gauge
Sentry.metrics.gauge("memory_usage", process.memoryUsage().heapUsed, {
  unit: "byte",
  attributes: {
    process: "main",
  },
});

// Connection pool gauge
Sentry.metrics.gauge("db_connections", 15, {
  attributes: {
    pool: "primary",
    max_connections: 100,
  },
});
```

### Distribution Examples

```javascript
// Response time distribution
Sentry.metrics.distribution("response_time", 187.5, {
  unit: "millisecond",
  attributes: {
    endpoint: "/api/products",
    method: "GET",
  },
});

// Cart value distribution
Sentry.metrics.distribution("cart_value", 149.99, {
  unit: "usd",
  attributes: {
    customer_tier: "premium",
  },
});

// Query duration distribution
Sentry.metrics.distribution("db_query_duration", 45.2, {
  unit: "millisecond",
  attributes: {
    query_type: "select",
    table: "users",
  },
});
```

### Manual Flush

```javascript
// Force pending metrics to send immediately
await Sentry.flush();

process.on("beforeExit", async () => {
  await Sentry.flush();
});
```

---

## Python Configuration

### Minimum SDK Version
- `sentry-sdk` version `2.44.0+`

### Step 1: Metrics Are Enabled by Default

```python
import sentry_sdk

sentry_sdk.init(
    dsn="YOUR_DSN_HERE",
    # Metrics enabled by default in 2.44.0+
)
```

### Step 2: Add Metric Filtering (Optional)

```python
import sentry_sdk

def before_send_metric(metric, hint):
    if metric.get("attributes", {}).get("sensitive"):
        return None
    return metric

sentry_sdk.init(
    dsn="YOUR_DSN_HERE",
    before_send_metric=before_send_metric,
)
```

## Python Metrics API Examples

### Counter Examples

```python
import sentry_sdk

sentry_sdk.metrics.count("button_click", 1)

sentry_sdk.metrics.count(
    "api_call",
    1,
    attributes={
        "endpoint": "/api/users",
        "method": "GET",
        "status_code": 200,
    }
)

sentry_sdk.metrics.count(
    "checkout_error",
    1,
    attributes={
        "error_type": "payment_declined",
        "payment_provider": "stripe",
    }
)
```

### Gauge Examples

```python
import sentry_sdk

sentry_sdk.metrics.gauge("queue_depth", 42)

sentry_sdk.metrics.gauge(
    "db_connections",
    connection_pool.size(),
    attributes={
        "pool": "primary",
        "max": connection_pool.max_size,
    }
)
```

### Distribution Examples

```python
import sentry_sdk
import time

start = time.time()
# ... do work ...
duration_ms = (time.time() - start) * 1000

sentry_sdk.metrics.distribution(
    "response_time",
    duration_ms,
    unit="millisecond",
    attributes={
        "endpoint": "/api/products",
        "method": "GET",
    }
)
```

---

## Instrumentation Patterns

### Timing Helper (JavaScript)

```javascript
async function withTiming(name, fn, attributes = {}) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    Sentry.metrics.distribution(name, duration, {
      unit: "millisecond",
      attributes,
    });
  }
}

// Usage
const result = await withTiming(
  "api.external.duration",
  () => fetch("https://api.example.com/data"),
  { service: "example-api" }
);
```

### Timing Decorator (Python)

```python
import functools
import time
import sentry_sdk

def track_duration(metric_name, **extra_attrs):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                duration_ms = (time.time() - start) * 1000
                sentry_sdk.metrics.distribution(
                    metric_name,
                    duration_ms,
                    unit="millisecond",
                    attributes=extra_attrs,
                )
        return wrapper
    return decorator

@track_duration("db.query.duration", query_type="user_lookup")
def get_user_by_id(user_id):
    return db.query(User).filter(User.id == user_id).first()
```

### Request Middleware (Express/Fastify Node.js)

```javascript
function metricsMiddleware(req, res, next) {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;

    Sentry.metrics.distribution("http.request.duration", duration, {
      unit: "millisecond",
      attributes: {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      },
    });

    Sentry.metrics.count("http.request.count", 1, {
      attributes: {
        method: req.method,
        status_code: res.statusCode,
      },
    });
  });

  next();
}
```

---

## Common Units

| Category | Units |
|----------|-------|
| **Time** | `nanosecond`, `microsecond`, `millisecond`, `second`, `minute`, `hour`, `day`, `week` |
| **Size** | `bit`, `byte`, `kilobyte`, `megabyte`, `gigabyte`, `terabyte` |
| **Currency** | `usd`, `eur`, `gbp` (or any ISO currency code) |
| **Rate** | `ratio`, `percent` |
| **Other** | `none` (default), or custom string |

---

## Best Practices

### DO Use Metrics For:
- Business KPIs (orders, signups, revenue)
- Application health (error rates, latency)
- Resource utilization (queue depth, connections)
- User actions (clicks, page views, feature usage)

### DON'T Use Metrics For:
- Infrastructure monitoring (use dedicated tools)
- Log aggregation (use Sentry Logs instead)
- Full request tracing (use Sentry Tracing)
- High-cardinality data in attributes

### Naming Conventions:
```
# Good - descriptive, namespaced
api.request.duration
checkout.cart.value
user.signup.completed

# Avoid - vague, inconsistent
duration
value1
myMetric
```

### Attribute Guidelines:
- Keep cardinality low (avoid user IDs, request IDs)
- Use consistent attribute names across metrics
- Include relevant context for filtering
- Avoid sensitive data in attributes

---

## Quick Reference

| Platform | SDK Version | API Namespace |
|----------|-------------|---------------|
| JavaScript | 10.25.0+ | `Sentry.metrics.*` |
| Python | 2.44.0+ | `sentry_sdk.metrics.*` |

| Method | JavaScript | Python |
|--------|------------|--------|
| Counter | `Sentry.metrics.count(name, value, options)` | `sentry_sdk.metrics.count(name, value, **kwargs)` |
| Gauge | `Sentry.metrics.gauge(name, value, options)` | `sentry_sdk.metrics.gauge(name, value, **kwargs)` |
| Distribution | `Sentry.metrics.distribution(name, value, options)` | `sentry_sdk.metrics.distribution(name, value, **kwargs)` |
