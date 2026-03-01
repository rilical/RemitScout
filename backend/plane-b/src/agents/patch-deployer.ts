import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import type { PatchProposal } from './patch-proposer'
import type { ValidationResult } from './patch-validator'
import { ToolGateway } from './tool-gateway'
import { notifyAgent } from '../../../shared/agent-notifications'
import { KnowledgePlane } from './knowledge-plane'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'

const logger = createLogger('plane-b.agents.patch-deployer')

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (): Record<string, string> => ({
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  service: 'remit-scout',
})

/**
 * Deployment result.
 */
export type DeployResult = {
  bundleId: string
  moduleId: string
  deployed: boolean
  method: 'pr' | 'direct' | 'deferred'
  prUrl: string | null
  reason: string
}

/**
 * Patch Deployer — applies validated patches to the codebase.
 *
 * The deployer operates in propose-only mode by default:
 * - Creates a GitHub PR with the proposed changes
 * - Records the PR URL on the failure bundle
 * - Requires human review and merge
 *
 * Direct application (without PR) is gated behind the `AGENT_DIRECT_DEPLOY` flag
 * and requires `autoHealEnabled` in the module's policy.
 */
export class PatchDeployer {
  private readonly pool: Pool
  private readonly toolGateway: ToolGateway
  private readonly knowledgePlane: KnowledgePlane

  constructor(pool: Pool) {
    this.pool = pool
    this.toolGateway = new ToolGateway(pool)
    this.knowledgePlane = new KnowledgePlane(pool)
  }

  /**
   * Deploy a validated patch proposal.
   */
  async deploy(
    proposal: PatchProposal,
    validation: ValidationResult,
  ): Promise<DeployResult> {
    if (!validation.valid) {
      return {
        bundleId: proposal.bundleId,
        moduleId: proposal.moduleId,
        deployed: false,
        method: 'deferred',
        prUrl: null,
        reason: `Validation failed: ${validation.summary}`,
      }
    }

    logger.info('deploying_patch', {
      bundleId: proposal.bundleId,
      moduleId: proposal.moduleId,
      confidence: proposal.confidence,
    })

    // Check if direct deploy is allowed
    const directDeploy = process.env.AGENT_DIRECT_DEPLOY === 'true'
    const { rows: modules } = await this.pool.query<{ policy: Record<string, unknown> }>(
      `SELECT policy FROM silver.module_registry WHERE module_id = $1`,
      [proposal.moduleId],
    )

    const autoHealEnabled = modules.length > 0 && (modules[0].policy as { autoHealEnabled?: boolean })?.autoHealEnabled === true

    if (directDeploy && autoHealEnabled && proposal.confidence === 'high') {
      // Direct application path — only for high-confidence proposals on auto-heal modules
      return this.deployDirect(proposal)
    }

    // Default: PR-based deployment (propose-only governance)
    return this.deployViaPR(proposal)
  }

  /**
   * Create a PR with the proposed changes via the GitHub API.
   *
   * Uses the tool gateway's github_api tool to:
   * 1. Create a branch (agent/repair-{bundleId})
   * 2. Commit patch files to the branch
   * 3. Create a pull request with repair context
   *
   * Falls back to a deferred record if the GitHub token or tool access is unavailable.
   */
  private async deployViaPR(proposal: PatchProposal): Promise<DeployResult> {
    const owner = process.env.GITHUB_REPO_OWNER
    const repo = process.env.GITHUB_REPO_NAME
    const token = process.env.AGENT_GITHUB_TOKEN

    // Fall back to deferred if GitHub is not configured
    if (!owner || !repo || !token) {
      logger.info('github_not_configured', { bundleId: proposal.bundleId })
      return this.deferPR(proposal, 'GitHub credentials not configured (GITHUB_REPO_OWNER, GITHUB_REPO_NAME, AGENT_GITHUB_TOKEN)')
    }

    const branchName = `agent/repair-${proposal.bundleId.slice(0, 8)}`
    const prTitle = `[Agent] Repair ${proposal.providerId}: ${proposal.description.slice(0, 60)}`

    try {
      // Step 1: Get default branch SHA
      const refResult = await this.toolGateway.submit({
        agentId: 'patch-deployer',
        moduleId: proposal.moduleId,
        toolType: 'github_api',
        operation: 'Get default branch ref',
        params: {
          method: 'GET',
          endpoint: `/repos/${owner}/${repo}/git/ref/heads/main`,
          token,
        },
        requiresApproval: false,
        ttlMs: 15_000,
      })

      if (!refResult.success) {
        return this.deferPR(proposal, `Failed to get default branch: ${refResult.errorMessage}`)
      }

      const baseSha = (refResult.data as { object?: { sha?: string } })?.object?.sha
      if (!baseSha) {
        return this.deferPR(proposal, 'Could not resolve base SHA from default branch')
      }

      // Step 2: Create the repair branch
      const createBranchResult = await this.toolGateway.submit({
        agentId: 'patch-deployer',
        moduleId: proposal.moduleId,
        toolType: 'github_api',
        operation: `Create branch ${branchName}`,
        params: {
          method: 'POST',
          endpoint: `/repos/${owner}/${repo}/git/refs`,
          token,
          body: { ref: `refs/heads/${branchName}`, sha: baseSha },
        },
        requiresApproval: false,
        ttlMs: 15_000,
      })

      if (!createBranchResult.success) {
        return this.deferPR(proposal, `Failed to create branch: ${createBranchResult.errorMessage}`)
      }

      // Step 3: Commit each change to the branch
      for (const change of proposal.changes) {
        if (change.changeType === 'edit' && change.newContent) {
          await this.toolGateway.submit({
            agentId: 'patch-deployer',
            moduleId: proposal.moduleId,
            toolType: 'github_api',
            operation: `Update file ${change.filePath}`,
            params: {
              method: 'PUT',
              endpoint: `/repos/${owner}/${repo}/contents/${change.filePath}`,
              token,
              body: {
                message: `fix(${proposal.providerId}): ${change.description.slice(0, 72)}`,
                content: Buffer.from(change.newContent).toString('base64'),
                branch: branchName,
              },
            },
            requiresApproval: false,
            ttlMs: 15_000,
          })
        }
      }

      // Step 4: Create the pull request
      const prBody = [
        `## Agent Repair Proposal`,
        '',
        `**Bundle:** \`${proposal.bundleId}\``,
        `**Module:** \`${proposal.moduleId}\``,
        `**Provider:** \`${proposal.providerId}\``,
        `**Confidence:** ${proposal.confidence}`,
        '',
        `### Reasoning`,
        proposal.reasoning,
        '',
        `### Changes`,
        ...proposal.changes.map((c) => `- \`${c.filePath}\`: ${c.description}`),
        '',
        '---',
        '_This PR was created automatically by the agent self-healing pipeline._',
      ].join('\n')

      const createPrResult = await this.toolGateway.submit({
        agentId: 'patch-deployer',
        moduleId: proposal.moduleId,
        toolType: 'github_api',
        operation: 'Create pull request',
        params: {
          method: 'POST',
          endpoint: `/repos/${owner}/${repo}/pulls`,
          token,
          body: {
            title: prTitle,
            body: prBody,
            head: branchName,
            base: 'main',
          },
        },
        requiresApproval: false,
        ttlMs: 15_000,
      })

      if (!createPrResult.success) {
        return this.deferPR(proposal, `Failed to create PR: ${createPrResult.errorMessage}`)
      }

      const prUrl = (createPrResult.data as { html_url?: string })?.html_url ?? null

      // Record success
      await this.pool.query(
        `INSERT INTO silver.agent_action
         (agent_id, module_id, action_type, description, status, requires_approval, result)
         VALUES ($1, $2, 'patch_deploy', $3, 'completed', FALSE, $4)`,
        [
          'patch-deployer',
          proposal.moduleId,
          `PR created for ${proposal.providerId}: ${proposal.description}`,
          JSON.stringify({ method: 'pr', prUrl, branchName }),
        ],
      )

      await this.pool.query(
        `UPDATE silver.failure_bundle
         SET repair_outcome = 'deployed', repair_pr_url = $2, updated_at = NOW()
         WHERE bundle_id = $1`,
        [proposal.bundleId, prUrl],
      )

      // Index the repair for future knowledge
      await this.knowledgePlane.indexRepair({
        bundleId: proposal.bundleId,
        moduleId: proposal.moduleId,
        providerId: proposal.providerId,
        description: proposal.description,
        prUrl,
      })

      // Notify Slack
      notifyAgent({
        type: 'repair_deployed',
        title: `PR created for ${proposal.providerId}: ${proposal.description}`,
        severity: 'info',
        details: {
          bundleId: proposal.bundleId,
          prUrl: prUrl ?? 'unknown',
          confidence: proposal.confidence,
          branchName,
        },
      }).catch(() => {})

      recordCloudWatchMetric({
        name: 'deploy_pr_created',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions(),
      })

      logger.info('patch_pr_created', {
        bundleId: proposal.bundleId,
        moduleId: proposal.moduleId,
        prUrl,
        branchName,
      })

      return {
        bundleId: proposal.bundleId,
        moduleId: proposal.moduleId,
        deployed: true,
        method: 'pr',
        prUrl,
        reason: `PR created: ${prUrl}`,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error('deploy_via_pr_error', { bundleId: proposal.bundleId, error: message })
      recordCloudWatchMetric({
        name: 'deploy_pr_failed',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions(),
      })
      return this.deferPR(proposal, `Unexpected error: ${message}`)
    }
  }

  /**
   * Record a deferred PR deployment when GitHub integration is unavailable.
   */
  private async deferPR(proposal: PatchProposal, reason: string): Promise<DeployResult> {
    recordCloudWatchMetric({
      name: 'deploy_pr_deferred',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions(),
    })

    await this.pool.query(
      `INSERT INTO silver.agent_action
       (agent_id, module_id, action_type, description, status, requires_approval, result)
       VALUES ($1, $2, 'patch_deploy', $3, 'pending', TRUE, $4)`,
      [
        'patch-deployer',
        proposal.moduleId,
        `PR deployment deferred for ${proposal.providerId}: ${proposal.description}`,
        JSON.stringify({ method: 'pr', proposal, reason }),
      ],
    )

    await this.pool.query(
      `UPDATE silver.failure_bundle
       SET repair_outcome = 'proposed', updated_at = NOW()
       WHERE bundle_id = $1`,
      [proposal.bundleId],
    )

    return {
      bundleId: proposal.bundleId,
      moduleId: proposal.moduleId,
      deployed: false,
      method: 'pr',
      prUrl: null,
      reason,
    }
  }

  /**
   * Apply patch directly (requires autoHealEnabled + AGENT_DIRECT_DEPLOY).
   * Currently deferred — direct deployment is not yet implemented.
   */
  private async deployDirect(proposal: PatchProposal): Promise<DeployResult> {
    logger.warn('direct_deploy_not_implemented', {
      bundleId: proposal.bundleId,
      moduleId: proposal.moduleId,
    })

    return {
      bundleId: proposal.bundleId,
      moduleId: proposal.moduleId,
      deployed: false,
      method: 'deferred',
      prUrl: null,
      reason: 'Direct deployment not yet implemented — falling back to PR workflow',
    }
  }
}
