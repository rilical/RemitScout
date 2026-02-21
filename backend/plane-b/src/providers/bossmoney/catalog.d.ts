export declare const corridors: string[];
export declare const corridorSource = "provider_corridor_capability";
export declare const sourceCountries: string[];
export declare const destinationCountries: string[];
export declare const codeMaps: {
    countryCodeMap: Record<string, string>;
    currencyCodeMap: Record<string, string>;
    payinMethodMap: Record<string, string>;
    payoutMethodMap: Record<string, string>;
};
export declare const amountBuckets: number[];
export declare const payinMethods: string[];
export declare const payoutMethods: string[];
export declare const defaultPayinMethod = "bank_transfer";
export declare const defaultPayoutMethod = "bank_deposit";
