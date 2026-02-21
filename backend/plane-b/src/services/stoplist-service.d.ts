import type { Pool } from 'pg';
export type BlockType = '403' | 'captcha' | 'rate_limit';
export declare const getBlockTypeFromReason: (reason: string | null, httpStatus?: number | null) => BlockType;
export declare class StoplistService {
    private readonly pool;
    constructor(pool: Pool);
    updateStoplistStatus(providerId: string, status: 'active' | 'paused'): Promise<void>;
    openCircuitBreaker(providerId: string, corridorId: string, reason: string): Promise<void>;
    handleBlockDetection(providerId: string, corridorId: string, blockType: BlockType): Promise<void>;
    shouldAutoResume(providerId: string): Promise<boolean>;
    autoResumeProvider(providerId: string): Promise<void>;
}
