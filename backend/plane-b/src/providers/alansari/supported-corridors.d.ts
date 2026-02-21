type AlansariDestinationOption = {
    country: string;
    currency: string;
    countryId: number;
    currencyId: number;
};
export declare const ALANSARI_SOURCE_COUNTRIES: string[];
export declare const ALANSARI_DESTINATION_OPTIONS: AlansariDestinationOption[];
export declare const ALANSARI_DESTINATION_COUNTRIES: string[];
export declare const ALANSARI_SUPPORTED_CORRIDORS: string[];
export declare const ALANSARI_B2B_CORRIDORS: string[];
export declare const resolveAlansariDestination: (country: string, currency: string) => AlansariDestinationOption | null;
export {};
