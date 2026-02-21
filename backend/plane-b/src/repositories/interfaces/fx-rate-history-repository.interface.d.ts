export type FxRateHistoryRecord = {
    base_currency: string;
    quote_currency: string;
    rate: number;
    bid: number | null;
    ask: number | null;
    rate_date: string | Date;
    source: string | null;
    created_at: string | Date | null;
};
export type FxRateHistoryInput = {
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
    bid?: number | null;
    ask?: number | null;
    rateDate: string | Date;
    source?: string | null;
};
export interface IFxRateHistoryRepository {
    getHistory(baseCurrency: string, quoteCurrency: string, startDate: string, endDate: string): Promise<FxRateHistoryRecord[]>;
    getLatestHistory(baseCurrency: string, quoteCurrency: string, days: number): Promise<FxRateHistoryRecord[]>;
    upsertHistory(records: FxRateHistoryInput[]): Promise<void>;
}
