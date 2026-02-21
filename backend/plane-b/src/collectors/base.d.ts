import type { Pool } from 'pg';
import type { NormalizedQuote } from '../normalize/quote-normalizer';
export type CollectorResumeStatus = {
    canCollect: boolean;
    reason: string;
};
export type AttemptInput = {
    corridorId: string;
    amountBucket: number;
    payinMethod: string;
    payoutMethod: string;
    success: boolean;
    errorType?: string | null;
    httpStatus?: number | null;
    errorMessage?: string | null;
    bronzeObjectKey?: string | null;
    requestFingerprint: string;
};
export type OpsAlertInput = {
    corridorId: string;
    amountBucket: number;
    payinMethod: string;
    payoutMethod: string;
    httpStatus: number | null;
    blockReason: string | null;
    bronzeObjectKey: string | null;
    collectorType: string;
    traceId: string;
    requestFingerprint: string;
};
type AnomalyDetectionInput = {
    pool: Pool;
    providerId: string;
    corridorId: string;
    currentRate: number;
    collectorType: string;
};
export declare const ensureProvider: (pool: Pool, providerId: string, displayName: string) => Promise<void>;
export declare const loadObservedCorridors: (pool: Pool, providerId: string) => Promise<(string | null)[]>;
export declare const loadUnsupportedCorridors: (pool: Pool, providerId: string) => Promise<Set<string>>;
export declare const ensureCorridor: (pool: Pool, corridorId: string) => Promise<void>;
export declare const insertAttempt: (pool: Pool, providerId: string, input: AttemptInput, durationSeconds?: number) => Promise<void>;
export declare const insertOpsAlert: (pool: Pool, providerId: string, input: OpsAlertInput) => Promise<string | null>;
export declare const handleBlockDetectionAutoStop: (pool: Pool, providerId: string, corridorId: string, blockReason: string | null, httpStatus: number | null) => Promise<void>;
export declare const markCorridorUnsupported: (pool: Pool, providerId: string, corridorId: string, source: string) => Promise<void>;
export declare const persistNormalizedQuote: (pool: Pool, normalized: NormalizedQuote, collectorType?: string) => Promise<void>;
export declare const runAnomalyDetection: (input: AnomalyDetectionInput) => Promise<import("../signals/anomaly-detector").AnomalyResult | null>;
export declare const pauseProviderForBlock: (pool: Pool, providerId: string, corridorId: string, reason: string, cooldownMs: number) => Promise<void>;
export declare const resumeProviderIfCooldownExpired: (pool: Pool, providerId: string) => Promise<CollectorResumeStatus>;
export declare const loadActiveCircuits: (pool: Pool, providerId: string) => Promise<Set<string | null>>;
export declare const createIngestionRun: (pool: Pool, providerId: string, collectorType: string, startedAt: Date) => Promise<string>;
export declare const finishIngestionRun: (pool: Pool, runId: string, status: string, errorCode: string | null) => Promise<void>;
export type CircuitState = 'open' | 'half_open' | 'closed';
export declare const recordCircuitOpen: (pool: Pool, providerId: string, corridorId: string | null, reason: string, ttlMs: number) => Promise<void>;
export declare const recordCircuitHalfOpen: (pool: Pool, providerId: string, corridorId: string | null, ttlMs: number) => Promise<void>;
export declare const recordCircuitClosed: (pool: Pool, providerId: string, corridorId: string | null) => Promise<void>;
export declare const loadCircuitStateFromDb: (pool: Pool, providerId: string, corridorId: string | null, halfOpenMs: number) => Promise<{
    state: CircuitState;
    cooldownMs: null;
} | {
    state: CircuitState;
    cooldownMs: number;
}>;
export {};
