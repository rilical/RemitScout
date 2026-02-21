export declare const countryCodeMap: Record<string, string>;
export declare const currencyCodeMap: Record<string, string>;
export declare const payinMethodMap: Record<string, string>;
export declare const payoutMethodMap: Record<string, string>;
export declare const mapPayinMethod: (value?: string | null) => string;
export declare const mapRecipientTypeToPayoutMethod: (value?: string | null) => string;
export declare const mapPayoutMethodToRecipientType: (payoutMethod?: string | null, currency?: string | null) => string | null;
export declare const getRecipientTypesForCurrency: (currency?: string | null) => string[];
