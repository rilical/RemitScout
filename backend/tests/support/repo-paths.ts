import { existsSync } from 'node:fs'
import path from 'node:path'

const resolveRepoRootFrom = (startDir: string): string | null => {
  let dir = startDir
  for (let i = 0; i < 12; i += 1) {
    const docsCandidate = path.join(dir, 'docs')
    const remitScoutCandidate = path.join(dir, '.remit-scout')
    if (existsSync(docsCandidate) && existsSync(remitScoutCandidate)) {
      return dir
    }

    const parent = path.dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  return null
}

export const resolveRepoRoot = (startDir: string): string => {
  return (
    resolveRepoRootFrom(process.cwd())
    ?? resolveRepoRootFrom(startDir)
    ?? path.resolve(process.cwd(), '..')
  )
}

export const resolveRepoPath = (startDir: string, ...segments: string[]): string => {
  return path.join(resolveRepoRoot(startDir), ...segments)
}
