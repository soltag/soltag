import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Capacitor } from '@capacitor/core';

/**
 * Secure Storage Wrapper
 * 
 * Provides encrypted storage for sensitive data in the app.
 * Uses native secure enclaves (KeyStore on Android, Keychain on iOS).
 * Falls back to localStorage in browser/web mode.
 */

// Check if we're running in a native environment
const isNative = Capacitor.isNativePlatform();

// Storage keys
export const STORAGE_KEYS = {
    WALLET_PUBKEY: 'soltag_wallet_pubkey',
    WALLET_CONNECTED: 'soltag_wallet_connected',
    SESSION_EXPIRY: 'soltag_session_expiry',
    ONBOARDING_COMPLETE: 'soltag_onboarding_complete',
    OFFLINE_QUEUE: 'soltag_offline_queue',
    USED_NONCES: 'soltag_used_nonces',
    SETTINGS: 'soltag_settings',
    USERNAME: 'soltag_username',
    AUTH_TOKEN: 'soltag_auth_token',
} as const;

// Sensitive keys that SHOULD use native secure storage when available
const SENSITIVE_KEYS: Set<string> = new Set([
    STORAGE_KEYS.WALLET_PUBKEY,
    STORAGE_KEYS.OFFLINE_QUEUE,
    STORAGE_KEYS.USED_NONCES,
    STORAGE_KEYS.AUTH_TOKEN,
]);

/**
 * Securely store a value
 */
export async function secureSet(key: string, value: string): Promise<void> {
    try {
        // Only use native storage for sensitive keys AND when running natively
        if (SENSITIVE_KEYS.has(key) && isNative) {
            await SecureStoragePlugin.set({ key, value });
        } else {
            localStorage.setItem(key, value);
        }
    } catch (error) {
        console.error(`[SecureStorage] Failed to set ${key}:`, error);
        // Fallback to localStorage if native fails
        try {
            localStorage.setItem(key, value);
        } catch (fallbackError) {
            console.error(`[SecureStorage] Fallback also failed for ${key}:`, fallbackError);
            throw error;
        }
    }
}

/**
 * Securely retrieve a value
 */
export async function secureGet(key: string): Promise<string | null> {
    try {
        // Only use native storage for sensitive keys AND when running natively
        if (SENSITIVE_KEYS.has(key) && isNative) {
            const { value } = await SecureStoragePlugin.get({ key });
            return value;
        } else {
            return localStorage.getItem(key);
        }
    } catch (error) {
        // Plugin throws if key doesn't exist – try localStorage as fallback
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }
}

/**
 * Remove a value from storage
 */
export async function secureRemove(key: string): Promise<void> {
    try {
        // Only use native storage for sensitive keys AND when running natively
        if (SENSITIVE_KEYS.has(key) && isNative) {
            await SecureStoragePlugin.remove({ key });
        } else {
            localStorage.removeItem(key);
        }
    } catch (error) {
        console.error(`[SecureStorage] Failed to remove ${key}:`, error);
        // Also try localStorage cleanup
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore fallback failure
        }
    }
}

/**
 * Clear all app data
 */
export async function secureClearAll(): Promise<void> {
    try {
        await SecureStoragePlugin.clear();
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('[SecureStorage] Failed to clear all:', error);
    }
}

/**
 * Store JSON object securely
 */
export async function secureSetJSON<T>(key: string, value: T): Promise<void> {
    await secureSet(key, JSON.stringify(value));
}

/**
 * Retrieve JSON object securely
 */
export async function secureGetJSON<T>(key: string): Promise<T | null> {
    const value = await secureGet(key);
    if (value === null) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        console.error(`[SecureStorage] Failed to parse JSON for ${key}`);
        return null;
    }
}

/**
 * Check if a key exists
 */
export async function hasKey(key: string): Promise<boolean> {
    const value = await secureGet(key);
    return value !== null;
}

