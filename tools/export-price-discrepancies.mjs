import fs from 'fs'
import path from 'path'

const baseUrl = process.env.PLANE_A_BASE_URL
const apiKey = process.env.PLANE_A_API_KEY || process.env.API_ACCESS_TOKEN
const amount = Number(process.env.AMOUNT || 500)
const payin = process.env.PAYIN || 'bank_transfer'
const payout = process.env.PAYOUT || 'bank_deposit'
const concurrency = Number(process.env.CONCURRENCY || 4)

if (!baseUrl) {
  console.error('PLANE_A_BASE_URL is required')
  process.exit(1)
}

const headers = apiKey ? { 'x-api-key': apiKey } : {}

const fetchJson = async (url, attempt = 1) => {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (attempt < 3 && (res.status >= 500 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, 500 * attempt))
      return fetchJson(url, attempt + 1)
    }
    throw new Error(`HTTP ${res.status} ${text}`)
  }
  return res.json()
}

const readHealthCorridors = () => {
  const filePath = path.resolve('backend/shared/health-corridors.ts')
  const content = fs.readFileSync(filePath, 'utf8')
  const regex = /'[A-Z]{2}-[A-Z]{2}-[A-Z]{3}-[A-Z]{3}'/g
  const matches = content.match(regex) || []
  return Array.from(new Set(matches.map((m) => m.replace(/'/g, ''))))
}

const corridors = readHealthCorridors()
console.log(`Found corridors: ${corridors.length}`)

const rows = []
const queue = corridors.slice()

const worker = async () => {
  while (queue.length) {
    const corridorId = queue.shift()
    if (!corridorId) return
    try {
      const url = `${baseUrl}/api/v1/quotes/current?corridor_id=${corridorId}&amount=${amount}&payin=${payin}&payout=${payout}&live=true`
      const payload = await fetchJson(url)
      const quotes = Array.isArray(payload.quotes) ? payload.quotes : []
      if (!quotes.length) continue

      const best = quotes.reduce((max, q) => (q.receive_amount > max ? q.receive_amount : max), -Infinity)
      const providerCount = quotes.length
      const today = new Date().toISOString().split('T')[0]

      for (const quote of quotes) {
        const receive = Number(quote.receive_amount)
        const delta = best - receive
        const deltaPct = best ? delta / best : null
        rows.push({
          date: today,
          corridor_id: corridorId,
          amount_bucket: amount,
          payin,
          payout,
          provider_id: quote.provider_id || '',
          send_amount: quote.send_amount ?? amount,
          receive_amount: receive,
          best_receive_amount: best,
          delta_amount: delta,
          delta_pct: deltaPct,
          fee_amount: quote.fee_amount ?? null,
          total_debit_amount: quote.total_debit_amount ?? null,
          implied_fx_rate: quote.implied_fx_rate ?? null,
          provider_count: providerCount,
        })
      }
    } catch (error) {
      console.warn(`Failed ${corridorId}:`, error.message)
    }
  }
}

const workers = []
for (let i = 0; i < concurrency; i += 1) {
  workers.push(worker())
}
await Promise.all(workers)

const headersCsv = [
  'date','corridor_id','amount_bucket','payin','payout','provider_id','send_amount','receive_amount','best_receive_amount',
  'delta_amount','delta_pct','fee_amount','total_debit_amount','implied_fx_rate','provider_count',
]

const lines = [headersCsv.join(',')]
for (const row of rows) {
  const line = headersCsv.map((key) => {
    const value = row[key]
    if (value === null || value === undefined) return ''
    if (typeof value === 'number') return Number.isFinite(value) ? value : ''
    const text = String(value).replace(/"/g, '""')
    return text.includes(',') ? `"${text}"` : text
  }).join(',')
  lines.push(line)
}

const outPath = path.resolve('investor_price_discrepancies_current.csv')
fs.writeFileSync(outPath, lines.join('\n'))
console.log(`Wrote ${outPath} (${rows.length} rows)`)
