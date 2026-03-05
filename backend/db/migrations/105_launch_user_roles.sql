-- Migration 105: Ensure launch user roles match seed spec.
-- Safety net for the DB-authoritative role refactor (staging-sync).
-- The seed script also sets these values, but migrations run first
-- and are more reliable as a deployment gate.

UPDATE silver.user_account
SET app_role = 'super_admin'
WHERE LOWER(email) = 'omar@remit-scout.com'
  AND app_role IS DISTINCT FROM 'super_admin';

UPDATE silver.user_account
SET app_role = 'admin'
WHERE LOWER(email) = 'developer@remit-scout.com'
  AND app_role IS DISTINCT FROM 'admin';

UPDATE silver.user_plan
SET plan_code = 'enterprise', status = 'active', updated_at = NOW()
WHERE user_id IN (
  SELECT user_id FROM silver.user_account
  WHERE LOWER(email) IN ('omar@remit-scout.com', 'developer@remit-scout.com')
)
AND (plan_code IS DISTINCT FROM 'enterprise' OR status IS DISTINCT FROM 'active');
