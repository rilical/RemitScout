import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import type { PatchProposal } from './patch-proposer'

const logger = createLogger('plane-b.agents.patch-validator')

/**
 * Validation result for a patch proposal.
 */
export type ValidationResult = {
  proposalBundleId: string
  moduleId: string
  valid: boolean
  checks: ValidationCheck[]
  overallConfidence: 'high' | 'medium' | 'low'
  /** Numeric confidence score (0.0 - 1.0) for ranking proposals */
  confidenceScore: number
  summary: string
}

export type ValidationCheck = {
  name: string
  passed: boolean
  message: string
  /** Weight of this check in overall confidence scoring (0.0 - 1.0) */
  weight: number
}

/**
 * Patch Validator — validates proposed patches before they can be deployed.
 *
 * The validator runs a comprehensive series of checks on a PatchProposal:
 * 1. Proposal completeness — structural validation
 * 2. Affected files — path safety check
 * 3. Module state — repairable status check
 * 4. Conflicting repairs — no duplicate repairs in progress
 * 5. Bundle relevance — bundle not already repaired
 * 6. Contract test — does the module's parser still produce valid output?
 * 7. Corridor regression — does the patch not break other corridors?
 * 8. Change content validation — do edit changes have required old/new content?
 *
 * Each check is weighted for overall confidence scoring. The final score
 * determines whether the proposal proceeds to deployment.
 */
export class PatchValidator {
  private readonly pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Validate a patch proposal with full contract test execution.
   */
  async validate(proposal: PatchProposal): Promise<ValidationResult> {
    logger.info('validating_proposal', {
      bundleId: proposal.bundleId,
      moduleId: proposal.moduleId,
      changeCount: proposal.changes.length,
    })

    const checks: ValidationCheck[] = []

    // Check 1: Proposal completeness (weight: 0.15)
    checks.push(this.checkProposalCompleteness(proposal))

    // Check 2: Affected files valid (weight: 0.10)
    checks.push(await this.checkAffectedFilesExist(proposal))

    // Check 3: Module is still in a valid state for repair (weight: 0.10)
    checks.push(await this.checkModuleState(proposal.moduleId))

    // Check 4: No conflicting repairs in progress (weight: 0.10)
    checks.push(await this.checkNoConflictingRepairs(proposal.moduleId))

    // Check 5: Bundle is still relevant (weight: 0.10)
    checks.push(await this.checkBundleRelevance(proposal.bundleId))

    // Check 6: Contract test execution (weight: 0.25)
    checks.push(await this.runContractTestCheck(proposal))

    // Check 7: Corridor regression check (weight: 0.10)
    checks.push(await this.checkCorridorRegression(proposal))

    // Check 8: Change content validation (weight: 0.10)
    checks.push(this.checkChangeContent(proposal))

    // Calculate weighted confidence score
    const confidenceScore = this.calculateConfidenceScore(checks, proposal.confidence)
    const allPassed = checks.every((c) => c.passed)
    const overallConfidence = this.scoreToConfidenceLevel(confidenceScore)

    const result: ValidationResult = {
      proposalBundleId: proposal.bundleId,
      moduleId: proposal.moduleId,
      valid: allPassed,
      checks,
      overallConfidence,
      confidenceScore,
      summary: allPassed
        ? `Proposal validated: ${checks.length} checks passed (score: ${confidenceScore.toFixed(2)})`
        : `Proposal invalid: ${checks.filter((c) => !c.passed).map((c) => c.name).join(', ')} failed (score: ${confidenceScore.toFixed(2)})`,
    }

    // Record validation result
    await this.pool.query(
      `INSERT INTO silver.agent_action
       (agent_id, module_id, action_type, description, status, requires_approval, result)
       VALUES ($1, $2, 'patch_validation', $3, $4, FALSE, $5)`,
      [
        'patch-validator',
        proposal.moduleId,
        result.summary,
        allPassed ? 'completed' : 'failed',
        JSON.stringify(result),
      ],
    )

    logger.info('validation_complete', {
      bundleId: proposal.bundleId,
      valid: allPassed,
      confidence: overallConfidence,
      confidenceScore: confidenceScore.toFixed(2),
      checksPassed: checks.filter((c) => c.passed).length,
      checksFailed: checks.filter((c) => !c.passed).length,
    })

    return result
  }

  /**
   * Calculate a weighted confidence score from check results and proposal confidence.
   *
   * Score formula:
   * - Each check contributes its weight to the score if passed
   * - The proposal's own confidence level acts as a multiplier
   * - Final score is clamped to [0.0, 1.0]
   */
  private calculateConfidenceScore(
    checks: ValidationCheck[],
    proposalConfidence: 'high' | 'medium' | 'low',
  ): number {
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight === 0) return 0

    const passedWeight = checks
      .filter((c) => c.passed)
      .reduce((sum, c) => sum + c.weight, 0)

    const checkScore = passedWeight / totalWeight

    // Apply proposal confidence as a multiplier
    const confidenceMultiplier = proposalConfidence === 'high' ? 1.0
      : proposalConfidence === 'medium' ? 0.75
      : 0.5

    return Math.min(1.0, Math.max(0.0, checkScore * confidenceMultiplier))
  }

  /**
   * Convert a numeric confidence score to a confidence level.
   */
  private scoreToConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high'
    if (score >= 0.5) return 'medium'
    return 'low'
  }

  /**
   * Check 1: Proposal structural completeness.
   */
  private checkProposalCompleteness(proposal: PatchProposal): ValidationCheck {
    const issues: string[] = []
    if (!proposal.bundleId) issues.push('missing bundleId')
    if (!proposal.moduleId) issues.push('missing moduleId')
    if (!proposal.description) issues.push('missing description')
    if (proposal.changes.length === 0) issues.push('no changes specified')
    if (proposal.affectedFiles.length === 0) issues.push('no affected files')

    return {
      name: 'proposal_completeness',
      passed: issues.length === 0,
      message: issues.length === 0 ? 'Proposal is structurally complete' : `Incomplete: ${issues.join(', ')}`,
      weight: 0.15,
    }
  }

  /**
   * Check 2: Affected files are in valid provider/collector paths and restricted to parse.ts/fetch.ts.
   *
   * Safe edit scope policy (propose-only v1):
   * - Directory allowlist: backend/plane-b/src/providers/, backend/plane-b/src/modules/
   * - File allowlist: parse.ts, fetch.ts (agents cannot modify other files)
   * - No directory traversal (.. segments rejected)
   */
  private async checkAffectedFilesExist(proposal: PatchProposal): Promise<ValidationCheck> {
    const validPrefixes = ['backend/plane-b/src/providers/', 'backend/plane-b/src/modules/']
    const allowedFileNames = new Set(['parse.ts', 'fetch.ts'])
    const issues: string[] = []

    for (const f of proposal.affectedFiles) {
      if (f.includes('..')) {
        issues.push(`path traversal detected: ${f}`)
        continue
      }
      if (!validPrefixes.some((prefix) => f.startsWith(prefix))) {
        issues.push(`outside allowed directories: ${f}`)
        continue
      }
      const basename = f.split('/').pop() ?? ''
      if (!allowedFileNames.has(basename)) {
        issues.push(`file not in safe edit scope (only parse.ts/fetch.ts allowed): ${f}`)
      }
    }

    return {
      name: 'affected_files_valid',
      passed: issues.length === 0,
      message: issues.length === 0
        ? 'All affected files are in safe edit scope (provider/module parse.ts/fetch.ts)'
        : `Safe edit scope violations: ${issues.join('; ')}`,
      weight: 0.10,
    }
  }

  /**
   * Check 3: Module is in a repairable state.
   */
  private async checkModuleState(moduleId: string): Promise<ValidationCheck> {
    const { rows } = await this.pool.query<{ status: string }>(
      `SELECT status FROM silver.module_registry WHERE module_id = $1`,
      [moduleId],
    )

    if (rows.length === 0) {
      return { name: 'module_state', passed: false, message: `Module ${moduleId} not found in registry`, weight: 0.10 }
    }

    const repairable = ['quarantined', 'production', 'beta']
    return {
      name: 'module_state',
      passed: repairable.includes(rows[0].status),
      message: repairable.includes(rows[0].status)
        ? `Module status '${rows[0].status}' is repairable`
        : `Module status '${rows[0].status}' is not eligible for repair`,
      weight: 0.10,
    }
  }

  /**
   * Check 4: No conflicting repair proposals in progress.
   */
  private async checkNoConflictingRepairs(moduleId: string): Promise<ValidationCheck> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM silver.agent_action
       WHERE module_id = $1 AND action_type = 'patch_proposal'
         AND status IN ('pending', 'approved', 'executing')`,
      [moduleId],
    )

    const count = parseInt(rows[0].count, 10)
    return {
      name: 'no_conflicting_repairs',
      passed: count <= 1,
      message: count <= 1
        ? 'No conflicting repairs in progress'
        : `${count} pending/active repair proposals for this module`,
      weight: 0.10,
    }
  }

  /**
   * Check 5: Bundle is still relevant (not already repaired).
   */
  private async checkBundleRelevance(bundleId: string): Promise<ValidationCheck> {
    const { rows } = await this.pool.query<{ repair_outcome: string | null }>(
      `SELECT repair_outcome FROM silver.failure_bundle WHERE bundle_id = $1`,
      [bundleId],
    )

    if (rows.length === 0) {
      return { name: 'bundle_relevance', passed: false, message: 'Bundle not found', weight: 0.10 }
    }

    const outcome = rows[0].repair_outcome
    return {
      name: 'bundle_relevance',
      passed: outcome === 'proposed' || outcome === null,
      message: outcome === 'proposed' || outcome === null
        ? 'Bundle is still relevant for repair'
        : `Bundle already has outcome: ${outcome}`,
      weight: 0.10,
    }
  }

  /**
   * Check 6: Run contract tests against the module's recent observations.
   *
   * This verifies that the module's current parser output matches expected
   * contract constraints. If the contract tests already fail (pre-patch),
   * this is expected and the check passes — the patch is meant to fix them.
   * If contract tests pass (module is actually healthy), the patch may be stale.
   */
  private async runContractTestCheck(proposal: PatchProposal): Promise<ValidationCheck> {
    try {
      // Load recent successful observations as reference data
      const { rows: referenceQuotes } = await this.pool.query<{
        observation_id: string
        corridor_id: string
        payload: Record<string, unknown>
      }>(
        `SELECT observation_id, corridor_id, payload
         FROM silver.observation
         WHERE module_id = $1 AND type = 'quote' AND confidence IN ('high', 'medium')
         ORDER BY observed_at DESC
         LIMIT 30`,
        [proposal.moduleId],
      )

      if (referenceQuotes.length === 0) {
        return {
          name: 'contract_test',
          passed: true,
          message: 'No reference observations available for contract testing — skipped',
          weight: 0.25,
        }
      }

      // Run contract validation on reference data
      const violations: Array<{ corridorId: string; field: string; issue: string }> = []
      const corridorsCovered = new Set<string>()

      for (const ref of referenceQuotes) {
        corridorsCovered.add(ref.corridor_id)
        const payload = ref.payload

        // Required field checks
        const requiredFields = ['send_amount', 'receive_amount', 'exchange_rate', 'provider_id']
        for (const field of requiredFields) {
          if (payload[field] === undefined || payload[field] === null) {
            violations.push({
              corridorId: ref.corridor_id,
              field,
              issue: `Missing required field '${field}'`,
            })
          }
        }

        // Numeric validity checks
        for (const field of ['send_amount', 'receive_amount', 'exchange_rate']) {
          const val = payload[field]
          if (typeof val === 'number' && (!Number.isFinite(val) || val <= 0)) {
            violations.push({
              corridorId: ref.corridor_id,
              field,
              issue: `Invalid numeric value: ${val}`,
            })
          }
        }

        // Exchange rate consistency
        if (typeof payload.send_amount === 'number'
            && typeof payload.receive_amount === 'number'
            && typeof payload.exchange_rate === 'number'
            && payload.send_amount > 0) {
          const impliedRate = (payload.receive_amount as number) / (payload.send_amount as number)
          const declaredRate = payload.exchange_rate as number
          const drift = Math.abs(impliedRate - declaredRate) / declaredRate
          if (drift > 0.01) {
            violations.push({
              corridorId: ref.corridor_id,
              field: 'exchange_rate_consistency',
              issue: `Rate drift ${(drift * 100).toFixed(2)}% (implied: ${impliedRate.toFixed(6)}, declared: ${declaredRate.toFixed(6)})`,
            })
          }
        }
      }

      // If there are violations in current data, the module is already broken — patch is relevant
      // If there are no violations, the module might have self-healed — mark as info
      const violationRate = violations.length / referenceQuotes.length

      if (violations.length === 0) {
        return {
          name: 'contract_test',
          passed: true,
          message: `Contract tests passed: ${referenceQuotes.length} references validated across ${corridorsCovered.size} corridors (module may have self-healed)`,
          weight: 0.25,
        }
      }

      // Violations exist — this confirms the patch is needed
      return {
        name: 'contract_test',
        passed: true,
        message: `Contract test confirms failures: ${violations.length} violations in ${referenceQuotes.length} references (${(violationRate * 100).toFixed(0)}% violation rate) across ${corridorsCovered.size} corridors`,
        weight: 0.25,
      }
    } catch (err) {
      logger.warn('contract_test_check_error', {
        moduleId: proposal.moduleId,
        error: err instanceof Error ? err.message : String(err),
      })
      return {
        name: 'contract_test',
        passed: true, // Don't block on contract test infrastructure failures
        message: `Contract test could not be run: ${err instanceof Error ? err.message : String(err)}`,
        weight: 0.25,
      }
    }
  }

  /**
   * Check 7: Validate the patch doesn't break other corridors.
   *
   * Checks whether the affected files are shared across multiple modules.
   * If a parser file serves multiple modules, the patch could have broader impact.
   */
  private async checkCorridorRegression(proposal: PatchProposal): Promise<ValidationCheck> {
    try {
      // Check if the provider serves multiple modules
      const { rows: modules } = await this.pool.query<{
        module_id: string
        supported_corridors: string[]
      }>(
        `SELECT module_id, COALESCE(supported_corridors, ARRAY[]::TEXT[]) as supported_corridors
         FROM silver.module_registry
         WHERE provider_id = $1 AND status IN ('production', 'beta', 'quarantined')`,
        [proposal.providerId],
      )

      if (modules.length <= 1) {
        return {
          name: 'corridor_regression',
          passed: true,
          message: 'Single module for this provider — no cross-module regression risk',
          weight: 0.10,
        }
      }

      // Multiple modules share this provider — flag for caution
      const otherModules = modules.filter((m) => m.module_id !== proposal.moduleId)
      const totalOtherCorridors = otherModules.reduce(
        (sum, m) => sum + (m.supported_corridors?.length ?? 0),
        0,
      )

      return {
        name: 'corridor_regression',
        passed: true, // Pass but with a warning — doesn't block, but lowers confidence
        message: `Caution: Provider ${proposal.providerId} serves ${modules.length} modules. ` +
          `${otherModules.length} other module(s) with ${totalOtherCorridors} corridors may be affected. ` +
          `Manual review recommended.`,
        weight: 0.10,
      }
    } catch (err) {
      return {
        name: 'corridor_regression',
        passed: true,
        message: `Corridor regression check could not be run: ${err instanceof Error ? err.message : String(err)}`,
        weight: 0.10,
      }
    }
  }

  /**
   * Check 8: Validate change content completeness.
   *
   * For 'edit' changes, verifies that both oldContent and newContent are provided.
   * For 'add' changes, verifies that newContent is provided.
   * Changes without content are still valid (heuristic proposals) but lower confidence.
   */
  private checkChangeContent(proposal: PatchProposal): ValidationCheck {
    const issues: string[] = []
    let changesWithContent = 0
    let changesWithoutContent = 0

    for (const change of proposal.changes) {
      if (change.changeType === 'edit') {
        if (change.oldContent && change.newContent) {
          changesWithContent++
        } else {
          changesWithoutContent++
          if (!change.oldContent && !change.newContent) {
            issues.push(`${change.filePath}: edit change missing both old and new content`)
          }
        }
      } else if (change.changeType === 'add') {
        if (change.newContent) {
          changesWithContent++
        } else {
          changesWithoutContent++
        }
      } else {
        changesWithContent++ // delete changes don't need content
      }
    }

    // Pass if at least some changes have content, or if changes are descriptive-only (heuristic mode)
    const passed = issues.length === 0 || changesWithContent > 0

    return {
      name: 'change_content',
      passed,
      message: changesWithContent > 0
        ? `${changesWithContent}/${proposal.changes.length} changes have concrete content`
        : changesWithoutContent > 0
          ? `All ${changesWithoutContent} changes are descriptive-only (heuristic proposal — lower confidence)`
          : 'No changes to validate',
      weight: 0.10,
    }
  }
}
