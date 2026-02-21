export declare enum QuoteRefreshStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    BLOCKED = "blocked",
    SKIPPED = "skipped"
}
export type QuoteRefreshStatusValue = `${QuoteRefreshStatus}`;
