export declare const PLACID_SOURCE_CURRENCIES: readonly ["USD"];
export type PlacidDestination = {
    placidCode: string;
    country: string;
    currency: string;
    name: string;
};
export declare const PLACID_DESTINATIONS: PlacidDestination[];
export declare const PLACID_DESTINATION_COUNTRIES: string[];
export declare const PLACID_DESTINATION_CURRENCIES: string[];
export declare const PLACID_CODE_BY_COUNTRY: Record<string, string>;
export declare const PLACID_DESTINATION_BY_COUNTRY: Record<string, PlacidDestination>;
export declare const PLACID_DESTINATION_BY_CODE: Record<string, PlacidDestination>;
export declare const PLACID_DESTINATION_COUNTRY_BY_CURRENCY: Record<string, string>;
export declare const PLACID_DESTINATION_CURRENCY_BY_COUNTRY: Record<string, string>;
export declare const PLACID_SOURCE_COUNTRIES: string[];
export declare const PLACID_SUPPORTED_CORRIDORS: string[];
export declare const PLACID_B2B_CORRIDORS: string[];
