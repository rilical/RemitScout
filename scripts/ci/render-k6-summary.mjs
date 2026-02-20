#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const parseArgs = () => {
  const args = process.argv.slice(2)
  const parsed = {
    input: '',
    output: '',
    title: 'k6 Load Test Summary',
  }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    const next = args[i + 1]
    if (arg === '--input' && next) {
      parsed.input = next
      i += 1
      continue
    }
    if (arg === '--output' && next) {
      parsed.output = next
      i += 1
      continue
    }
    if (arg === '--title' && next) {
      parsed.title = next
      i += 1
      continue
    }
  }
  if (!parsed.input || !parsed.output) {
    throw new Error('Usage: render-k6-summary.mjs --input <summary.json> --output <summary.html>')
  }
  return parsed
}

const numberOrDash = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2)
  }
  return '-'
}

const metricRow = (label, metric, keys) => {
  if (!metric || !metric.values) {
    return `<tr><td>${label}</td><td>-</td><td>-</td><td>-</td></tr>`
  }
  const [a, b, c] = keys.map((key) => numberOrDash(metric.values[key]))
  return `<tr><td>${label}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`
}

const main = () => {
  const args = parseArgs()
  const summary = JSON.parse(fs.readFileSync(args.input, 'utf8'))
  const metrics = summary.metrics || {}
  const generatedAt = new Date().toISOString()

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${args.title}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { margin: 0 0 12px; }
    p { color: #4b5563; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${args.title}</h1>
  <p>Generated at <code>${generatedAt}</code></p>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value A</th>
        <th>Value B</th>
        <th>Value C</th>
      </tr>
    </thead>
    <tbody>
      ${metricRow('http_req_duration (avg/p95/p99 ms)', metrics.http_req_duration, ['avg', 'p(95)', 'p(99)'])}
      ${metricRow('http_req_failed (rate)', metrics.http_req_failed, ['rate', 'passes', 'fails'])}
      ${metricRow('http_reqs (count/rate)', metrics.http_reqs, ['count', 'rate', ''])}
      ${metricRow('checks (passes/fails/rate)', metrics.checks, ['passes', 'fails', 'rate'])}
      ${metricRow('vus (value/max)', metrics.vus, ['value', 'max', 'min'])}
      ${metricRow('iteration_duration (avg/p95/p99 ms)', metrics.iteration_duration, ['avg', 'p(95)', 'p(99)'])}
    </tbody>
  </table>
</body>
</html>
`

  fs.mkdirSync(path.dirname(args.output), { recursive: true })
  fs.writeFileSync(args.output, html)
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to render k6 summary: ${message}`)
  process.exit(1)
}

