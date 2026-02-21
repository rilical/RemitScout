import type { Pool } from 'pg';
export type ProxyTier = 'RESIDENTIAL_PREMIUM' | 'DATACENTER_ROTATING' | 'NONE';
export declare const getDefaultProxyTierForCollector: (collectorType: string) => ProxyTier;
export declare const getProxyForTier: (tier: ProxyTier) => Promise<string | null>;
/**
 * Synchronous version for backward compatibility.
 * Falls back to environment variables if not yet resolved.
 */
export declare const getProxyForTierSync: (tier: ProxyTier) => string | null;
export declare const getProxyTierForCorridor: (pool: Pool, corridorId: string, fallbackTier?: ProxyTier) => Promise<ProxyTier>;
