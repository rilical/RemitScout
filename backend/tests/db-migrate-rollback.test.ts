import { describe, it, expect } from 'vitest'
import { parseMigrationFile, extractVersion } from '../scripts/db-migrate'
import type { ParsedMigration } from '../scripts/db-migrate'

describe('db-migrate rollback helpers', () => {
  // ---------------------------------------------------------------------------
  // parseMigrationFile
  // ---------------------------------------------------------------------------

  describe('parseMigrationFile', () => {
    it('parses forward-only SQL when no marker is present', () => {
      const content = `
CREATE TABLE silver.example (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
`
      const result: ParsedMigration = parseMigrationFile('042_add_example.sql', content)

      expect(result.forwardSql).toBe(content.trim())
      expect(result.rollbackSql).toBeNull()
      expect(result.isReversible).toBe(false)
    })

    it('parses forward + rollback SQL separated by -- @rollback marker', () => {
      const content = `
ALTER TABLE silver.user_plan ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- @rollback
ALTER TABLE silver.user_plan DROP COLUMN version;
`
      const result = parseMigrationFile('115_user_plan_version_column.sql', content)

      expect(result.forwardSql).toBe('ALTER TABLE silver.user_plan ADD COLUMN version INTEGER NOT NULL DEFAULT 1;')
      expect(result.rollbackSql).toBe('ALTER TABLE silver.user_plan DROP COLUMN version;')
      expect(result.isReversible).toBe(true)
    })

    it('parses -- @rollback impossible marker as non-reversible', () => {
      const content = `
DROP TABLE silver.legacy_data;

-- @rollback impossible
`
      const result = parseMigrationFile('099_drop_legacy.sql', content)

      expect(result.forwardSql).toBe('DROP TABLE silver.legacy_data;')
      expect(result.rollbackSql).toBeNull()
      expect(result.isReversible).toBe(false)
    })

    it('handles empty rollback SQL after marker', () => {
      const content = `
SELECT 1;

-- @rollback
`
      const result = parseMigrationFile('050_noop.sql', content)

      expect(result.forwardSql).toBe('SELECT 1;')
      expect(result.rollbackSql).toBe('')
      expect(result.isReversible).toBe(true)
    })

    it('handles multiline forward and rollback SQL', () => {
      const content = `
CREATE TABLE silver.audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_action ON silver.audit_log (action);

-- @rollback
DROP INDEX IF EXISTS silver.idx_audit_log_action;
DROP TABLE IF EXISTS silver.audit_log;
`
      const result = parseMigrationFile('080_audit_log.sql', content)

      expect(result.forwardSql).toContain('CREATE TABLE silver.audit_log')
      expect(result.forwardSql).toContain('CREATE INDEX idx_audit_log_action')
      expect(result.rollbackSql).toContain('DROP INDEX IF EXISTS')
      expect(result.rollbackSql).toContain('DROP TABLE IF EXISTS')
      expect(result.isReversible).toBe(true)
    })

    it('treats impossible marker with higher priority than regular marker', () => {
      // If both markers appear, impossible should win because it appears first in our check
      const content = `
ALTER TABLE silver.users ADD COLUMN email TEXT;

-- @rollback impossible
`
      const result = parseMigrationFile('101_confusing.sql', content)

      expect(result.isReversible).toBe(false)
      expect(result.rollbackSql).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // extractVersion
  // ---------------------------------------------------------------------------

  describe('extractVersion', () => {
    it('extracts numeric version from standard migration filename', () => {
      expect(extractVersion('001_initial_schema.sql')).toBe(1)
      expect(extractVersion('042_add_users.sql')).toBe(42)
      expect(extractVersion('112_autovacuum_observation_quote_record.sql')).toBe(112)
    })

    it('extracts version from filenames with large numbers', () => {
      expect(extractVersion('999_final_migration.sql')).toBe(999)
      expect(extractVersion('1000_post_launch.sql')).toBe(1000)
    })

    it('throws on invalid filename without numeric prefix', () => {
      expect(() => extractVersion('add_users.sql')).toThrow('Invalid migration filename: add_users.sql')
    })

    it('throws on empty filename', () => {
      expect(() => extractVersion('')).toThrow('Invalid migration filename: ')
    })

    it('throws on filename starting with non-numeric characters', () => {
      expect(() => extractVersion('abc_123_migration.sql')).toThrow('Invalid migration filename: abc_123_migration.sql')
    })
  })
})
