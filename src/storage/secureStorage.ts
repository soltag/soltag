/**
 * Secure Storage Wrapper
 * 
 * Provides encrypted storage for sensitive data in the app.
 * Uses browser crypto APIs for encryption at rest.
 * 
 * In React Native, replace with expo-secure-store or react-native-keychain.
 */

// Storage keys
export const STORAGE_KEYS = {
    WALLET_PUBKEY: 'soltag_wallet_pubkey',
    WALLET_CONNECTED: 'soltag_wallet_connected',
    SESSION_EXPIRY: 'soltag_session_expiry',
    ONBOARDING_COMPLETE: 'soltag_onboarding_complete',
    OFFLINE_QUEUE: 'soltag_offline_queue',
    USED_NONCES: 'soltag_used_nonces',
    SETTINGS: 'soltag_settings',
} as const;

// Sensitive keys that should be encrypted
const SENSITIVE_KEYS: Set<string> = new Set([
    STORAGE_KEYS.WALLET_PUBKEY,
    STORAGE_KEYS.OFFLINE_QUEUE,
    STORAGE_KEYS.USED_NONCES,
]);

// Encryption key (in production, derive from device-specific secret)
let encryptionKey: CryptoKey | null = null;

/**
 * Initialize encryption key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
    if (encryptionKey) {
        return encryptionKey;
    }

    // Generate or retrieve encryption key
    // In production, this should be stored in secure enclave
    const keyMaterial = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    encryptionKey = keyMaterial;
    return encryptionKey;
}

/**
 * Encrypt a value
 */
async function encrypt(value: string): Promise<string> {
    try {
        const key = await getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(value);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Return as base64
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('[SecureStorage] Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt a value
 */
async function decrypt(encryptedValue: string): Promise<string> {
    try {
        const key = await getEncryptionKey();

        // Decode base64
        const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));

        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('[SecureStorage] Decryption failed:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Securely store a value
 */
export async function secureSet(key: string, value: string): Promise<void> {
    try {
        if (SENSITIVE_KEYS.has(key)) {
            const encrypted = await encrypt(value);
            localStorage.setItem(key, encrypted);
        } else {
            localStorage.setItem(key, value);
        }
    } catch (error) {
        console.error(`[SecureStorage] Failed to set ${key}:`, error);
        throw error;
    }
}

/**
 * Securely retrieve a value
 */
export async function secureGet(key: string): Promise<string | null> {
    try {
        const value = localStorage.getItem(key);
        if (value === null) {
            return null;
        }

        if (SENSITIVE_KEYS.has(key)) {
            return await decrypt(value);
        }

        return value;
    } catch (error) {
        console.error(`[SecureStorage] Failed to get ${key}:`, error);
        // If decryption fails, data may be corrupted - return null
        return null;
    }
}

/**
 * Remove a value from storage
 */
export function secureRemove(key: string): void {
    localStorage.removeItem(key);
}

/**
 * Clear all app data
 */
export function secureClearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    encryptionKey = null;
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
export function hasKey(key: string): boolean {
    return localStorage.getItem(key) !== null;
}

/**
 * Get storage usage stats
 */
export function getStorageStats(): { used: number; keys: number } {
    let used = 0;
    let keys = 0;

    for (const key of Object.values(STORAGE_KEYS)) {
        const value = localStorage.getItem(key);
        if (value) {
            used += value.length * 2; // UTF-16 = 2 bytes per char
            keys++;
        }
    }

    return { used, keys };
}
