import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const AWS_SDK_DIRECT_PACKAGES = new Set([
  '@aws-sdk/client-cloudwatch',
  '@aws-sdk/client-ecs',
  '@aws-sdk/client-elasticache',
  '@aws-sdk/client-eventbridge',
  '@aws-sdk/client-rds',
  '@aws-sdk/client-s3',
  '@aws-sdk/client-secrets-manager',
  '@aws-sdk/client-ses',
  '@aws-sdk/client-sns',
  '@aws-sdk/client-sqs',
  '@aws-sdk/client-ssm',
  '@aws-sdk/s3-request-presigner',
])

const unique = <T,>(items: T[]): T[] => Array.from(new Set(items))

const parseLockfileResolvedAwsSdkVersions = (): string[] => {
  // Workspace lockfile lives at repo root.
  const lockPath = resolve(process.cwd(), '..', 'pnpm-lock.yaml')
  const text = readFileSync(lockPath, 'utf8')

  // Example lock entries:
  //   '@aws-sdk/client-s3@3.981.0':
  const re = /'(@aws-sdk\/[^@]+)@(\d+\.\d+\.\d+)'/g
  const versions: string[] = []
  for (;;) {
    const match = re.exec(text)
    if (!match) break
    const name = match[1]
    const version = match[2]
    if (AWS_SDK_DIRECT_PACKAGES.has(name)) {
      versions.push(version)
    }
  }
  return unique(versions)
}

const parseDirectAwsSdkVersionsFromPnpmLs = (): string[] => {
  const raw = execSync('pnpm ls --depth=0 --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const parsed = JSON.parse(raw) as Array<{
    dependencies?: Record<string, { version?: string } | string>
  }>
  const root = parsed[0] ?? {}
  const deps = root.dependencies ?? {}

  const versions: string[] = []
  for (const [name, meta] of Object.entries(deps)) {
    if (!AWS_SDK_DIRECT_PACKAGES.has(name)) continue
    const version = typeof meta === 'string' ? meta : meta.version
    if (version) versions.push(version)
  }
  return unique(versions)
}

const main = () => {
  const direct = parseDirectAwsSdkVersionsFromPnpmLs()
  if (direct.length > 1) {
    console.error('AWS SDK surface direct dependencies are misaligned:', direct)
    process.exit(1)
  }

  const resolved = parseLockfileResolvedAwsSdkVersions()
  if (resolved.length > 1) {
    console.error('AWS SDK surface resolved versions in pnpm-lock.yaml are misaligned:', resolved)
    process.exit(1)
  }

  if (direct.length === 0 && resolved.length === 0) {
    console.warn('No @aws-sdk/* dependencies found (skipping check).')
    return
  }

  const version = direct[0] ?? resolved[0]
  console.log(`AWS SDK alignment OK: ${version}`)
}

main()
