import fs from 'node:fs'
import path from 'node:path'

type ProviderCatalog = {
  version: number
  providers: Array<{
    provider_id: string
    probe?: {
      aws_scheduled?: boolean
      github_actions?: boolean
    }
  }>
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const catalogPath = path.join(repoRoot, '.remit-scout', 'providers', 'catalog.json')

const fail = (message: string): never => {
  console.error(`validate-provider-probe-coverage failed: ${message}`)
  process.exit(1)
}

const main = (): void => {
  if (!fs.existsSync(catalogPath)) {
    fail(`missing provider catalog: ${catalogPath}`)
  }

  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ProviderCatalog
  const providers = Array.isArray(raw.providers) ? raw.providers : []
  if (providers.length === 0) {
    fail('provider catalog has no providers')
  }

  const noProbePath = providers
    .map((provider) => {
      const providerId = String(provider?.provider_id || '').trim()
      const awsScheduled = provider?.probe?.aws_scheduled === true
      const githubActions = provider?.probe?.github_actions === true
      return { providerId, awsScheduled, githubActions }
    })
    .filter((provider) => !provider.providerId || (!provider.awsScheduled && !provider.githubActions))

  if (noProbePath.length > 0) {
    const providerIds = noProbePath.map((provider) => provider.providerId || '<missing_provider_id>')
    fail(`providers missing both probe paths: ${providerIds.join(', ')}`)
  }

  console.log(
    `validate-provider-probe-coverage ok (providers=${providers.length}, noProbeCount=${noProbePath.length})`,
  )
}

main()
