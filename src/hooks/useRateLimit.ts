/**
 * Rate Limiting Hooks
 * 
 * React hooks for rate limiting user actions to prevent abuse
 * and protect against denial-of-service attacks.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs?: number;
}

/**
 * Rate limit state
 */
export interface RateLimitState {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number | null;
    blocked: boolean;
    blockEndTime: number | null;
}

/**
 * Default configurations for common actions
 */
export const RATE_LIMIT_PRESETS = {
    qrScan: { maxAttempts: 5, windowMs: 60000, blockDurationMs: 300000 },
    walletConnect: { maxAttempts: 3, windowMs: 30000, blockDurationMs: 60000 },
    mintAttempt: { maxAttempts: 3, windowMs: 60000, blockDurationMs: 120000 },
    apiRequest: { maxAttempts: 30, windowMs: 60000 },
    searchQuery: { maxAttempts: 20, windowMs: 60000 },
} as const;

/**
 * Hook for rate limiting an action
 */
export function useRateLimit(config: RateLimitConfig): {
    checkLimit: () => boolean;
    recordAttempt: () => void;
    reset: () => void;
    state: RateLimitState;
} {
    const attemptsRef = useRef<number[]>([]);
    const blockedUntilRef = useRef<number | null>(null);
    const [state, setState] = useState<RateLimitState>({
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetTime: null,
        blocked: false,
        blockEndTime: null,
    });

    // Cleanup old attempts periodically
    useEffect(() => {
        const interval = setInterval(() => {
            updateState();
        }, 1000);

        return () => clearInterval(interval);
    }, [config]);

    const updateState = useCallback(() => {
        const now = Date.now();

        // Check if blocked
        if (blockedUntilRef.current && now < blockedUntilRef.current) {
            setState({
                allowed: false,
                remainingAttempts: 0,
                resetTime: blockedUntilRef.current,
                blocked: true,
                blockEndTime: blockedUntilRef.current,
            });
            return;
        }

        // Clear block if expired
        if (blockedUntilRef.current && now >= blockedUntilRef.current) {
            blockedUntilRef.current = null;
            attemptsRef.current = [];
        }

        // Filter to recent attempts only
        const recentAttempts = attemptsRef.current.filter(
            t => now - t < config.windowMs
        );
        attemptsRef.current = recentAttempts;

        const remaining = config.maxAttempts - recentAttempts.length;
        const oldestAttempt = recentAttempts[0];
        const resetTime = oldestAttempt ? oldestAttempt + config.windowMs : null;

        setState({
            allowed: remaining > 0,
            remainingAttempts: Math.max(0, remaining),
            resetTime,
            blocked: false,
            blockEndTime: null,
        });
    }, [config]);

    const checkLimit = useCallback((): boolean => {
        const now = Date.now();

        // Check block
        if (blockedUntilRef.current && now < blockedUntilRef.current) {
            return false;
        }

        // Clear expired block
        if (blockedUntilRef.current && now >= blockedUntilRef.current) {
            blockedUntilRef.current = null;
            attemptsRef.current = [];
        }

        // Count recent attempts
        const recentAttempts = attemptsRef.current.filter(
            t => now - t < config.windowMs
        );

        return recentAttempts.length < config.maxAttempts;
    }, [config]);

    const recordAttempt = useCallback(() => {
        const now = Date.now();
        attemptsRef.current.push(now);

        // Filter to recent only
        attemptsRef.current = attemptsRef.current.filter(
            t => now - t < config.windowMs
        );

        // Check if should block
        if (attemptsRef.current.length >= config.maxAttempts && config.blockDurationMs) {
            blockedUntilRef.current = now + config.blockDurationMs;
            console.warn(`[RateLimit] Action blocked until ${new Date(blockedUntilRef.current).toISOString()}`);
        }

        updateState();
    }, [config, updateState]);

    const reset = useCallback(() => {
        attemptsRef.current = [];
        blockedUntilRef.current = null;
        updateState();
    }, [updateState]);

    return { checkLimit, recordAttempt, reset, state };
}

/**
 * Hook for debounced actions (e.g., search input)
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    delay: number
): T {
    const lastCall = useRef<number>(0);
    const lastResult = useRef<ReturnType<T>>();

    return useCallback((...args: Parameters<T>): ReturnType<T> => {
        const now = Date.now();

        if (now - lastCall.current >= delay) {
            lastCall.current = now;
            lastResult.current = callback(...args);
        }

        return lastResult.current as ReturnType<T>;
    }, [callback, delay]) as T;
}

/**
 * Hook for rate-limited async actions with loading state
 */
export function useRateLimitedAction<T>(
    action: () => Promise<T>,
    config: RateLimitConfig
): {
    execute: () => Promise<T | null>;
    loading: boolean;
    error: string | null;
    rateLimitState: RateLimitState;
} {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { checkLimit, recordAttempt, state } = useRateLimit(config);

    const execute = useCallback(async (): Promise<T | null> => {
        // Check rate limit
        if (!checkLimit()) {
            const msg = state.blocked
                ? `Too many attempts. Try again in ${Math.ceil((state.blockEndTime! - Date.now()) / 1000)}s`
                : 'Rate limit exceeded. Please wait.';
            setError(msg);
            return null;
        }

        setLoading(true);
        setError(null);
        recordAttempt();

        try {
            const result = await action();
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [action, checkLimit, recordAttempt, state]);

    return { execute, loading, error, rateLimitState: state };
}

/**
 * Global rate limiter for cross-component limiting
 */
class GlobalRateLimiter {
    private limits: Map<string, { attempts: number[]; blockedUntil: number | null }> = new Map();

    check(key: string, config: RateLimitConfig): boolean {
        const now = Date.now();
        const entry = this.limits.get(key) || { attempts: [], blockedUntil: null };

        // Check block
        if (entry.blockedUntil && now < entry.blockedUntil) {
            return false;
        }

        // Clear expired
        if (entry.blockedUntil && now >= entry.blockedUntil) {
            entry.blockedUntil = null;
            entry.attempts = [];
        }

        // Count recent
        entry.attempts = entry.attempts.filter(t => now - t < config.windowMs);

        return entry.attempts.length < config.maxAttempts;
    }

    record(key: string, config: RateLimitConfig): void {
        const now = Date.now();
        const entry = this.limits.get(key) || { attempts: [], blockedUntil: null };

        entry.attempts.push(now);
        entry.attempts = entry.attempts.filter(t => now - t < config.windowMs);

        if (entry.attempts.length >= config.maxAttempts && config.blockDurationMs) {
            entry.blockedUntil = now + config.blockDurationMs;
        }

        this.limits.set(key, entry);
    }

    reset(key: string): void {
        this.limits.delete(key);
    }

    clear(): void {
        this.limits.clear();
    }
}

export const globalRateLimiter = new GlobalRateLimiter();
