export type FreshnessReportBatch = {
    providerIds: string[];
    corridorIds: string[];
    amountBuckets: number[];
    payinMethods: string[];
    payoutMethods: string[];
    ageMinutes: Array<number | null>;
    sloMinutes: Array<number | null>;
    isStale: boolean[];
    observedAts: string[];
};
export interface IFreshnessReportRepository {
    insertBatch(input: FreshnessReportBatch): Promise<void>;
}
