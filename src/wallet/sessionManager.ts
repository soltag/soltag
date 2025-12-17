/**
 * Wallet Session Manager
 * 
 * Handles secure wallet session management including:
 * - Session timeout after inactivity
 * - Automatic cleanup on expiry
 * - Session persistence across app restarts
 */

import { STORAGE_KEYS, secureGet, secureSet, secureRemove } from '../storage/secureStorage';

// Session configuration
const SESSION_CONFIG = {
    TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
    INACTIVITY_CHECK_INTERVAL: 60 * 1000, // Check every minute
    GRACE_PERIOD_MS: 5 * 60 * 1000, // 5 minute grace period for warnings
};

// Session state
interface SessionState {
    connected: boolean;
    publicKey: string | null;
    connectedAt: number;
    lastActivity: number;
    expiresAt: number;
}

let currentSession: SessionState | null = null;
let inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;
let onSessionExpiredCallback: (() => void) | null = null;
let onSessionWarningCallback: ((remainingMs: number) => void) | null = null;

/**
 * Initialize session manager
 */
export function initSessionManager(callbacks: {
    onExpired?: () => void;
    onWarning?: (remainingMs: number) => void;
}): void {
    onSessionExpiredCallback = callbacks.onExpired || null;
    onSessionWarningCallback = callbacks.onWarning || null;

    // Restore session from storage
    restoreSession();

    // Start inactivity monitoring
    startInactivityMonitor();
}

/**
 * Create a new session when wallet connects
 */
export async function createSession(publicKey: string): Promise<void> {
    const now = Date.now();

    currentSession = {
        connected: true,
        publicKey,
        connectedAt: now,
        lastActivity: now,
        expiresAt: now + SESSION_CONFIG.TIMEOUT_MS,
    };

    // Persist session
    await persistSession();

    console.log('[SessionManager] Session created for:', publicKey.slice(0, 8) + '...');
}

/**
 * Update last activity timestamp
 */
export function recordActivity(): void {
    if (!currentSession) {
        return;
    }

    const now = Date.now();
    currentSession.lastActivity = now;
    currentSession.expiresAt = now + SESSION_CONFIG.TIMEOUT_MS;

    // Don't persist on every activity - too expensive
    // Session will be persisted periodically or on important actions
}

/**
 * End current session (logout)
 */
export async function endSession(): Promise<void> {
    currentSession = null;

    // Clear stored session data
    secureRemove(STORAGE_KEYS.WALLET_CONNECTED);
    secureRemove(STORAGE_KEYS.WALLET_PUBKEY);
    secureRemove(STORAGE_KEYS.SESSION_EXPIRY);

    console.log('[SessionManager] Session ended');
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
    if (!currentSession) {
        return false;
    }

    const now = Date.now();
    return now < currentSession.expiresAt;
}

/**
 * Get current session info
 */
export function getSession(): SessionState | null {
    return currentSession;
}

/**
 * Get remaining session time in milliseconds
 */
export function getSessionRemainingMs(): number {
    if (!currentSession) {
        return 0;
    }

    return Math.max(0, currentSession.expiresAt - Date.now());
}

/**
 * Extend session (e.g., after user confirms they're still active)
 */
export async function extendSession(): Promise<void> {
    if (!currentSession) {
        return;
    }

    const now = Date.now();
    currentSession.lastActivity = now;
    currentSession.expiresAt = now + SESSION_CONFIG.TIMEOUT_MS;

    await persistSession();

    console.log('[SessionManager] Session extended');
}

/**
 * Persist session to storage
 */
async function persistSession(): Promise<void> {
    if (!currentSession) {
        return;
    }

    await secureSet(STORAGE_KEYS.WALLET_CONNECTED, 'true');
    await secureSet(STORAGE_KEYS.WALLET_PUBKEY, currentSession.publicKey || '');
    await secureSet(STORAGE_KEYS.SESSION_EXPIRY, String(currentSession.expiresAt));
}

/**
 * Restore session from storage
 */
async function restoreSession(): Promise<void> {
    try {
        const connected = await secureGet(STORAGE_KEYS.WALLET_CONNECTED);
        const publicKey = await secureGet(STORAGE_KEYS.WALLET_PUBKEY);
        const expiresAtStr = await secureGet(STORAGE_KEYS.SESSION_EXPIRY);

        if (connected !== 'true' || !publicKey) {
            return;
        }

        const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
        const now = Date.now();

        // Check if session has expired
        if (now >= expiresAt) {
            console.log('[SessionManager] Stored session expired, clearing');
            await endSession();
            return;
        }

        // Restore session
        currentSession = {
            connected: true,
            publicKey,
            connectedAt: now, // We don't know original, use now
            lastActivity: now,
            expiresAt,
        };

        console.log('[SessionManager] Session restored for:', publicKey.slice(0, 8) + '...');
    } catch (error) {
        console.error('[SessionManager] Failed to restore session:', error);
    }
}

/**
 * Start monitoring for inactivity
 */
function startInactivityMonitor(): void {
    // Clear any existing interval
    if (inactivityCheckInterval) {
        clearInterval(inactivityCheckInterval);
    }

    inactivityCheckInterval = setInterval(() => {
        checkSessionStatus();
    }, SESSION_CONFIG.INACTIVITY_CHECK_INTERVAL);
}

/**
 * Check session status and handle expiry/warnings
 */
function checkSessionStatus(): void {
    if (!currentSession) {
        return;
    }

    const now = Date.now();
    const remaining = currentSession.expiresAt - now;

    // Session expired
    if (remaining <= 0) {
        console.log('[SessionManager] Session expired due to inactivity');
        endSession();
        onSessionExpiredCallback?.();
        return;
    }

    // Warning threshold
    if (remaining <= SESSION_CONFIG.GRACE_PERIOD_MS) {
        onSessionWarningCallback?.(remaining);
    }
}

/**
 * Cleanup on app unmount
 */
export function cleanupSessionManager(): void {
    if (inactivityCheckInterval) {
        clearInterval(inactivityCheckInterval);
        inactivityCheckInterval = null;
    }

    onSessionExpiredCallback = null;
    onSessionWarningCallback = null;
}

/**
 * Hook for components to track activity
 */
export function useActivityTracker(): void {
    // In React, this would be a hook that calls recordActivity on user interactions
    // For now, just record on mount
    recordActivity();
}
