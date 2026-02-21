/**
 * Remit-Scout Research User-Agent strings
 *
 * These User-Agents identify our service as a legitimate research/comparison platform
 * while rotating through different browser/platform combinations to avoid simple blocking.
 *
 * All strings include our identification: Remit-Scout-Research/1.0
 * Contact: support@remit-scout.com
 * Documentation: https://remit-scout.com/research
 */
/**
 * Get the next User-Agent string in rotation
 * Uses round-robin rotation through the pool
 */
export declare function getRotatingUserAgent(): string;
/**
 * Get a random User-Agent string from the pool
 * Useful for parallel requests
 */
export declare function getRandomUserAgent(): string;
/**
 * Get a User-Agent based on corridor ID (deterministic but varied)
 * Same corridor will always get the same User-Agent for consistency
 */
export declare function getUserAgentForCorridor(corridorId: string): string;
