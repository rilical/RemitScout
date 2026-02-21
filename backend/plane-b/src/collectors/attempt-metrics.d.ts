import type { Pool } from 'pg';
export declare const loadAttemptMetrics: (pool: Pool, providerId: string, locale: string) => Promise<{
    avgAttemptSeconds: number | null;
    sampleCount: number;
}>;
export declare const persistAttemptMetrics: (pool: Pool, providerId: string, locale: string, avgAttemptSeconds: number, sampleCount: number) => Promise<void>;
