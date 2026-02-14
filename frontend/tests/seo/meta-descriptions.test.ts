import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type SeoEntry = {
  file: string
  title: string
  description: string
}

const walk = (dir: string): string[] => {
  const out: string[] = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walk(p))
    else if (ent.isFile() && p.endsWith('.vue')) out.push(p)
  }
  return out
}

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

// Prefer `frontend/` as vitest cwd, but support running from repo root too.
const resolvePagesDir = () => {
  const candidates = [
    path.resolve(process.cwd(), 'pages'),
    path.resolve(process.cwd(), 'frontend/pages'),
  ]
  const found = candidates.find(p => fs.existsSync(p))
  if (!found) throw new Error(`Could not find Nuxt pages dir. Tried: ${candidates.join(', ')}`)
  return found
}

const isLikelyIndexablePage = (relFromPages: string) => {
  const p = relFromPages.replace(/\\/g, '/')
  if (p.startsWith('admin/')) return false
  if (p.startsWith('auth/')) return false
  if (p.startsWith('embed/')) return false
  if (p.startsWith('preview/')) return false
  if (p.startsWith('newsletter/')) return false
  if (p.startsWith('go/')) return false
  if (p === 'maintenance.vue') return false
  if (p === 'sign-in.vue') return false
  if (p === 'sign-up.vue') return false
  if (p === 'forgot-password.vue') return false
  if (p === 'reset-password.vue') return false
  if (p === 'plus/success.vue') return false
  return true
}

const extractIndexableSeoEntries = (): SeoEntry[] => {
  const pagesDir = resolvePagesDir()
  const files = walk(pagesDir)

  // Captures string-literal title/description inside each `setSeo({ ... })` call.
  // Supports escaped quotes, and backticks (template literals) as long as they don't contain `${...}`.
  const re = /setSeo\(\s*\{[\s\S]*?\btitle\s*:\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1[\s\S]*?\bdescription\s*:\s*(['"`])((?:\\.|(?!\3)[\s\S])*?)\3[\s\S]*?\}\s*\)/g

  const out: SeoEntry[] = []

  for (const file of files) {
    const relFromPages = path.relative(pagesDir, file).replace(/\\/g, '/')
    if (!isLikelyIndexablePage(relFromPages)) continue

    const content = fs.readFileSync(file, 'utf8')
    let match: RegExpExecArray | null
    while ((match = re.exec(content))) {
      const fullCall = match[0]
      if (/\bnoindex\s*:\s*true\b/.test(fullCall)) continue

      const titleQuote = match[1]
      const rawTitle = match[2]
      const descQuote = match[3]
      const rawDescription = match[4]

      // Skip dynamic titles/descriptions.
      if (titleQuote === '`' && rawTitle.includes('${')) continue
      if (descQuote === '`' && rawDescription.includes('${')) continue

      out.push({
        file: relFromPages,
        title: normalize(rawTitle),
        description: normalize(rawDescription),
      })
    }
  }

  return out
}

describe('SEO meta descriptions', () => {
  it('keeps indexable titles/descriptions within SERP-friendly lengths and avoids duplicates', () => {
    const entries = extractIndexableSeoEntries()
    expect(entries.length).toBeGreaterThan(0)

    for (const e of entries) {
      expect(e.title.length, `${e.file} title length`).toBeGreaterThanOrEqual(30)
      expect(e.title.length, `${e.file} title length`).toBeLessThanOrEqual(60)

      expect(e.description.length, `${e.file} description length`).toBeGreaterThanOrEqual(120)
      expect(e.description.length, `${e.file} description length`).toBeLessThanOrEqual(160)
    }

    const titleToFiles = new Map<string, string[]>()
    const descToFiles = new Map<string, string[]>()

    for (const e of entries) {
      titleToFiles.set(e.title, (titleToFiles.get(e.title) || []).concat(e.file))
      descToFiles.set(e.description, (descToFiles.get(e.description) || []).concat(e.file))
    }

    const dupTitles = [...titleToFiles.entries()].filter(([, files]) => files.length > 1)
    const dupDescs = [...descToFiles.entries()].filter(([, files]) => files.length > 1)

    expect(dupTitles, `Duplicate titles: ${JSON.stringify(dupTitles, null, 2)}`).toHaveLength(0)
    expect(dupDescs, `Duplicate descriptions: ${JSON.stringify(dupDescs, null, 2)}`).toHaveLength(0)
  })
})
