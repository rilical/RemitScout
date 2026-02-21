import type { Pool } from 'pg';
export type BronzeWriteInput = {
    provider_id: string;
    corridor_id: string;
    amount_bucket?: number;
    payin_method?: string;
    payout_method?: string;
    payload: unknown;
};
export declare const writeBronzePayload: (pool: Pool, input: BronzeWriteInput) => Promise<number | null>;
