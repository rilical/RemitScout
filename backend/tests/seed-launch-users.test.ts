import { describe, expect, it } from 'vitest'
import {
  parseArgsFromArgv,
  printPasswordsEnabled,
  validatePasswordExportArgs,
} from '../scripts/seed-launch-users'

describe('seed-launch-users args', () => {
  it('parses print-passwords with explicit output path', () => {
    const parsed = parseArgsFromArgv(['--print-passwords', '--password-output', '/tmp/seeds.json'])

    expect(parsed).toMatchObject({
      printPasswords: true,
      passwordOutputPath: '/tmp/seeds.json',
    })
  })

  it('rejects password export when env opt-in is not enabled', () => {
    const parsed = parseArgsFromArgv(['--print-passwords', '--password-output', '/tmp/seeds.json'])

    expect(() =>
      validatePasswordExportArgs(parsed, { SEED_PRINT_PASSWORDS_ENABLED: '0' } as NodeJS.ProcessEnv),
    ).toThrow('Password export is disabled.')
  })

  it('rejects password export without output path', () => {
    const parsed = parseArgsFromArgv(['--print-passwords'])

    expect(() =>
      validatePasswordExportArgs(parsed, { SEED_PRINT_PASSWORDS_ENABLED: '1' } as NodeJS.ProcessEnv),
    ).toThrow('must provide --password-output')
  })

  it('accepts password export when env opt-in is enabled and path is present', () => {
    const parsed = parseArgsFromArgv(['--print-passwords', '--password-output=/tmp/seeds.json'])

    expect(() =>
      validatePasswordExportArgs(parsed, { SEED_PRINT_PASSWORDS_ENABLED: '1' } as NodeJS.ProcessEnv),
    ).not.toThrow()
    expect(printPasswordsEnabled({ SEED_PRINT_PASSWORDS_ENABLED: 'true' } as NodeJS.ProcessEnv)).toBe(
      true,
    )
  })
})
