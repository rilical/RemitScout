-- Migration: 082_institutional_client_admin_grants
-- Purpose: Grant INSERT/UPDATE on institutional_client to plane_a for admin CRUD,
--          and SELECT on institutional_export_log for admin detail views.

GRANT INSERT, UPDATE ON public.institutional_client TO plane_a;
GRANT SELECT ON public.institutional_export_log TO plane_a;
