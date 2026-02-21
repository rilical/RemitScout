import type { Pool } from 'pg';
import type { ISignalRepository, SignalHistoryInput } from '../interfaces/signal-repository.interface';
export declare class SignalRepository implements ISignalRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertSignal(input: SignalHistoryInput): Promise<void>;
}
