import type { Pool } from 'pg';
export declare const notifyBlockAlert: (pool: Pool, alertId: string, options?: {
    force?: boolean;
}) => Promise<void>;
