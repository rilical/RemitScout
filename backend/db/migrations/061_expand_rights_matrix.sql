-- Expand rights_matrix for corridor-first architecture
-- Adds data access classification, commercial rights, index permissions, and governance fields

-- Data access classification
ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'public_web';
-- Values: public_web, partner_api, paid_api, app_simulation

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS auth_required BOOLEAN DEFAULT false;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS terms_risk TEXT DEFAULT 'low';
-- Values: low, medium, high

-- Commercial rights (what we can do with the data)
ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_internal_use BOOLEAN DEFAULT true;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_resell_b2b BOOLEAN DEFAULT false;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_derived_only BOOLEAN DEFAULT false;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_provider_attribution BOOLEAN DEFAULT true;

-- Index permissions (which indices can include this provider)
ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_in_rvi BOOLEAN DEFAULT false;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_in_rci BOOLEAN DEFAULT false;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS allowed_in_teer BOOLEAN DEFAULT false;

-- Operational quality metrics
ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS expected_update_frequency INTERVAL;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS observed_update_frequency INTERVAL;

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS uptime_last_30d DECIMAL(5,4);

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS avg_quote_latency_ms INTEGER;

-- Governance
ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'candidate';
-- Values: candidate, sandbox, beta, production, deprecated

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS reviewer TEXT;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS rights_matrix_status_idx
  ON silver.rights_matrix (status);

CREATE INDEX IF NOT EXISTS rights_matrix_allowed_in_rvi_idx
  ON silver.rights_matrix (allowed_in_rvi)
  WHERE allowed_in_rvi = true;

CREATE INDEX IF NOT EXISTS rights_matrix_allowed_in_rci_idx
  ON silver.rights_matrix (allowed_in_rci)
  WHERE allowed_in_rci = true;

CREATE INDEX IF NOT EXISTS rights_matrix_allowed_in_teer_idx
  ON silver.rights_matrix (allowed_in_teer)
  WHERE allowed_in_teer = true;

-- Set production providers to default index and resell permissions
UPDATE silver.rights_matrix
SET
  allowed_in_rvi = true,
  allowed_in_rci = true,
  allowed_in_teer = true,
  allowed_resell_b2b = true,
  status = 'production'
WHERE allowed_collect = true
  AND allowed_b2b = true
  AND stoplist_status = 'active';
