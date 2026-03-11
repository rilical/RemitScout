-- Migration 110: Grant SELECT on rights_matrix to plane_a
--
-- Migration 001 grants SELECT ON ALL TABLES IN SCHEMA silver TO plane_a,
-- but that only covers tables existing at migration-001 time. Tables created
-- by later migrations (e.g. silver.rights_matrix from migration 108) may
-- lack the grant, causing search_indices_permissions_failed warnings in
-- Plane A's providers-list route.

GRANT SELECT ON silver.rights_matrix TO plane_a;

-- Ensure default privileges cover future silver tables for plane_a
ALTER DEFAULT PRIVILEGES IN SCHEMA silver GRANT SELECT ON TABLES TO plane_a;
