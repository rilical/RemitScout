export declare const sourceCountries: readonly ["US", "GB", "HR", "GR", "AT", "BG", "FI", "ES", "BE", "NL", "DE", "NO", "DK", "SE", "IT", "IE", "FR", "CH", "PT", "CA"];
export declare const corridors: string[];
export declare const corridorSource = "provider_corridor_capability";
export declare const amountBuckets: number[];
export declare const defaultPayinMethod = "bank_transfer";
export declare const defaultPayoutMethod = "cash_pickup";
export declare const codeMaps: {
    countryCodeMap: Record<string, string>;
    currencyCodeMap: Record<string, string>;
    payinMethodMap: Record<string, string>;
    payoutMethodMap: Record<string, string>;
};
export declare const payinMethods: string[];
export declare const payoutMethods: string[];
