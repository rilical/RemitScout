import { stat, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const walkSize = async (dir) => {
  let total = 0
  const entries = await readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) {
      total += await walkSize(p)
    } else if (ent.isFile()) {
      total += (await stat(p)).size
    }
  }
  return total
}

const formatBytes = (n) => {
  const mb = n / (1024 * 1024)
  return `${mb.toFixed(2)} MiB`
}

const main = async () => {
  const root = resolve(process.cwd())
  const target = resolve(root, 'frontend', '.output', 'public', '_nuxt')
  const maxBytes = Number.parseInt(process.env.FRONTEND_NUXT_BUNDLE_MAX_BYTES ?? '', 10) || 30 * 1024 * 1024

  const size = await walkSize(target)
  console.log(`Nuxt bundle size (_nuxt): ${formatBytes(size)} (limit: ${formatBytes(maxBytes)})`)
  if (size > maxBytes) {
    console.error('Bundle size exceeded the limit.')
    process.exit(1)
  }
}

await main()

