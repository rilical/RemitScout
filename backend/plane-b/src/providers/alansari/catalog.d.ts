export declare const destinationCountries: string[];
export declare const sourceCountries: string[];
export declare const amountBuckets: number[];
export declare const defaultPayinMethod = "bank_transfer";
export declare const defaultPayoutMethod = "bank_deposit";
export declare const corridors: string[];
export declare const corridorSource = "provider_corridor_capability";
export declare const codeMaps: {
    payinMethodMap: (value?: string | null) => string;
    payoutMethodMap: (value?: string | null) => string;
};
export declare const payinMethods: string[];
export declare const payoutMethods: string[];
