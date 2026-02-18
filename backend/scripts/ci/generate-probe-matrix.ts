/**
 * Generate a GitHub Actions matrix for provider probes.
 *
 * This intentionally reads the repo-native provider catalog:
 *   `.remit-scout/providers/catalog.json`
 *
 * Output:
 *   {"provider":["remitly","wise",...]}
 */

import { listGithubActionsProbeProviders } from '../../shared/provider-catalog'

const main = () => {
  const providers = listGithubActionsProbeProviders()
  process.stdout.write(JSON.stringify({ provider: providers }, null, 0))
}

main()

