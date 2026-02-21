export type BlockDetectionResult = {
    blocked: boolean;
    reason: string | null;
};
export declare const detectBlock: (status?: number | null, bodyText?: string | null) => BlockDetectionResult;
