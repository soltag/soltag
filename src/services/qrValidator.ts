/**
 * QR Payload Validator
 * 
 * Security module for validating SOLTAG event QR codes.
 * Implements Ed25519 signature verification, timestamp validation,
 * and replay attack prevention.
 */

import type { QRPayload, VerificationStatus } from '../types';
import { ed25519 } from '@noble/curves/ed25519';
import bs58 from 'bs58';
import { secureGetJSON, secureSetJSON, STORAGE_KEYS } from '../storage/secureStorage';

// Validation result type
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    payload?: QRPayload;
}

// QR Schema for validation
const QR_SCHEMA = {
    requiredFields: ['v', 'event_id', 'asset', 'nonce', 'issued_at', 'expires_at', 'zone', 'sig'],
    version: 1,
    maxPayloadSize: 2048, // bytes
    maxNonceAge: 300000, // 5 minutes in ms
};


/**
 * Parse and validate a raw QR code string
 */
export function parseQRCode(rawData: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check payload size
    if (rawData.length > QR_SCHEMA.maxPayloadSize) {
        return { valid: false, errors: ['QR payload exceeds maximum size'], warnings };
    }

    // Try to parse JSON
    let payload: QRPayload;
    try {
        payload = JSON.parse(rawData);
    } catch {
        return { valid: false, errors: ['Invalid QR format: not valid JSON'], warnings };
    }

    // Schema validation
    const schemaResult = validateSchema(payload);
    if (!schemaResult.valid) {
        return { valid: false, errors: schemaResult.errors, warnings };
    }

    return { valid: true, errors, warnings, payload };
}

/**
 * Validate QR payload schema
 */
function validateSchema(payload: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof payload !== 'object' || payload === null) {
        return { valid: false, errors: ['Payload must be an object'] };
    }

    const obj = payload as Record<string, unknown>;

    // Check required fields
    for (const field of QR_SCHEMA.requiredFields) {
        if (!(field in obj)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Type validation
    if (typeof obj.event_id !== 'string' || obj.event_id.length < 8) {
        errors.push('Invalid event_id format');
    }

    if (typeof obj.asset !== 'string' || obj.asset.length < 32) {
        errors.push('Invalid asset format');
    }

    if (typeof obj.issued_at !== 'number' || typeof obj.expires_at !== 'number') {
        errors.push('Invalid timestamp format');
    }

    if (typeof obj.zone !== 'string' || obj.zone.length < 2) {
        errors.push('Invalid zone format');
    }


    if (typeof obj.nonce !== 'string' || obj.nonce.length < 8) {
        errors.push('Invalid nonce format');
    }

    if (typeof obj.sig !== 'string' || obj.sig.length < 64) {
        errors.push('Invalid signature format');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Verify Ed25519 signature of QR payload
 */
export async function verifySignature(
    payload: QRPayload,
    trustedEventKeys: string[]
): Promise<{ valid: boolean; error?: string }> {
    // In the new model, we verify that the 'asset' pubkey belongs to a trusted event
    // or the 'sig' is valid against fixed organizer authority.
    // For now, we'll keep the mock logic but use the correct fields.

    try {
        const message = buildSignatureMessage(payload);
        const messageBytes = new TextEncoder().encode(message);

        const signatureBytes = bs58.decode(payload.sig);
        // We assume the first trusted key is the organizer authority
        const publicKeyBytes = bs58.decode(trustedEventKeys[0] || '');

        const isValid = ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);


        if (!isValid) {
            return { valid: false, error: 'Invalid signature' };
        }

        return { valid: true };
    } catch (error) {
        console.error('[Security] Signature verification error:', error);
        return { valid: false, error: 'Signature verification failed' };
    }
}

/**
 * Build the message that was signed
 * Exported for use in production Ed25519 verification
 */
export function buildSignatureMessage(payload: QRPayload): string {
    // Canonical order for signature verification
    return JSON.stringify({
        v: payload.v,
        event_id: payload.event_id,
        asset: payload.asset,
        nonce: payload.nonce,
        issued_at: payload.issued_at,
        expires_at: payload.expires_at,
        zone: payload.zone,
    });
}


/**
 * Validate timestamp window
 */
export function validateTimeWindow(
    payload: QRPayload
): { valid: boolean; status: 'valid' | 'expired' | 'notStarted' } {
    const now = Math.floor(Date.now() / 1000); // Unix seconds

    if (now < payload.issued_at) {
        return { valid: false, status: 'notStarted' };
    }

    if (now > payload.expires_at) {
        return { valid: false, status: 'expired' };
    }

    return { valid: true, status: 'valid' };
}


/**
 * Check for replay attacks using nonce and TTL
 */
export function checkNonceReplay(
    nonce: string,
    payloadTs: number,
    usedNonces: Set<string>
): { valid: boolean; error?: string } {
    const now = Date.now();

    // 1. Strict TTL check
    if (now - payloadTs > QR_SCHEMA.maxNonceAge) {
        return { valid: false, error: 'QR code has expired (TTL exceeded)' };
    }

    // 2. Duplicate check
    if (usedNonces.has(nonce)) {
        return { valid: false, error: 'Nonce already used - possible replay attack' };
    }

    return { valid: true };
}


/**
 * Persistence: Load used nonces from secure storage
 */
export async function loadUsedNonces(): Promise<Set<string>> {
    const stored = await secureGetJSON<string[]>(STORAGE_KEYS.USED_NONCES);
    if (stored) {
        return new Set(stored);
    }
    return new Set();
}

/**
 * Persistence: Save used nonces to secure storage
 */
export async function saveUsedNonces(nonces: Set<string>): Promise<void> {
    const arr = Array.from(nonces);
    await secureSetJSON(STORAGE_KEYS.USED_NONCES, arr);
}

/**
 * Store a used nonce to prevent replay
 */
export async function recordNonce(nonce: string, usedNonces: Set<string>): Promise<void> {
    usedNonces.add(nonce);

    // Limit set size to prevent memory issues
    if (usedNonces.size > 1000) {
        // Remove oldest entries
        const arr = Array.from(usedNonces);
        usedNonces.clear();
        arr.slice(-500).forEach(n => usedNonces.add(n));
    }

    await saveUsedNonces(usedNonces);
}

/**
 * Full QR validation pipeline
 */
export async function validateQRPayload(
    rawData: string,
    trustedEventKeys: string[],
    usedNonces: Set<string>
): Promise<VerificationStatus & { payload?: QRPayload }> {
    const result: VerificationStatus = {
        signature: 'checking',
        timeWindow: 'checking',
        location: 'checking',
        duplicate: 'checking',
        onChain: 'waiting'
    };

    // Step 1: Parse and validate schema
    const parseResult = parseQRCode(rawData);
    if (!parseResult.valid || !parseResult.payload) {
        return { ...result, signature: 'invalid' };
    }

    const payload = parseResult.payload;

    // Step 2: Verify signature
    const sigResult = await verifySignature(payload, trustedEventKeys);
    if (!sigResult.valid) {
        return { ...result, signature: 'invalid' };
    }
    result.signature = 'valid';

    // Step 3: Check time window
    const timeResult = validateTimeWindow(payload);
    result.timeWindow = timeResult.status;
    if (!timeResult.valid) {
        return { ...result, location: 'checking', duplicate: 'checking', payload };
    }

    // Step 4: Check nonce replay and TTL
    // We use issued_at for the 5-minute TTL check
    const nonceResult = checkNonceReplay(payload.nonce, payload.issued_at * 1000, usedNonces);
    if (!nonceResult.valid) {
        return { ...result, duplicate: 'duplicate', location: 'checking', payload };
    }

    result.duplicate = 'clear';


    // Location check is done separately in zone.ts
    result.location = 'checking';

    return { ...result, payload };
}

/**
 * Sanitize QR input for display (prevent XSS)
 */
export function sanitizeForDisplay(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
