import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

type GateCheck = {
  description: string
  command: string
  requiresEnv?: string[]
}

type GateProfile = {
  description: string
  checks: string[]
}

type GateManifest = {
  version: number
  profiles: Record<string, GateProfile>
  checks: Record<string, GateCheck>
}

type RunStatus = 'pass' | 'fail' | 'skipped'

type RunResult = {
  id: string
  status: RunStatus
  description: string
  command: string
  note?: string
}

type CliOptions = {
  checklist: boolean
  profile: string
}

const repoRoot = path.resolve(__dirname, '../../..')
const manifestPath = path.join(repoRoot, '.remit-scout', 'release-correctness-gates.json')

const parseArgs = (argv: string[]): CliOptions => {
  let profile = 'prepush'
  let checklist = false

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--checklist') {
      checklist = true
      continue
    }
    if (token === '--profile') {
      profile = argv[index + 1] || profile
      index += 1
      continue
    }
    if (!token.startsWith('--')) {
      profile = token
    }
  }

  return {
    checklist,
    profile,
  }
}

const loadManifest = async (): Promise<GateManifest> => {
  const raw = await readFile(manifestPath, 'utf8')
  return JSON.parse(raw) as GateManifest
}

const findMissingEnv = (keys: readonly string[]) =>
  keys.filter((key) => !String(process.env[key] || '').trim())

const runCommand = async (command: string): Promise<{ ok: boolean; note?: string }> =>
  await new Promise((resolve) => {
    const child = spawn(command, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: process.env.SHELL?.trim() || true,
      env: process.env,
    })

    child.on('error', (error) => {
      resolve({
        ok: false,
        note: error.message,
      })
    })

    child.on('exit', (code, signal) => {
      if (signal) {
        resolve({
          ok: false,
          note: `terminated by ${signal}`,
        })
        return
      }
      resolve({
        ok: code === 0,
        note: code === 0 ? undefined : `exit=${String(code ?? 'unknown')}`,
      })
    })
  })

const printChecklist = (
  profileName: string,
  profile: GateProfile,
  manifest: GateManifest,
) => {
  console.log(`Release Correctness Checklist — ${profileName}`)
  console.log(profile.description)
  console.log('')

  profile.checks.forEach((checkId, index) => {
    const check = manifest.checks[checkId]
    if (!check) {
      console.log(`${index + 1}. [ ] ${checkId} (missing from manifest)`)
      return
    }
    console.log(`${index + 1}. [ ] ${check.description}`)
    console.log(`   id: ${checkId}`)
    console.log(`   run: ${check.command}`)
    if (check.requiresEnv?.length) {
      console.log(`   env: ${check.requiresEnv.join(', ')}`)
    }
  })
}

const printSummary = (profileName: string, results: RunResult[]) => {
  console.log('')
  console.log(`Release Correctness Gate Summary — ${profileName}`)

  for (const result of results) {
    const marker =
      result.status === 'pass' ? 'PASS'
        : result.status === 'skipped' ? 'SKIP'
          : 'FAIL'
    const detail = result.note ? ` | ${result.note}` : ''
    console.log(`${marker} ${result.id} | ${result.description}${detail}`)
  }

  const failures = results.filter((result) => result.status === 'fail')
  const skipped = results.filter((result) => result.status === 'skipped')
  console.log('')
  console.log(
    `Verdict: ${failures.length === 0 ? 'PASS' : 'FAIL'} | passed=${results.length - failures.length - skipped.length} failed=${failures.length} skipped=${skipped.length}`,
  )
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  const manifest = await loadManifest()
  const profile = manifest.profiles[options.profile]

  if (!profile) {
    const available = Object.keys(manifest.profiles).sort().join(', ')
    throw new Error(`Unknown profile "${options.profile}". Available profiles: ${available}`)
  }

  if (options.checklist) {
    printChecklist(options.profile, profile, manifest)
    return
  }

  console.log(`Release Correctness Gate — ${options.profile}`)
  console.log(profile.description)
  console.log(`Catalog: ${path.relative(repoRoot, manifestPath)}`)

  const results: RunResult[] = []

  for (const checkId of profile.checks) {
    const check = manifest.checks[checkId]
    if (!check) {
      results.push({
        id: checkId,
        status: 'fail',
        description: 'Missing manifest entry',
        command: '',
        note: 'check id not found',
      })
      continue
    }

    const missingEnv = findMissingEnv(check.requiresEnv ?? [])
    if (missingEnv.length > 0) {
      results.push({
        id: checkId,
        status: 'fail',
        description: check.description,
        command: check.command,
        note: `missing env: ${missingEnv.join(', ')}`,
      })
      continue
    }

    console.log('')
    console.log(`==> ${checkId}`)
    console.log(check.description)
    console.log(`$ ${check.command}`)

    const outcome = await runCommand(check.command)
    results.push({
      id: checkId,
      status: outcome.ok ? 'pass' : 'fail',
      description: check.description,
      command: check.command,
      note: outcome.note,
    })
  }

  printSummary(options.profile, results)

  if (results.some((result) => result.status === 'fail')) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(
    'Release correctness gate crashed:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
})
