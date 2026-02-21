type RemitbeeCountry = {
    country_id: number;
    country_name?: string;
    currency_name?: string;
    currency_code: string;
    iso2: string;
    iso3?: string;
};
export declare const remitbeeCountryByIso2: Map<string, RemitbeeCountry>;
export declare const countryIdByIso2: Record<string, number>;
export declare const currencyCodeByIso2: Record<string, string>;
export declare const currencyCodesByIso2: Record<string, string[]>;
export declare const getRemitbeeCountry: (iso2: string) => RemitbeeCountry | undefined;
export declare const getCountryIdForIso2: (iso2: string) => number;
export declare const getCurrencyCodeForIso2: (iso2: string) => string;
export declare const getCurrencyCodesForIso2: (iso2: string) => string[];
export declare const payinMethodMap: Record<string, string>;
export declare const payoutMethodMap: Record<string, string>;
export {};
