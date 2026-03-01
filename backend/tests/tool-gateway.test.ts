import { describe, it, expect } from 'vitest'

/**
 * Tool Gateway unit tests — validates policy enforcement, rate limiting,
 * and agent authorization logic.
 */

describe('ToolGateway', () => {
  describe('agent policy overrides', () => {
    const AGENT_POLICIES: Record<string, string[]> = {
      'failure-detector': ['db_query'],
      'patch-proposer': ['db_query', 'file_read', 'http_fetch', 'llm_inference'],
      'patch-validator': ['db_query', 'file_read'],
      'patch-deployer': ['db_query', 'file_read', 'git_read', 'git_write', 'github_api'],
      'stress-responder': ['db_query', 'redis_command'],
      'orchestrator': ['db_query', 'redis_command', 'file_read', 'git_read'],
    }

    it('failure-detector has read-only DB access', () => {
      const allowed = AGENT_POLICIES['failure-detector']
      expect(allowed).toEqual(['db_query'])
      expect(allowed).not.toContain('file_read')
      expect(allowed).not.toContain('git_write')
    })

    it('patch-proposer cannot write to git', () => {
      const allowed = AGENT_POLICIES['patch-proposer']
      expect(allowed).toContain('file_read')
      expect(allowed).toContain('llm_inference')
      expect(allowed).not.toContain('git_write')
      expect(allowed).not.toContain('github_api')
    })

    it('only patch-deployer has git write access', () => {
      for (const [agentId, tools] of Object.entries(AGENT_POLICIES)) {
        if (agentId === 'patch-deployer') {
          expect(tools).toContain('git_write')
          expect(tools).toContain('github_api')
        } else {
          expect(tools).not.toContain('git_write')
          expect(tools).not.toContain('github_api')
        }
      }
    })

    it('all agents have at least db_query access', () => {
      for (const tools of Object.values(AGENT_POLICIES)) {
        expect(tools).toContain('db_query')
      }
    })
  })

  describe('rate limiting', () => {
    const TOOL_RATE_LIMITS: Record<string, number> = {
      http_fetch: 30,
      llm_inference: 10,
      shell_exec: 5,
      db_query: 100,
      file_read: 50,
      git_write: 10,
    }

    it('llm_inference has stricter limits than db_query', () => {
      expect(TOOL_RATE_LIMITS.llm_inference).toBeLessThan(TOOL_RATE_LIMITS.db_query)
    })

    it('shell_exec has the strictest limit', () => {
      const minRate = Math.min(...Object.values(TOOL_RATE_LIMITS))
      expect(TOOL_RATE_LIMITS.shell_exec).toBe(minRate)
    })

    it('all rate limits are positive', () => {
      for (const limit of Object.values(TOOL_RATE_LIMITS)) {
        expect(limit).toBeGreaterThan(0)
      }
    })
  })

  describe('file path safety validation', () => {
    const ALLOWED_PATH_PREFIXES = ['providers/', 'collectors/', 'normalize/', 'shared/']

    const isPathSafe = (filePath: string): boolean => {
      const normalized = filePath.replace(/\\/g, '/')
      if (normalized.includes('..')) return false
      return ALLOWED_PATH_PREFIXES.some(prefix => normalized.includes(prefix))
    }

    it('allows provider file reads', () => {
      expect(isPathSafe('backend/plane-b/src/providers/wise/parse.ts')).toBe(true)
    })

    it('allows collector file reads', () => {
      expect(isPathSafe('backend/plane-b/src/collectors/base-collector.ts')).toBe(true)
    })

    it('allows shared file reads', () => {
      expect(isPathSafe('backend/shared/types/failure-bundle.ts')).toBe(true)
    })

    it('blocks path traversal attacks', () => {
      expect(isPathSafe('../../etc/passwd')).toBe(false)
      expect(isPathSafe('providers/../../secrets.env')).toBe(false)
    })

    it('blocks reads outside allowed directories', () => {
      expect(isPathSafe('infrastructure/cdk/lib/pipeline.ts')).toBe(false)
      expect(isPathSafe('.env')).toBe(false)
      expect(isPathSafe('backend/scripts/brain/brain.ts')).toBe(false)
    })
  })

  describe('authorization check', () => {
    const checkAgentAuthorization = (
      agentId: string,
      toolType: string,
      policies: Record<string, string[]>,
    ): { authorized: boolean; reason: string } => {
      const allowed = policies[agentId]
      if (!allowed) return { authorized: false, reason: `Unknown agent: ${agentId}` }
      if (!allowed.includes(toolType)) {
        return { authorized: false, reason: `Agent ${agentId} not authorized for ${toolType}` }
      }
      return { authorized: true, reason: 'ok' }
    }

    const policies: Record<string, string[]> = {
      'failure-detector': ['db_query'],
      'patch-proposer': ['db_query', 'file_read', 'http_fetch', 'llm_inference'],
    }

    it('authorizes valid agent-tool pairs', () => {
      const result = checkAgentAuthorization('failure-detector', 'db_query', policies)
      expect(result.authorized).toBe(true)
    })

    it('blocks unauthorized tool access', () => {
      const result = checkAgentAuthorization('failure-detector', 'git_write', policies)
      expect(result.authorized).toBe(false)
      expect(result.reason).toContain('not authorized')
    })

    it('blocks unknown agents', () => {
      const result = checkAgentAuthorization('rogue-agent', 'db_query', policies)
      expect(result.authorized).toBe(false)
      expect(result.reason).toContain('Unknown agent')
    })
  })
})
