#!/usr/bin/env node
import { runExperiment, parseRunOverrides } from './orchestrator'
import { DEFAULT_CONFIG } from './config'
import type { OrchestratorRunConfig } from './schema'

const printUsage = (): void => {
  console.log(`Monito vs Provider comparison harness

Usage:
  node src/index.ts run [options]

Options:
  --corridor <fromCountry-toCountry-fromCurrency-toCurrency>
  --amounts <comma-separated>
  --interval <seconds>
  --duration <minutes>
  --concurrency <number>
  --retries <number>
  --top-n <number>
  --headless <true|false>
  --match-window <seconds>
`)
}

const normalizeBooleanEnv = (value: unknown): boolean | null => {
  if (typeof value !== 'string') return null
  const normalized = value.toLowerCase().trim()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return null
}

const buildConfig = (rawArgs: string[]): OrchestratorRunConfig => {
  const overrides = parseRunOverrides(rawArgs)
  const envHeadless = normalizeBooleanEnv(process.env.MONITO_HARNESS_HEADLESS)
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    headlessBrowser: overrides.headlessBrowser ?? envHeadless ?? DEFAULT_CONFIG.headlessBrowser,
  }
}

const run = async (args: string[]): Promise<void> => {
  const command = args[0]
  const commandArgs = args.slice(1)

  if (command !== 'run') {
    printUsage()
    process.exitCode = 1
    return
  }

  const config = buildConfig(commandArgs)
  const result = await runExperiment(config)
  console.log(`run_id=${result.runId}`)
  console.log(`manifest=${result.evidencePath}`)
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage()
    return
  }

  try {
    await run(args)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Run failed: ${message}`)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
    process.exitCode = 1
  }
}

void main()

