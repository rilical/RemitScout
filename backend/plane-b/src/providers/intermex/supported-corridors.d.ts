type CurrencyOption = {
    country: string;
    currency: string;
};
type IntermexDestinationOption = CurrencyOption & {
    intermexCode: string;
};
export declare const INTERMEX_SOURCE_COUNTRIES: string[];
export declare const INTERMEX_DESTINATION_OPTIONS: IntermexDestinationOption[];
export declare const INTERMEX_DESTINATION_COUNTRIES: string[];
export declare const INTERMEX_SUPPORTED_CORRIDORS: string[];
export declare const INTERMEX_B2B_CORRIDORS: string[];
export {};
