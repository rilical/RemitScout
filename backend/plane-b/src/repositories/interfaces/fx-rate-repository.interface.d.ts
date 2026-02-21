export type FxRateInput = {
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
    providerCount?: number;
    sampleCount?: number;
    updatedAt?: Date;
};
export type FxRateAggregationRow = {
    base_currency: string;
    quote_currency: string;
    rate: number;
    provider_count: number;
    sample_count: number;
};
export type FxRateRecord = {
    base_currency: string;
    quote_currency: string;
    rate: number;
    updated_at: Date;
};
export type FxRateWithHistory = {
    current: FxRateRecord | null;
    history: {
        rate_date: string | Date;
        rate: number;
        bid: number | null;
        ask: number | null;
        source: string | null;
        created_at: string | Date | null;
    }[];
};
export interface IFxRateRepository {
    upsertRate(input: FxRateInput): Promise<void>;
    aggregateFxRates(): Promise<FxRateAggregationRow[]>;
    getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null>;
    getRates(baseCurrency?: string, quoteCurrency?: string): Promise<FxRateRecord[]>;
    getRateWithHistory(baseCurrency: string, quoteCurrency: string, days: number): Promise<FxRateWithHistory>;
}
