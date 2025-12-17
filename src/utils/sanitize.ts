/**
 * Input Sanitization Utilities
 * 
 * Security utilities for sanitizing user inputs to prevent
 * XSS, injection attacks, and other security vulnerabilities.
 */

/**
 * HTML escape for text display
 */
export function escapeHtml(input: string): string {
    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    };

    return input.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char);
}

/**
 * Sanitize wallet address for display
 * Only allows alphanumeric characters
 */
export function sanitizeWalletAddress(address: string): string {
    // Solana addresses are base58 encoded (alphanumeric, no 0, O, I, l)
    const sanitized = address.replace(/[^A-HJ-NP-Za-km-z1-9]/g, '');

    // Valid Solana addresses are 32-44 characters
    if (sanitized.length < 32 || sanitized.length > 44) {
        throw new Error('Invalid wallet address format');
    }

    return sanitized;
}

/**
 * Sanitize event ID
 */
export function sanitizeEventId(eventId: string): string {
    // Allow alphanumeric, hyphens, underscores
    const sanitized = eventId.replace(/[^a-zA-Z0-9_-]/g, '');

    if (sanitized.length === 0 || sanitized.length > 64) {
        throw new Error('Invalid event ID format');
    }

    return sanitized;
}

/**
 * Sanitize display name
 */
export function sanitizeDisplayName(name: string): string {
    // Remove control characters and limit length
    const sanitized = name
        .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
        .replace(/[<>"'`]/g, '') // HTML-sensitive characters
        .trim()
        .slice(0, 50); // Max length

    return sanitized;
}

/**
 * Sanitize URL for safe navigation
 */
export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Only allow https URLs (and http for localhost in dev)
        if (parsed.protocol !== 'https:') {
            if (!(parsed.protocol === 'http:' && parsed.hostname === 'localhost')) {
                return null;
            }
        }

        // Block javascript: and data: URLs
        if (url.toLowerCase().startsWith('javascript:') ||
            url.toLowerCase().startsWith('data:')) {
            return null;
        }

        return url;
    } catch {
        return null;
    }
}

/**
 * Sanitize JSON string input
 */
export function sanitizeJsonInput(input: string): string | null {
    try {
        // Limit size
        if (input.length > 10000) {
            return null;
        }

        // Parse to ensure valid JSON
        const parsed = JSON.parse(input);

        // Re-stringify to normalize
        return JSON.stringify(parsed);
    } catch {
        return null;
    }
}

/**
 * Validate and sanitize transaction signature
 */
export function sanitizeTransactionSignature(sig: string): string {
    // Transaction signatures are base58 encoded, typically 88 characters
    const sanitized = sig.replace(/[^A-HJ-NP-Za-km-z1-9]/g, '');

    if (sanitized.length < 80 || sanitized.length > 90) {
        throw new Error('Invalid transaction signature format');
    }

    return sanitized;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
    return query
        .replace(/[<>"'`]/g, '') // Remove HTML-sensitive chars
        .replace(/[^\w\s@#.-]/g, '') // Only allow safe characters
        .trim()
        .slice(0, 100); // Limit length
}

/**
 * Deep sanitize an object (for API responses)
 */
export function deepSanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const safeKey = key.replace(/[^\w]/g, '');

        if (typeof value === 'string') {
            sanitized[safeKey] = escapeHtml(value);
        } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                sanitized[safeKey] = value.map(item =>
                    typeof item === 'object' && item !== null
                        ? deepSanitizeObject(item as Record<string, unknown>)
                        : typeof item === 'string' ? escapeHtml(item) : item
                );
            } else {
                sanitized[safeKey] = deepSanitizeObject(value as Record<string, unknown>);
            }
        } else {
            sanitized[safeKey] = value;
        }
    }

    return sanitized as T;
}

/**
 * Rate limiter for input validation
 */
export class InputRateLimiter {
    private attempts: Map<string, number[]> = new Map();
    private maxAttempts: number;
    private windowMs: number;

    constructor(maxAttempts = 10, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    /**
     * Check if action should be allowed
     */
    check(key: string): boolean {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Filter to only recent attempts
        const recentAttempts = attempts.filter(t => now - t < this.windowMs);

        if (recentAttempts.length >= this.maxAttempts) {
            return false;
        }

        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);

        return true;
    }

    /**
     * Reset attempts for a key
     */
    reset(key: string): void {
        this.attempts.delete(key);
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.attempts.clear();
    }
}

// Singleton rate limiter for QR scans
export const qrScanRateLimiter = new InputRateLimiter(5, 60000); // 5 scans per minute
