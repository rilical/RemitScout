export declare const destinationCountries: string[];
export declare const sourceCountries: string[];
export declare const amountBuckets: number[];
export declare const defaultPayinMethod = "debit_card";
export declare const defaultPayoutMethod = "bank_deposit";
export declare const corridors: string[];
export declare const corridorSource = "provider_corridor_capability";
export declare const codeMaps: {
    payinMethodMap: (value?: string | number | null) => string;
    payoutMethodMap: (value?: string | number | null) => string;
};
export declare const payinMethods: string[];
export declare const payoutMethods: string[];
