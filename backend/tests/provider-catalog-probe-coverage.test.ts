import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type ProviderCatalog = {
  providers: Array<{
    provider_id: string
    probe?: {
      aws_scheduled?: boolean
      github_actions?: boolean
    }
  }>
}

describe('provider catalog probe coverage', () => {
  it('keeps every provider covered by aws_scheduled and github_actions probes', () => {
    const catalogPath = path.resolve(
      process.cwd(),
      '..',
      '.remit-scout',
      'providers',
      'catalog.json',
    )
    const raw = JSON.parse(readFileSync(catalogPath, 'utf8')) as ProviderCatalog
    const providers = raw.providers || []

    expect(providers.length).toBe(24)

    const missingAwsScheduled = providers
      .filter((provider) => provider.probe?.aws_scheduled !== true)
      .map((provider) => provider.provider_id)
    const missingGithubActions = providers
      .filter((provider) => provider.probe?.github_actions !== true)
      .map((provider) => provider.provider_id)
    const noProbePath = providers
      .filter((provider) =>
        provider.probe?.aws_scheduled !== true && provider.probe?.github_actions !== true,
      )
      .map((provider) => provider.provider_id)

    expect(missingAwsScheduled).toEqual([])
    expect(missingGithubActions).toEqual([])
    expect(noProbePath).toEqual([])
  })
})
