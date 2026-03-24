BEGIN;

-- Plane A serves /api/v1/indices/triangulated/:corridorId from gold_export.triangulated_index.
-- Staging readiness exercises that route before deploy, so plane_a needs explicit read access.
GRANT SELECT ON gold_export.triangulated_index TO plane_a;

COMMIT;

-- @rollback
BEGIN;

REVOKE SELECT ON gold_export.triangulated_index FROM plane_a;

COMMIT;
