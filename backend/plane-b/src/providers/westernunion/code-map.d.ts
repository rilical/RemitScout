export declare const countryCodeMap: Record<string, string>;
export declare const currencyCodeMap: Record<string, string>;
export declare const payinMethodMap: Record<string, string>;
export declare const payoutMethodMap: Record<string, string>;
export declare const getPaymentCodeForPayin: (payinMethod?: string | null) => string;
export declare const getServiceCodeForPayout: (payoutMethod?: string | null) => string | null;
