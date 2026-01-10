ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS source_countries TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS destination_countries TEXT[] NULL;

CREATE INDEX IF NOT EXISTS rights_matrix_source_countries_gin
  ON silver.rights_matrix
  USING GIN (source_countries);

CREATE INDEX IF NOT EXISTS rights_matrix_destination_countries_gin
  ON silver.rights_matrix
  USING GIN (destination_countries);
