-- Migration 092: Knowledge Chunk Table
-- Creates the knowledge plane storage for agent context retrieval.

BEGIN;

-- silver.knowledge_chunk — indexed knowledge for agent context
CREATE TABLE IF NOT EXISTS silver.knowledge_chunk (
  chunk_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     TEXT NOT NULL CHECK (source_type IN (
    'code', 'documentation', 'observation', 'failure', 'repair'
  )),
  source_path     TEXT NOT NULL,
  content         TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index on content
CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_fts
  ON silver.knowledge_chunk
  USING GIN (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_source_type
  ON silver.knowledge_chunk (source_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_source_path
  ON silver.knowledge_chunk (source_path);

COMMIT;
