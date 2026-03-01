import { execSync } from 'node:child_process'
import fs from 'node:fs'

const getTrackedFiles = (): string[] => {
  const raw = execSync('git ls-files -z', { encoding: 'utf8' })
  return raw
    .split('\0')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const hasSourceForDistArtifact = (distPath: string): boolean => {
  let relative = distPath.replace(/^backend\/dist\//, '')
  relative = relative
    .replace(/\.js\.map$/, '')
    .replace(/\.d\.ts\.map$/, '')
    .replace(/\.d\.ts$/, '')
    .replace(/\.js$/, '')

  const candidates = [
    `backend/${relative}.ts`,
    `backend/${relative}.tsx`,
    `backend/${relative}.mts`,
    `backend/${relative}.cts`,
    `backend/${relative}/index.ts`,
    `backend/${relative}/index.tsx`,
    `backend/${relative}/index.mts`,
    `backend/${relative}/index.cts`,
  ]

  return candidates.some((candidate) => fs.existsSync(candidate))
}

const run = () => {
  const tracked = getTrackedFiles()
  const violations: string[] = []

  for (const filePath of tracked) {
    if (/^backend\/plane-[abc]\/src\/.*\.d\.ts$/.test(filePath)) {
      violations.push(`${filePath} (generated declaration file inside src/)`)
    }

    if (/^backend\/plane-[abc]\/src\/.*\.js$/.test(filePath)) {
      violations.push(`${filePath} (compiled JavaScript artifact inside TypeScript src/)`)
    }

    if (filePath.startsWith('infrastructure/cdk/cdk.out')) {
      violations.push(`${filePath} (CDK synth/deploy artifact should not be tracked)`)
    }

    if (filePath.endsWith('.DS_Store')) {
      violations.push(`${filePath} (OS metadata artifact should not be tracked)`)
    }

    if (
      filePath.startsWith('backend/dist/') &&
      (filePath.endsWith('.js') ||
        filePath.endsWith('.d.ts') ||
        filePath.endsWith('.js.map') ||
        filePath.endsWith('.d.ts.map')) &&
      !filePath.endsWith('tsconfig.tsbuildinfo') &&
      !hasSourceForDistArtifact(filePath)
    ) {
      violations.push(`${filePath} (stale dist artifact without source counterpart)`)
    }
  }

  if (violations.length > 0) {
    console.error('Generated artifact guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log('Generated artifact guard passed.')
}

run()
