-- Migration: Drop raw ip_address column from user_session
-- Reason: SOC-2 compliance — only the ip_hash column is needed for analytics.
-- The truncated IP was already stored (last octet zeroed) but even truncated
-- IPs are considered PII. The ip_hash column (SHA-256 with salt) is sufficient.

-- Step 1: Drop the raw ip_address column
ALTER TABLE silver.user_session DROP COLUMN IF EXISTS ip_address;

-- Step 2: Update comment on ip_hash to clarify it is the sole IP identifier
COMMENT ON COLUMN silver.user_session.ip_hash IS 'SHA-256 hash of truncated IP address (PII-safe)';
