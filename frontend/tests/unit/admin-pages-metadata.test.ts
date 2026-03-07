// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

describe('admin pages metadata', () => {
  it('keeps every /admin page behind authenticated admin middleware and the admin layout', () => {
    const adminPagesDir = path.resolve(__dirname, '../../pages/admin')
    const pageFiles = readdirSync(adminPagesDir)
      .filter(file => file.endsWith('.vue'))
      .filter(file => file !== 'AGENTS.md')

    expect(pageFiles.length).toBeGreaterThan(0)

    for (const file of pageFiles) {
      const content = readFileSync(path.join(adminPagesDir, file), 'utf8')
      const hasAdminGuard = content.includes("middleware: ['auth', 'admin']")
      const hasSuperAdminGuard = content.includes("middleware: ['auth', 'super-admin']")
      expect(
        hasAdminGuard || hasSuperAdminGuard,
        `${file} missing authenticated admin middleware`,
      ).toBe(true)
      expect(content, `${file} missing admin layout`).toContain('layout: \'admin\'')
    }
  })
})
