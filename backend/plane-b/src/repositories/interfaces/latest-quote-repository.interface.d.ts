export type LatestQuoteUpsertInput = {
    corridorId: string;
    amountBucket: number;
    payin: string;
    payout: string;
    providerId: string;
    collectedAt: string | Date;
    sendAmount: number;
    feeAmount: number;
    promotionalFeeAmount: number | null;
    totalDebitAmount: number;
    receiveAmount: number;
    impliedFxRate: number;
    promotionalRate: number | null;
    baseRate: number | null;
    promotionalCapAmount: number | null;
    deliveryTimeMinMinutes: number | null;
    deliveryTimeMaxMinutes: number | null;
    status: string;
    qualityFlags: string | null;
};
export type LatestQuoteAgeRecord = {
    corridor_id: string | null;
    age_minutes: number | null;
};
export interface ILatestQuoteRepository {
    getLatestCollectedAt(corridorId: string, amountBucket: number, payinMethod: string, payoutMethod: string, providerId: string): Promise<Date | null>;
    getLatestQuoteAgeMinutes(providerId: string, corridorId: string, amountBucket: number, payinMethod: string, payoutMethod: string): Promise<number | null>;
    loadFreshnessLagByCorridor(providerId: string, corridors: string[], amountBucket: number, payinMethod: string, payoutMethod: string): Promise<LatestQuoteAgeRecord[]>;
    upsertLatestQuote(input: LatestQuoteUpsertInput): Promise<void>;
}
