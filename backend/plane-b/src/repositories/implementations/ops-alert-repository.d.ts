import type { Pool } from 'pg';
import type { IOpsAlertRepository, OpsAlertInput, OpsAlertRecord } from '../interfaces/ops-alert-repository.interface';
export declare class OpsAlertRepository implements IOpsAlertRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertAlert(input: OpsAlertInput): Promise<string | null>;
    getAlert(alertId: string): Promise<OpsAlertRecord | null>;
}
