-- Expand method_profile enum to support mobile_wallet, airtime, card delivery,
-- and home delivery payout methods. Previously only standard_bank, standard_card,
-- and cash_pickup were supported, causing mobile_wallet and airtime quotes to be
-- silently dropped from Gold aggregation.

ALTER TYPE method_profile ADD VALUE IF NOT EXISTS 'mobile_wallet';
ALTER TYPE method_profile ADD VALUE IF NOT EXISTS 'airtime_topup';
ALTER TYPE method_profile ADD VALUE IF NOT EXISTS 'card_delivery';
ALTER TYPE method_profile ADD VALUE IF NOT EXISTS 'home_delivery';
