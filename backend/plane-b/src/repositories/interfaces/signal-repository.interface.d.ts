export type SignalHistoryInput = {
    signalType: string;
    providerId: string;
    corridorId: string;
    currentRate: number;
    avg24h: number | null;
    stdDev24h: number | null;
    zScore: number;
};
export interface ISignalRepository {
    insertSignal(input: SignalHistoryInput): Promise<void>;
}
