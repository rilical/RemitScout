export declare const sourceCountries: readonly ["BE", "CA", "FR", "DE", "IE", "IT", "PT", "ES", "GB", "US"];
export declare const corridors: string[];
export declare const corridorSource = "provider_corridor_capability";
export declare const amountBuckets: number[];
export declare const defaultPayinMethod = "debit_card";
export declare const defaultPayoutMethod = "bank_deposit";
export declare const codeMaps: {
    countryCodeMap: Record<string, string>;
    currencyCodeMap: Record<string, string>;
    payinMethodMap: Record<string, string>;
    payoutMethodMap: Record<string, string>;
};
export declare const payinMethods: string[];
export declare const payoutMethods: string[];
