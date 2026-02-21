import { getMetrics, metricsContentType } from '../../../shared/metrics-registry';
export declare const recordCollection: (providerId: string, corridorId: string, success: boolean, durationSeconds?: number | null, errorType?: string) => void;
export declare const updateCircuitBreakerState: (providerId: string, corridorId: string | null, state: "closed" | "open" | "half_open") => void;
export { getMetrics, metricsContentType };
