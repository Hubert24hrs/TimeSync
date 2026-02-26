/**
 * Security utilities for TimeSync
 * Input sanitization, rate limiting, session management
 */

// ─── Input Sanitization ────────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
};

/**
 * Sanitize a string to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
    return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from input
 */
export function stripHTML(input: string): string {
    return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize and trim user input for safe storage
 */
export function cleanUserInput(input: string, maxLength = 500): string {
    return stripHTML(input).trim().slice(0, maxLength);
}

// ─── Rate Limiter ──────────────────────────────────────────────────────

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limiter
 * @param key - Unique identifier for the action
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(
    key: string,
    maxAttempts: number = 10,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return false;
    }

    if (entry.count >= maxAttempts) {
        return true;
    }

    entry.count++;
    return false;
}

/**
 * Get remaining attempts for a rate-limited action
 */
export function getRemainingAttempts(key: string, maxAttempts: number = 10): number {
    const entry = rateLimitStore.get(key);
    if (!entry || Date.now() > entry.resetTime) return maxAttempts;
    return Math.max(0, maxAttempts - entry.count);
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// ─── Session Management ────────────────────────────────────────────────

interface SessionConfig {
    tokenExpiryMs: number;
    refreshThresholdMs: number;
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
    tokenExpiryMs: 3600000, // 1 hour
    refreshThresholdMs: 300000, // 5 minutes before expiry
};

let sessionState = {
    lastActivity: Date.now(),
    tokenIssuedAt: 0,
    isLocked: false,
};

/**
 * Update the last activity timestamp
 */
export function touchSession(): void {
    sessionState.lastActivity = Date.now();
}

/**
 * Check if the session has timed out
 */
export function isSessionTimedOut(timeoutMs: number = 900000): boolean {
    return Date.now() - sessionState.lastActivity > timeoutMs;
}

/**
 * Check if the token needs refreshing
 */
export function needsTokenRefresh(config = DEFAULT_SESSION_CONFIG): boolean {
    const elapsed = Date.now() - sessionState.tokenIssuedAt;
    return elapsed > config.tokenExpiryMs - config.refreshThresholdMs;
}

/**
 * Mark token as refreshed
 */
export function markTokenRefreshed(): void {
    sessionState.tokenIssuedAt = Date.now();
}

/**
 * Lock the app session
 */
export function lockSession(): void {
    sessionState.isLocked = true;
}

/**
 * Unlock the app session
 */
export function unlockSession(): void {
    sessionState.isLocked = false;
    sessionState.lastActivity = Date.now();
}

/**
 * Check if the session is locked
 */
export function isSessionLocked(): boolean {
    return sessionState.isLocked;
}

// ─── Password / PIN Hashing ────────────────────────────────────────────

/**
 * Simple hash for PIN codes (client-side only)
 * In production, use bcrypt or Argon2 on the server
 */
export function hashPin(pin: string): string {
    let hash = 0;
    const salt = 'timesync_v1_';
    const salted = salt + pin;
    for (let i = 0; i < salted.length; i++) {
        const char = salted.charCodeAt(i);
        hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Verify a PIN against its hash
 */
export function verifyPin(pin: string, storedHash: string): boolean {
    return hashPin(pin) === storedHash;
}

// ─── Content Security ──────────────────────────────────────────────────

/**
 * Check if a URL is from an allowed domain
 */
export function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
    try {
        const parsed = new URL(url);
        return allowedDomains.some(
            (domain) =>
                parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
}

/**
 * Mask sensitive data for display (e.g., email)
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
}

/**
 * Mask a phone number
 */
export function maskPhone(phone: string): string {
    if (phone.length < 4) return '***';
    return '***' + phone.slice(-4);
}
