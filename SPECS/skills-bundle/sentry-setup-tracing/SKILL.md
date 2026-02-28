---
name: sentry-setup-tracing
description: "Use when asked to add performance monitoring, enable tracing, track transactions/spans, or instrument application performance. Supports JavaScript, TypeScript, Python, Ruby, React, Next.js, Vue, and Node.js."
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

# Setup Sentry Tracing

This agent configures Sentry's Tracing (Performance Monitoring) to track application performance, measure latency, and create distributed traces across services.

## When to Use This Agent

Invoke when:
- User asks to "setup tracing" or "enable performance monitoring"
- User wants to "track transactions" or "measure latency"
- User requests "distributed tracing" or "span instrumentation"
- User mentions tracking API response times or page load performance
- User asks about `tracesSampleRate` or custom spans

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Trace** | Complete journey of a request across services |
| **Transaction** | Single instance of a service being called (root span) |
| **Span** | Individual unit of work within a transaction |
| **Sample Rate** | Percentage of transactions to capture (0-1) |

## Platform Detection

### JavaScript/TypeScript
Check `package.json` for:
- `@sentry/nextjs`, `@sentry/react`, `@sentry/node`, `@sentry/browser`, `@sentry/vue`, `@sentry/angular`, `@sentry/sveltekit`

### Python
Check for `sentry-sdk` in requirements.

### Ruby
Check for `sentry-ruby` in Gemfile.

---

## JavaScript/TypeScript Configuration

### Step 1: Locate Sentry Init

Find the `Sentry.init()` call:
- Next.js: `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- React: `src/index.tsx` or entry file
- Node.js: Entry point or config file
- Vue/Angular: Main app initialization

### Step 2: Enable Tracing

#### Browser/React

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/yourserver\.io\/api/,
  ],
});
```

#### Next.js - Configure All Init Files

**Client (`instrumentation-client.ts`):**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  tracesSampleRate: 1.0,
});
```

**Server (`sentry.server.config.ts`):**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  tracesSampleRate: 1.0,
});
```

**Edge (`sentry.edge.config.ts`):**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  tracesSampleRate: 1.0,
});
```

**Next.js 14+ App Router - add trace data to root layout:**
```typescript
// app/layout.tsx
import * as Sentry from "@sentry/nextjs";

export async function generateMetadata() {
  return {
    other: {
      ...Sentry.getTraceData(),
    },
  };
}
```

#### Node.js (Fastify/Express)

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  tracesSampleRate: 1.0,
});
```

### Step 3: Configure Sampling

#### Option A: Uniform Sample Rate

```javascript
Sentry.init({
  tracesSampleRate: 0.2, // 20% of transactions
});
```

#### Option B: Dynamic Sampling (Recommended for Production)

```javascript
Sentry.init({
  tracesSampler: ({ name, attributes, parentSampled }) => {
    // Always skip health checks
    if (name.includes("healthcheck") || name.includes("/healthz")) {
      return 0;
    }

    // Always capture checkout and payment flows
    if (name.includes("checkout") || name.includes("payment")) {
      return 1;
    }

    // Inherit parent sampling decision if available
    if (typeof parentSampled === "boolean") {
      return parentSampled;
    }

    // Default: 10% in production
    return 0.1;
  },
});
```

---

## Browser Tracing Integration Options

```javascript
Sentry.init({
  integrations: [
    Sentry.browserTracingIntegration({
      tracePropagationTargets: ["localhost", /^https:\/\/api\./],

      beforeStartSpan: (context) => {
        return {
          ...context,
          name: context.name.replace(/\/users\/\d+/, "/users/:id"),
        };
      },

      shouldCreateSpanForRequest: (url) => {
        return !url.includes("healthcheck");
      },

      idleTimeout: 1000,
      finalTimeout: 30000,
      childSpanTimeout: 15000,
      instrumentNavigation: true,
      instrumentPageLoad: true,
      enableLongTask: true,
      enableInp: true,
      interactionsSampleRate: 1.0,
    }),
  ],
});
```

---

## Python Configuration

### Enable Tracing

```python
import sentry_sdk

sentry_sdk.init(
    dsn="YOUR_DSN_HERE",
    traces_sample_rate=1.0,
)
```

### Dynamic Sampling

```python
def traces_sampler(sampling_context):
    transaction_name = sampling_context.get("transaction_context", {}).get("name", "")

    if "healthcheck" in transaction_name:
        return 0

    if "auth" in transaction_name or "payment" in transaction_name:
        return 1.0

    if sampling_context.get("parent_sampled") is not None:
        return sampling_context["parent_sampled"]

    return 0.1

sentry_sdk.init(
    dsn="YOUR_DSN_HERE",
    traces_sampler=traces_sampler,
)
```

---

## Ruby Configuration

```ruby
Sentry.init do |config|
  config.dsn = "YOUR_DSN_HERE"
  config.traces_sample_rate = 1.0

  config.traces_sampler = lambda do |sampling_context|
    transaction_name = sampling_context[:transaction_context][:name]
    return 0 if transaction_name.include?("healthcheck")
    return 1.0 if transaction_name.include?("payment")
    0.5
  end
end
```

---

## Custom Instrumentation

### JavaScript Custom Spans

#### Using startSpan (Recommended)

```javascript
// Synchronous operation
const result = Sentry.startSpan(
  { name: "expensive-calculation", op: "function" },
  () => {
    return calculateSomething();
  }
);

// Async operation
const result = await Sentry.startSpan(
  { name: "fetch-user-data", op: "http.client" },
  async () => {
    const response = await fetch("/api/user");
    return response.json();
  }
);

// With attributes
const result = await Sentry.startSpan(
  {
    name: "process-order",
    op: "task",
    attributes: {
      "order.id": orderId,
      "order.amount": amount,
    },
  },
  async () => {
    return processOrder(orderId);
  }
);
```

#### Nested Spans

```javascript
await Sentry.startSpan({ name: "checkout-flow", op: "transaction" }, async () => {
  await Sentry.startSpan({ name: "validate-cart", op: "validation" }, async () => {
    await validateCart();
  });

  await Sentry.startSpan({ name: "process-payment", op: "payment" }, async () => {
    await processPayment();
  });

  await Sentry.startSpan({ name: "send-confirmation", op: "email" }, async () => {
    await sendConfirmationEmail();
  });
});
```

### Python Custom Spans

#### Using Decorator (Simplest)

```python
import sentry_sdk

@sentry_sdk.trace
def expensive_function():
    return do_work()

# With parameters (SDK 2.35.0+)
@sentry_sdk.trace(op="database", name="fetch-users")
def fetch_users():
    return db.query(User).all()
```

#### Using Context Manager

```python
import sentry_sdk

def process_order(order_id):
    with sentry_sdk.start_span(name="process-order", op="task") as span:
        span.set_data("order.id", order_id)

        with sentry_sdk.start_span(name="validate-order", op="validation"):
            validate(order_id)

        with sentry_sdk.start_span(name="charge-payment", op="payment"):
            charge(order_id)

        return {"success": True}
```

---

## Distributed Tracing

### Configure Trace Propagation Targets

Only URLs matching these patterns receive trace headers:

```javascript
Sentry.init({
  tracePropagationTargets: [
    "localhost",
    "https://api.yourapp.com",
    /^https:\/\/.*\.yourapp\.com\/api/,
  ],
});
```

### Manual Propagation (WebSockets, SQS, etc.)

```javascript
// Sender
const traceData = Sentry.getTraceData();
sendMessage({
  ...payload,
  _traceHeaders: traceData,
});

// Receiver
Sentry.continueTrace(
  {
    sentryTrace: message._traceHeaders["sentry-trace"],
    baggage: message._traceHeaders["baggage"],
  },
  () => {
    processMessage(message);
  }
);
```

---

## Common Operation Types

| Operation | Use Case |
|-----------|----------|
| `http.client` | Outgoing HTTP requests |
| `http.server` | Incoming HTTP requests |
| `db` | Database operations |
| `db.query` | Database queries |
| `cache` | Cache operations |
| `task` | Background tasks |
| `function` | Function execution |
| `ui.render` | UI rendering |
| `ui.action` | User interactions |
| `middleware` | Middleware execution |

---

## Production Sampling Recommendations

| Traffic Level | Recommended Rate |
|---------------|-----------------|
| Development/Testing | `1.0` (100%) |
| Low traffic (<1K req/min) | `0.5` - `1.0` |
| Medium traffic (1K-10K req/min) | `0.1` - `0.5` |
| High traffic (>10K req/min) | `0.01` - `0.1` |

Always use `tracesSampler` (not just `tracesSampleRate`) to capture critical flows at 100% while sampling routine traffic lower.

---

## Disabling Tracing

**Important:** Setting `tracesSampleRate: 0` does NOT fully disable tracing. To fully disable, omit both sampling options from `Sentry.init()`.

---

## Verification Steps

### JavaScript
```javascript
await Sentry.startSpan(
  { name: "test-transaction", op: "test" },
  async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
);
```

Check **Sentry → Performance** for your test transaction.

---

## Common Issues

### Transactions not appearing
1. Verify `tracesSampleRate > 0` or `tracesSampler` returns > 0
2. Check DSN is correct
3. For browser: Ensure `browserTracingIntegration()` is added

### Distributed traces not connected
1. Check `tracePropagationTargets` includes your API URLs
2. Verify CORS allows `sentry-trace` and `baggage` headers
3. For SSR: Ensure trace meta tags are rendered

### Too many transactions
1. Lower `tracesSampleRate`
2. Use `tracesSampler` to filter health check endpoints
3. Use `shouldCreateSpanForRequest` to skip internal polling
