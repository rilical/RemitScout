"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRotatingUserAgent = getRotatingUserAgent;
exports.getRandomUserAgent = getRandomUserAgent;
exports.getUserAgentForCorridor = getUserAgentForCorridor;
const REMIT_SCOUT_IDENTIFIER = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)';
/**
 * Pool of User-Agent strings that rotate to appear as different browsers/platforms
 * while maintaining our research identification
 */
const USER_AGENT_POOL = [
    // Chrome on Windows
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ${REMIT_SCOUT_IDENTIFIER}`,
    // Chrome on macOS
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 ${REMIT_SCOUT_IDENTIFIER}`,
    // Chrome on Linux
    `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 ${REMIT_SCOUT_IDENTIFIER}`,
    // Firefox on Windows
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0 ${REMIT_SCOUT_IDENTIFIER}`,
    // Firefox on macOS
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0 ${REMIT_SCOUT_IDENTIFIER}`,
    // Safari on macOS
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15 ${REMIT_SCOUT_IDENTIFIER}`,
    // Edge on Windows
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0 ${REMIT_SCOUT_IDENTIFIER}`,
    // Chrome on Android
    `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36 ${REMIT_SCOUT_IDENTIFIER}`,
];
let currentIndex = 0;
/**
 * Get the next User-Agent string in rotation
 * Uses round-robin rotation through the pool
 */
function getRotatingUserAgent() {
    const userAgent = USER_AGENT_POOL[currentIndex];
    currentIndex = (currentIndex + 1) % USER_AGENT_POOL.length;
    return userAgent;
}
/**
 * Get a random User-Agent string from the pool
 * Useful for parallel requests
 */
function getRandomUserAgent() {
    const randomIndex = Math.floor(Math.random() * USER_AGENT_POOL.length);
    return USER_AGENT_POOL[randomIndex];
}
/**
 * Get a User-Agent based on corridor ID (deterministic but varied)
 * Same corridor will always get the same User-Agent for consistency
 */
function getUserAgentForCorridor(corridorId) {
    let hash = 0;
    for (let i = 0; i < corridorId.length; i++) {
        hash = ((hash << 5) - hash) + corridorId.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % USER_AGENT_POOL.length;
    return USER_AGENT_POOL[index];
}
