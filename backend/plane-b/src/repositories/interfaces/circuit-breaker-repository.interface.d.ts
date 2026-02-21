export type CircuitState = 'open' | 'half_open' | 'closed';
export type CircuitBreakerStateRecord = {
    state: CircuitState;
    cooldown_until: string | null;
};
export type CircuitBreakerOpenRecord = {
    corridor_id: string | null;
    cooldown_until: string | null;
};
export type CircuitBreakerRecord = {
    provider_id: string;
    corridor_id: string | null;
    state: CircuitState;
    cooldown_until: string | null;
};
export interface ICircuitBreakerRepository {
    openCircuit(providerId: string, corridorId: string | null, reason: string, cooldownUntil: string | null): Promise<void>;
    halfOpenCircuit(providerId: string, corridorId: string | null, cooldownUntil: string | null): Promise<void>;
    closeCircuit(providerId: string, corridorId: string | null): Promise<void>;
    getCircuitState(providerId: string, corridorId: string | null): Promise<CircuitBreakerStateRecord | null>;
    loadOpenCircuits(providerId: string): Promise<CircuitBreakerOpenRecord[]>;
    closeExpiredOpenCircuits(providerId: string): Promise<void>;
    loadAllCircuits(): Promise<CircuitBreakerRecord[]>;
}
