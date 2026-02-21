export declare const normalizeMethodToken: (value?: string | null) => string;
export declare const mapPayinMethod: (value?: string | null) => string;
export declare const mapPayoutMethod: (value?: string | null) => string;
export declare const resolveTransferType: (method?: string | null) => string;
export declare const resolveDestination: (country: string, currency: string) => {
    country: string;
    currency: string;
    countryId: number;
    currencyId: number;
} | null;
export declare const ALANSARI_SOURCE_CURRENCY_ID = 91;
