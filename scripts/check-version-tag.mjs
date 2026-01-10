import fs from 'node:fs/promises'

const tag = process.env.GITHUB_REF_NAME || process.env.TAG_NAME || ''
const normalizedTag = tag.startsWith('v') ? tag.slice(1) : tag

if (!normalizedTag) {
  console.error('Missing tag name (GITHUB_REF_NAME or TAG_NAME).')
  process.exit(1)
}

const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url)))
const version = pkg.version

if (version !== normalizedTag) {
  console.error(`Tag ${tag} does not match package.json version ${version}`)
  process.exit(1)
}

console.log(`✅ Tag ${tag} matches package.json version ${version}`)
