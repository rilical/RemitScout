import { describe, expect, it } from 'vitest'
import { validatePatchPromptResponse } from '../plane-b/src/agents/patch-proposer'

describe('patch prompt schema validation', () => {
  const bundle = {
    providerId: 'wise',
    affectedCorridors: ['GB-IN-GBP-INR'],
  }

  it('rejects malformed payloads', () => {
    const result = validatePatchPromptResponse({ providerId: 'wise' }, bundle)
    expect(result.parsed).toBeNull()
    expect(result.reasonCode).toBe('missing_route')
  })

  it('rejects provider mismatch', () => {
    const result = validatePatchPromptResponse({
      providerId: 'remitly',
      route: 'GB-IN-GBP-INR',
      detected_issue_class: 'parse.selector_drift',
      proposed_patch: {
        description: 'Adjust selectors',
        changes: [],
      },
      confidence: 'low',
      risk_level: 'medium',
    }, bundle)

    expect(result.parsed).toBeNull()
    expect(result.reasonCode).toBe('provider_mismatch')
  })

  it('rejects unsafe file changes', () => {
    const result = validatePatchPromptResponse({
      providerId: 'wise',
      route: 'GB-IN-GBP-INR',
      detected_issue_class: 'parse.selector_drift',
      proposed_patch: {
        description: 'Adjust selectors',
        changes: [
          {
            filePath: 'backend/scripts/brain/brain.ts',
            changeType: 'edit',
            description: 'Bad path',
          },
        ],
      },
      confidence: 'medium',
      risk_level: 'medium',
    }, bundle)

    expect(result.parsed).toBeNull()
    expect(result.reasonCode).toBe('no_valid_changes')
  })

  it('accepts valid proposal payloads', () => {
    const result = validatePatchPromptResponse({
      providerId: 'wise',
      route: 'GB-IN-GBP-INR',
      detected_issue_class: 'parse.selector_drift',
      proposed_patch: {
        description: 'Guard against missing nodes and update selector',
        reasoning: 'Recent payload includes renamed node attributes.',
        changes: [
          {
            filePath: 'backend/plane-b/src/providers/wise/parse.ts',
            changeType: 'edit',
            description: 'Update DOM selector and optional chain node access',
            oldContent: 'old',
            newContent: 'new',
          },
        ],
      },
      confidence: 'high',
      risk_level: 'low',
    }, bundle)

    expect(result.reasonCode).toBeUndefined()
    expect(result.parsed?.providerId).toBe('wise')
    expect(result.parsed?.route).toBe('GB-IN-GBP-INR')
    expect(result.parsed?.proposed_patch.changes).toHaveLength(1)
  })
})
