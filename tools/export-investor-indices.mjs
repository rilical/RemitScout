import fs from 'fs'
import path from 'path'

const baseUrl = process.env.PLANE_A_BASE_URL
const apiKey = process.env.PLANE_A_API_KEY || process.env.API_ACCESS_TOKEN
const days = Number(process.env.INDICES_DAYS || 30)
const concurrency = Number(process.env.CONCURRENCY || 1)
const maxCorridors = Number(process.env.MAX_CORRIDORS || 200)
const requestDelayMs = Number(process.env.REQUEST_DELAY_MS || 150)

if (!baseUrl) {
  console.error('PLANE_A_BASE_URL is required')
  process.exit(1)
}

const headers = apiKey ? { 'x-api-key': apiKey } : {}

const fetchJson = async (url, attempt = 1) => {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (attempt < 6 && (res.status >= 500 || res.status === 429)) {
      const delayMs = res.status === 429 ? 3000 * attempt : 500 * attempt
      await new Promise((r) => setTimeout(r, delayMs))
      return fetchJson(url, attempt + 1)
    }
    throw new Error(`HTTP ${res.status} ${text}`)
  }
  return res.json()
}

const stddev = (values) => {
  if (!values.length) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

const avgAbsDelta = (values) => {
  if (values.length < 2) return null
  let total = 0
  for (let i = 1; i < values.length; i += 1) {
    total += Math.abs(values[i] - values[i - 1])
  }
  return total / (values.length - 1)
}

const pearson = (xs, ys) => {
  if (xs.length !== ys.length || xs.length < 2) return null
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  const denom = Math.sqrt(denX * denY)
  if (!denom) return null
  return num / denom
}

const writeCsv = (filePath, headers, rows) => {
  const lines = [headers.join(',')]
  for (const row of rows) {
    const line = headers.map((key) => {
      const value = row[key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return Number.isFinite(value) ? value : ''
      const text = String(value).replace(/"/g, '""')
      return text.includes(',') ? `"${text}"` : text
    }).join(',')
    lines.push(line)
  }
  fs.writeFileSync(filePath, lines.join('\n'))
}

const corridorList = await fetchJson(`${baseUrl}/api/v1/indices/corridors`)
const corridors = (corridorList.corridors || [])
  .sort((a, b) => (b.dataPoints || 0) - (a.dataPoints || 0))
  .slice(0, maxCorridors)

console.log(`Fetched corridors: ${corridors.length} (max ${maxCorridors})`)

const summaries = []
const correlations = []

const requestedCorridors = new Set([
  'US-MX-USD-MXN',
  'US-PH-USD-PHP',
  'US-IN-USD-INR',
  'US-NG-USD-NGN',
  'US-KE-USD-KES',
  'US-CO-USD-COP',
  'AE-IN-AED-INR',
])
const requestedRows = []

const queue = corridors.map((c) => c.corridorId)

const worker = async () => {
  while (queue.length) {
    const corridorId = queue.shift()
    if (!corridorId) return
    const seriesRes = await fetchJson(`${baseUrl}/api/v1/indices/series?corridor_id=${corridorId}&days=${days}`)
    if (requestDelayMs > 0) {
      await new Promise((r) => setTimeout(r, requestDelayMs))
    }
    const series = seriesRes.series || []

    const clean = series.filter((row) => !row.suppressionFlag)

    const teerValues = clean.map((row) => row.teer).filter((v) => typeof v === 'number')
    const rciValues = clean.map((row) => row.rci).filter((v) => typeof v === 'number')
    const rviValues = clean.map((row) => row.rvi_bps).filter((v) => typeof v === 'number')

    const avgProvider = clean.length
      ? clean.reduce((acc, row) => acc + (row.providerCountBinned || 0), 0) / clean.length
      : null

    if (corridorId && requestedCorridors.has(corridorId)) {
      requestedRows.push({
        corridor: corridorId,
        points: clean.length,
        last_updated: seriesRes.lastUpdated || null,
        teer_min: teerValues.length ? Math.min(...teerValues) : null,
        teer_max: teerValues.length ? Math.max(...teerValues) : null,
        rci_min: rciValues.length ? Math.min(...rciValues) : null,
        rci_max: rciValues.length ? Math.max(...rciValues) : null,
        rvi_bps_min: rviValues.length ? Math.min(...rviValues) : null,
        rvi_bps_max: rviValues.length ? Math.max(...rviValues) : null,
        avg_provider: avgProvider,
      })
    }

    if (teerValues.length && rciValues.length && rviValues.length) {
      summaries.push({
        corridor: corridorId,
        days: clean.length,
        teer_min: Math.min(...teerValues),
        teer_max: Math.max(...teerValues),
        teer_std: stddev(teerValues),
        teer_avg_abs_delta: avgAbsDelta(teerValues),
        rci_min: Math.min(...rciValues),
        rci_max: Math.max(...rciValues),
        rci_std: stddev(rciValues),
        rci_avg_abs_delta: avgAbsDelta(rciValues),
        rvi_bps_min: Math.min(...rviValues),
        rvi_bps_max: Math.max(...rviValues),
        rvi_bps_std: stddev(rviValues),
        rvi_bps_avg_abs_delta: avgAbsDelta(rviValues),
        avg_provider: avgProvider,
      })
    }

    const minLen = Math.min(teerValues.length, rciValues.length)
    const minLenRvi = Math.min(teerValues.length, rviValues.length)
    const minLenRciRvi = Math.min(rciValues.length, rviValues.length)

    if (minLen >= 2 || minLenRvi >= 2 || minLenRciRvi >= 2) {
      correlations.push({
        corridor: corridorId,
        points: clean.length,
        teer_rci_corr: minLen >= 2 ? pearson(teerValues.slice(0, minLen), rciValues.slice(0, minLen)) : null,
        teer_rvi_corr: minLenRvi >= 2 ? pearson(teerValues.slice(0, minLenRvi), rviValues.slice(0, minLenRvi)) : null,
        rci_rvi_corr: minLenRciRvi >= 2 ? pearson(rciValues.slice(0, minLenRciRvi), rviValues.slice(0, minLenRciRvi)) : null,
        avg_provider: avgProvider,
      })
    }
  }
}

const workers = []
for (let i = 0; i < concurrency; i += 1) {
  workers.push(worker())
}
await Promise.all(workers)

const summaryHeaders = [
  'corridor','days','teer_min','teer_max','teer_std','teer_avg_abs_delta',
  'rci_min','rci_max','rci_std','rci_avg_abs_delta',
  'rvi_bps_min','rvi_bps_max','rvi_bps_std','rvi_bps_avg_abs_delta','avg_provider',
]
const corrHeaders = ['corridor','points','teer_rci_corr','teer_rvi_corr','rci_rvi_corr','avg_provider']
const requestedHeaders = ['corridor','points','last_updated','teer_min','teer_max','rci_min','rci_max','rvi_bps_min','rvi_bps_max','avg_provider']

writeCsv(path.resolve('investor_indices_clean_nonzero.csv'), summaryHeaders, summaries)
writeCsv(path.resolve('investor_indices_corr.csv'), corrHeaders, correlations)
writeCsv(path.resolve('investor_requested_corridors.csv'), requestedHeaders, requestedRows)

console.log(`Wrote investor_indices_clean_nonzero.csv (${summaries.length})`)
console.log(`Wrote investor_indices_corr.csv (${correlations.length})`)
console.log(`Wrote investor_requested_corridors.csv (${requestedRows.length})`)
