export type RightsMatrixCountryFilter = {
    sourceCountries?: string[] | null;
    destinationCountries?: string[] | null;
};
export type PriorityQueues = {
    tier1: string[];
    tier2: string[];
    all: string[];
};
export declare const filterQueuesByRightsMatrix: (queues: PriorityQueues, rights: RightsMatrixCountryFilter | undefined, providerId: string) => PriorityQueues;
