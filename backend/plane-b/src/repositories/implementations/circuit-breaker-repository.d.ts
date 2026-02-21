import type { Pool } from 'pg';
import type { CircuitBreakerOpenRecord, CircuitBreakerRecord, CircuitBreakerStateRecord, ICircuitBreakerRepository } from '../interfaces/circuit-breaker-repository.interface';
export declare class CircuitBreakerRepository implements ICircuitBreakerRepository {
    private readonly pool;
    constructor(pool: Pool);
    openCircuit(providerId: string, corridorId: string | null, reason: string, cooldownUntil: string | null): Promise<void>;
    halfOpenCircuit(providerId: string, corridorId: string | null, cooldownUntil: string | null): Promise<void>;
    closeCircuit(providerId: string, corridorId: string | null): Promise<void>;
    getCircuitState(providerId: string, corridorId: string | null): Promise<CircuitBreakerStateRecord | null>;
    loadOpenCircuits(providerId: string): Promise<CircuitBreakerOpenRecord[]>;
    closeExpiredOpenCircuits(providerId: string): Promise<void>;
    loadAllCircuits(): Promise<CircuitBreakerRecord[]>;
}
